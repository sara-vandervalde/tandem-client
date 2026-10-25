import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as settlementsApi from '../../api/settlements'
import { getErrorMessage } from '../../api/errors'
import { useToast } from '../../components/ToastContext'
import Avatar from '../../components/Avatar'
import { formatDate } from '../../utils/dates'
import { formatShekel } from '../events/eventUi'
import BankAccountCard from './BankAccountCard'
import type { MySettlement } from '../../types/settlements'

type Tab = 'pay' | 'receive'

// "My payments": what I pay (with where to transfer) and what I receive
export default function PaymentsPage() {
  const { showToast } = useToast()
  const [list, setList] = useState<MySettlement[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('pay')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setList(await settlementsApi.getMySettlements())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function togglePaid(s: MySettlement) {
    setBusyId(s.id)
    try {
      await settlementsApi.setPaid(s.id, !s.isPaid)
      showToast(s.isPaid ? 'הסימון בוטל' : `סומן ששילמת ל${s.toUserName} ✓`)
      await load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast('הועתק', 'info')
    } catch {
      showToast('לא הצלחתי להעתיק', 'error')
    }
  }

  const toPay = list?.filter(s => s.iOwe) ?? []
  const toReceive = list?.filter(s => !s.iOwe) ?? []
  const sum = (items: MySettlement[]) => items.filter(s => !s.isPaid).reduce((total, s) => total + s.amount, 0)
  const shown = tab === 'pay' ? toPay : toReceive

  return (
    <div className="stack" style={{ gap: 'var(--sp-5)' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow">תשלומים</span>
          <h1>מי משלמת למי</h1>
        </div>
      </div>

      <div className="split">
        <div className="stack">
          {/* Two totals: what is still open on each side */}
          <div className="money-tiles">
            <button className={`money-tile owe ${tab === 'pay' ? 'active' : ''}`} onClick={() => setTab('pay')}>
              <span>את צריכה להעביר</span>
              <b>{formatShekel(sum(toPay))}</b>
              <small>{toPay.filter(s => !s.isPaid).length} תשלומים פתוחים</small>
            </button>
            <button className={`money-tile get ${tab === 'receive' ? 'active' : ''}`} onClick={() => setTab('receive')}>
              <span>מגיע לך</span>
              <b>{formatShekel(sum(toReceive))}</b>
              <small>{toReceive.filter(s => !s.isPaid).length} ממתינים</small>
            </button>
          </div>

          {error && <div className="alert alert-conflict" role="alert"><p>{error}</p></div>}
          {list === null && !error && [1, 2].map(i => <div key={i} className="card skeleton" style={{ height: 140 }} />)}

          {list && shown.length === 0 && (
            <div className="card empty-state">
              <span className="quick-icon">{tab === 'pay' ? '🎉' : '💸'}</span>
              <h2>{tab === 'pay' ? 'אין לך מה לשלם' : 'אין כרגע כסף שמגיע לך'}</h2>
              <p className="muted">תשלומים נוצרים כשהאחראית סוגרת את החשבון של אירוע.</p>
            </div>
          )}

          {shown.map(s => {
            const other = s.iOwe ? s.toUserName : s.fromUserName
            const bank = s.recipientBankAccount
            return (
              <article key={s.id} className={`card pay-card ${s.isPaid ? 'is-paid' : ''}`}>
                <div className="pay-main">
                  <Avatar name={other} size={44} />
                  <div className="pay-text">
                    <b>{s.iOwe ? `ל${other}` : `מ${other}`}</b>
                    <Link to={`/events/${s.eventId}`} className="muted">{s.eventTitle} · {formatDate(s.eventDate)}</Link>
                  </div>
                  <div className="pay-amount">
                    <b>{formatShekel(s.amount)}</b>
                    {s.isPaid
                      ? <span className="badge badge-organized">שולם</span>
                      : <span className="badge badge-organizing">{s.iOwe ? 'לתשלום' : 'ממתין'}</span>}
                  </div>
                </div>

                {s.iOwe && !s.isPaid && (bank ? (
                  <div className="bank-details">
                    <div><span>בנק</span><b>{bank.bankName}</b></div>
                    <div><span>סניף</span><b dir="ltr">{bank.branchNumber}</b><button className="copy-btn" onClick={() => copy(bank.branchNumber)}>העתקה</button></div>
                    <div><span>חשבון</span><b dir="ltr">{bank.accountNumber}</b><button className="copy-btn" onClick={() => copy(bank.accountNumber)}>העתקה</button></div>
                    <div><span>על שם</span><b>{bank.accountHolderName}</b></div>
                  </div>
                ) : (
                  <p className="pay-note">{other} עוד לא הזינה חשבון בנק. אפשר לשאול אותה לאן להעביר.</p>
                ))}

                {s.iOwe && (
                  <div className="pay-actions">
                    <button className={s.isPaid ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'} disabled={busyId === s.id} onClick={() => togglePaid(s)}>
                      {busyId === s.id ? <span className="spinner" /> : s.isPaid ? 'ביטול הסימון' : 'העברתי ✓ שילמתי'}
                    </button>
                    {s.isPaid && s.paidAt && <span className="field-hint">סומן ב-{formatDate(s.paidAt)}</span>}
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <BankAccountCard />
      </div>
    </div>
  )
}
