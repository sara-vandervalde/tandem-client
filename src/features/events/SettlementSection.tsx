import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryClient'
import * as settlementsApi from '../../api/settlements'
import { getErrorMessage } from '../../api/errors'
import { useToast } from '../../components/ToastContext'
import Avatar from '../../components/Avatar'
import Modal from '../../components/Modal'
import { formatShekel } from './eventUi'
import type { EventDetails } from '../../types/events'
import type { EventSummary } from '../../types/settlements'

type Props = {
  event: EventDetails
  userId: number | undefined
  onClosed: () => Promise<void>
}

// The money part of the event page.
// Before closing: a live estimate. After closing: the final payments and who already paid.
export default function SettlementSection({ event, userId, onClosed }: Props) {
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [closing, setClosing] = useState(false)

  // Its key is under ['event', id], so when the event page reloads after a change
  // (a new price, for example), the estimate reloads with it
  const summaryQuery = useQuery({ queryKey: queryKeys.summary(event.id), queryFn: () => settlementsApi.getSummary(event.id) })
  const summary: EventSummary | null = summaryQuery.data ?? null

  async function close() {
    setClosing(true)
    try {
      await settlementsApi.closeAccount(event.id)
      showToast('החשבון נסגר. כל אחת רואה עכשיו כמה להעביר ולמי 🎉')
      await onClosed()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setClosing(false)
      setConfirming(false)
    }
  }

  if (event.status === 'Cancelled' || event.organizerId === null) return null
  if (!summary) return <div className="card skeleton" style={{ height: 160 }} />

  const isOrganizer = event.organizerId === userId
  const transfers = summary.isFinal ? summary.settlements : summary.preview?.transfers ?? []
  const total = summary.preview?.total ?? transfers.reduce((sum, t) => sum + t.amount, 0)
  const paidCount = summary.settlements.filter(s => s.isPaid).length

  return (
    <section className="card stack settle-section">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 className="section-title">{summary.isFinal ? 'התשלומים' : 'הערכת תשלומים'}</h2>
          <p className="muted">
            {summary.isFinal
              ? `החשבון נסגר · ${paidCount} מתוך ${summary.settlements.length} שילמו`
              : 'אם החשבון ייסגר עכשיו, לפי המחירים שהוזנו עד כה'}
          </p>
        </div>
        {!summary.isFinal && summary.preview && (
          <div className="settle-total">
            <span>סה״כ</span>
            <b>{formatShekel(total)}</b>
            <small>{summary.preview.sharerCount} מתחלקות</small>
          </div>
        )}
      </header>

      {summary.isFinal && summary.settlements.length > 0 && (
        <div className="progress"><span style={{ width: `${(paidCount / summary.settlements.length) * 100}%` }} /></div>
      )}

      {transfers.length === 0 ? (
        <p className="muted items-empty">{summary.isFinal ? 'לא היה צורך בהעברות.' : 'עדיין אין העברות. הן יופיעו כשיוזנו מחירים.'}</p>
      ) : (
        <ul className="transfer-list">
          {transfers.map((t, i) => {
            const isPaid = 'isPaid' in t && t.isPaid
            const involvesMe = t.fromUserId === userId || t.toUserId === userId
            return (
              <li key={i} className={`${involvesMe ? 'is-mine' : ''} ${isPaid ? 'is-paid' : ''}`}>
                <span className="transfer-person"><Avatar name={t.fromUserName} size={28} />{t.fromUserId === userId ? 'את' : t.fromUserName}</span>
                <span className="transfer-arrow" aria-label="מעבירה ל">←</span>
                <span className="transfer-person"><Avatar name={t.toUserName} size={28} />{t.toUserId === userId ? 'את' : t.toUserName}</span>
                <b className="transfer-amount">{formatShekel(t.amount)}</b>
                {summary.isFinal && (isPaid ? <span className="badge badge-organized">שולם</span> : <span className="badge badge-organizing">ממתין</span>)}
              </li>
            )
          })}
        </ul>
      )}

      {/* Only the organizer closes, and only once the event is Organized */}
      {!summary.isFinal && isOrganizer && (
        <div className="settle-close">
          <p className="field-hint">
            {event.status === 'Organized'
              ? 'הכול מוכן. אחרי הסגירה המחירים ננעלים, וכל אחת רואה כמה להעביר ולמי.'
              : 'אפשר לסגור את החשבון רק כשהאירוע "מאורגן" (כל התחומים מאוישים ומתומחרים).'}
          </p>
          <button className="btn btn-dark" disabled={event.status !== 'Organized'} onClick={() => setConfirming(true)}>סגירת חשבון</button>
        </div>
      )}

      {confirming && (
        <Modal title="לסגור את החשבון?" onClose={() => setConfirming(false)}>
          <p className="muted">אחרי הסגירה אי אפשר לשנות מחירים או הגדרות. התשלומים יופיעו אצל כל אחת במסך "תשלומים".</p>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-5)' }}>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>חזרה</button>
            <button className="btn btn-primary" disabled={closing} onClick={close}>{closing ? <span className="spinner" /> : 'כן, לסגור'}</button>
          </div>
        </Modal>
      )}
    </section>
  )
}
