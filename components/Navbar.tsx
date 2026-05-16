'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

const pageInfo: Record<string, { title: string; sub: string; icon: string; color: string }> = {
  '/dashboard':  { title: 'Dashboard',  sub: 'your day at a glance',     icon: 'ti-layout-dashboard', color: '#d4607a' },
  '/mood':       { title: 'Mood',       sub: 'how you feeling rn?',       icon: 'ti-mood-smile',       color: '#9b7ec8' },
  '/habits':     { title: 'Habits',     sub: 'tend your daily garden',    icon: 'ti-checks',           color: '#5a8c63' },
  '/study':      { title: 'Study',      sub: 'focus & grow',              icon: 'ti-book',             color: '#b8860b' },
  '/expenses':   { title: 'Expenses',   sub: 'track your spending',       icon: 'ti-wallet',           color: '#d4607a' },
  '/attendance': { title: 'Attendance', sub: 'show up for yourself',      icon: 'ti-calendar-check',   color: '#9b7ec8' },
  '/insights':   { title: 'Insights',   sub: 'your weekly story',         icon: 'ti-chart-bar',        color: '#5a8c63' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300;1,9..144,400&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  .nb * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

  .nb-bar {
    position: sticky; top: 0; z-index: 100;
    background: rgba(253,247,240,0.88);
    backdrop-filter: blur(24px) saturate(160%);
    border-bottom: 1px solid rgba(212,96,122,0.1);
    padding: 0 28px;
    height: 60px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }

  /* left — page title */
  .nb-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }

  .nb-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }

  .nb-title {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 18px; font-weight: 300; color: #3d2a35;
    letter-spacing: -0.3px; white-space: nowrap;
  }

  .nb-sub {
    font-size: 11px; color: rgba(61,42,53,0.4);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* right — actions */
  .nb-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  /* date pill */
  .nb-date {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    background: rgba(212,96,122,0.06);
    border: 1px solid rgba(212,96,122,0.12);
    border-radius: 999px;
    font-size: 12px; font-weight: 500; color: rgba(61,42,53,0.5);
    white-space: nowrap;
  }
  .nb-date i { font-size: 12px; color: #d4607a; }

  /* icon btn */
  .nb-icon-btn {
    width: 36px; height: 36px; border-radius: 10px;
    background: transparent;
    border: 1px solid rgba(212,96,122,0.12);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: rgba(61,42,53,0.45);
    cursor: pointer; transition: all 0.15s ease; position: relative;
  }
  .nb-icon-btn:hover {
    background: rgba(212,96,122,0.07);
    color: #d4607a; border-color: rgba(212,96,122,0.25);
  }

  /* notification dot */
  .nb-notif-dot {
    position: absolute; top: 6px; right: 6px;
    width: 6px; height: 6px; border-radius: 50%;
    background: #d4607a;
    box-shadow: 0 0 6px rgba(212,96,122,0.7);
    animation: nb-blink 2s ease-in-out infinite;
  }
  @keyframes nb-blink {
    0%,100% { opacity: 1; } 50% { opacity: 0.4; }
  }

  /* avatar btn */
  .nb-avatar-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce, #e8daf5);
    border: 1.5px solid rgba(212,96,122,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #d4607a;
    cursor: pointer; transition: all 0.15s ease; flex-shrink: 0;
  }
  .nb-avatar-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 0 3px rgba(212,96,122,0.15);
  }

  /* ── PROFILE PANEL ── */
  .nb-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(61,42,53,0.25);
    backdrop-filter: blur(4px);
    animation: nb-fade 0.18s ease;
  }
  @keyframes nb-fade { from { opacity: 0; } to { opacity: 1; } }

  .nb-panel {
    position: fixed; top: 68px; right: 20px;
    width: 300px; z-index: 201;
    background: #fdf7f0;
    border: 1px solid rgba(212,96,122,0.15);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(61,42,53,0.12), 0 4px 16px rgba(212,96,122,0.08);
    overflow: hidden;
    animation: nb-panel-in 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  @keyframes nb-panel-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* panel header */
  .nb-panel-header {
    padding: 20px 20px 16px;
    background: linear-gradient(135deg, rgba(242,196,206,0.3) 0%, rgba(232,218,245,0.3) 100%);
    border-bottom: 1px solid rgba(212,96,122,0.1);
  }

  .nb-panel-avatar-wrap {
    position: relative; display: inline-block; margin-bottom: 12px;
  }

  .nb-panel-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce, #e8daf5);
    border: 2px solid rgba(212,96,122,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 800; color: #d4607a;
  }

  .nb-panel-status {
    position: absolute; bottom: 2px; right: 2px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #5a8c63;
    border: 2px solid #fdf7f0;
    box-shadow: 0 0 6px rgba(90,140,99,0.6);
  }

  .nb-panel-name {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 18px; font-weight: 300; color: #3d2a35;
    margin-bottom: 3px;
  }

  .nb-panel-email {
    font-size: 12px; color: rgba(61,42,53,0.45);
    margin-bottom: 10px;
  }

  .nb-panel-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(212,96,122,0.1);
    border: 1px solid rgba(212,96,122,0.2);
    border-radius: 999px; padding: 3px 10px;
    font-size: 11px; font-weight: 600; color: #d4607a;
  }

  /* stats row */
  .nb-panel-stats {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: rgba(212,96,122,0.08);
    border-top: 1px solid rgba(212,96,122,0.08);
    border-bottom: 1px solid rgba(212,96,122,0.08);
  }

  .nb-stat {
    background: #fdf7f0;
    padding: 12px 8px; text-align: center;
  }

  .nb-stat-val {
    font-family: 'Fraunces', serif; font-weight: 300;
    font-size: 18px; color: #3d2a35; line-height: 1;
    margin-bottom: 3px;
  }

  .nb-stat-lbl {
    font-size: 9px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; color: rgba(61,42,53,0.35);
  }

  /* menu items */
  .nb-panel-menu { padding: 8px; }

  .nb-menu-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: transparent; border: none;
    color: rgba(61,42,53,0.6);
    font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    cursor: pointer; width: 100%; text-align: left;
    transition: all 0.14s ease;
  }
  .nb-menu-item:hover {
    background: rgba(212,96,122,0.06);
    color: #d4607a;
  }
  .nb-menu-item i { font-size: 16px; color: rgba(61,42,53,0.35); transition: color 0.14s; }
  .nb-menu-item:hover i { color: #d4607a; }

  .nb-menu-divider {
    height: 1px; background: rgba(212,96,122,0.08);
    margin: 4px 8px;
  }

  .nb-menu-signout {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: rgba(212,96,122,0.06);
    border: 1px solid rgba(212,96,122,0.15);
    color: #d4607a;
    font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; width: 100%; text-align: left;
    transition: all 0.14s ease; margin-top: 4px;
  }
  .nb-menu-signout:hover { background: rgba(212,96,122,0.12); }
  .nb-menu-signout i { font-size: 16px; }

  /* mobile: hide navbar on mobile (topbar handles it) */
  @media (max-width: 768px) { .nb-bar { display: none; } }
`

export default function Navbar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [profileOpen, setProfileOpen] = useState(false)
  const [date, setDate] = useState('')
  const [user, setUser] = useState<any>(null)
  const [moodCount, setMoodCount] = useState(0)

  const page = pageInfo[pathname] || pageInfo['/dashboard']

  useEffect(() => {
    setDate(new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }))
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    supabase.from('mood_entries').select('id', { count: 'exact' }).then(({ count }) => {
      setMoodCount(count || 0)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  const displayName = user?.user_metadata?.full_name || 'Student'
  const email = user?.email || ''
  const firstName = displayName.split(' ')[0]

  return (
    <>
      <style>{css}</style>
      <div className="nb">
        <div className="nb-bar">

          {/* Left — page info */}
          <div className="nb-left">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div className="nb-icon-wrap"
                style={{ background: `${page.color}12`, border: `1px solid ${page.color}25` }}>
                <i className={`ti ${page.icon}`} style={{ color: page.color }} />
              </div>
              <div>
                <div className="nb-title">{page.title}</div>
                <div className="nb-sub">{page.sub}</div>
              </div>
            </motion.div>
          </div>

          {/* Right — actions */}
          <div className="nb-right">

            {/* Date */}
            <div className="nb-date">
              <i className="ti ti-calendar-heart" />
              {date}
            </div>

            {/* Notifications */}
            <button className="nb-icon-btn" title="Notifications">
              <i className="ti ti-bell" />
              <span className="nb-notif-dot" />
            </button>

            {/* Search */}
            <button className="nb-icon-btn" title="Search">
              <i className="ti ti-search" />
            </button>

            {/* Avatar */}
            <button className="nb-avatar-btn" onClick={() => setProfileOpen(v => !v)}>
              {initials}
            </button>
          </div>
        </div>

        {/* Profile panel */}
        <AnimatePresence>
          {profileOpen && (
            <>
              <div className="nb-overlay" onClick={() => setProfileOpen(false)} />
              <motion.div
                className="nb-panel"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                {/* Header */}
                <div className="nb-panel-header">
                  <div className="nb-panel-avatar-wrap">
                    <div className="nb-panel-avatar">{initials}</div>
                    <div className="nb-panel-status" title="Online" />
                  </div>
                  <div className="nb-panel-name">{displayName}</div>
                  <div className="nb-panel-email">{email}</div>
                  <div className="nb-panel-badge">
                    <i className="ti ti-sparkles" style={{ fontSize: '10px' }} />
                    Student
                  </div>
                </div>

                {/* Stats */}
                <div className="nb-panel-stats">
                  <div className="nb-stat">
                    <div className="nb-stat-val">{moodCount}</div>
                    <div className="nb-stat-lbl">moods</div>
                  </div>
                  <div className="nb-stat">
                    <div className="nb-stat-val">0</div>
                    <div className="nb-stat-lbl">habits</div>
                  </div>
                  <div className="nb-stat">
                    <div className="nb-stat-val">0h</div>
                    <div className="nb-stat-lbl">studied</div>
                  </div>
                </div>

                {/* Menu */}
                <div className="nb-panel-menu">
                  <button className="nb-menu-item">
                    <i className="ti ti-user" />
                    Edit profile
                  </button>
                  <button className="nb-menu-item">
                    <i className="ti ti-settings" />
                    Settings
                  </button>
                  <button className="nb-menu-item">
                    <i className="ti ti-moon" />
                    Dark mode
                  </button>
                  <div className="nb-menu-divider" />
                  <button className="nb-menu-item">
                    <i className="ti ti-help" />
                    Help & feedback
                  </button>
                  <button className="nb-menu-signout" onClick={handleSignOut}>
                    <i className="ti ti-logout" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}