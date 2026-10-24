// The Tandem mark: two rings that overlap – two people, one shared part.
// The shared part (the lens in the middle) is the brand gradient.
type LogoProps = {
  size?: number
  showWordmark?: boolean
  light?: boolean
}

export default function Logo({ size = 40, showWordmark = true, light = false }: LogoProps) {
  const ring = light ? '#ffffff' : '#2b1b4a'

  return (
    <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.25 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="tandem-lens" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff8a5b" />
            <stop offset="1" stopColor="#e8434f" />
          </linearGradient>
        </defs>
        <circle cx="19" cy="24" r="12" fill="none" stroke={ring} strokeWidth="3.4" />
        <circle cx="29" cy="24" r="12" fill="none" stroke="#ff6b4a" strokeWidth="3.4" />
        <path d="M24 13.09 A12 12 0 0 1 24 34.91 A12 12 0 0 1 24 13.09 Z" fill="url(#tandem-lens)" />
      </svg>
      {showWordmark && (
        <span
          style={{
            font: `800 ${size * 0.62}px/1 var(--font-display)`,
            letterSpacing: '-0.03em',
            color: light ? '#fff' : 'var(--c-plum-800)',
            direction: 'ltr',
          }}
        >
          tandem
        </span>
      )}
    </span>
  )
}
