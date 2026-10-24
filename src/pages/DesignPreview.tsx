import { useState } from 'react'
import Logo from '../components/Logo'

// Temporary page: shows the whole design system on one screen for approval.
// It is replaced by the real routes in UI step 2.

const swatches = [
  { name: 'Plum 800', value: '#2b1b4a', note: 'מותג, כותרות' },
  { name: 'Plum 600', value: '#4a3279', note: 'משני' },
  { name: 'Coral', value: '#ff6b4a', note: 'פעולה ראשית' },
  { name: 'Crimson', value: '#e8434f', note: 'סוף הגרדיאנט' },
  { name: 'Cream', value: '#faf7f2', note: 'רקע' },
  { name: 'Ink', value: '#221a33', note: 'טקסט' },
]

type Item = { id: number; name: string; owner: string | null }

export default function DesignPreview() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'סלט ירוק גדול', owner: null },
    { id: 2, name: 'עוגת שמרים', owner: 'רחל' },
    { id: 3, name: 'צלחות וכוסות חד-פעמיות', owner: null },
  ])
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [showConflict, setShowConflict] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function claim(item: Item) {
    setLoadingId(item.id)
    setTimeout(() => {
      setLoadingId(null)
      if (item.owner) {
        setShowConflict(true)
        return
      }
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, owner: 'את' } : i)))
      setToast(`מעולה! "${item.name}" עלייך`)
      setTimeout(() => setToast(null), 2600)
    }, 700)
  }

  return (
    <>
      <header style={{ background: 'var(--grad-night)', color: '#fff', overflow: 'hidden', position: 'relative' }}>
        <div aria-hidden style={{ position: 'absolute', insetInlineEnd: -120, top: -120, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgb(255 107 74 / 0.45), transparent 65%)' }} />
        <div className="container" style={{ padding: 'var(--sp-7) 0 var(--sp-8)', position: 'relative' }}>
          <Logo size={44} light />
          <h1 style={{ color: '#fff', marginTop: 'var(--sp-6)', maxWidth: 640 }}>
            כל אחת לוקחת חלק.
            <br />
            <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              ביחד זה פשוט יותר.
            </span>
          </h1>
          <p style={{ marginTop: 'var(--sp-4)', maxWidth: 520, opacity: 0.8, fontSize: 'var(--fs-lg)' }}>
            מארגנות אירוע עם הקבוצה? מי מביאה מה, מי משלמת כמה – הכול במקום אחד, בלי רשימות בוואטסאפ.
          </p>
          <div className="row" style={{ marginTop: 'var(--sp-6)' }}>
            <button className="btn btn-primary">בואי נתחיל</button>
            <button className="btn btn-ghost" style={{ color: '#fff' }}>כבר יש לי חשבון</button>
          </div>
        </div>
      </header>

      <main className="container stack" style={{ gap: 'var(--sp-7)', padding: 'var(--sp-7) 0' }}>
        {/* Colors */}
        <section className="stack">
          <span className="eyebrow">צבעים</span>
          <h2>פלטה</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--sp-4)' }}>
            {swatches.map(s => (
              <div key={s.name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 72, background: s.value, borderBottom: '1px solid var(--c-line)' }} />
                <div style={{ padding: 'var(--sp-3)' }}>
                  <b style={{ fontFamily: 'var(--font-display)' }}>{s.name}</b>
                  <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{s.value} · {s.note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Type & buttons */}
        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div className="card stack">
            <span className="eyebrow">טיפוגרפיה</span>
            <h1 style={{ fontSize: 'var(--fs-xl)' }}>Rubik – כותרות</h1>
            <h3>כותרת משנה</h3>
            <p className="muted">Heebo לטקסט רץ: קריא, נקי ונוח בעברית גם בגדלים קטנים.</p>
          </div>
          <div className="card stack">
            <span className="eyebrow">כפתורים</span>
            <div className="row">
              <button className="btn btn-primary">ראשי</button>
              <button className="btn btn-dark">כהה</button>
              <button className="btn btn-secondary">משני</button>
            </div>
            <div className="row">
              <button className="btn btn-ghost">שקוף</button>
              <button className="btn btn-danger">מחיקה</button>
              <button className="btn btn-primary" disabled><span className="spinner" />שומרת…</button>
            </div>
          </div>
        </section>

        {/* Event card */}
        <section className="stack">
          <span className="eyebrow">אירועים</span>
          <h2>כרטיס אירוע</h2>
          <div className="grid">
            <EventCard day="14" month="נוב׳" title="ערב הוקרה לשרה" group="בנות המחזור" status="organizing" progress={60} />
            <EventCard day="02" month="דצמ׳" title="מסיבת חנוכה" group="שכנות ברחוב הגפן" status="organized" progress={100} />
            <EventCard day="19" month="דצמ׳" title="יום הולדת 40 לדינה" group="חברות מהעבודה" status="draft" progress={10} />
          </div>
        </section>

        {/* Claim flow */}
        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div className="card stack">
            <span className="eyebrow">מה להביא</span>
            <h3>"אני לוקחת את זה!"</h3>
            <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              נסי ללחוץ על "עוגת שמרים" – מישהי כבר תפסה אותה, וזה מה שרואים כשהשרת מחזיר 409.
            </p>
            {items.map(item => (
              <div key={item.id} className={`item-row ${item.owner === 'את' ? 'is-mine' : item.owner ? 'is-taken' : ''}`}>
                <span className="item-name">{item.name}</span>
                {item.owner === 'את' ? (
                  <span className="badge badge-organized">עלייך</span>
                ) : (
                  <>
                    {item.owner && <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{item.owner}</span>}
                    <button className="btn btn-primary btn-sm" disabled={loadingId === item.id} onClick={() => claim(item)}>
                      {loadingId === item.id ? <span className="spinner" /> : 'אני לוקחת!'}
                    </button>
                  </>
                )}
              </div>
            ))}
            {showConflict && (
              <div className="alert alert-conflict" role="alert">
                <span aria-hidden style={{ fontSize: 20 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <strong>מישהי הקדימה אותך</strong>
                  <p>רחל כבר לקחה את "עוגת שמרים" לפני רגע. הרשימה עודכנה – אולי משהו אחר?</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowConflict(false)}>הבנתי</button>
              </div>
            )}
          </div>

          <div className="card stack">
            <span className="eyebrow">טפסים</span>
            <h3>התחברות</h3>
            <div className="field">
              <label htmlFor="email">אימייל</label>
              <input id="email" className="input" placeholder="name@example.com" dir="ltr" />
            </div>
            <div className="field field-error">
              <label htmlFor="pass">סיסמה</label>
              <input id="pass" className="input" type="password" defaultValue="123" />
              <span className="field-hint">הסיסמה צריכה להכיל לפחות 8 תווים</span>
            </div>
            <button className="btn btn-dark">התחברות</button>
            <div className="alert alert-success">
              <span aria-hidden>✓</span>
              <div><strong>שולם</strong><p>סימנת "שילמתי" ל-120 ₪ לדינה.</p></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container row" style={{ justifyContent: 'space-between', padding: 'var(--sp-5) 0', borderTop: '1px solid var(--c-line)' }}>
        <Logo size={24} />
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>כל אחת לוקחת חלק</span>
      </footer>

      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </>
  )
}

type EventCardProps = {
  day: string
  month: string
  title: string
  group: string
  status: 'draft' | 'organizing' | 'organized'
  progress: number
}

const statusLabel = { draft: 'טיוטה', organizing: 'בארגון', organized: 'מאורגן' }

function EventCard({ day, month, title, group, status, progress }: EventCardProps) {
  return (
    <article className="card card-hover stack" style={{ gap: 'var(--sp-4)' }}>
      <div className="event-card">
        <div className="date-tile"><b>{day}</b><span>{month}</span></div>
        <div className="stack" style={{ gap: 'var(--sp-1)', flex: 1 }}>
          <span className={`badge badge-${status}`} style={{ alignSelf: 'flex-start' }}>{statusLabel[status]}</span>
          <h3>{title}</h3>
          <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{group}</span>
        </div>
      </div>
      <div className="stack" style={{ gap: 'var(--sp-2)' }}>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
          <span className="muted">מה כבר מכוסה</span>
          <b>{progress}%</b>
        </div>
        <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="avatar-stack">
          <span className="avatar">ש</span>
          <span className="avatar" style={{ background: 'var(--c-coral-500)' }}>ר</span>
          <span className="avatar" style={{ background: 'var(--c-success)' }}>ד</span>
          <span className="avatar" style={{ background: 'var(--c-surface-2)', color: 'var(--c-ink-2)' }}>+4</span>
        </div>
        <button className="btn btn-secondary btn-sm">לאירוע</button>
      </div>
    </article>
  )
}
