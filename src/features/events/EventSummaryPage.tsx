import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as settlementsApi from '../../api/settlements'
import { getErrorMessage } from '../../api/errors'
import Logo from '../../components/Logo'
import { formatDate } from '../../utils/dates'
import { formatShekel, statusInfo } from './eventUi'
import type { EventSummary } from '../../types/settlements'

const mealLabels = { Shared: 'ארוחה משותפת', Catering: 'קייטרינג', SelfMade: 'מכינה לבד' }

// Everything about the event on one sheet, designed to be printed (or saved as PDF)
export default function EventSummaryPage() {
  const eventId = Number(useParams().id)
  const [summary, setSummary] = useState<EventSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    settlementsApi.getSummary(eventId).then(setSummary).catch(err => setError(getErrorMessage(err)))
  }, [eventId])

  if (error) return <div className="alert alert-conflict" role="alert"><p>{error}</p></div>
  if (!summary) return <div className="card skeleton" style={{ height: 400 }} />

  const { event, items } = summary
  const transfers = summary.isFinal ? summary.settlements : summary.preview?.transfers ?? []
  const rows = [
    { label: '📍 מקום', who: event.venue.responsibleName, what: event.venue.address, price: event.venue.price },
    {
      label: '🍽️ ארוחה',
      who: event.meal.responsibleName,
      what: [event.meal.mealType && mealLabels[event.meal.mealType], event.meal.cateringName].filter(Boolean).join(' · '),
      price: event.meal.price,
    },
    ...(event.gift ? [{ label: '🎁 מתנה', who: event.gift.responsibleName, what: event.gift.description, price: event.gift.price }] : []),
  ]

  return (
    <div className="stack summary-page">
      <div className="row no-print" style={{ justifyContent: 'space-between' }}>
        <Link to={`/events/${event.id}`} className="back-link">→ חזרה לאירוע</Link>
        <button className="btn btn-dark btn-sm" onClick={() => window.print()}>🖨 הדפסה / PDF</button>
      </div>

      <article className="card summary-sheet">
        <header className="summary-head">
          <div>
            <span className={`badge ${statusInfo[event.status].className}`}>{statusInfo[event.status].label}</span>
            <h1>{event.title}</h1>
            <p className="muted">{formatDate(event.eventDate)} · {event.groupName} · אחראית: {event.organizerName ?? '—'}</p>
          </div>
          <Logo size={28} />
        </header>

        <h3>תחומי אחריות</h3>
        <table className="summary-table">
          <thead><tr><th>תחום</th><th>אחראית</th><th>פרטים</th><th>מחיר</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label}><td>{r.label}</td><td>{r.who ?? '—'}</td><td>{r.what || '—'}</td><td>{formatShekel(r.price)}</td></tr>
            ))}
          </tbody>
        </table>

        {items.length > 0 && (
          <>
            <h3>מה להביא</h3>
            <table className="summary-table">
              <thead><tr><th>פריט</th><th>סוג</th><th>מי מביאה</th></tr></thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id}><td>{i.name}</td><td>{i.type === 'Food' ? 'אוכל' : 'כלים'}</td><td>{i.assigneeName ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h3>{summary.isFinal ? 'תשלומים' : 'הערכת תשלומים'}</h3>
        {transfers.length === 0 ? <p className="muted">אין העברות.</p> : (
          <table className="summary-table">
            <thead><tr><th>מי</th><th>למי</th><th>סכום</th>{summary.isFinal && <th>מצב</th>}</tr></thead>
            <tbody>
              {transfers.map((t, i) => (
                <tr key={i}>
                  <td>{t.fromUserName}</td><td>{t.toUserName}</td><td>{formatShekel(t.amount)}</td>
                  {summary.isFinal && <td>{'isPaid' in t && t.isPaid ? '✓ שולם' : 'ממתין'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </div>
  )
}
