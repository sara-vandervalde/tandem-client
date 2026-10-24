import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as groupsApi from '../../api/groups'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../../components/ToastContext'
import Avatar from '../../components/Avatar'
import Modal from '../../components/Modal'
import { colorFor } from '../../utils/colors'
import { formatDate } from '../../utils/dates'
import type { CreateInvitationsResponse, GroupDetails, GroupMember, Invitation } from '../../types/groups'

const statusText: Record<string, { label: string; className: string }> = {
  Pending: { label: 'ממתינה', className: 'badge-organizing' },
  Accepted: { label: 'הצטרפה', className: 'badge-organized' },
  Declined: { label: 'דחתה', className: 'badge-draft' },
  Cancelled: { label: 'בוטלה', className: 'badge-draft' },
}

type Confirm = { title: string; text: string; action: () => Promise<void>; danger?: boolean }

export default function GroupDetailsPage() {
  const groupId = Number(useParams().id)
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const isManager = group?.managerId === user?.id

  const load = useCallback(async () => {
    try {
      const g = await groupsApi.getGroup(groupId)
      setGroup(g)
      // Only the manager may see the group's invitations
      setInvitations(g.managerId === user?.id ? await groupsApi.getGroupInvitations(groupId) : [])
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [groupId, user?.id])

  useEffect(() => {
    load()
  }, [load])

  // Every action: run, show the result, reload. A 409 shows the server's Hebrew reason.
  async function run(action: () => Promise<void>, success: string) {
    try {
      await action()
      showToast(success)
      await load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  if (error) {
    return (
      <div className="card empty-state">
        <h2>אי אפשר לפתוח את הקבוצה</h2>
        <p className="muted">{error}</p>
        <Link to="/groups" className="btn btn-secondary" style={{ marginTop: 'var(--sp-3)' }}>חזרה לקבוצות</Link>
      </div>
    )
  }
  if (!group) return <div className="card skeleton" style={{ height: 220 }} />

  const pending = invitations.filter(i => i.status === 'Pending' && !i.isExpired)

  function askRemove(member: GroupMember) {
    const self = member.userId === user?.id
    setConfirm({
      title: self ? 'לעזוב את הקבוצה?' : `להסיר את ${member.fullName}?`,
      text: self ? 'לא תראי יותר את האירועים של הקבוצה.' : 'היא לא תראה יותר את האירועים של הקבוצה.',
      danger: true,
      action: async () => {
        await groupsApi.removeMember(groupId, member.userId)
        if (self) {
          showToast('עזבת את הקבוצה', 'info')
          navigate('/groups')
        } else {
          showToast(`${member.fullName} הוסרה מהקבוצה`, 'info')
          await load()
        }
      },
    })
  }

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)' }}>
      <Link to="/groups" className="back-link">→ כל הקבוצות</Link>

      <section className="group-hero" style={{ ['--group-color' as string]: colorFor(group.name) }}>
        <span className="group-tile lg">{group.name.charAt(0)}</span>
        <div style={{ flex: 1 }}>
          <h1>{group.name}</h1>
          <p>
            {group.members.length} חברות · מנהלת: {group.managerName} · נפתחה ב-{formatDate(group.createdAt)}
          </p>
        </div>
        <div className="row">
          <Link to={`/events?groupId=${group.id}`} className="btn btn-primary">לאירועים של הקבוצה</Link>
          {isManager && <button className="btn btn-glass" onClick={() => setRenaming(true)}>שינוי שם</button>}
        </div>
      </section>

      <div className="split">
        <section className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>חברות הקבוצה</h3>
            <div className="avatar-stack">
              {group.members.slice(0, 5).map(m => <Avatar key={m.userId} name={m.fullName} size={28} />)}
            </div>
          </div>

          <ul className="member-list">
            {group.members.map(m => {
              const self = m.userId === user?.id
              const managerRow = m.userId === group.managerId
              return (
                <li key={m.userId}>
                  <Avatar name={m.fullName} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{m.fullName}{self && <span className="muted"> (את)</span>}</b>
                    <div className="muted ellipsis" style={{ fontSize: 'var(--fs-sm)' }} dir="ltr">{m.email}</div>
                  </div>
                  {managerRow && <span className="badge badge-closed">מנהלת</span>}
                  {isManager && !managerRow && (
                    <div className="row" style={{ gap: 'var(--sp-1)' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirm({
                          title: `להעביר את הניהול ל${m.fullName}?`,
                          text: 'את תישארי חברה בקבוצה, אבל היא תנהל אותה מעכשיו.',
                          action: () => run(() => groupsApi.transferManager(groupId, m.userId), `${m.fullName} מנהלת את הקבוצה`),
                        })}
                      >
                        העברת ניהול
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => askRemove(m)}>הסרה</button>
                    </div>
                  )}
                  {self && !managerRow && <button className="btn btn-ghost btn-sm" onClick={() => askRemove(m)}>עזיבה</button>}
                </li>
              )
            })}
          </ul>
        </section>

        {isManager && (
          <aside className="stack">
            <InviteCard groupId={groupId} onInvited={load} />

            {invitations.length > 0 && (
              <section className="card stack">
                <h3>הזמנות שנשלחו {pending.length > 0 && <span className="muted">· {pending.length} ממתינות</span>}</h3>
                <ul className="invite-list">
                  {invitations.map(inv => {
                    const s = inv.status === 'Pending' && inv.isExpired
                      ? { label: 'פגה', className: 'badge-draft' }
                      : statusText[inv.status]
                    return (
                      <li key={inv.id}>
                        <span className="ellipsis" dir="ltr" style={{ flex: 1 }}>{inv.email}</span>
                        <span className={`badge ${s.className}`}>{s.label}</span>
                        {inv.status === 'Pending' && !inv.isExpired && (
                          <button className="icon-btn" aria-label="ביטול ההזמנה" title="ביטול ההזמנה"
                            onClick={() => run(() => groupsApi.cancelInvitation(inv.id), 'ההזמנה בוטלה')}>✕</button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </aside>
        )}
      </div>

      {(isManager || isAdmin) && (
        <section className="danger-zone">
          <div>
            <b>מחיקת הקבוצה</b>
            <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>הקבוצה והאירועים שלה יימחקו. אי אפשר לבטל.</p>
          </div>
          <button
            className="btn btn-danger"
            onClick={() => setConfirm({
              title: `למחוק את "${group.name}"?`,
              text: 'הקבוצה והאירועים שלה יימחקו לתמיד.',
              danger: true,
              action: async () => {
                await groupsApi.deleteGroup(groupId)
                showToast('הקבוצה נמחקה', 'info')
                navigate('/groups')
              },
            })}
          >
            מחיקה
          </button>
        </section>
      )}

      {renaming && (
        <RenameModal
          current={group.name}
          onClose={() => setRenaming(false)}
          onSave={async name => {
            await groupsApi.renameGroup(groupId, name)
            setRenaming(false)
            showToast('השם עודכן')
            await load()
          }}
        />
      )}

      {confirm && <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />}
    </div>
  )
}

// Emails as chips: type, then Enter / comma / space adds one
function InviteCard({ groupId, onInvited }: { groupId: number; onInvited: () => Promise<void> }) {
  const [emails, setEmails] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<CreateInvitationsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  function addDraft() {
    const parts = draft.split(/[\s,;]+/).map(p => p.trim().toLowerCase()).filter(Boolean)
    if (parts.length) setEmails(prev => [...new Set([...prev, ...parts])])
    setDraft('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault()
      addDraft()
    } else if (e.key === 'Backspace' && !draft && emails.length) {
      setEmails(prev => prev.slice(0, -1))
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    const all = [...new Set([...emails, ...draft.split(/[\s,;]+/).map(p => p.trim().toLowerCase()).filter(Boolean)])]
    if (!all.length) return
    setSending(true)
    setError(null)
    try {
      const response = await groupsApi.inviteToGroup(groupId, all)
      setResult(response)
      setEmails([])
      setDraft('')
      await onInvited()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="card stack invite-card" onSubmit={send}>
      <div>
        <h3>הזמנת חברות</h3>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>אפשר כמה כתובות בבת אחת. ההזמנה בתוקף 14 יום.</p>
      </div>
      <div className="chips-input" onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
        {emails.map(email => (
          <span key={email} className="chip" dir="ltr">
            {email}
            <button type="button" aria-label={`הסרת ${email}`} onClick={() => setEmails(prev => prev.filter(x => x !== email))}>✕</button>
          </span>
        ))}
        <input
          dir="ltr"
          value={draft}
          placeholder={emails.length ? '' : 'name@example.com'}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={addDraft}
        />
      </div>
      {error && <div className="alert alert-conflict"><p>{error}</p></div>}
      <button className="btn btn-dark" disabled={sending || (!emails.length && !draft.trim())}>
        {sending ? <span className="spinner" /> : `שליחת ${emails.length > 1 ? `${emails.length} הזמנות` : 'הזמנה'}`}
      </button>

      {result && (
        <div className="stack" style={{ gap: 'var(--sp-2)' }}>
          {result.invited.length > 0 && (
            <div className="alert alert-success"><span>✓</span><p>נשלחו {result.invited.length} הזמנות</p></div>
          )}
          {result.skipped.map(s => (
            <div key={s.email} className="alert alert-info">
              <span>i</span>
              <p><b dir="ltr">{s.email}</b> – {s.reason}</p>
            </div>
          ))}
        </div>
      )}
    </form>
  )
}

function RenameModal({ current, onClose, onSave }: { current: string; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(name.trim())
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal title="שינוי שם הקבוצה" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className={`field ${error ? 'field-error' : ''}`}>
          <label htmlFor="rename">שם חדש</label>
          <input id="rename" className="input" autoFocus value={name} onChange={e => setName(e.target.value)} />
          {error && <span className="field-hint">{error}</span>}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>ביטול</button>
          <button className="btn btn-primary" disabled={saving || name.trim().length < 2}>שמירה</button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal({ confirm, onClose }: { confirm: Confirm; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setBusy(true)
    try {
      await confirm.action()
      onClose()
    } catch (err) {
      // e.g. 409: a member with open responsibilities cannot leave
      setError(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={confirm.title} onClose={onClose}>
      <div className="stack">
        <p className="muted">{confirm.text}</p>
        {error && <div className="alert alert-conflict" role="alert"><span>⚡</span><p>{error}</p></div>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
          <button className={`btn ${confirm.danger ? 'btn-danger' : 'btn-dark'}`} disabled={busy} onClick={go}>
            {busy ? <span className="spinner" /> : 'אישור'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
