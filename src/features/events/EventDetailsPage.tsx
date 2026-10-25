import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as eventsApi from '../../api/events'
import * as groupsApi from '../../api/groups'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../../components/ToastContext'
import Avatar from '../../components/Avatar'
import Modal from '../../components/Modal'
import { colorFor } from '../../utils/colors'
import AreaCard, { type AreaView } from './AreaCard'
import AreaEditModal from './AreaEditModal'
import EventSettingsModal from './EventSettingsModal'
import ItemsSection from './ItemsSection'
import SettlementSection from './SettlementSection'
import MessagesSection from './MessagesSection'
import { statusInfo } from './eventUi'
import type { GroupDetails } from '../../types/groups'
import type { Area, EventDetails, Item, MealType } from '../../types/events'

const areaNames: Record<Area, string> = { venue: 'המקום', gift: 'המתנה', meal: 'הארוחה' }
const mealLabels: Record<MealType, string> = { Shared: 'ארוחה משותפת', Catering: 'קייטרינג', SelfMade: 'מכינה לבד' }
const splitLabels = { Equal: 'שווה בשווה בין כל הקבוצה', OrganizerPays: 'האחראית משלמת', SelectedMembers: 'בין משתתפות נבחרות' }

type Tab = 'areas' | 'items' | 'money' | 'chat'
const tabs: Tab[] = ['areas', 'items', 'money', 'chat']

type Confirm = { title: string; text: string; action: () => Promise<void>; success: string; after?: () => void }

function isConflict(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 409
}

// The progress ring in the header: an SVG circle whose visible stroke length is the percentage
function ProgressRing({ done, total }: { done: number; total: number }) {
  const radius = 26
  const length = 2 * Math.PI * radius
  return (
    <div className="ring" aria-label={`${done} מתוך ${total} מוכנים`}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} className="ring-track" />
        <circle cx="32" cy="32" r={radius} className="ring-value"
          strokeDasharray={length} strokeDashoffset={length * (1 - done / total)} />
      </svg>
      <span>{done}/{total}</span>
    </div>
  )
}

