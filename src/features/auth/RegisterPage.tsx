import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getErrorMessage, getFieldErrors } from '../../api/errors'
import { useToast } from '../../components/ToastContext'
import AuthLayout from './AuthLayout'
import PasswordInput from './PasswordInput'
import Logo from '../../components/Logo'

type Form = { fullName: string; email: string; password: string; address: string }

// 0-3: length, letters + digits, and a symbol or 12+ characters
function passwordLevel(password: string): number {
  if (password.length < 8) return password ? 1 : 0
  let level = 1
  if (/[a-zA-Zא-ת]/.test(password) && /\d/.test(password)) level++
  if (/[^a-zA-Zא-ת0-9]/.test(password) || password.length >= 12) level++
  return level
}

// The same rules as the server's RegisterRequest, so most errors show before sending
function validate(form: Form): Partial<Record<keyof Form, string>> {
  const errors: Partial<Record<keyof Form, string>> = {}
  if (form.fullName.trim().length < 2) errors.fullName = 'השם צריך להכיל לפחות 2 תווים'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'כתובת האימייל אינה תקינה'
  if (form.password.length < 8) errors.password = 'הסיסמה צריכה להכיל לפחות 8 תווים'
  return errors
}

export default function RegisterPage() {
  const { user, register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState<Form>({ fullName: '', email: '', password: '', address: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  function update(field: keyof Form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    const clientErrors = validate(form)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSubmitting(true)
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        address: form.address.trim() || undefined,
      })
      showToast(`נעים להכיר, ${form.fullName.trim().split(' ')[0]}!`)
      navigate('/', { replace: true })
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
      else setServerError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const level = passwordLevel(form.password)

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-mobile-logo"><Logo size={32} /></div>
        <header>
          <span className="eyebrow">חשבון חדש</span>
          <h2 style={{ marginTop: 'var(--sp-2)' }}>מצטרפת ל-Tandem</h2>
          <p className="muted">דקה אחת, ואת בפנים.</p>
        </header>

        {serverError && (
          <div className="alert alert-conflict" role="alert">
            <span aria-hidden>!</span>
            <p>{serverError}</p>
          </div>
        )}

        <div className={`field ${errors.fullName ? 'field-error' : ''}`}>
          <label htmlFor="fullName">שם מלא</label>
          <input id="fullName" className="input" autoComplete="name" value={form.fullName}
            onChange={e => update('fullName', e.target.value)} />
          {errors.fullName && <span className="field-hint">{errors.fullName}</span>}
        </div>

        <div className={`field ${errors.email ? 'field-error' : ''}`}>
          <label htmlFor="email">אימייל</label>
          <input id="email" className="input" type="email" dir="ltr" autoComplete="email"
            placeholder="name@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
          {errors.email && <span className="field-hint">{errors.email}</span>}
        </div>

        <div className={`field ${errors.password ? 'field-error' : ''}`}>
          <label htmlFor="password">סיסמה</label>
          <PasswordInput id="password" autoComplete="new-password" value={form.password}
            onChange={e => update('password', e.target.value)} />
          <div className="strength" data-level={level} aria-hidden><span /><span /><span /></div>
          <span className="field-hint">{errors.password ?? 'לפחות 8 תווים. אותיות, ספרות וסימן – חזקה יותר.'}</span>
        </div>

        <div className="field">
          <label htmlFor="address">כתובת <span className="muted">(לא חובה)</span></label>
          <input id="address" className="input" autoComplete="street-address" value={form.address}
            onChange={e => update('address', e.target.value)} />
        </div>

        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? <><span className="spinner" />יוצרת חשבון…</> : 'יצירת חשבון'}
        </button>

        <p className="auth-switch">
          כבר יש לך חשבון? <Link to="/login">להתחברות</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
