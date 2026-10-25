import { useEffect, useState, type FormEvent } from 'react'
import * as settlementsApi from '../../api/settlements'
import { getErrorMessage, getFieldErrors } from '../../api/errors'
import { useToast } from '../../components/ToastContext'
import type { Bank, BankAccount } from '../../types/settlements'

type Form = { bankId: string; branchNumber: string; accountNumber: string; accountHolderName: string }

function validate(form: Form): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.bankId) errors.bankId = 'יש לבחור בנק'
  if (!/^\d{1,5}$/.test(form.branchNumber)) errors.branchNumber = 'ספרות בלבד, עד 5'
  if (!/^\d{2,20}$/.test(form.accountNumber)) errors.accountNumber = 'ספרות בלבד, בין 2 ל-20'
  if (form.accountHolderName.trim().length < 2) errors.accountHolderName = 'לפחות 2 תווים'
  return errors
}

// "My account for receiving money". Shown masked; the full number only inside the form
export default function BankAccountCard() {
  const { showToast } = useToast()
  const [account, setAccount] = useState<BankAccount | null | undefined>(undefined)
  const [banks, setBanks] = useState<Bank[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Form>({ bankId: '', branchNumber: '', accountNumber: '', accountHolderName: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([settlementsApi.getMyBankAccount(), settlementsApi.getBanks()])
      .then(([acc, list]) => {
        setAccount(acc)
        setBanks(list)
      })
      .catch(err => showToast(getErrorMessage(err), 'error'))
  }, [showToast])

  function startEdit() {
    setForm(account
      ? { bankId: String(account.bankId), branchNumber: account.branchNumber, accountNumber: account.accountNumber, accountHolderName: account.accountHolderName }
      : { bankId: '', branchNumber: '', accountNumber: '', accountHolderName: '' })
    setErrors({})
    setEditing(true)
  }

  function update(field: keyof Form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      const request = { ...form, bankId: Number(form.bankId), accountHolderName: form.accountHolderName.trim() }
      await settlementsApi.saveMyBankAccount(request)
      setAccount({ ...request, bankName: banks.find(b => b.id === request.bankId)?.name ?? '' })
      setEditing(false)
      showToast('פרטי החשבון נשמרו')
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { form: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  if (account === undefined) return <div className="card skeleton" style={{ height: 200 }} />

  return (
    <section className="card stack bank-card">
      <header>
        <span className="eyebrow">לקבלת כסף</span>
        <h3>החשבון שלי</h3>
      </header>

      {editing ? (
        <form className="stack" onSubmit={save} noValidate>
          {errors.form && <div className="alert alert-conflict" role="alert"><p>{errors.form}</p></div>}
          <div className={`field ${errors.bankId ? 'field-error' : ''}`}>
            <label htmlFor="bank">בנק</label>
            <select id="bank" className="input" value={form.bankId} onChange={e => update('bankId', e.target.value)}>
              <option value="">בחירת בנק…</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.bankId && <span className="field-hint">{errors.bankId}</span>}
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className={`field ${errors.branchNumber ? 'field-error' : ''}`} style={{ flex: 1, minWidth: 90 }}>
              <label htmlFor="branch">סניף</label>
              <input id="branch" className="input" dir="ltr" inputMode="numeric" maxLength={5} value={form.branchNumber}
                onChange={e => update('branchNumber', e.target.value.replace(/\D/g, ''))} />
              {errors.branchNumber && <span className="field-hint">{errors.branchNumber}</span>}
            </div>
            <div className={`field ${errors.accountNumber ? 'field-error' : ''}`} style={{ flex: 2, minWidth: 140 }}>
              <label htmlFor="account">מספר חשבון</label>
              <input id="account" className="input" dir="ltr" inputMode="numeric" maxLength={20} value={form.accountNumber}
                onChange={e => update('accountNumber', e.target.value.replace(/\D/g, ''))} />
              {errors.accountNumber && <span className="field-hint">{errors.accountNumber}</span>}
            </div>
          </div>
          <div className={`field ${errors.accountHolderName ? 'field-error' : ''}`}>
            <label htmlFor="holder">שם בעל/ת החשבון</label>
            <input id="holder" className="input" maxLength={100} value={form.accountHolderName} onChange={e => update('accountHolderName', e.target.value)} />
            {errors.accountHolderName && <span className="field-hint">{errors.accountHolderName}</span>}
          </div>
          <div className="row">
            <button className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? <span className="spinner" /> : 'שמירה'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>ביטול</button>
          </div>
        </form>
      ) : account ? (
        <>
          <div className="bank-visual">
            <span className="bank-visual-name">{account.bankName}</span>
            <span className="bank-visual-number" dir="ltr">{account.branchNumber} · ••••{account.accountNumber.slice(-4)}</span>
            <span className="bank-visual-holder">{account.accountHolderName}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={startEdit}>עריכת הפרטים</button>
        </>
      ) : (
        <>
          <p className="muted">כדי שחברות יוכלו להחזיר לך כסף, הן צריכות לדעת לאן להעביר.</p>
          <button className="btn btn-dark" onClick={startEdit}>הוספת חשבון בנק</button>
        </>
      )}
      <p className="field-hint">🔒 הפרטים מוצגים רק למי שחייבת לך כסף.</p>
    </section>
  )
}