export default function EventDetailsPage() {
  const eventId = Number(useParams().id)
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  // The open tab lives in the URL (?tab=items), so "back" works and a link can open a tab
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const tab: Tab = tabParam && tabs.includes(tabParam) ? tabParam : 'areas'

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  // The 409 message per area, shown on the card that lost the race
  const [conflicts, setConflicts] = useState<Partial<Record<Area | 'organizer', string>>>({})
  const [editing, setEditing] = useState<Area | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const load = useCallback(async () => {
    try {
      // The event and its items load together; the group (members) needs the event's groupId
      const [ev, list] = await Promise.all([eventsApi.getEvent(eventId), eventsApi.getItems(eventId)])
      setEvent(ev)
      setItems(list)
      setGroup(await groupsApi.getGroup(ev.groupId))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  // Claiming: success shows a toast. A 409 means someone was faster -
  // the message stays on that card and the page reloads, so the winner's name appears.
  async function claim(key: Area | 'organizer') {
    setBusy(key)
    setConflicts(prev => ({ ...prev, [key]: undefined }))
    try {
      if (key === 'organizer') await eventsApi.claimOrganizer(eventId)
      else await eventsApi.claimArea(eventId, key)
      showToast(key === 'organizer' ? 'את האחראית על האירוע 🎉' : `לקחת את ${areaNames[key]}`)
    } catch (err) {
      if (isConflict(err)) setConflicts(prev => ({ ...prev, [key]: getErrorMessage(err) }))
      else showToast(getErrorMessage(err), 'error')
    } finally {
      setBusy(null)
      await load()
    }
  }

  async function runConfirm() {
    if (!confirm) return
    try {
      await confirm.action()
      showToast(confirm.success)
      if (confirm.after) confirm.after()
      else await load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
      await load()
    } finally {
      setConfirm(null)
    }
  }

  function openTab(next: Tab) {
    setSearchParams(next === 'areas' ? {} : { tab: next }, { replace: true })
  }

  if (error) {
    return (
      <div className="stack">
        <Link to="/events" className="back-link">→ לכל האירועים</Link>
        <div className="alert alert-conflict" role="alert"><p>{error}</p></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="stack">
        <div className="card skeleton" style={{ height: 180 }} />
        <div className="grid">{[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 200 }} />)}</div>
      </div>
    )
  }

  const isOrganizer = event.organizerId === user?.id
  const isClosed = event.status === 'Settled' || event.status === 'Cancelled'
  const canClaimAreas = event.organizerId !== null && (event.organizationMode === 'Open' || isOrganizer)
  const canDelete = event.status === 'Draft' && (event.createdById === user?.id || group?.managerId === user?.id)
  const canCancel = isOrganizer && !isClosed
  const date = new Date(event.eventDate)

  const areas: AreaView[] = [
    {
      area: 'venue', icon: '📍', title: 'מקום', ...event.venue,
      details: event.venue.address ? [event.venue.address] : [],
    },
    {
      area: 'meal', icon: '🍽️', title: 'ארוחה', ...event.meal,
      details: [
        event.meal.mealType ? mealLabels[event.meal.mealType] : '',
        event.meal.cateringName ?? '',
        event.meal.cateringIncludesTableware ? 'כולל כלים' : '',
      ].filter(Boolean),
    },
  ]
  if (event.gift) {
    areas.push({
      area: 'gift', icon: '🎁', title: 'מתנה', ...event.gift,
      details: event.gift.description ? [event.gift.description] : [],
    })
  }

  // The same checklist the server uses to set "Organized" automatically
  const publicItems = items?.filter(i => !i.isPrivate) ?? []
  const claimedItems = publicItems.filter(i => i.assigneeId !== null).length
  const checks = [
    { label: 'אחראית אירוע', done: event.organizerId !== null },
    ...areas.map(a => ({
      label: a.responsibleId === null ? a.title : `מחיר ${a.title}`,
      done: a.responsibleId !== null && a.price !== null,
    })),
    ...(publicItems.length > 0 ? [{ label: 'פריטים ברשימה', done: claimedItems === publicItems.length }] : []),
  ]
  const doneCount = checks.filter(c => c.done).length
  const missing = checks.filter(c => !c.done).map(c => c.label)

  const tabLabels: Record<Tab, string> = {
    areas: 'תחומי אחריות',
    items: publicItems.length ? `מה להביא · ${claimedItems}/${publicItems.length}` : 'מה להביא',
    money: 'תשלומים',
    chat: '💬 הודעות',
  }

  return (
    <div className="stack" style={{ gap: 'var(--sp-5)' }}>
      <Link to="/events" className="back-link">→ לכל האירועים</Link>

      {/* Header: date, title, status, progress and actions - everything at a glance */}
      <section className="event-hero" style={{ '--group-color': colorFor(event.groupName) } as CSSProperties}>
        <div className="event-hero-date">
          <b>{date.getDate()}</b>
          <span>{date.toLocaleDateString('he-IL', { month: 'short' })}</span>
          <small>{date.toLocaleDateString('he-IL', { weekday: 'long' })}</small>
        </div>

        <div className="event-hero-text">
          <span className={`badge ${statusInfo[event.status].className}`}>{statusInfo[event.status].label}</span>
          <h1>{event.title}</h1>
          <p>
            <Link to={`/groups/${event.groupId}`}>{event.groupName}</Link>
            {event.organizerName && <> · אחראית: {isOrganizer ? 'את' : event.organizerName}</>}
            {event.organizerId !== null && <> · {event.organizationMode === 'Open' ? 'פתוח לכולן' : 'Solo'}</>}
          </p>
          {!isClosed && event.organizerId !== null && (
            <p className="event-hero-missing">{missing.length === 0 ? '✓ הכול מוכן' : `חסר: ${missing.join(' · ')}`}</p>
          )}
        </div>

        {!isClosed && event.organizerId !== null && <ProgressRing done={doneCount} total={checks.length} />}

        <div className="event-hero-actions">
          {isOrganizer && !isClosed && <button className="btn btn-glass btn-sm" onClick={() => setSettingsOpen(true)}>⚙ הגדרות</button>}
          <Link to={`/events/${event.id}/summary`} className="btn btn-glass btn-sm">🖨 סיכום</Link>
          {(canCancel || canDelete) && (
            <div className="menu">
              <button className="btn btn-glass btn-sm" aria-label="עוד פעולות" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>⋯</button>
              {menuOpen && (
                <div className="menu-pop" onMouseLeave={() => setMenuOpen(false)}>
                  <button className="menu-danger" onClick={() => {
                    setMenuOpen(false)
                    setConfirm(canDelete
                      ? { title: 'למחוק את הטיוטה?', text: 'אי אפשר לבטל את הפעולה הזו.', action: () => eventsApi.deleteEvent(event.id), success: 'הטיוטה נמחקה', after: () => navigate('/events') }
                      : { title: 'לבטל את האירוע?', text: 'האירוע יישאר בלוח כ"בוטל", וכל החברות יראו זאת. אי אפשר יהיה לשנות אותו.', action: () => eventsApi.cancelEvent(event.id), success: 'האירוע בוטל' })
                  }}>
                    {canDelete ? '🗑 מחיקת הטיוטה' : '✕ ביטול האירוע'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {event.status === 'Cancelled' && <div className="alert alert-info"><p>האירוע בוטל.</p></div>}

      {/* No organizer yet: the one thing to do on this page */}
      {event.organizerId === null && !isClosed ? (
        <section className={`card claim-banner ${conflicts.organizer ? 'has-conflict' : ''}`}>
          <span className="claim-emoji">🙋‍♀️</span>
          <div style={{ flex: 1 }}>
            <h3>לאירוע הזה עדיין אין אחראית</h3>
            <p className="muted">מי שלוקחת מגדירה את האירוע, ובסוף סוגרת את החשבון.</p>
            {conflicts.organizer && <div className="alert alert-conflict" role="alert" style={{ marginTop: 'var(--sp-3)' }}><p>{conflicts.organizer}</p></div>}
          </div>
          <button className="btn btn-primary" disabled={busy === 'organizer'} onClick={() => claim('organizer')}>
            {busy === 'organizer' ? <span className="spinner" /> : 'אני אחראית האירוע'}
          </button>
        </section>
      ) : (
        <>
          {/* Tabs: one task per screen */}
          <nav className="tabs" role="tablist">
            {tabs.map(t => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => openTab(t)}>
                {tabLabels[t]}
              </button>
            ))}
          </nav>

          {tab === 'areas' && (
            <div className="area-grid">
              {areas.map(a => (
                <AreaCard
                  key={a.area}
                  view={a}
                  userId={user?.id}
                  canClaim={canClaimAreas}
                  isClosed={isClosed}
                  busy={busy === a.area}
                  conflict={conflicts[a.area] ?? null}
                  onClaim={() => claim(a.area)}
                  onEdit={() => setEditing(a.area)}
                  onRelease={() => setConfirm({
                    title: `לוותר על ${areaNames[a.area]}?`,
                    text: 'התחום יחזור להיות פנוי, ומישהי אחרת תוכל לקחת אותו.',
                    action: () => eventsApi.releaseArea(event.id, a.area),
                    success: 'התחום שוחרר',
                  })}
                />
              ))}
            </div>
          )}

          {tab === 'items' && <ItemsSection event={event} items={items} userId={user?.id} isClosed={isClosed} onChanged={load} />}

          {tab === 'chat' && <MessagesSection eventId={event.id} userId={user?.id} />}

          {tab === 'money' && (
            <div className="stack">
              <p className="muted">חלוקה: {splitLabels[event.splitMethod]}</p>
              {event.splitMethod === 'SelectedMembers' && event.participants.length > 0 && (
                <div className="row">
                  {event.participants.map(p => (
                    <span key={p.userId} className="person-chip"><Avatar name={p.fullName} size={24} />{p.fullName}</span>
                  ))}
                </div>
              )}
              <SettlementSection event={event} userId={user?.id} onClosed={load} />
            </div>
          )}
        </>
      )}

      {editing && (
        <AreaEditModal area={editing} event={event} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); showToast('נשמר'); load() }} />
      )}

      {settingsOpen && group && (
        <EventSettingsModal event={event} members={group.members} onClose={() => setSettingsOpen(false)}
          onSaved={() => { setSettingsOpen(false); showToast('ההגדרות נשמרו'); load() }} />
      )}

      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="muted">{confirm.text}</p>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-5)' }}>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>חזרה</button>
            <button className="btn btn-danger" onClick={runConfirm}>כן, להמשיך</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
