'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const metrics = [
  {
    label: 'Mood today',  value: '—',      sub: 'Not logged yet',
    c: '#bf7fff',
    bg: 'rgba(191,127,255,0.09)', border: 'rgba(191,127,255,0.22)',
    icon: 'ti-mood-smile',
  },
  {
    label: 'Habits done', value: '0 / 0',  sub: 'No habits added',
    c: '#00e5a0',
    bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.2)',
    icon: 'ti-checks',
  },
  {
    label: 'Study hours', value: '0h',     sub: 'Today',
    c: '#ffcf40',
    bg: 'rgba(255,207,64,0.08)', border: 'rgba(255,207,64,0.2)',
    icon: 'ti-clock-hour-4',
  },
  {
    label: 'Attendance',  value: '—%',     sub: 'This month',
    c: '#38bdff',
    bg: 'rgba(56,189,255,0.08)', border: 'rgba(56,189,255,0.2)',
    icon: 'ti-calendar-stats',
  },
  {
    label: 'Expenses',    value: '₹0',     sub: 'This month',
    c: '#ff6b8a',
    bg: 'rgba(255,107,138,0.08)', border: 'rgba(255,107,138,0.2)',
    icon: 'ti-receipt',
  },
  {
    label: 'Streak',      value: '0 days', sub: 'Keep going',
    c: '#ff9340',
    bg: 'rgba(255,147,64,0.08)', border: 'rgba(255,147,64,0.2)',
    icon: 'ti-flame',
  },
]

const actions = [
  { label: 'Log mood',    href: '/mood',       c: '#bf7fff', bg: 'rgba(191,127,255,0.1)',  border: 'rgba(191,127,255,0.22)', icon: 'ti-mood-smile' },
  { label: 'Study timer', href: '/study',      c: '#ffcf40', bg: 'rgba(255,207,64,0.09)',  border: 'rgba(255,207,64,0.22)',  icon: 'ti-clock-play' },
  { label: 'Add expense', href: '/expenses',   c: '#ff6b8a', bg: 'rgba(255,107,138,0.09)', border: 'rgba(255,107,138,0.22)',icon: 'ti-cash' },
  { label: 'Attendance',  href: '/attendance', c: '#38bdff', bg: 'rgba(56,189,255,0.09)',  border: 'rgba(56,189,255,0.22)', icon: 'ti-calendar-check' },
  { label: 'Habits',      href: '/habits',     c: '#00e5a0', bg: 'rgba(0,229,160,0.09)',   border: 'rgba(0,229,160,0.22)',  icon: 'ti-checks' },
  { label: 'Insights',    href: '/insights',   c: '#e879f9', bg: 'rgba(232,121,249,0.09)', border: 'rgba(232,121,249,0.22)',icon: 'ti-chart-bar' },
]

