import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as eventsApi from '../../api/events'
import * as groupsApi from '../../api/groups'
import { getErrorMessage } from '../../api/errors'
import { useToast } from '../../components/ToastContext'
import { colorFor } from '../../utils/colors'
import CreateEventModal from './CreateEventModal'
import { dayKey, hebrewDays, statusInfo } from './eventUi'
import type { Group } from '../../types/groups'
import type { EventListItem, EventStatus, PagedResult } from '../../types/events'

type View = 'calendar' | 'list'

const statusFilters: (EventStatus | 'all')[] = ['all', 'Draft', 'Organizing', 'Organized', 'Settled', 'Cancelled']

// The 42 days (6 weeks, Sunday first) that the month grid shows
function monthCells(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + i))
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default function EventsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [view, setView] = useState<View>('calendar')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState<number | undefined>()
  const [status, setStatus] = useState<EventStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PagedResult<EventListItem> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createDate, setCreateDate] = useState<string | null>(null)

  const cells = useMemo(() => monthCells(month), [month])
  const [todayKey] = useState(() => dayKey(new Date()))
  const isFiltered = Boolean(debouncedSearch || status !== 'all' || groupId)

  useEffect(() => {
    groupsApi.getGroups().then(setGroups).catch(err => setError(getErrorMessage(err)))
  }, [])

  // Wait 350ms after the last key press, so we don't call the server on every letter
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timer)
  }, [search])

  // Filtering, sorting and paging all happen on the server.
  // Calendar: every event in the 6 visible weeks. List: one page, nearest date first.
  useEffect(() => {
    let ignore = false
    const range = view === 'calendar'
      ? { from: cells[0].toISOString(), to: new Date(cells[41].getTime() + 86_399_000).toISOString(), pageSize: 100 }
      : { page, pageSize: 12, sortBy: 'date' as const, sortDir: 'asc' as const }
    eventsApi
      .getEvents({ ...range, groupId, status: status === 'all' ? undefined : status, search: debouncedSearch || undefined })
      .then(data => {
        if (!ignore) {
          setResult(data)
          setError(null)
        }
      })
      .catch(err => {
        if (!ignore) setError(getErrorMessage(err))
      })
    // If the filters change before the answer arrives, the old answer is ignored
    return () => {
      ignore = true
    }
  }, [view, cells, page, groupId, status, debouncedSearch])

  // Events grouped by day, for the calendar cells
  const byDay = useMemo(() => {
    const map = new Map<string, EventListItem[]>()
    for (const ev of result?.items ?? []) {
      const key = dayKey(new Date(ev.eventDate))
      map.set(key, [...(map.get(key) ?? []), ev])
    }
    return map
  }, [result])

  // Any filter change goes back to page 1
  function changeFilter(update: () => void) {
    update()
    setPage(1)
  }

  function openCreate(key = '') {
    if (groups.length === 0) {
      showToast('קודם צריך להיות חברה בקבוצה', 'info')
      return
    }
    setCreateDate(key)
  }

  function moveMonth(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1))
  }

  return (
    <div className="stack" style={{ gap: 'var(--sp-5)' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow">אירועים</span>
          <h1>מה בלוח?</h1>
        </div>
        <button className="btn btn-primary" onClick={() => openCreate()}>+ אירוע חדש</button>
      </div>

      {/* Toolbar: view switch, search, group and status filters */}
      <div className="toolbar card">
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={view === 'calendar'} className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>לוח שנה</button>
          <button role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>רשימה</button>
        </div>
        <input className="input search-input" type="search" placeholder="חיפוש לפי שם אירוע…" value={search}
          onChange={e => changeFilter(() => setSearch(e.target.value))} />
        <select className="input" value={groupId ?? ''} aria-label="קבוצה"
          onChange={e => changeFilter(() => setGroupId(e.target.value ? Number(e.target.value) : undefined))}>
          <option value="">כל הקבוצות</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="filter-chips">
          {statusFilters.map(s => (
            <button key={s} className={`filter-chip ${status === s ? 'active' : ''}`} onClick={() => changeFilter(() => setStatus(s))}>
              {s === 'all' ? 'הכול' : statusInfo[s].label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-conflict" role="alert"><p>{error}</p></div>}

      {view === 'calendar' ? (
        <section className="calendar card">
          <header className="calendar-head">
            <button className="icon-btn" aria-label="החודש הקודם" onClick={() => moveMonth(-1)}>›</button>
            <h2>{month.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</h2>
            <button className="icon-btn" aria-label="החודש הבא" onClick={() => moveMonth(1)}>‹</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setMonth(startOfMonth(new Date()))}>היום</button>
          </header>

          <div className="calendar-grid">
            {hebrewDays.map(d => <div key={d} className="calendar-dayname">{d}</div>)}
            {cells.map(date => {
              const key = dayKey(date)
              const events = byDay.get(key) ?? []
              const isPast = key < todayKey
              const classes = [
                'calendar-cell',
                date.getMonth() !== month.getMonth() && 'is-outside',
                key === todayKey && 'is-today',
                isPast && 'is-past',
              ].filter(Boolean).join(' ')
              return (
                <div key={key} className={classes} onClick={() => !isPast && openCreate(key)}
                  title={isPast ? undefined : 'לחיצה – אירוע חדש ביום הזה'}>
                  <span className="calendar-num">{date.getDate()}</span>
                  {events.slice(0, 3).map(ev => (
                    <Link key={ev.id} to={`/events/${ev.id}`} className={`calendar-event status-${ev.status.toLowerCase()}`}
                      style={{ '--ev-color': colorFor(ev.groupName) } as CSSProperties}
                      title={`${ev.title} · ${ev.groupName} · ${statusInfo[ev.status].label}`}
                      onClick={e => e.stopPropagation()}>
                      <span className="ellipsis">{ev.title}</span>
                    </Link>
                  ))}
                  {events.length > 3 && <span className="calendar-more">+{events.length - 3} נוספים</span>}
                  {!isPast && <span className="calendar-add" aria-hidden="true">+</span>}
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="stack">
          {result === null && !error && [1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 92 }} />)}

          {result?.items.length === 0 && (
            <div className="card empty-state">
              <span className="quick-icon">🗓️</span>
              <h2>{isFiltered ? 'לא נמצאו אירועים' : 'עדיין אין אירועים'}</h2>
              <p className="muted">{isFiltered ? 'נסי לשנות את החיפוש או הסינון.' : 'יוצרים אירוע ראשון, וכל החברות בקבוצה רואות אותו.'}</p>
            </div>
          )}

          {result?.items.map(ev => {
            const d = new Date(ev.eventDate)
            return (
              <Link key={ev.id} to={`/events/${ev.id}`} className="card card-hover event-card event-row">
                <div className="date-tile">
                  <b>{d.getDate()}</b>
                  <span>{d.toLocaleDateString('he-IL', { month: 'short' })}</span>
                </div>
                <div className="event-row-body">
                  <h3 className="ellipsis">{ev.title}</h3>
                  <div className="muted event-row-meta">
                    <span className="group-dot" style={{ background: colorFor(ev.groupName) }} />
                    <span>{ev.groupName}</span>
                    <span>·</span>
                    <span>{ev.organizerName ? `אחראית: ${ev.organizerName}` : 'עדיין אין אחראית'}</span>
                    {ev.hasGift && <span>· 🎁 מתנה</span>}
                  </div>
                </div>
                <span className={`badge ${statusInfo[ev.status].className}`}>{statusInfo[ev.status].label}</span>
              </Link>
            )
          })}

          {result && result.totalPages > 1 && (
            <nav className="pager">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>→ הקודם</button>
              <span className="muted">עמוד {result.page} מתוך {result.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= result.totalPages} onClick={() => setPage(p => p + 1)}>הבא ←</button>
            </nav>
          )}
        </section>
      )}

      {createDate !== null && (
        <CreateEventModal
          groups={groups}
          initialDate={createDate || undefined}
          initialGroupId={groupId}
          onClose={() => setCreateDate(null)}
          onCreated={ev => {
            setCreateDate(null)
            showToast(ev.status === 'Draft' ? 'האירוע נשמר כטיוטה' : 'האירוע נוצר, ואת האחראית 🎉')
            navigate(`/events/${ev.id}`)
          }}
        />
      )}
    </div>
  )
}
