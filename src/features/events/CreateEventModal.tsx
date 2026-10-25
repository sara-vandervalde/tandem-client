import { useState, type FormEvent } from 'react'
import * as eventsApi from '../../api/events'
import { getErrorMessage, getFieldErrors } from '../../api/errors'
import Modal from '../../components/Modal'
import { colorFor } from '../../utils/colors'
import { dayKey, dayToUtcIso } from './eventUi'
import type { Group } from '../../types/groups'
import type { EventDetails } from '../../types/events'

type Props = {
  groups: Group[]
  initialDate?: string
  initialGroupId?: number
  onClose: () => void
  onCreated: (event: EventDetails) => void
}

// Two steps in one dialog: 1) group, name and date  2) "are you the organizer?"
export default function CreateEventModal({ groups, initialDate, initialGroupId, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [groupId, setGroupId] = useState<number>(initialGroupId ?? groups[0]?.id ?? 0)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  // Read the clock once, when the dialog opens
  const [today] = useState(() => dayKey(new Date()))

  // Step 1 is checked here, before the question, so the user is not asked for nothing
  function next(e: FormEvent) {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (!groupId) found.groupId = 'יש לבחור קבוצה'
    if (title.trim().length < 2) found.title = 'שם האירוע צריך להכיל לפחות 2 תווים'
    if (!date) found.eventDate = 'יש לבחור תאריך'
    else if (date < today) found.eventDate = 'אי אפשר לבחור תאריך שעבר'
    setErrors(found)
    if (Object.keys(found).length === 0) setStep(2)
  }

  async function create(isOrganizer: boolean) {
    setSaving(true)
    try {
      const created = await eventsApi.createEvent(groupId, title.trim(), dayToUtcIso(date), isOrganizer)
      onCreated(created)
    } catch (err) {
      // Server validation goes back to step 1, next to the field
      const fieldErrors = getFieldErrors(err)
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { form: getErrorMessage(err) })
      setStep(1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={step === 1 ? 'אירוע חדש' : 'עוד שאלה אחת'} onClose={onClose}>
      {step === 1 ? (
        <form className="stack" onSubmit={next} noValidate>
          {errors.form && <div className="alert alert-conflict" role="alert"><p>{errors.form}</p></div>}

          <div className={`field ${errors.groupId ? 'field-error' : ''}`}>
            <label>באיזו קבוצה?</label>
            <div className="group-picker">
              {groups.map(g => (
                <button type="button" key={g.id} className={g.id === groupId ? 'is-selected' : ''} onClick={() => setGroupId(g.id)}>
                  <span className="group-tile sm" style={{ background: colorFor(g.name) }}>{g.name.charAt(0)}</span>
                  <span className="ellipsis">{g.name}</span>
                </button>
              ))}
            </div>
            {errors.groupId && <span className="field-hint">{errors.groupId}</span>}
          </div>

          <div className={`field ${errors.title ? 'field-error' : ''}`}>
            <label htmlFor="ev-title">שם האירוע</label>
            <input id="ev-title" className="input" autoFocus value={title} maxLength={150}
              placeholder="למשל: יום ההולדת של סבתא" onChange={e => setTitle(e.target.value)} />
            {errors.title && <span className="field-hint">{errors.title}</span>}
          </div>

          <div className={`field ${errors.eventDate ? 'field-error' : ''}`}>
            <label htmlFor="ev-date">תאריך</label>
            <input id="ev-date" type="date" className="input" min={today} value={date} onChange={e => setDate(e.target.value)} />
            {errors.eventDate && <span className="field-hint">{errors.eventDate}</span>}
          </div>

          <button className="btn btn-primary" type="submit">המשך</button>
        </form>
      ) : (
        <div className="stack">
          <p className="muted">מי שאחראית על האירוע מגדירה אותו וסוגרת את החשבון בסוף.</p>
          <div className="choice-grid">
            <button className="choice-card" disabled={saving} onClick={() => create(true)}>
              <span className="choice-emoji">🙋‍♀️</span>
              <b>כן, אני אחראית</b>
              <span>האירוע עובר ל"בארגון" ואפשר להתחיל</span>
            </button>
            <button className="choice-card" disabled={saving} onClick={() => create(false)}>
              <span className="choice-emoji">📝</span>
              <b>לא כרגע</b>
              <span>האירוע נשמר כטיוטה, ומישהי אחרת תוכל לקחת</span>
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} disabled={saving} onClick={() => setStep(1)}>→ חזרה</button>
        </div>
      )}
    </Modal>
  )
}
