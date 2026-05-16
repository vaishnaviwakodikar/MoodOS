'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'ti-layout-dashboard', accent: '#7F77DD' },
  { label: 'Mood',       href: '/mood',        icon: 'ti-mood-smile',       accent: '#ff6b8a' },
  { label: 'Habits',     href: '/habits',      icon: 'ti-checks',           accent: '#00e5a0' },
  { label: 'Study',      href: '/study',       icon: 'ti-book',             accent: '#38bdff' },
  { label: 'Expenses',   href: '/expenses',    icon: 'ti-wallet',           accent: '#ffcf40' },
  { label: 'Attendance', href: '/attendance',  icon: 'ti-calendar-check',   accent: '#bf7fff' },
  { label: 'Insights',   href: '/insights',    icon: 'ti-chart-bar',        accent: '#ff9340' },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  /* ─── sidebar reset ─── */
  .sb * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

  /* ─── DESKTOP sidebar ─── */
  .sb-rail {
    width: 220px;
    min-width: 220px;
    background: #08080f;
    border-right: 1px solid rgba(127,119,221,0.13);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
  }

  /* subtle noise texture overlay */
  .sb-rail::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
  }

  .sb-rail > * { position: relative; z-index: 1; }

  /* ─── logo area ─── */
  .sb-logo {
    padding: 22px 18px 18px;
    border-bottom: 1px solid rgba(127,119,221,0.09);
  }

  .sb-logo-row {
    display: flex; align-items: center; gap: 9px;
  }

  .sb-logo-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: #7F77DD;
    box-shadow: 0 0 10px rgba(127,119,221,0.9), 0 0 20px rgba(127,119,221,0.4);
    flex-shrink: 0;
    animation: sb-pulse 3s ease-in-out infinite;
  }
  @keyframes sb-pulse {
    0%,100% { box-shadow: 0 0 10px rgba(127,119,221,0.9), 0 0 20px rgba(127,119,221,0.4); }
    50%      { box-shadow: 0 0 14px rgba(127,119,221,1),   0 0 28px rgba(127,119,221,0.6); }
  }

  .sb-logo-name {
    font-size: 17px; font-weight: 800; color: #edeaff;
    letter-spacing: -0.5px;
  }

  .sb-logo-sub {
    font-size: 10px; font-weight: 500;
    color: rgba(232,230,255,0.25);
    margin-top: 5px; margin-left: 18px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  /* ─── nav ─── */
  .sb-nav {
    flex: 1; padding: 10px 10px;
    display: flex; flex-direction: column; gap: 1px;
    overflow-y: auto;
  }

  .sb-nav-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 11px; border-radius: 10px;
    background: transparent;
    border: 1px solid transparent;
    color: rgba(232,230,255,0.38);
    font-size: 13px; font-weight: 500;
    cursor: pointer; text-align: left; width: 100%;
    transition: all 0.16s ease;
    position: relative; overflow: hidden;
  }

  .sb-nav-btn:hover {
    color: rgba(232,230,255,0.75);
    background: rgba(255,255,255,0.04);
    transform: translateX(2px);
  }

  .sb-nav-btn.active {
    color: #edeaff;
    font-weight: 700;
  }

  /* active glow pill on left edge */
  .sb-nav-btn.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 3px; border-radius: 0 3px 3px 0;
  }

  .sb-nav-icon {
    font-size: 15px; flex-shrink: 0;
    transition: transform 0.16s ease;
  }
  .sb-nav-btn:hover .sb-nav-icon { transform: scale(1.15); }
  .sb-nav-btn.active .sb-nav-icon { transform: scale(1.1); }

  /* ─── section label ─── */
  .sb-section-lbl {
    font-size: 9px; font-weight: 700; letter-spacing: 1.8px;
    text-transform: uppercase;
    color: rgba(232,230,255,0.18);
    padding: 12px 12px 5px;
  }

  /* ─── user area ─── */
  .sb-user {
    padding: 10px 10px 12px;
    border-top: 1px solid rgba(127,119,221,0.09);
  }

  .sb-user-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 10px;
    margin-bottom: 6px;
    background: rgba(127,119,221,0.06);
    border: 1px solid rgba(127,119,221,0.1);
  }

  .sb-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(127,119,221,0.4), rgba(255,107,138,0.3));
    border: 1px solid rgba(127,119,221,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #edeaff;
    flex-shrink: 0; letter-spacing: -0.3px;
  }

  .sb-user-name {
    font-size: 12px; font-weight: 600; color: #edeaff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .sb-user-email {
    font-size: 10px; color: rgba(232,230,255,0.28);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 1px;
  }

  .sb-signout {
    width: 100%; padding: 8px 12px;
    background: transparent;
    border: 1px solid rgba(226,75,74,0.18);
    border-radius: 9px;
    color: rgba(226,75,74,0.55);
    font-size: 12px; font-weight: 600;
    cursor: pointer; letter-spacing: 0.2px;
    transition: all 0.15s ease;
  }
  .sb-signout:hover {
    background: rgba(226,75,74,0.08);
    color: rgba(226,75,74,0.85);
    border-color: rgba(226,75,74,0.35);
  }

  /* ─── MOBILE: bottom tab bar ─── */
  .sb-bottom-bar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 999;
    background: rgba(8,8,15,0.92);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-top: 1px solid rgba(127,119,221,0.14);
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
    display: none;
    justify-content: space-around;
    align-items: center;
    gap: 2px;
  }

  .sb-tab-btn {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 3px; padding: 6px 8px;
    border-radius: 12px;
    background: transparent; border: none;
    color: rgba(232,230,255,0.3);
    font-size: 10px; font-weight: 600;
    cursor: pointer; min-width: 44px;
    transition: all 0.15s ease;
    letter-spacing: 0.2px;
    position: relative;
  }

  .sb-tab-icon {
    font-size: 20px; line-height: 1;
    display: block;
    transition: transform 0.15s ease;
  }

  .sb-tab-btn.active .sb-tab-icon { transform: scale(1.15) translateY(-1px); }

  /* active indicator dot under icon */
  .sb-tab-dot {
    width: 4px; height: 4px; border-radius: 50%;
    position: absolute; bottom: 2px;
    opacity: 0; transition: opacity 0.15s;
  }
  .sb-tab-btn.active .sb-tab-dot { opacity: 1; }

  /* ─── MOBILE: top topbar header ─── */
  .sb-topbar {
    display: none;
    position: fixed; top: 0; left: 0; right: 0; z-index: 999;
    background: rgba(8,8,15,0.92);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid rgba(127,119,221,0.12);
    padding: 12px 16px;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 56px;
  }

  .sb-topbar-logo {
    display: flex; align-items: center; gap: 7px;
    overflow: hidden; flex: 1; min-width: 0;
  }

  .sb-topbar-name {
    font-size: 16px; font-weight: 800; color: #edeaff; letter-spacing: -0.4px;
  }

  .sb-topbar-right {
    display: flex; align-items: center; gap: 10px;
  }

  .sb-topbar-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(127,119,221,0.5), rgba(255,107,138,0.4));
    border: 1.5px solid rgba(127,119,221,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #edeaff;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* ─── profile sheet (mobile) ─── */
  .sb-sheet-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(4px);
    animation: sb-fade-in 0.18s ease;
  }
  @keyframes sb-fade-in { from { opacity: 0; } to { opacity: 1; } }

  .sb-sheet {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 1001;
    background: #0e0e1a;
    border: 1px solid rgba(127,119,221,0.18);
    border-bottom: none;
    border-radius: 20px 20px 0 0;
    padding: 20px 18px calc(24px + env(safe-area-inset-bottom));
    animation: sb-slide-up 0.22s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  @keyframes sb-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

  .sb-sheet-handle {
    width: 36px; height: 4px; border-radius: 2px;
    background: rgba(255,255,255,0.15);
    margin: 0 auto 18px;
  }

  .sb-sheet-user {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 14px;
    background: rgba(127,119,221,0.07);
    border: 1px solid rgba(127,119,221,0.12);
    border-radius: 14px;
    margin-bottom: 14px;
  }

  .sb-sheet-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(127,119,221,0.5), rgba(255,107,138,0.4));
    border: 2px solid rgba(127,119,221,0.35);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 800; color: #edeaff;
    flex-shrink: 0;
  }

  .sb-sheet-signout {
    width: 100%; padding: 13px;
    background: rgba(226,75,74,0.08);
    border: 1px solid rgba(226,75,74,0.22);
    border-radius: 12px;
    color: rgba(226,75,74,0.75);
    font-size: 14px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.2px;
    transition: all 0.15s;
  }
  .sb-sheet-signout:hover {
    background: rgba(226,75,74,0.14);
    color: rgba(226,75,74,1);
  }

  /* ─── responsive breakpoints ─── */
  @media (max-width: 768px) {
    .sb-rail    { display: none !important; }
    .sb-topbar  { display: flex !important; }
    .sb-bottom-bar { display: flex !important; }
    .sb-sheet-overlay.open { display: block !important; }
  }

  /* ─── page offset for mobile bars ─── */
  .sb-page-wrap {
    padding-top: 0;
    padding-bottom: 0;
  }

  @media (max-width: 768px) {
    .sb-page-wrap {
      padding-top: 58px;
      padding-bottom: 72px;
    }
  }