const vibes = [
  'you got this',
  'stay focused',
  'big brain energy',
  'doing great today',
  'main character energy',
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .db {
    font-family: 'DM Sans', sans-serif;
    background: #070710;
    min-height: 100vh;
    /* generous padding — overridden on mobile below */
    padding: clamp(20px,5vw,52px) clamp(20px,4vw,44px);
    color: #f0eeff;
    /* prevent any ancestor clipping */
    overflow-x: hidden;
    width: 100%;
  }

  .db::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background-image:
      radial-gradient(ellipse 70% 55% at 80% 10%, rgba(191,127,255,0.13) 0%, transparent 55%),
      radial-gradient(ellipse 55% 40% at 10% 85%, rgba(0,229,160,0.09) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 55% 95%, rgba(56,189,255,0.07) 0%, transparent 55%);
    pointer-events: none;
  }

  .db-inner {
    position: relative; z-index: 1;
    max-width: 100%;
  }

  /* ── header ── */
  .db-header { margin-bottom: clamp(24px,4vw,48px); }
  .db-row {
    display: flex; align-items: flex-start;
    justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }

  .db-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: rgba(240,238,255,0.28); margin-bottom: 10px;
  }

  .db-h1 {
    font-size: clamp(28px,6vw,52px); font-weight: 700;
    letter-spacing: -2px; line-height: 1.05; color: #f0eeff; margin-bottom: 14px;
    /* ensure it never clips */
    overflow: visible;
    word-break: break-word;
  }

  .db-h1 em {
    font-style: normal;
    background: linear-gradient(105deg, #bf7fff 0%, #38bdff 45%, #00e5a0 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: inline-block; /* gradient needs block context to not clip */
    padding-right: 4px;    /* prevent right-edge gradient crop */
  }

  .db-vibe {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.3px;
    color: rgba(191,127,255,0.9);
    background: rgba(191,127,255,0.1);
    border: 1px solid rgba(191,127,255,0.22);
    border-radius: 100px; padding: 5px 14px;
  }

  .db-vibe-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #bf7fff;
    box-shadow: 0 0 6px 2px rgba(191,127,255,0.7);
    animation: pulse-dot 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.75); }
  }

  /* ── clock ── */
  .db-clock {
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 12px 18px;
    flex-shrink: 0;
  }

  .db-clock-val {
    font-size: clamp(18px,3vw,28px); font-weight: 700;
    color: #f0eeff; letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums; line-height: 1;
  }

  .db-clock-sub {
    font-size: 10px; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(240,238,255,0.2); margin-top: 5px;
  }

  /* ── section label ── */
  .sl {
    font-size: 10px; font-weight: 700; letter-spacing: 3px;
    text-transform: uppercase; color: rgba(240,238,255,0.2); margin-bottom: 14px;
  }

  /* ── metric cards ── */
  .db-metrics {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px;
  }

  .db-card {
    border-radius: 18px;
    padding: clamp(12px,2vw,20px);
    position: relative; overflow: hidden; cursor: default;
    transition: transform 0.22s ease;
  }
  .db-card:hover { transform: translateY(-4px); }

  .db-card-ico {
    position: absolute; top: 12px; right: 14px;
    font-size: 17px; opacity: 0.28;
  }

  .db-card-lbl {
    font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: rgba(240,238,255,0.3);
    margin-bottom: 9px; padding-left: 10px;
  }

  .db-card-val {
    font-size: clamp(22px,3.5vw,34px); font-weight: 700;
    letter-spacing: -1px; line-height: 1;
    margin-bottom: 5px; padding-left: 10px;
  }

  .db-card-sub {
    font-size: 11px; color: rgba(240,238,255,0.22); padding-left: 10px;
  }

  /* ── actions ── */
  .db-actions { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 24px; }

  .db-action {
    display: flex; align-items: center; gap: 8px;
    padding: clamp(10px,1.5vw,13px) clamp(10px,2vw,14px);
    border-radius: 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: clamp(11px,1.4vw,13px); font-weight: 600;
    color: rgba(240,238,255,0.72); text-decoration: none;
    transition: transform 0.15s ease, color 0.15s ease;
    overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  }
  .db-action:hover { transform: translateY(-2px) scale(1.03); color: #f0eeff; }
  .db-action:active { transform: scale(0.97); }
  .db-action-ico { font-size: 15px; flex-shrink: 0; }

  /* ── footer ── */
  .db-footer {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(191,127,255,0.14);
    border-radius: 18px; padding: 16px 20px;
    position: relative; overflow: hidden;
  }

  .db-footer::after {
    content: '';
    position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
    animation: shimmer 4s ease-in-out infinite;
  }
  @keyframes shimmer { to { left: 130%; } }

  .db-footer-lbl {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(240,238,255,0.22); margin-bottom: 5px;
  }

  .db-footer-txt {
    font-size: clamp(12px,2vw,14px); font-weight: 500;
    color: rgba(240,238,255,0.65); line-height: 1.45;
  }

  .db-footer-ico { font-size: 22px; color: rgba(191,127,255,0.55); flex-shrink: 0; }

  /* ── MOBILE ── */
  @media (max-width: 768px) {
    .db {
      /* top: clear fixed topbar (56px); sides: 20px breathing room; bottom: clear tab bar (72px) */
      padding: 72px 20px 88px 20px;
    }

    .db-row { flex-direction: column; gap: 12px; }

    /* clock sits below greeting on mobile, left-aligned */
    .db-clock { text-align: left; align-self: flex-start; }
    .db-clock-val { font-size: 20px; }

    .db-metrics { grid-template-columns: repeat(2,1fr); gap: 10px; }
    .db-actions  { grid-template-columns: repeat(2,1fr); gap: 8px; }

    .db-footer { flex-direction: column; align-items: flex-start; }

    /* make h1 slightly smaller so it never clips */
    .db-h1 { font-size: clamp(26px, 7vw, 36px); letter-spacing: -1.5px; }
  }

  @media (max-width: 380px) {
    .db { padding-left: 16px; padding-right: 16px; }
    .db-h1 { font-size: 24px; }
    .db-metrics { grid-template-columns: repeat(2,1fr); }
    .db-actions  { grid-template-columns: repeat(2,1fr); }
  }
`

export default function DashboardPage() {
  const supabase = createClient()
  const [greeting, setGreeting] = useState('')
  const [vibe, setVibe]         = useState('')
  const [date, setDate]         = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    setVibe(vibes[Math.floor(Math.random() * vibes.length)])
    setDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))

    // fetch user name from supabase auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const full = user.user_metadata?.full_name as string | undefined
      if (full) {
        // use first name only for the greeting
        setUserName(full.split(' ')[0])
      } else if (user.email) {
        // fallback: capitalise the part before @
        const part = user.email.split('@')[0]
        setUserName(part.charAt(0).toUpperCase() + part.slice(1))
      }
    })
  }, [])

  return (
    <>
      <style>{css}</style>
      <div className="db">
        <div className="db-inner">

          {/* ── Header ── */}
          <motion.header className="db-header"
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44 }}>
            <div className="db-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="db-eyebrow">{date}</p>
                <h1 className="db-h1">
                  {greeting},<br />
                  <em>{userName || '...'}</em>
                </h1>
                <motion.span className="db-vibe"
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}>
                  <span className="db-vibe-dot" />
                  {vibe}
                </motion.span>
              </div>
              <LiveTime />
            </div>
          </motion.header>

          {/* ── Metrics ── */}
          <p className="sl">overview</p>
          <div className="db-metrics">
            {metrics.map((m, i) => (
              <motion.div key={m.label} className="db-card"
                style={{ background: m.bg, border: `1px solid ${m.border}` }}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.38 }}>
                <div style={{
                  position: 'absolute', left: 0, top: '16%', bottom: '16%',
                  width: 3, borderRadius: '0 3px 3px 0', background: m.c, opacity: 0.7,
                }} />
                <i className={`ti ${m.icon} db-card-ico`} aria-hidden="true" style={{ color: m.c }} />
                <p className="db-card-lbl">{m.label}</p>
                <p className="db-card-val" style={{ color: m.c }}>{m.value}</p>
                <p className="db-card-sub">{m.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Quick actions ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}>
            <p className="sl">quick actions</p>
            <div className="db-actions">
              {actions.map((a, i) => (
                <motion.a key={a.label} href={a.href} className="db-action"
                  style={{ background: a.bg, border: `1px solid ${a.border}` }}
                  initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}>
                  <i className={`ti ${a.icon} db-action-ico`} aria-hidden="true" style={{ color: a.c }} />
                  {a.label}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* ── Footer ── */}
          <motion.div className="db-footer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
            <div>
              <p className="db-footer-lbl">today's mission</p>
              <p className="db-footer-txt">Log your mood, crush your habits, stay on track.</p>
            </div>
            <i className="ti ti-rocket db-footer-ico" aria-hidden="true" />
          </motion.div>

        </div>
      </div>
    </>
  )
}

function LiveTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div className="db-clock"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}>
      <p className="db-clock-val">{time}</p>
      <p className="db-clock-sub">IST</p>
    </motion.div>
  )
}