import Avatar from '../../components/Avatar'
import { formatShekel } from './eventUi'
import type { Area } from '../../types/events'

export type AreaView = {
  area: Area
  icon: string
  title: string
  responsibleId: number | null
  responsibleName: string | null
  price: number | null
  // What the responsible member entered, e.g. the address. Empty = nothing yet
  details: string[]
}

type Props = {
  view: AreaView
  userId: number | undefined
  canClaim: boolean
  isClosed: boolean
  busy: boolean
  conflict: string | null
  onClaim: () => void
  onRelease: () => void
  onEdit: () => void
}

// One area of responsibility (venue / meal / gift) in its three states:
// free, mine, or taken by someone else
export default function AreaCard({ view, userId, canClaim, isClosed, busy, conflict, onClaim, onRelease, onEdit }: Props) {
  const isMine = view.responsibleId !== null && view.responsibleId === userId
  const isFree = view.responsibleId === null
  const stateClass = isFree ? 'is-free' : isMine ? 'is-mine' : 'is-taken'
  const missingPrice = !isFree && view.price === null

  return (
    <article className={`card area-card ${stateClass} ${conflict ? 'has-conflict' : ''}`}>
      <header className="area-head">
        <span className="area-icon">{view.icon}</span>
        <h3>{view.title}</h3>
        {isFree && <span className="badge badge-draft">פנוי</span>}
        {!isFree && (missingPrice
          ? <span className="badge badge-organizing">חסר מחיר</span>
          : <span className="badge badge-organized">{formatShekel(view.price)}</span>)}
      </header>

      {/* The 409 message stays on the card that lost, so it is clear what happened */}
      {conflict && <div className="alert alert-conflict" role="alert"><p>{conflict}</p></div>}

      {isFree ? (
        <p className="muted area-body">עדיין אף אחת לא לקחה את התחום הזה.</p>
      ) : (
        <div className="area-body">
          <div className="area-person">
            <Avatar name={view.responsibleName ?? '?'} size={28} />
            <span><b>{isMine ? 'את' : view.responsibleName}</b> {isMine ? 'אחראית' : 'אחראית על זה'}</span>
          </div>
          {view.details.length > 0
            ? <ul className="area-details">{view.details.map(d => <li key={d}>{d}</li>)}</ul>
            : <p className="muted">{isMine ? 'הוסיפי פרטים ומחיר כשיש.' : 'עוד לא הוזנו פרטים.'}</p>}
        </div>
      )}

      {!isClosed && (
        <footer className="area-actions">
          {isFree && canClaim && (
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={onClaim}>
              {busy ? <span className="spinner" /> : 'אני אחראית'}
            </button>
          )}
          {isFree && !canClaim && <span className="field-hint">באירוע Solo האחראית לוקחת את כל התחומים</span>}
          {isMine && (
            <>
              <button className="btn btn-dark btn-sm" onClick={onEdit}>פרטים ומחיר</button>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={onRelease}>אני מוותרת</button>
            </>
          )}
        </footer>
      )}
    </article>
  )
}
