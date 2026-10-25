import { useState, type FormEvent } from 'react'
import * as eventsApi from '../../api/events'
import { getErrorMessage } from '../../api/errors'
import Modal from '../../components/Modal'
import type { Area, EventDetails, MealType } from '../../types/events'

type Props = {
  area: Area
  event: EventDetails
  onClose: () => void
  onSaved: () => void
}

const mealTypes: { value: MealType; icon: string; label: string; hint: string }[] = [
  { value: 'Shared', icon: '🥗', label: 'משותפת', hint: 'כל אחת מביאה מנה' },
  { value: 'Catering', icon: '🍽️', label: 'קייטרינג', hint: 'מזמינים מבחוץ' },
  { value: 'SelfMade', icon: '👩‍🍳', label: 'מכינה לבד', hint: 'אני מבשלת לכולן' },
]

// "" in the price field means "not entered yet" (null); 0 is a real price
function toPrice(text: string): number | null {
  return text.trim() === '' ? null : Number(text)
}

// The responsible member's form: the details and the price of one area
export default function AreaEditModal({ area, event, onClose, onSaved }: Props) {
  const current = area === 'venue' ? event.venue : area === 'gift' ? event.gift : event.meal
  const [price, setPrice] = useState(current?.price?.toString() ?? '')
  const [address, setAddress] = useState(event.venue.address ?? '')
  const [description, setDescription] = useState(event.gift?.description ?? '')
  const [mealType, setMealType] = useState<MealType | null>(event.meal.mealType)
  const [cateringName, setCateringName] = useState(event.meal.cateringName ?? '')
  const [tableware, setTableware] = useState(event.meal.cateringIncludesTableware)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    const value = toPrice(price)
    if (value !== null && (Number.isNaN(value) || value < 0 || value > 100000)) {
      setError('המחיר צריך להיות מספר בין 0 ל-100,000')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (area === 'venue') await eventsApi.updateVenue(event.id, address.trim() || null, value)
      if (area === 'gift') await eventsApi.updateGift(event.id, description.trim() || null, value)
      if (area === 'meal') {
        const isCatering = mealType === 'Catering'
        await eventsApi.updateMeal(event.id, {
          mealType,
          cateringName: isCatering ? cateringName.trim() || null : null,
          cateringIncludesTableware: isCatering && tableware,
          price: value,
        })
      }
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const title = area === 'venue' ? 'המקום' : area === 'gift' ? 'המתנה' : 'הארוחה'

  return (
    <Modal title={title} onClose={onClose}>
      <form className="stack" onSubmit={save} noValidate>
        {error && <div className="alert alert-conflict" role="alert"><p>{error}</p></div>}

        {area === 'venue' && (
          <div className="field">
            <label htmlFor="venue-address">כתובת</label>
            <input id="venue-address" className="input" maxLength={200} value={address}
              placeholder="למשל: הבית של רחל, הרצל 5" onChange={e => setAddress(e.target.value)} />
          </div>
        )}

        {area === 'gift' && (
          <div className="field">
            <label htmlFor="gift-desc">מה קונים?</label>
            <input id="gift-desc" className="input" maxLength={300} value={description}
              placeholder="למשל: שובר לספא" onChange={e => setDescription(e.target.value)} />
          </div>
        )}

        {area === 'meal' && (
          <>
            <div className="field">
              <label>סוג הארוחה</label>
              <div className="option-cards three">
                {mealTypes.map(m => (
                  <button type="button" key={m.value} className={mealType === m.value ? 'is-selected' : ''} onClick={() => setMealType(m.value)}>
                    <span className="option-icon">{m.icon}</span>
                    <b>{m.label}</b>
                    <span>{m.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            {mealType === 'Catering' && (
              <>
                <div className="field">
                  <label htmlFor="catering-name">שם הקייטרינג</label>
                  <input id="catering-name" className="input" maxLength={150} value={cateringName} onChange={e => setCateringName(e.target.value)} />
                </div>
                <label className="check-row">
                  <input type="checkbox" checked={tableware} onChange={e => setTableware(e.target.checked)} />
                  הקייטרינג מביא גם כלים
                </label>
              </>
            )}
          </>
        )}

        <div className="field">
          <label htmlFor="area-price">כמה שילמת? (₪)</label>
          <input id="area-price" className="input" type="number" min={0} max={100000} step="0.01" inputMode="decimal"
            dir="ltr" value={price} placeholder="אפשר להשאיר ריק ולהוסיף אחר כך" onChange={e => setPrice(e.target.value)} />
          <span className="field-hint">המחיר שיצא מהכיס שלך. בסגירת החשבון הוא חוזר אלייך. 0 זה בסדר (למשל אירוע בבית).</span>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? <span className="spinner" /> : 'שמירה'}
        </button>
      </form>
    </Modal>
  )
}
