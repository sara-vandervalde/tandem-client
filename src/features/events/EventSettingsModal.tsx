import { useState, type FormEvent } from 'react'
import * as eventsApi from '../../api/events'
import { getErrorMessage } from '../../api/errors'
import Modal from '../../components/Modal'
import { dayKey, dayToUtcIso } from './eventUi'
import type { GroupMember } from '../../types/groups'
import type { EventDetails, OrganizationMode, SplitMethod } from '../../types/events'

type Props = {
  event: EventDetails
  members: GroupMember[]
  onClose: () => void
  onSaved: () => void
}

const modes: { value: OrganizationMode; icon: string; label: string; hint: string }[] = [
  { value: 'Solo', icon: '🧑‍💼', label: 'אני מארגנת לבד', hint: 'רק אני לוקחת את התחומים' },
  { value: 'Open', icon: '🤝', label: 'פתוח לכולן', hint: 'כל חברה יכולה לקחת תחום' },
]

const splits: { value: SplitMethod; icon: string; label: string; hint: string }[] = [
  { value: 'Equal', icon: '⚖️', label: 'שווה בשווה', hint: 'בין כל חברות הקבוצה' },
  { value: 'OrganizerPays', icon: '💝', label: 'אני משלמת', hint: 'אף אחת לא מחזירה' },
  { value: 'SelectedMembers', icon: '✅', label: 'משתתפות שאבחר', hint: 'שווה בשווה ביניהן' },
]

// The organizer's settings: name, date, Solo/Open, gift, and how the cost is split
export default function EventSettingsModal({ event, members, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(event.title)
  const [date, setDate] = useState(dayKey(new Date(event.eventDate)))
  const [mode, setMode] = useState(event.organizationMode)
  const [hasGift, setHasGift] = useState(event.hasGift)
  const [split, setSplit] = useState(event.splitMethod)
  const [participants, setParticipants] = useState<number[]>(event.participants.map(p => p.userId))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function toggleParticipant(userId: number) {
    setParticipants(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (title.trim().length < 2) return setError('שם האירוע צריך להכיל לפחות 2 תווים')
    if (!date) return setError('יש לבחור תאריך')
    if (split === 'SelectedMembers' && participants.length === 0) return setError('יש לבחור לפחות משתתפת אחת')

    setSaving(true)
    setError(null)
    try {
      await eventsApi.updateEvent(event.id, {
        title: title.trim(),
        eventDate: dayToUtcIso(date),
        organizationMode: mode,
        hasGift,
        splitMethod: split,
      })
      // The participants list is saved only after the split method allows it
      if (split === 'SelectedMembers') await eventsApi.setParticipants(event.id, participants)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="הגדרות האירוע" onClose={onClose}>
      <form className="stack settings-form" onSubmit={save} noValidate>
        {error && <div className="alert alert-conflict" role="alert"><p>{error}</p></div>}

        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="field" style={{ flex: 2, minWidth: 180 }}>
            <label htmlFor="set-title">שם האירוע</label>
            <input id="set-title" className="input" maxLength={150} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 150 }}>
            <label htmlFor="set-date">תאריך</label>
            <input id="set-date" className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>אופן הארגון</label>
          <div className="option-cards">
            {modes.map(m => (
              <button type="button" key={m.value} className={mode === m.value ? 'is-selected' : ''} onClick={() => setMode(m.value)}>
                <span className="option-icon">{m.icon}</span>
                <b>{m.label}</b>
                <span>{m.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="switch-row">
          <span>
            <b>🎁 יש מתנה?</b>
            <span className="field-hint">אם כן, מופיע כרטיס "מתנה" שמישהי לוקחת עליו אחריות</span>
          </span>
          <input type="checkbox" role="switch" className="switch" checked={hasGift} onChange={e => setHasGift(e.target.checked)} />
        </label>

        <div className="field">
          <label>איך מתחלקים בתשלום?</label>
          <div className="option-cards three">
            {splits.map(s => (
              <button type="button" key={s.value} className={split === s.value ? 'is-selected' : ''} onClick={() => setSplit(s.value)}>
                <span className="option-icon">{s.icon}</span>
                <b>{s.label}</b>
                <span>{s.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {split === 'SelectedMembers' && (
          <div className="field">
            <label>מי משתתפת בתשלום? ({participants.length})</label>
            <div className="member-checks">
              {members.map(m => (
                <label key={m.userId} className={participants.includes(m.userId) ? 'is-selected' : ''}>
                  <input type="checkbox" checked={participants.includes(m.userId)} onChange={() => toggleParticipant(m.userId)} />
                  {m.fullName}
                </label>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? <span className="spinner" /> : 'שמירת ההגדרות'}
        </button>
      </form>
    </Modal>
  )
}
