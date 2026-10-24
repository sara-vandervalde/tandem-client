import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

// Home screen after login. Filled with real groups and events in UI step 3.
export default function HomePage() {
  const { user } = useAuth()
  const firstName = user?.fullName.trim().split(' ')[0]
  // Read the clock once, when the screen opens
  const [hour] = useState(() => new Date().getHours())
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 18 ? 'צהריים טובים' : 'ערב טוב'

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)' }}>
      <section className="welcome">
        <span className="eyebrow">{greeting}</span>
        <h1>היי {firstName} 👋</h1>
        <p className="muted">מה מארגנות היום?</p>
      </section>

      <section className="grid">
        <Link to="/groups" className="card card-hover quick-card">
          <span className="quick-icon">👭</span>
          <h3>הקבוצות שלי</h3>
          <p className="muted">חברות, משפחה, שכנות – כל קבוצה במקום אחד.</p>
        </Link>
        <Link to="/events" className="card card-hover quick-card">
          <span className="quick-icon">📅</span>
          <h3>אירועים</h3>
          <p className="muted">לוח שנה, מי מביאה מה ומה עוד חסר.</p>
        </Link>
        <Link to="/payments" className="card card-hover quick-card">
          <span className="quick-icon">💸</span>
          <h3>תשלומים</h3>
          <p className="muted">מי משלמת למי, ולסמן "שילמתי".</p>
        </Link>
      </section>
    </div>
  )
}
