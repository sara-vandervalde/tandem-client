// Placeholder for screens built in the next UI steps
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="card empty-state">
      <span className="quick-icon">🚧</span>
      <h2>{title}</h2>
      <p className="muted">המסך הזה ייבנה בצעד הבא.</p>
    </div>
  )
}
