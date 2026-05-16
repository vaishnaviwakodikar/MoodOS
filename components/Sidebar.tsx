'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'ti-layout-dashboard', accent: '#d4607a' },
  { label: 'Mood',       href: '/mood',        icon: 'ti-mood-smile',       accent: '#9b7ec8' },
  { label: 'Habits',     href: '/habits',      icon: 'ti-checks',           accent: '#5a8c63' },
  { label: 'Study',      href: '/study',       icon: 'ti-book',             accent: '#b8860b' },
  { label: 'Expenses',   href: '/expenses',    icon: 'ti-wallet',           accent: '#d4607a' },
  { label: 'Attendance', href: '/attendance',  icon: 'ti-calendar-check',   accent: '#9b7ec8' },
  { label: 'Insights',   href: '/insights',    icon: 'ti-chart-bar',        accent: '#5a8c63' },
  { label: 'Profile', href: '/profile', icon: 'ti-user-circle', accent: '#d4607a' },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── DESKTOP SIDEBAR ── */
  .sb-rail {
    width: 220px; min-width: 220px;
    background: #fdf7f0;
    border-right: 1px solid rgba(212,96,122,0.12);
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh;
    overflow: hidden; font-family: 'DM Sans', sans-serif;
  }

  .sb-rail::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 120% 60% at 50% 0%, rgba(212,96,122,0.06) 0%, transparent 70%),
      radial-gradient(ellipse 80% 40% at 80% 100%, rgba(155,126,200,0.06) 0%, transparent 70%);
  }
  .sb-rail > * { position: relative; z-index: 1; }

  /* ── logo ── */
  .sb-logo {
    padding: 22px 18px 16px;
    border-bottom: 1px solid rgba(212,96,122,0.1);
  }
  .sb-logo-row { display: flex; align-items: center; gap: 9px; }
  .sb-logo-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #d4607a; flex-shrink: 0;
    box-shadow: 0 0 8px rgba(212,96,122,0.6);
    animation: sb-heartbeat 2.4s ease-in-out infinite;
  }
  @keyframes sb-heartbeat {
    0%,100% { box-shadow: 0 0 8px rgba(212,96,122,0.6); transform: scale(1); }
    45%      { box-shadow: 0 0 14px rgba(212,96,122,0.9); transform: scale(1.2); }
    55%      { box-shadow: 0 0 10px rgba(212,96,122,0.7); transform: scale(1.1); }
  }
  .sb-logo-name {
    font-family: 'Fraunces', serif; font-weight: 400; font-style: italic;
    font-size: 18px; color: #3d2a35; letter-spacing: -0.3px;
  }
  .sb-logo-sub {
    font-size: 10px; font-weight: 500; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(61,42,53,0.35);
    margin-top: 5px; margin-left: 17px;
  }

  /* ── nav ── */
  .sb-nav {
    flex: 1; padding: 10px 10px;
    display: flex; flex-direction: column; gap: 1px;
    overflow-y: auto;
  }
  .sb-section-lbl {
    font-size: 9px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(61,42,53,0.25);
    padding: 10px 10px 5px;
  }
  .sb-nav-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 11px; border-radius: 12px;
    background: transparent; border: 1px solid transparent;
    color: rgba(61,42,53,0.45);
    font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    cursor: pointer; text-align: left; width: 100%;
    transition: all 0.16s ease; position: relative; overflow: hidden;
  }
  .sb-nav-btn:hover {
    color: #3d2a35; background: rgba(212,96,122,0.06);
    transform: translateX(2px);
  }
  .sb-nav-btn.active {
    color: #3d2a35; font-weight: 700;
  }
  .sb-nav-icon {
    font-size: 15px; flex-shrink: 0;
    transition: transform 0.16s ease;
  }
  .sb-nav-btn:hover .sb-nav-icon { transform: scale(1.12); }
  .sb-nav-btn.active .sb-nav-icon { transform: scale(1.1); }

  /* ── user ── */
  .sb-user {
    padding: 10px 10px 14px;
    border-top: 1px solid rgba(212,96,122,0.1);
  }
  .sb-user-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 12px;
    margin-bottom: 8px;
    background: rgba(212,96,122,0.05);
    border: 1px solid rgba(212,96,122,0.1);
  }
  .sb-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce, #e8daf5);
    border: 1.5px solid rgba(212,96,122,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #d4607a; flex-shrink: 0;
  }
  .sb-user-name {
    font-size: 12px; font-weight: 600; color: #3d2a35;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sb-user-email {
    font-size: 10px; color: rgba(61,42,53,0.35);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 1px;
  }
  .sb-signout {
    width: 100%; padding: 8px 12px;
    background: transparent;
    border: 1px solid rgba(212,96,122,0.2);
    border-radius: 10px; color: rgba(212,96,122,0.6);
    font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; letter-spacing: 0.2px;
    transition: all 0.15s ease;
  }
  .sb-signout:hover {
    background: rgba(212,96,122,0.08);
    color: #d4607a; border-color: rgba(212,96,122,0.4);
  }

  /* ── MOBILE topbar ── */
  .sb-topbar {
    display: none;
    position: fixed; top: 0; left: 0; right: 0; z-index: 999;
    background: rgba(253,247,240,0.92);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(212,96,122,0.12);
    padding: 10px 16px;
    align-items: center; justify-content: space-between;
    min-height: 56px;
  }
  .sb-topbar-name {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 17px; font-weight: 400; color: #3d2a35;
  }
  .sb-topbar-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce, #e8daf5);
    border: 1.5px solid rgba(212,96,122,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #d4607a;
    cursor: pointer; flex-shrink: 0;
  }

  /* ── MOBILE bottom bar ── */
  .sb-bottom-bar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 999;
    background: rgba(253,247,240,0.95);
    backdrop-filter: blur(24px);
    border-top: 1px solid rgba(212,96,122,0.12);
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
    justify-content: space-around; align-items: center; gap: 2px;
  }
  .sb-tab-btn {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 3px; padding: 6px 8px; border-radius: 12px;
    background: transparent; border: none;
    color: rgba(61,42,53,0.35);
    font-size: 10px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; min-width: 44px;
    transition: all 0.15s ease; position: relative;
  }
  .sb-tab-icon { font-size: 20px; line-height: 1; display: block; transition: transform 0.15s ease; }
  .sb-tab-btn.active .sb-tab-icon { transform: scale(1.15) translateY(-1px); }
  .sb-tab-dot {
    width: 4px; height: 4px; border-radius: 50%;
    position: absolute; bottom: 2px; opacity: 0; transition: opacity 0.15s;
  }
  .sb-tab-btn.active .sb-tab-dot { opacity: 1; }

  /* ── MOBILE sheet ── */
  .sb-sheet-overlay {
    display: none; position: fixed; inset: 0; z-index: 1000;
    background: rgba(61,42,53,0.4); backdrop-filter: blur(4px);
    animation: sb-fade-in 0.18s ease;
  }
  @keyframes sb-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .sb-sheet {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 1001;
    background: #fdf7f0;
    border: 1px solid rgba(212,96,122,0.15);
    border-bottom: none; border-radius: 20px 20px 0 0;
    padding: 18px 18px calc(24px + env(safe-area-inset-bottom));
    animation: sb-slide-up 0.22s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  @keyframes sb-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .sb-sheet-handle {
    width: 36px; height: 4px; border-radius: 2px;
    background: rgba(212,96,122,0.2); margin: 0 auto 16px;
  }
  .sb-sheet-user {
    display: flex; align-items: center; gap: 12px;
    padding: 14px; border-radius: 14px;
    background: rgba(212,96,122,0.05);
    border: 1px solid rgba(212,96,122,0.12);
    margin-bottom: 12px;
  }
  .sb-sheet-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce, #e8daf5);
    border: 2px solid rgba(212,96,122,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 800; color: #d4607a; flex-shrink: 0;
  }
  .sb-sheet-signout {
    width: 100%; padding: 13px;
    background: rgba(212,96,122,0.06);
    border: 1px solid rgba(212,96,122,0.2);
    border-radius: 12px; color: #d4607a;
    font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .sb-sheet-signout:hover { background: rgba(212,96,122,0.12); }

  /* ── responsive ── */
  @media (max-width: 768px) {
    .sb-rail       { display: none !important; }
    .sb-topbar     { display: flex !important; }
    .sb-bottom-bar { display: flex !important; }
    .sb-sheet-overlay.open { display: block !important; }
  }

  .sb-page-wrap { padding-top: 0; padding-bottom: 0; }
  @media (max-width: 768px) {
    .sb-page-wrap { padding-top: 58px; padding-bottom: 72px; }
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
  const bottomNavItems = navItems.slice(0, 5)

  return (
    <>
      <style>{css}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="sb-rail">
        <div className="sb-logo">
          <div className="sb-logo-row">
            <div className="sb-logo-dot" />
            <span className="sb-logo-name">MoodOS</span>
          </div>
          <p className="sb-logo-sub">Student life, sorted.</p>
        </div>

        <nav className="sb-nav">
          <div className="sb-section-lbl">Navigation</div>
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={`sb-nav-btn${isActive ? ' active' : ''}`}
                style={isActive ? {
                  background: `${item.accent}12`,
                  border: `1px solid ${item.accent}25`,
                  color: item.accent,
                } : {}}>
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: '3px', borderRadius: '0 3px 3px 0',
                    background: item.accent,
                    boxShadow: `0 0 6px ${item.accent}`,
                  }} />
                )}
                <i className={`ti ${item.icon} sb-nav-icon`} aria-hidden="true"
                  style={{ color: isActive ? item.accent : undefined }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="sb-user">
          <div className="sb-user-row">
            <div className="sb-avatar">{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="sb-user-name">{displayName}</div>
              <div className="sb-user-email">{email}</div>
            </div>
          </div>
          <button className="sb-signout" onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <header className="sb-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%', background: '#d4607a', flexShrink: 0,
            boxShadow: '0 0 6px rgba(212,96,122,0.7)', animation: 'sb-heartbeat 2.4s ease-in-out infinite',
          }} />
          <span className="sb-topbar-name">MoodOS</span>
          {navItems.find(n => n.href === pathname) && (
            <>
              <span style={{ color: 'rgba(61,42,53,0.2)', fontSize: '13px', margin: '0 4px', flexShrink: 0 }}>/</span>
              <span style={{
                fontSize: '12px', fontWeight: 600,
                color: navItems.find(n => n.href === pathname)?.accent || 'rgba(61,42,53,0.5)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {navItems.find(n => n.href === pathname)?.label}
              </span>
            </>
          )}
        </div>
        <div className="sb-topbar-avatar" onClick={() => setSheetOpen(true)}>{initials}</div>
      </header>

      {/* MOBILE BOTTOM BAR */}
      <nav className="sb-bottom-bar">
        {bottomNavItems.map(item => {
          const isActive = pathname === item.href
          return (
            <button key={item.href}
              className={`sb-tab-btn${isActive ? ' active' : ''}`}
              onClick={() => router.push(item.href)}
              style={{ color: isActive ? item.accent : undefined }}>
              <i className={`ti ${item.icon} sb-tab-icon`} aria-hidden="true" />
              <span style={{ fontSize: '9px' }}>{item.label}</span>
              <span className="sb-tab-dot" style={{ background: item.accent }} />
            </button>
          )
        })}
        <button
          className={`sb-tab-btn${['/attendance', '/insights'].includes(pathname) ? ' active' : ''}`}
          onClick={() => setSheetOpen(true)}
          style={{ color: ['/attendance', '/insights'].includes(pathname) ? '#9b7ec8' : undefined }}>
          <i className="ti ti-dots sb-tab-icon" aria-hidden="true" />
          <span style={{ fontSize: '9px' }}>More</span>
          <span className="sb-tab-dot" style={{ background: '#9b7ec8' }} />
        </button>
      </nav>

      {/* MOBILE SHEET */}
      <div className={`sb-sheet-overlay${sheetOpen ? ' open' : ''}`} onClick={() => setSheetOpen(false)} />
      {sheetOpen && (
        <div className="sb-sheet">
          <div className="sb-sheet-handle" />
          <div className="sb-sheet-user">
            <div className="sb-sheet-avatar">{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#3d2a35', marginBottom: '2px' }}>{displayName}</div>
              <div style={{ fontSize: '12px', color: 'rgba(61,42,53,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
            {navItems.slice(5).map(item => {
              const isActive = pathname === item.href
              return (
                <button key={item.href}
                  onClick={() => { router.push(item.href); setSheetOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: isActive ? `${item.accent}10` : 'rgba(212,96,122,0.03)',
                    border: `1px solid ${isActive ? item.accent + '30' : 'rgba(212,96,122,0.1)'}`,
                    color: isActive ? item.accent : 'rgba(61,42,53,0.6)',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', textAlign: 'left',
                  }}>
                  <i className={`ti ${item.icon}`} aria-hidden="true"
                    style={{ fontSize: '18px', color: isActive ? item.accent : 'rgba(61,42,53,0.4)' }} />
                  {item.label}
                </button>
              )
            })}
          </div>
          <button className="sb-sheet-signout" onClick={handleSignOut}>Sign out</button>
        </div>
      )}
    </>
  )
}