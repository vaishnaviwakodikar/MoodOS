'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const metrics = [
  {
    label: 'mood today',   value: '—',      sub: 'not logged yet',
    c: '#d4607a',   bg: '#fff9fb',   border: 'rgba(212,96,122,0.1)',
    dotC: '#e8a0b0', icon: 'ti-mood-smile',
  },
  {
    label: 'habits',       value: '0 / 0',  sub: 'none added yet',
    c: '#9b7ec8',   bg: '#fdf8ff',   border: 'rgba(201,184,232,0.25)',
    dotC: '#c9b8e8', icon: 'ti-checks',
  },
  {
    label: 'study time',   value: '0h',     sub: "today's session",
    c: '#b8860b',   bg: '#fffdf5',   border: 'rgba(245,221,180,0.35)',
    dotC: '#f5ddb4', icon: 'ti-clock-hour-4',
  },
  {
    label: 'attendance',   value: '—%',     sub: "this month's record",
    c: '#5a8c63',   bg: '#f8fcf8',   border: 'rgba(168,201,174,0.3)',
    dotC: '#a8c9ae', icon: 'ti-calendar-stats',
  },
  {
    label: 'expenses',     value: '₹0',     sub: 'this month',
    c: '#d4607a',   bg: '#fff9fb',   border: 'rgba(212,96,122,0.1)',
    dotC: '#e8a0b0', icon: 'ti-receipt',
  },
  {
    label: 'streak',       value: '0',      sub: 'days',
    c: '#9b7ec8',   bg: '#fdf8ff',   border: 'rgba(201,184,232,0.25)',
    dotC: '#c9b8e8', icon: 'ti-flame',
  },
  { label: 'periods',      value: '—',      sub: 'not tracked yet',
    c: '#9b7ec8',   bg: '#fdf8ff',   border: 'rgba(201,184,232,0.25)',
    dotC: '#c9b8e8', icon: 'ti-calendar-heart',
   },
]

const actions = [
  { label: 'log mood',    href: '/mood',       iconC: '#d4607a', icon: 'ti-mood-smile' },
  { label: 'study',       href: '/study',      iconC: '#b8860b', icon: 'ti-clock-play' },
  { label: 'expenses',    href: '/expenses',   iconC: '#d4607a', icon: 'ti-cash' },
  { label: 'attendance',  href: '/attendance', iconC: '#5a8c63', icon: 'ti-calendar-check' },
  { label: 'habits',      href: '/habits',     iconC: '#9b7ec8', icon: 'ti-checks' },
  { label: 'insights',    href: '/insights',   iconC: '#d4607a', icon: 'ti-chart-bar' },
  { label: 'periods',     href: '/',    iconC: '#9b7ec8', icon: 'ti-calendar-heart' },
  
]

