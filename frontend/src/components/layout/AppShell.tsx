import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Hotel,
  GitCompareArrows,
  ClipboardCheck,
  Tags,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Network,
} from 'lucide-react'
import BackendStatus from './BackendStatus'

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Suppliers', path: '/suppliers', icon: Building2 },
  { label: 'Inventory', path: '/inventory', icon: Hotel },
  { label: 'Hotel Matching', path: '/matching', icon: GitCompareArrows },
  { label: 'Review Queue', path: '/review', icon: ClipboardCheck },
  { label: 'Offer Comparison', path: '/offers', icon: Tags },
  { label: 'Analytics', path: '/analytics', icon: ChartNoAxesCombined },
]

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  function closeMobileNavigation() {
    if (!mobileOpen) return

    setMobileOpen(false)
    menuButtonRef.current?.focus()
  }

  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])
  const location = useLocation()
  const currentPage =
    navigation.find(({ path }) => path === location.pathname)?.label ??
    (location.pathname === '/settings' ? 'Settings' : 'Workspace')

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={closeMobileNavigation}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Network size={21} strokeWidth={2.2} /></div>
          <div className="brand-copy">
            <span className="brand-name">TBO</span>
            <span className="brand-subtitle">INVENTORY INTELLIGENCE</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={closeMobileNavigation}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav id="primary-navigation" className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={closeMobileNavigation}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            onClick={closeMobileNavigation}
          >
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </NavLink>
          <div className="sidebar-divider" />
          <div className="workspace-card">
            <div className="workspace-avatar">TI</div>
            <div className="workspace-info">
              <strong>Travel Intelligence</strong>
              <span>Demo workspace</span>
            </div>
            <ChevronDown size={15} />
          </div>
          <div className="sidebar-version">TBO Inventory Intelligence <span>v0.1.0</span></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              ref={menuButtonRef}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="primary-navigation"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{currentPage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="global-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Global search coming soon"
                aria-label="Global search is not available yet"
                disabled
              />
            </label>
            <BackendStatus />
            <button
              className="icon-button notification-button"
              aria-label="Notifications coming soon"
              title="Notifications are not available yet"
              disabled
            >
              <Bell size={19} />
            </button>
            <div className="topbar-divider" />
            <div className="profile-button" aria-label="Workspace Admin profile">
              <span className="profile-avatar">RK</span>
              <span className="profile-copy"><strong>Workspace Admin</strong><small>Administrator</small></span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Copyright 2026 TBO Inventory Intelligence</span>
          <span><i /> Demonstration environment</span>
        </footer>
      </div>
    </div>
  )
}
