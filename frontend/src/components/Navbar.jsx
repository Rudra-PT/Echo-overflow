import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

// ─── Flame / Logo icon ────────────────────────────────────────────────────────

function FlameIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-1.5-.5-3-1.5-4.5C15 11 14 12.5 12 13c0-3-1-6-1-6 0 0-1 2-1 4a3 3 0 01-1-2.5C9 5.5 12 2 12 2z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M12 2s-5 6-5 11a5 5 0 0010 0c0-1.5-.5-3-1.5-4.5C15 11 14 12.5 12 13c0-3-1-6-1-6s-1 2-1 4a3 3 0 01-1-2.5C9 5.5 12 2 12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Hamburger / Close icon ───────────────────────────────────────────────────

function HamburgerIcon({ open }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar({ token, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Subtle shadow-on-scroll effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    onLogout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const navLinkClass = (path) =>
    `relative inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200
     ${isActive(path)
       ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-400/10'
       : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800'
     }`

  return (
    <header
      id="site-navbar"
      className={`sticky top-0 z-40 w-full
        bg-white/80 dark:bg-neutral-950/80
        border-b border-stone-200 dark:border-neutral-800
        backdrop-blur-md
        transition-shadow duration-200
        ${scrolled ? 'shadow-sm shadow-stone-200/60 dark:shadow-black/30' : ''}`}
    >
      <nav
        className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          id="navbar-logo"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
        >
          <span
            className="flex items-center justify-center w-8 h-8 rounded-xl
              bg-gradient-to-br from-amber-500 to-orange-400
              text-white shadow-md shadow-amber-200/50
              group-hover:shadow-amber-300/60 group-hover:scale-105
              transition-all duration-200"
          >
            <FlameIcon />
          </span>
          <span className="text-base font-bold text-stone-800 dark:text-neutral-100 tracking-tight">
            Echo<span className="text-amber-500">Overflow</span>
          </span>
        </Link>

        {/* ── Desktop links ── */}
        <div className="hidden sm:flex items-center gap-1">
          <Link to="/" id="nav-home" className={navLinkClass('/')}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>

          {token && (
            <Link to="/ask" id="nav-ask" className={navLinkClass('/ask')}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ask
            </Link>
          )}
        </div>

        {/* ── Auth buttons (desktop) ── */}
        <div className="hidden sm:flex items-center gap-2">
          {token ? (
            <button
              id="nav-logout-btn"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg
                text-stone-600 dark:text-neutral-400
                border border-stone-200 dark:border-neutral-700
                hover:border-red-300 hover:text-red-600 hover:bg-red-50
                dark:hover:border-red-700 dark:hover:text-red-400 dark:hover:bg-red-400/10
                focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400
                transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                id="nav-login-btn"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg
                  text-stone-600 dark:text-neutral-400
                  border border-stone-200 dark:border-neutral-700
                  hover:border-stone-300 hover:text-stone-800
                  dark:hover:border-neutral-600 dark:hover:text-neutral-100
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                  transition-all duration-200"
              >
                Login
              </Link>
              <Link
                to="/login"
                id="nav-signup-btn"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg
                  text-white
                  bg-gradient-to-r from-amber-500 to-orange-400
                  hover:from-amber-400 hover:to-orange-300
                  shadow-md shadow-amber-200/50 hover:shadow-amber-300/60
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                  active:scale-[0.97] transition-all duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile menu toggle ── */}
        <button
          id="mobile-menu-toggle"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((o) => !o)}
          className="sm:hidden p-2 rounded-lg text-stone-500 dark:text-neutral-400
            hover:bg-stone-100 dark:hover:bg-neutral-800
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            transition-colors duration-150"
        >
          <HamburgerIcon open={mobileOpen} />
        </button>
      </nav>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="sm:hidden border-t border-stone-100 dark:border-neutral-800
            bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md
            px-4 py-3 space-y-1"
        >
          <Link
            to="/"
            id="mobile-nav-home"
            className={`${navLinkClass('/')} w-full`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>

          {token && (
            <Link to="/ask" id="mobile-nav-ask" className={`${navLinkClass('/ask')} w-full`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ask a Question
            </Link>
          )}

          <div className="pt-2 border-t border-stone-100 dark:border-neutral-800">
            {token ? (
              <button
                id="mobile-logout-btn"
                onClick={handleLogout}
                className="w-full text-left inline-flex items-center gap-1.5 text-sm font-medium
                  px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-400/10
                  transition-colors duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                id="mobile-login-btn"
                className="w-full inline-flex items-center gap-1.5 text-sm font-semibold
                  px-3 py-1.5 rounded-lg
                  text-white bg-gradient-to-r from-amber-500 to-orange-400
                  hover:from-amber-400 hover:to-orange-300
                  shadow-md shadow-amber-200/50
                  transition-all duration-200"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