const vibes = [
  "you're blooming so beautifully",
  'soft days deserve soft starts',
  'gentle progress is still progress',
  'your best is always enough',
  "you're growing, even on slow days",
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sg {
    --blush: #f2c4ce;
    --blush2: #e8a0b0;
    --rose: #d4607a;
    --petal: #fde8ee;
    --lavender: #e8daf5;
    --lav2: #c9b8e8;
    --butter: #fef3e2;
    --butter2: #f5ddb4;
    --sage: #d4e8d8;
    --sage2: #a8c9ae;
    --cream: #fdf7f0;
    --ink: #3d2a35;
    --ink2: #7a5c68;
    --ink3: #b09aa4;
    --card: #fff9fb;
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    padding: clamp(20px,5vw,48px) clamp(20px,4vw,40px);
    overflow-x: hidden;
    width: 100%;
  }

  /* ── header ── */
  .sg-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
  }
  .sg-header-left { flex: 1; min-width: 0; }

  .sg-eyebrow {
    font-size: 10px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase;
    color: var(--ink3); margin-bottom: 8px;
    display: flex; align-items: center; gap: 7px;
  }
  .sg-petal-ico { font-size: 13px; color: var(--blush2); }

  .sg-name {
    font-family: 'Fraunces', serif;
    font-size: clamp(30px, 6vw, 48px); font-weight: 300; font-style: italic;
    letter-spacing: -1px; line-height: 1.05;
    color: var(--ink); margin-bottom: 14px;
    word-break: break-word;
  }
  .sg-name .accent { color: var(--rose); }

  .sg-vibe {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--petal); border: 1px solid rgba(212,96,122,0.18);
    border-radius: 999px; padding: 6px 16px;
    font-size: 12px; font-weight: 400; color: var(--rose);
    font-family: 'Fraunces', serif; font-style: italic;
  }
  .sg-vibe-heart {
    font-size: 12px; color: var(--blush2);
    animation: hbeat 2.4s ease-in-out infinite;
    display: inline-block;
  }
  @keyframes hbeat {
    0%, 100% { transform: scale(1); }
    45%       { transform: scale(1.3); }
    55%       { transform: scale(1.1); }
  }

  /* ── clock ── */
  .sg-clock-card {
    background: var(--lavender); border: 1px solid rgba(201,184,232,0.5);
    border-radius: 18px; padding: 14px 18px; text-align: right; flex-shrink: 0;
  }
  .sg-clock-val {
    font-family: 'Fraunces', serif; font-size: clamp(18px,3vw,26px); font-weight: 300;
    color: var(--ink); letter-spacing: -0.5px; line-height: 1;
  }
  .sg-clock-sub {
    font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--ink3); margin-top: 4px;
  }

  /* ── divider ── */
  .sg-divider {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }
  .sg-divider-line { flex: 1; height: 1px; background: rgba(212,96,122,0.12); }
  .sg-divider-label {
    font-size: 9px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase;
    color: var(--ink3); white-space: nowrap;
  }
  .sg-divider-flower { font-size: 11px; color: var(--blush2); }

  /* ── metric cards ── */
  .sg-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;
  }

  .sg-card {
    border-radius: 20px; padding: clamp(14px,2vw,20px) clamp(12px,1.5vw,16px);
    position: relative; overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s;
    cursor: default;
  }
  .sg-card:hover { transform: translateY(-3px); }

  .sg-card::after {
    content: ''; position: absolute; bottom: -18px; right: -18px;
    width: 56px; height: 56px; border-radius: 50%;
    opacity: 0.22; pointer-events: none;
    background: var(--dot-c, #f2c4ce);
  }

  .sg-card-lbl {
    font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink3); margin-bottom: 10px;
    display: flex; align-items: center; gap: 5px;
  }
  .sg-card-lbl-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  .sg-card-val {
    font-family: 'Fraunces', serif;
    font-size: clamp(24px,3.5vw,32px); font-weight: 300; letter-spacing: -0.5px; line-height: 1;
    margin-bottom: 5px;
  }
  .sg-card-sub  { font-size: 11px; color: var(--ink3); }
  .sg-card-ico  { position: absolute; top: 14px; right: 14px; font-size: 16px; opacity: 0.22; }

  /* ── actions ── */
  .sg-acts {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;
  }

  .sg-act {
    display: flex; flex-direction: column; align-items: flex-start; gap: 7px;
    padding: clamp(10px,1.5vw,14px) clamp(10px,1.5vw,12px);
    border-radius: 18px; border: 1px solid rgba(212,96,122,0.1);
    background: var(--card); text-decoration: none; color: var(--ink2);
    font-size: 11px; font-weight: 500; letter-spacing: 0.2px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.17s ease;
  }
  .sg-act:hover {
    background: var(--petal); border-color: rgba(212,96,122,0.25);
    color: var(--rose); transform: translateY(-2px);
  }
  .sg-act:active { transform: scale(0.97); }
  .sg-act-ico { font-size: 17px; }

  /* ── footer ── */
  .sg-footer {
    background: linear-gradient(135deg, var(--petal) 0%, var(--lavender) 100%);
    border: 1px solid rgba(212,96,122,0.14);
    border-radius: 20px; padding: 18px 22px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .sg-footer-lbl {
    font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink3); margin-bottom: 5px;
  }
  .sg-footer-msg {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 15px; font-weight: 300; color: var(--ink2);
  }
  .sg-footer-right { display: flex; align-items: center; gap: 6px; }
  .sg-footer-ico   { font-size: 20px; color: var(--blush2); }

  /* ── mobile ── */
  @media (max-width: 768px) {
    .sg { padding: 72px 20px 88px; }
    .sg-header { flex-direction: column; gap: 12px; }
    .sg-clock-card { align-self: flex-start; text-align: left; }
    .sg-grid  { grid-template-columns: repeat(2, 1fr); }
    .sg-acts  { grid-template-columns: repeat(2, 1fr); }
    .sg-footer { flex-direction: column; align-items: flex-start; }
  }

  @media (max-width: 380px) {
    .sg { padding-left: 16px; padding-right: 16px; }
    .sg-name { font-size: 26px; }
  }
