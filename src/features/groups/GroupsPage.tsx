import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryClient'
import { Link, useNavigate } from 'react-router-dom'
import * as groupsApi from '../../api/groups'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../../components/ToastContext'
import Modal from '../../components/Modal'
import { colorFor } from '../../utils/colors'
import { daysLeft } from '../../utils/dates'
import type { Invitation } from '../../types/groups'

export default function GroupsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [respondingId, setRespondingId] = useState<number | null>(null)

  // React Query loads, caches and tracks loading/error for us - no useEffect, no manual state
  const groupsQuery = useQuery({ queryKey: queryKeys.groups, queryFn: groupsApi.getGroups })
  const invitationsQuery = useQuery({ queryKey: queryKeys.myInvitations, queryFn: groupsApi.getMyInvitations })
  const groups = groupsQuery.data ?? null
  const invitations = invitationsQuery.data ?? []
  const failed = groupsQuery.error ?? invitationsQuery.error
  const error = failed ? getErrorMessage(failed) : null

  // After a change: mark the cached lists as stale, React Query loads them again
  async function load() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myInvitations }),
    ])
  }

  async function respond(invitation: Invitation, accept: boolean) {
    setRespondingId(invitation.id)
    try {
      await groupsApi.respondToInvitation(invitation.id, accept)
      showToast(accept ? `הצטרפת ל"${invitation.groupName}" 🎉` : 'ההזמנה נדחתה', accept ? 'success' : 'info')
      await load()
    } catch (err) {
      // 409 = already handled or expired; the list refreshes so it disappears
      showToast(getErrorMessage(err), 'error')
      await load()
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow">הקבוצות שלי</span>
          <h1>עם מי מארגנות?</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ קבוצה חדשה</button>
      </div>

      {invitations.length > 0 && (
        <section className="invites">
          <h3>💌 מחכות לך {invitations.length === 1 ? 'הזמנה' : `${invitations.length} הזמנות`}</h3>
          {invitations.map(inv => (
            <div key={inv.id} className="invite-row">
              <span className="group-tile sm" style={{ background: colorFor(inv.groupName) }}>{inv.groupName.charAt(0)}</span>
              <div style={{ flex: 1 }}>
                <b>{inv.groupName}</b>
                <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                  {inv.invitedByName} הזמינה אותך · נשארו {daysLeft(inv.expiresAt)} ימים
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" disabled={respondingId === inv.id} onClick={() => respond(inv, false)}>לא תודה</button>
              <button className="btn btn-primary btn-sm" disabled={respondingId === inv.id} onClick={() => respond(inv, true)}>
                {respondingId === inv.id ? <span className="spinner" /> : 'הצטרפות'}
              </button>
            </div>
          ))}
        </section>
      )}

      {error && <div className="alert alert-conflict" role="alert"><p>{error}</p></div>}

      {groups === null && !error && (
        <div className="grid">{[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 168 }} />)}</div>
      )}

      {groups?.length === 0 && (
        <div className="card empty-state">
          <span className="quick-icon">👭</span>
          <h2>עדיין אין קבוצות</h2>
          <p className="muted">פתחי קבוצה ראשונה והזמיני אליה את החברות.</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--sp-3)' }} onClick={() => setCreating(true)}>פתיחת קבוצה</button>
        </div>
      )}

      {groups && groups.length > 0 && (
        <div className="grid">
          {groups.map(g => (
            <Link key={g.id} to={`/groups/${g.id}`} className="card card-hover group-card">
              <div className="group-card-top">
                <span className="group-tile" style={{ background: colorFor(g.name) }}>{g.name.charAt(0)}</span>
                {g.managerId === user?.id && <span className="badge badge-closed">מנהלת</span>}
              </div>
              <h3>{g.name}</h3>
              <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                {g.memberCount} {g.memberCount === 1 ? 'חברה' : 'חברות'} · ניהול: {g.managerName}
              </div>
              <span className="group-card-go">לקבוצה ←</span>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <CreateGroupModal
          onClose={() => setCreating(false)}
          onCreated={id => {
            queryClient.invalidateQueries({ queryKey: queryKeys.groups })
            showToast('הקבוצה נפתחה! עכשיו אפשר להזמין חברות')
            navigate(`/groups/${id}`)
          }}
        />
      )}
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const group = await groupsApi.createGroup(name.trim())
      onCreated(group.id)
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal title="קבוצה חדשה" onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit}>
        <div className={`field ${error ? 'field-error' : ''}`}>
          <label htmlFor="group-name">שם הקבוצה</label>
          <input id="group-name" className="input" autoFocus placeholder="למשל: בנות המחזור" value={name}
            onChange={e => setName(e.target.value)} />
          {error && <span className="field-hint">{error}</span>}
        </div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>את תהיי מנהלת הקבוצה, ותוכלי להזמין אליה חברות.</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>ביטול</button>
          <button className="btn btn-primary" disabled={saving || name.trim().length < 2}>
            {saving ? <span className="spinner" /> : 'פתיחת קבוצה'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
