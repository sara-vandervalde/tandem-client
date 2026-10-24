import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import Logo from './Logo'
import NavIcon, { type IconName } from './NavIcon'

type NavItem = { to: string; label: string; icon: IconName; end?: boolean }

const navItems: NavItem[] = [
  { to: '/', label: 'ראשי', icon: 'home', end: true },
  { to: '/groups', label: 'הקבוצות שלי', icon: 'groups' },
  { to: '/events', label: 'אירועים', icon: 'events' },
  { to: '/payments', label: 'תשלומים', icon: 'payments' },
]

// The frame of every signed-in screen.
// Desktop: a side bar. Phone: a small top bar + a tab bar at the bottom.
// The same list of links feeds both, so nothing is written twice.
export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()
  const initial = user?.fullName.trim().charAt(0) ?? '?'
  const items: NavItem[] = isAdmin ? [...navItems, { to: '/admin', label: 'ניהול', icon: 'admin' }] : navItems

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-logo" aria-label="דף הבית"><Logo size={32} light /></NavLink>

        <nav className="sidenav">
          <span className="sidenav-label">תפריט</span>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="avatar" style={{ background: 'var(--grad-brand)', width: 40, height: 40 }}>{initial}</span>
          <div className="sidebar-user-text">
            <b className="ellipsis">{user?.fullName}</b>
            <span className="ellipsis">{isAdmin ? 'מנהלת מערכת' : user?.email}</span>
          </div>
          <button className="sidebar-logout" onClick={logout} aria-label="יציאה" title="יציאה">
            <NavIcon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <header className="mobilebar">
        <NavLink to="/" aria-label="דף הבית"><Logo size={26} /></NavLink>
        <div className="row" style={{ gap: 'var(--sp-2)' }}>
          <span className="avatar" style={{ background: 'var(--grad-brand)' }}>{initial}</span>
          <button className="icon-btn" onClick={logout} aria-label="יציאה"><NavIcon name="logout" size={18} /></button>
        </div>
      </header>

      <main className="app-main">
        <div className="container page">
          <Outlet />
        </div>
      </main>

      <nav className="tabbar">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <NavIcon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
