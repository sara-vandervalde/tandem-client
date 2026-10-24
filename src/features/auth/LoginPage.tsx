import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getErrorMessage } from '../../api/errors'
import AuthLayout from './AuthLayout'
import PasswordInput from './PasswordInput'
import Logo from '../../components/Logo'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    searchParams.get('expired') ? 'החיבור פג תוקף. יש להתחבר שוב.' : null,
  )
  const [submitting, setSubmitting] = useState(false)

  // Where to go after login: the page the user tried to open, or home
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (user) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-mobile-logo"><Logo size={32} /></div>
        <header>
          <span className="eyebrow">ברוכה השבה</span>
          <h2 style={{ marginTop: 'var(--sp-2)' }}>התחברות ל-Tandem</h2>
          <p className="muted">הקבוצות והאירועים שלך מחכים לך.</p>
        </header>

        {error && (
          <div className="alert alert-conflict" role="alert">
            <span aria-hidden>!</span>
            <p>{error}</p>
          </div>
        )}

        <div className="field">
          <label htmlFor="email">אימייל</label>
          <input
            id="email"
            className="input"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">סיסמה</label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary" disabled={submitting || !email || !password}>
          {submitting ? <><span className="spinner" />מתחברת…</> : 'התחברות'}
        </button>

        <p className="auth-switch">
          עדיין אין לך חשבון? <Link to="/register">להרשמה</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
