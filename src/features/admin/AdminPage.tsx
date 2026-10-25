import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryClient'
import { Link, useSearchParams } from 'react-router-dom'
import * as usersApi from '../../api/users'
import * as groupsApi from '../../api/groups'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../../components/ToastContext'
import Avatar from '../../components/Avatar'
import Modal from '../../components/Modal'
import { colorFor } from '../../utils/colors'
import { formatDate } from '../../utils/dates'
import type { User } from '../../api/users'
import type { Group } from '../../types/groups'
import type { PagedResult } from '../../types/events'

type Tab = 'users' | 'groups'
type Confirm = { title: string; text: string; label: string; action: () => Promise<void>; success: string }

// The system manager's screen: every user (block / release) and every group (delete)
export default function AdminPage() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'groups' ? 'groups' : 'users'

  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const queryClient = useQueryClient()

  // Both lists load at once, so the two tiles show their numbers right away
  const usersQuery = useQuery({
    queryKey: queryKeys.users(page),
    queryFn: () => usersApi.getUsers(page),
    placeholderData: keepPreviousData,
  })
  const groupsQuery = useQuery({ queryKey: queryKeys.groups, queryFn: groupsApi.getGroups })
  const users: PagedResult<User> | null = usersQuery.data ?? null
  const groups: Group[] | null = groupsQuery.data ?? null
  const failed = tab === 'users' ? usersQuery.error : groupsQuery.error
  const error = failed ? getErrorMessage(failed) : null

  async function reload() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
    ])
  }

  // Releasing a block needs no confirmation, so it runs straight away
  const releaseMutation = useMutation({
    mutationFn: (u: User) => usersApi.setUserActive(u.id, true),
    onSuccess: (_data, u) => showToast(`החסימה של ${u.fullName} שוחררה`),
    onError: err => showToast(getErrorMessage(err), 'error'),
    onSettled: reload,
  })
  const toggleActive = (u: User) => releaseMutation.mutate(u)
  const busyId = releaseMutation.isPending ? releaseMutation.variables?.id : null

  async function runConfirm() {
    if (!confirm) return
    try {
      await confirm.action()
      showToast(confirm.success)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setConfirm(null)
      await reload()
    }
  }

  const activeCount = users?.items.filter(u => u.isActive).length ?? 0

  return (
    <div className="stack" style={{ gap: 'var(--sp-5)' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow">ניהול המערכת</span>
          <h1>לוח בקרה</h1>
        </div>
      </div>

      <div className="money-tiles admin-tiles">
        <button className={`money-tile ${tab === 'users' ? 'active' : ''}`} onClick={() => setSearchParams({})}>
          <span>משתמשים</span>
          <b>{users?.totalCount ?? '—'}</b>
          <small>{users ? `${activeCount} פעילים בעמוד הזה` : 'רשומים במערכת'}</small>
        </button>
        <button className={`money-tile ${tab === 'groups' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'groups' })}>
          <span>קבוצות</span>
          <b>{groups?.length ?? '—'}</b>
          <small>בכל המערכת</small>
        </button>
      </div>

      {error && <div className="alert alert-conflict" role="alert"><p>{error}</p></div>}

      {tab === 'users' ? (
        <section className="card table-card">
          {users === null && !error ? <div className="skeleton" style={{ height: 320 }} /> : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>משתמש/ת</th><th>אימייל</th><th>תפקיד</th><th>נרשמ/ה</th><th>מצב</th><th aria-label="פעולות" /></tr>
                </thead>
                <tbody>
                  {users?.items.map(u => {
                    const isMe = u.id === me?.id
                    return (
                      <tr key={u.id} className={u.isActive ? '' : 'is-blocked'}>
                        <td><span className="cell-person"><Avatar name={u.fullName} size={30} />{u.fullName}{isMe && <small className="muted"> (את)</small>}</span></td>
                        <td dir="ltr" className="cell-email">{u.email}</td>
                        <td>{u.role === 'Admin' ? <span className="badge badge-closed">מנהל/ת</span> : <span className="muted">חבר/ה</span>}</td>
                        <td className="muted">{formatDate(u.createdAt)}</td>
                        <td>{u.isActive ? <span className="badge badge-organized">פעיל/ה</span> : <span className="badge badge-cancelled">חסום/ה</span>}</td>
                        <td className="cell-actions">
                          {!isMe && u.role !== 'Admin' && (
                            u.isActive ? (
                              <button className="btn btn-danger btn-sm" disabled={busyId === u.id} onClick={() => setConfirm({
                                title: `לחסום את ${u.fullName}?`,
                                text: 'משתמש/ת חסום/ה לא יכול/ה להתחבר למערכת. אפשר לשחרר את החסימה בכל רגע.',
                                label: 'חסימה',
                                action: () => usersApi.setUserActive(u.id, false),
                                success: `${u.fullName} נחסמ/ה`,
                              })}>חסימה</button>
                            ) : (
                              <button className="btn btn-secondary btn-sm" disabled={busyId === u.id} onClick={() => toggleActive(u)}>
                                {busyId === u.id ? <span className="spinner" /> : 'שחרור'}
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {users && users.totalPages > 1 && (
            <nav className="pager">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>→ הקודם</button>
              <span className="muted">עמוד {users.page} מתוך {users.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= users.totalPages} onClick={() => setPage(p => p + 1)}>הבא ←</button>
            </nav>
          )}
        </section>
      ) : (
        <section className="card table-card">
          {groups === null && !error ? <div className="skeleton" style={{ height: 240 }} /> : groups?.length === 0 ? (
            <p className="muted items-empty">אין קבוצות במערכת.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>קבוצה</th><th>מנהל/ת</th><th>חברים</th><th>נפתחה</th><th aria-label="פעולות" /></tr></thead>
                <tbody>
                  {groups?.map(g => (
                    <tr key={g.id}>
                      <td>
                        <Link to={`/groups/${g.id}`} className="cell-person">
                          <span className="group-tile sm" style={{ background: colorFor(g.name) }}>{g.name.charAt(0)}</span>{g.name}
                        </Link>
                      </td>
                      <td>{g.managerName}</td>
                      <td>{g.memberCount}</td>
                      <td className="muted">{formatDate(g.createdAt)}</td>
                      <td className="cell-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm({
                          title: `למחוק את "${g.name}"?`,
                          text: 'הקבוצה תימחק לגמרי, כולל כל האירועים שלה. אי אפשר לבטל את הפעולה.',
                          label: 'מחיקה',
                          action: () => groupsApi.deleteGroup(g.id),
                          success: 'הקבוצה נמחקה',
                        })}>מחיקה</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="muted">{confirm.text}</p>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-5)' }}>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>חזרה</button>
            <button className="btn btn-danger" onClick={runConfirm}>{confirm.label}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
