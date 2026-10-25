import { useState, type FormEvent } from 'react'
import axios from 'axios'
import * as eventsApi from '../../api/events'
import { getErrorMessage } from '../../api/errors'
import { useToast } from '../../components/ToastContext'
import Avatar from '../../components/Avatar'
import type { EventDetails, Item, ItemType } from '../../types/events'

type Props = {
  event: EventDetails
  // Loaded by the event page, so its progress bar can count them too
  items: Item[] | null
  userId: number | undefined
  isClosed: boolean
  onChanged: () => Promise<void>
}

// The "what to bring" list: food (added by the meal's responsible member)
// and equipment (added by the venue's). Anyone in the group can say "I'll bring it".
export default function ItemsSection({ event, items, userId, isClosed, onChanged }: Props) {
  const { showToast } = useToast()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [conflicts, setConflicts] = useState<Record<number, string>>({})

  // Who may add to each part - the same rules the server checks
  const mealType = event.meal.mealType
  const canAddFood = !isClosed && event.meal.responsibleId === userId && (mealType === 'Shared' || mealType === 'SelfMade')
  const canAddEquipment = !isClosed && event.venue.responsibleId === userId && !event.meal.cateringIncludesTableware

  async function act(item: Item, action: () => Promise<void>, success: string) {
    setBusyId(item.id)
    setConflicts(prev => {
      const next = { ...prev }
      delete next[item.id]
      return next
    })
    try {
      await action()
      showToast(success)
    } catch (err) {
      // 409: someone else took it a moment earlier. The list reloads and shows who.
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setConflicts(prev => ({ ...prev, [item.id]: getErrorMessage(err) }))
      } else {
        showToast(getErrorMessage(err), 'error')
      }
    } finally {
      setBusyId(null)
      await onChanged()
    }
  }

  const food = items?.filter(i => i.type === 'Food') ?? []
  const equipment = items?.filter(i => i.type === 'Equipment') ?? []
  const mine = items?.filter(i => i.assigneeId === userId).length ?? 0

  function renderPart(type: ItemType, title: string, icon: string, list: Item[], canAdd: boolean, emptyText: string) {
    const isPrivateMenu = type === 'Food' && mealType === 'SelfMade'
    return (
      <div className="items-part">
        <header className="items-part-head">
          <span>{icon}</span>
          <h3>{isPrivateMenu ? 'התפריט הפרטי שלי' : title}</h3>
          <span className="muted">{list.filter(i => i.assigneeId).length}/{list.length}</span>
        </header>

        {isPrivateMenu && canAdd && <p className="field-hint">רק את רואה את התפריט הזה. זו רשימה לעצמך.</p>}

        {list.length === 0 && !canAdd && <p className="muted items-empty">{emptyText}</p>}

        <ul className="items-list">
          {list.map(item => {
            const isMine = item.assigneeId === userId
            const canRelease = item.assigneeId !== null && (isMine || item.addedById === userId)
            const canDelete = item.addedById === userId
            return (
              <li key={item.id} className={`item-row ${item.assigneeId ? 'is-taken' : ''} ${isMine ? 'is-mine' : ''}`}>
                <span className="item-name">{item.name}</span>
                {item.assigneeName && !item.isPrivate && (
                  <span className="item-who"><Avatar name={item.assigneeName} size={22} />{isMine ? 'את' : item.assigneeName}</span>
                )}
                {!isClosed && !item.isPrivate && item.assigneeId === null && (
                  <button className="btn btn-primary btn-sm" disabled={busyId === item.id}
                    onClick={() => act(item, () => eventsApi.claimItem(item.id), `תודה! את מביאה ${item.name}`)}>
                    {busyId === item.id ? <span className="spinner" /> : 'אני מביאה'}
                  </button>
                )}
                {!isClosed && canRelease && (
                  <button className="btn btn-ghost btn-sm" disabled={busyId === item.id}
                    onClick={() => act(item, () => eventsApi.releaseItem(item.id), 'הפריט שוחרר')}>
                    {isMine ? 'ביטול' : 'שחרור'}
                  </button>
                )}
                {!isClosed && canDelete && (
                  <button className="icon-btn" aria-label={`מחיקת ${item.name}`} disabled={busyId === item.id}
                    onClick={() => act(item, () => eventsApi.deleteItem(item.id), 'הפריט נמחק')}>✕</button>
                )}
                {conflicts[item.id] && <span className="item-conflict" role="alert">{conflicts[item.id]}</span>}
              </li>
            )
          })}
        </ul>

        {canAdd && <AddItemForm type={type} eventId={event.id} onAdded={onChanged} />}
      </div>
    )
  }

  return (
    <section className="card stack items-section">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 className="section-title">מה להביא</h2>
          <p className="muted">כל אחת מביאה על חשבונה. הפריטים לא נכנסים לחישוב התשלומים.</p>
        </div>
        {mine > 0 && <span className="badge badge-organized">את מביאה {mine}</span>}
      </header>

      {items === null ? (
        <div className="card skeleton" style={{ height: 120 }} />
      ) : (
        <div className="items-grid">
          {mealType !== 'Catering' && renderPart('Food', 'אוכל', '🥗', food, canAddFood,
            mealType ? 'עדיין אין מנות ברשימה.' : 'אחראית הארוחה עוד לא בחרה סוג ארוחה.')}
          {!event.meal.cateringIncludesTableware && renderPart('Equipment', 'כלים ועריכה', '🍴', equipment, canAddEquipment,
            'עדיין אין כלים ברשימה.')}
        </div>
      )}
    </section>
  )
}

// A one-line form under each part, for the responsible member only
function AddItemForm({ type, eventId, onAdded }: { type: ItemType; eventId: number; onAdded: () => void }) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function add(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      showToast('שם הפריט צריך להכיל לפחות 2 תווים', 'error')
      return
    }
    setSaving(true)
    try {
      await eventsApi.addItem(eventId, type, name.trim())
      setName('')
      onAdded()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="add-item" onSubmit={add}>
      <input className="input" value={name} maxLength={100} onChange={e => setName(e.target.value)}
        placeholder={type === 'Food' ? 'הוספת מנה, למשל: סלט ירקות' : 'הוספת פריט, למשל: צלחות חד-פעמיות'} />
      <button className="btn btn-dark btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : '+ הוספה'}</button>
    </form>
  )
}
