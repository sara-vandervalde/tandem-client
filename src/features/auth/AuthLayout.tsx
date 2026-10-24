import type { ReactNode } from 'react'
import Logo from '../../components/Logo'

// Shared frame of the login and register screens:
// the brand story on one side, the form on the other
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <Logo size={40} light />

        <div>
          <h1>
            האירוע של הקבוצה,
            <br />
            <span className="gradient-text">בלי הבלגן.</span>
          </h1>
          <p>מי מביאה מה, מי משלמת כמה ומתי נפגשות. הכול במקום אחד.</p>

          <div className="activity" aria-hidden="true">
            <div className="activity-card">
              <span className="avatar" style={{ background: 'var(--c-coral-500)' }}>ר</span>
              <div>רחל לקחה את עוגת השמרים<small>לפני 2 דקות</small></div>
            </div>
            <div className="activity-card">
              <span className="avatar" style={{ background: 'var(--c-success)' }}>ד</span>
              <div>דינה סימנה "שילמתי" ✓<small>לפני 10 דקות</small></div>
            </div>
            <div className="activity-card">
              <span className="avatar" style={{ background: 'var(--grad-brand)' }}>★</span>
              <div>מסיבת חנוכה: הכול מאורגן!<small>היום</small></div>
            </div>
          </div>
        </div>

        <small style={{ opacity: 0.5 }}>© Tandem 2026</small>
      </aside>

      <main className="auth-form-side">{children}</main>
    </div>
  )
}