`

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase()

  const displayName = user?.user_metadata?.full_name || 'Student'
  const email = user?.email || ''

  // split nav: first 5 in bottom bar (most important), rest hidden on mobile
  const bottomNavItems = navItems.slice(0, 5)

  return (
    <>
      <style>{css}</style>

      {/* ══════════════════ DESKTOP SIDEBAR ══════════════════ */}
      <aside className="sb sb-rail">
        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-row">
            <div className="sb-logo-dot" />
            <span className="sb-logo-name">MoodOS</span>
          </div>
          <p className="sb-logo-sub">Student life, sorted.</p>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          <div className="sb-section-lbl">Navigation</div>
          {navItems.map((item, i) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`sb-nav-btn${isActive ? ' active' : ''}`}
                style={isActive ? {
                  background: `${item.accent}18`,
                  border: `1px solid ${item.accent}30`,
                  color: item.accent,
                } : {}}
              >
                {/* active left bar */}
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0, top: '22%', bottom: '22%',
                    width: '3px', borderRadius: '0 3px 3px 0',
                    background: item.accent,
                    boxShadow: `0 0 8px ${item.accent}`,
                  }} />
                )}
                <i className={`ti ${item.icon} sb-nav-icon`} aria-hidden="true" style={{ color: isActive ? item.accent : undefined }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="sb-user">
          <div className="sb-user-row">
            <div className="sb-avatar">{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="sb-user-name">{displayName}</div>
              <div className="sb-user-email">{email}</div>
            </div>
          </div>
          <button className="sb-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ══════════════════ MOBILE TOPBAR ══════════════════ */}
      <header className="sb sb-topbar">
        <div className="sb-topbar-logo" style={{ flex: 1, minWidth: 0 }}>
          <div className="sb-logo-dot" style={{
            width: '8px', height: '8px', borderRadius: '50%', background: '#7F77DD',
            flexShrink: 0, boxShadow: '0 0 8px rgba(127,119,221,0.9)',
            animation: 'sb-pulse 3s ease-in-out infinite'
          }} />
          <span className="sb-topbar-name" style={{ flexShrink: 0 }}>MoodOS</span>
          {navItems.find(n => n.href === pathname) && (
            <>
              <span style={{ color: 'rgba(232,230,255,0.2)', fontSize: '13px', margin: '0 5px', flexShrink: 0 }}>/</span>
              <span style={{
                fontSize: '12px', fontWeight: 700,
                color: navItems.find(n => n.href === pathname)?.accent || 'rgba(232,230,255,0.45)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {navItems.find(n => n.href === pathname)?.label}
              </span>
            </>
          )}
        </div>

        <div className="sb-topbar-right" style={{ flexShrink: 0 }}>
          <div
            className="sb-topbar-avatar"
            onClick={() => setSheetOpen(true)}
            role="button" aria-label="Open profile"
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ══════════════════ MOBILE BOTTOM TAB BAR ══════════════════ */}
      <nav className="sb sb-bottom-bar" aria-label="Mobile navigation">
        {bottomNavItems.map(item => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              className={`sb-tab-btn${isActive ? ' active' : ''}`}
              onClick={() => router.push(item.href)}
              style={{ color: isActive ? item.accent : undefined }}
              aria-label={item.label}
            >
              <i className={`ti ${item.icon} sb-tab-icon`} aria-hidden="true" />
              <span style={{ fontSize: '9px' }}>{item.label}</span>
              <span className="sb-tab-dot" style={{ background: item.accent }} />
            </button>
          )
        })}
        {/* "More" button for items 5-7 */}
        <button
          className={`sb-tab-btn${['/attendance', '/insights'].includes(pathname) ? ' active' : ''}`}
          onClick={() => setSheetOpen(true)}
          style={{ color: ['/attendance', '/insights'].includes(pathname) ? '#bf7fff' : undefined }}
          aria-label="More"
        >
          <i className="ti ti-dots sb-tab-icon" aria-hidden="true" />
          <span style={{ fontSize: '9px' }}>More</span>
          <span className="sb-tab-dot" style={{ background: '#bf7fff' }} />
        </button>
      </nav>

      {/* ══════════════════ MOBILE PROFILE / MORE SHEET ══════════════════ */}
      <div
        className={`sb sb-sheet-overlay${sheetOpen ? ' open' : ''}`}
        onClick={() => setSheetOpen(false)}
      />
      {sheetOpen && (
        <div className="sb sb-sheet">
          <div className="sb-sheet-handle" />

          {/* User info */}
          <div className="sb-sheet-user">
            <div className="sb-sheet-avatar">{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#edeaff', marginBottom: '2px' }}>{displayName}</div>
              <div style={{ fontSize: '12px', color: 'rgba(232,230,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
            </div>
          </div>

          {/* Extra nav items not in bottom bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
            {navItems.slice(5).map(item => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); setSheetOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: isActive ? `${item.accent}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? item.accent + '40' : 'rgba(255,255,255,0.06)'}`,
                    color: isActive ? item.accent : 'rgba(232,230,255,0.6)',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true" style={{ fontSize: '18px', color: isActive ? item.accent : 'rgba(232,230,255,0.5)' }} />
                  {item.label}
                </button>
              )
            })}
          </div>

          <button className="sb-sheet-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </>
  )
}