`

export default function DashboardPage() {
  const supabase = createClient()
  const [greeting, setGreeting] = useState('')
  const [vibe,     setVibe]     = useState('')
  const [date,     setDate]     = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    setVibe(vibes[Math.floor(Math.random() * vibes.length)])
    setDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const full = user.user_metadata?.full_name as string | undefined
      if (full) {
        setUserName(full.split(' ')[0])
      } else if (user.email) {
        const part = user.email.split('@')[0]
        setUserName(part.charAt(0).toUpperCase() + part.slice(1))
      }
    })
  }, [])

  return (
    <>
      <style>{css}</style>
      <div className="sg">

        {/* ── Header ── */}
        <motion.header className="sg-header"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44 }}>
          <div className="sg-header-left">
            <p className="sg-eyebrow">
              <i className="ti ti-leaf sg-petal-ico" aria-hidden="true" />
              {date}
            </p>
            <h1 className="sg-name">
              {greeting},<br />
              <span className="accent">
  {userName || '...'}{' '}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline', verticalAlign: 'middle' }}
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
</span>
            </h1>
            <motion.span className="sg-vibe"
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              <i className="ti ti-heart sg-vibe-heart" aria-hidden="true" />
              {vibe}
            </motion.span>
          </div>
          <LiveTime />
        </motion.header>

        {/* ── Divider ── */}
        <div className="sg-divider">
          <div className="sg-divider-line" />
          <i className="ti ti-circle sg-divider-flower" aria-hidden="true" />
          <span className="sg-divider-label">your day at a glance</span>
          <i className="ti ti-circle sg-divider-flower" aria-hidden="true" />
          <div className="sg-divider-line" />
        </div>

        {/* ── Metrics ── */}
        <div className="sg-grid">
          {metrics.map((m, i) => (
            <motion.div key={m.label} className="sg-card"
              style={{
                background: m.bg,
                border: `1px solid ${m.border}`,
                ['--dot-c' as string]: m.dotC,
              }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.36 }}>
              <i className={`ti ${m.icon} sg-card-ico`} aria-hidden="true" style={{ color: m.c }} />
              <p className="sg-card-lbl">
                <span className="sg-card-lbl-dot" style={{ background: m.dotC }} />
                {m.label}
              </p>
              <p className="sg-card-val" style={{ color: m.c }}>{m.value}</p>
              <p className="sg-card-sub">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Actions divider ── */}
        <div className="sg-divider">
          <div className="sg-divider-line" />
          <i className="ti ti-circle sg-divider-flower" aria-hidden="true" />
          <span className="sg-divider-label">quick actions</span>
          <i className="ti ti-circle sg-divider-flower" aria-hidden="true" />
          <div className="sg-divider-line" />
        </div>

        {/* ── Actions ── */}
        <motion.div className="sg-acts"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}>
          {actions.map((a, i) => (
            <motion.a key={a.label} href={a.href} className="sg-act"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.38 + i * 0.05 }}>
              <i className={`ti ${a.icon} sg-act-ico`} aria-hidden="true" style={{ color: a.iconC }} />
              {a.label}
            </motion.a>
          ))}
        </motion.div>

        {/* ── Footer ── */}
        <motion.div className="sg-footer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <div>
            <p className="sg-footer-lbl">today's intention</p>
            <p className="sg-footer-msg">log your mood, tend your habits, bloom gently.</p>
          </div>
          <div className="sg-footer-right">
            <i className="ti ti-heart sg-footer-ico" aria-hidden="true" />
            <i className="ti ti-flower sg-footer-ico" aria-hidden="true" />
          </div>
        </motion.div>

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
    <motion.div className="sg-clock-card"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
      <p className="sg-clock-val">{time}</p>
      <p className="sg-clock-sub">IST</p>
    </motion.div>
  )
}