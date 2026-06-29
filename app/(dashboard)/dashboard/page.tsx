'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePeriod } from '../PeriodContext'

const vibes = [
  "you're blooming so beautifully",
  'soft days deserve soft starts',
  'gentle progress is still progress',
  'your best is always enough',
  "you're growing, even on slow days",
]

const periodVibes = [
  'rest is productive. you earned it.',
  'your body is doing something incredible',
  'heat, comfort, and grace — you deserve all three',
  "bleeding and still showing up? that's power",
  'take up space. take the heat pad. take the day.',
]

const actions = [
  { label: 'log mood',   href: '/mood',       iconC: '#d4607a', periodIconC: '#c0394f', icon: 'ti-mood-smile'     },
  { label: 'study',      href: '/study',      iconC: '#b8860b', periodIconC: '#a05030', icon: 'ti-clock-play'     },
  { label: 'expenses',   href: '/expenses',   iconC: '#d4607a', periodIconC: '#c0394f', icon: 'ti-cash'           },
  { label: 'attendance', href: '/attendance', iconC: '#5a8c63', periodIconC: '#8c5a6a', icon: 'ti-calendar-check' },
  { label: 'habits',     href: '/habits',     iconC: '#9b7ec8', periodIconC: '#9b4a5f', icon: 'ti-checks'         },
  { label: 'insights',   href: '/insights',   iconC: '#d4607a', periodIconC: '#c0394f', icon: 'ti-chart-bar'      },
  { label: 'periods',    href: '/periods',    iconC: '#9b7ec8', periodIconC: '#c0394f', icon: 'ti-calendar-heart' },
]

function LeafIcon({ size = 14, color = '#5a8c63' }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sg {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    padding: clamp(20px,5vw,48px) clamp(20px,4vw,40px);
    overflow-x: hidden; width: 100%;
    /* Inherits --cream, --ink etc. from PeriodLayout's CSS Module when on period */
    background: var(--cream, #fdf7f0);
    color: var(--ink, #3d2a35);
    transition: background 0.6s ease, color 0.6s ease;
  }

  /* Normal palette defaults — period overrides come from period.module.css on the layout */
  .sg {
    --blush: #f2c4ce; --blush2: #e8a0b0; --rose: #d4607a; --petal: #fde8ee;
    --lavender: #e8daf5; --lav2: #c9b8e8; --cream: #fdf7f0;
    --ink: #3d2a35; --ink2: #7a5c68; --ink3: #b09aa4; --card: #fff9fb;
    --divider-line: rgba(212,96,122,0.12); --divider-flower: #e8a0b0;
    --act-border: rgba(212,96,122,0.1); --act-bg: #fff9fb;
    --act-hover-bg: #fde8ee; --act-hover-border: rgba(212,96,122,0.25); --act-hover-text: #d4607a;
    --footer-grad-a: #fde8ee; --footer-grad-b: #e8daf5;
    --footer-border: rgba(212,96,122,0.14); --footer-ico: #e8a0b0;
    --vibe-bg: #fde8ee; --vibe-border: rgba(212,96,122,0.18); --vibe-text: #d4607a;
    --clock-bg: #e8daf5; --clock-border: rgba(201,184,232,0.5);
  }

  .sg-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .sg-header-left { flex: 1; min-width: 0; }
  .sg-eyebrow { font-size: 10px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; }
  .sg-petal-ico { font-size: 13px; color: var(--blush2); }
  .sg-name { font-family: 'Fraunces', serif; font-size: clamp(30px,6vw,48px); font-weight: 300; font-style: italic; letter-spacing: -1px; line-height: 1.05; color: var(--ink); margin-bottom: 14px; word-break: break-word; }
  .sg-name .accent { color: var(--rose); }
  .sg-vibe { display: inline-flex; align-items: center; gap: 8px; background: var(--vibe-bg); border: 1px solid var(--vibe-border); border-radius: 999px; padding: 6px 16px; font-size: 12px; font-weight: 400; color: var(--vibe-text); font-family: 'Fraunces', serif; font-style: italic; }
  .sg-vibe-heart { font-size: 12px; color: var(--blush2); animation: hbeat 2.4s ease-in-out infinite; display: inline-block; }
  @keyframes hbeat { 0%,100%{transform:scale(1)} 45%{transform:scale(1.3)} 55%{transform:scale(1.1)} }

  .sg-period-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(176,48,80,0.15); border: 1px solid rgba(176,48,80,0.3); border-radius: 999px; padding: 4px 12px; font-size: 9px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #e8a0b0; margin-bottom: 10px; }
  .sg-period-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #c0394f; animation: pulse-dot 1.8s ease-in-out infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }

  .sg-clock-card { background: var(--clock-bg); border: 1px solid var(--clock-border); border-radius: 18px; padding: 14px 18px; text-align: right; flex-shrink: 0; transition: background 0.5s, border-color 0.5s; }
  .sg-clock-val { font-family: 'Fraunces', serif; font-size: clamp(18px,3vw,26px); font-weight: 300; color: var(--ink); letter-spacing: -0.5px; line-height: 1; }
  .sg-clock-sub { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-top: 4px; }

  .sg-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .sg-divider-line { flex: 1; height: 1px; background: var(--divider-line); }
  .sg-divider-label { font-size: 9px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); white-space: nowrap; }
  .sg-divider-flower { font-size: 11px; color: var(--divider-flower); }

  .sg-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
  .sg-card { border-radius: 20px; padding: clamp(14px,2vw,20px) clamp(12px,1.5vw,16px); position: relative; overflow: hidden; transition: transform 0.2s ease, border-color 0.2s, background 0.5s; cursor: default; }
  .sg-card:hover { transform: translateY(-3px); }
  .sg-card::after { content: ''; position: absolute; bottom: -18px; right: -18px; width: 56px; height: 56px; border-radius: 50%; opacity: 0.22; pointer-events: none; background: var(--dot-c, #f2c4ce); }
  .sg-card-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
  .sg-card-lbl-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .sg-card-val { font-family: 'Fraunces', serif; font-size: clamp(24px,3.5vw,32px); font-weight: 300; letter-spacing: -0.5px; line-height: 1; margin-bottom: 5px; }
  .sg-card-sub { font-size: 11px; color: var(--ink3); display: flex; align-items: center; gap: 5px; }
  .sg-card-ico { position: absolute; top: 14px; right: 14px; font-size: 16px; opacity: 0.22; }

  .sg-acts { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 16px; }
  .sg-act { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; padding: clamp(10px,1.5vw,14px) clamp(10px,1.5vw,12px); border-radius: 18px; border: 1px solid var(--act-border); background: var(--act-bg); text-decoration: none; color: var(--ink2); font-size: 11px; font-weight: 500; letter-spacing: 0.2px; font-family: 'DM Sans', sans-serif; transition: all 0.17s ease; }
  .sg-act:hover { background: var(--act-hover-bg); border-color: var(--act-hover-border); color: var(--act-hover-text); transform: translateY(-2px); }
  .sg-act:active { transform: scale(0.97); }
  .sg-act-ico { font-size: 17px; }

  .sg-footer { background: linear-gradient(135deg, var(--footer-grad-a) 0%, var(--footer-grad-b) 100%); border: 1px solid var(--footer-border); border-radius: 20px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .sg-footer-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 5px; }
  .sg-footer-msg { font-family: 'Fraunces', serif; font-style: italic; font-size: 15px; font-weight: 300; color: var(--ink2); }
  .sg-footer-right { display: flex; align-items: center; gap: 6px; }
  .sg-footer-ico { font-size: 20px; color: var(--footer-ico); }

  @media (max-width: 768px) {
    .sg { padding: 72px 20px 88px; }
    .sg-header { flex-direction: column; gap: 12px; }
    .sg-clock-card { align-self: flex-start; text-align: left; }
    .sg-grid { grid-template-columns: repeat(2,1fr); }
    .sg-acts { grid-template-columns: repeat(2,1fr); }
    .sg-footer { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 380px) {
    .sg { padding-left: 16px; padding-right: 16px; }
    .sg-name { font-size: 26px; }
  }
`

interface MetricState {
  mood: string; habits: string; habitSub: string; habitsDone: boolean
  studyTime: string; attendance: string; expenses: string; streak: string
  period: string; periodSub: string;
}

const DEFAULT_METRICS: MetricState = {
  mood: '—', habits: '0 / 0', habitSub: 'none added yet', habitsDone: false,
  studyTime: '0min', attendance: '—%', expenses: '₹0', streak: '0',
  period: '—', periodSub: 'not tracked yet',
}

function formatExpenses(total: number): string {
  if (total >= 100_000) return `₹${(total / 100_000).toFixed(1)}L`
  if (total >= 1_000)   return `₹${(total / 1_000).toFixed(1)}k`
  return `₹${Math.round(total)}`
}
function formatStudyTime(mins: number): string {
  const h = Math.floor(mins / 60); const m = mins % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}
function lastDayOfMonth(thisMonth: string): string {
  const [y, m] = thisMonth.split('-').map(Number)
  return `${thisMonth}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

function periodCardStyle(label: string): { c: string; bg: string; border: string; dotC: string } {
  const map: Record<string, { c: string; bg: string; border: string; dotC: string }> = {
    'mood today': { c: '#e8a0b0', bg: '#1e1015', border: 'rgba(192,57,79,0.2)',  dotC: '#9b4a60' },
    'habits':     { c: '#c97080', bg: '#1e1015', border: 'rgba(176,48,80,0.18)', dotC: '#7a3848' },
    'study time': { c: '#c08060', bg: '#1e1015', border: 'rgba(160,80,48,0.2)',  dotC: '#804030' },
    'attendance': { c: '#9b7080', bg: '#1e1015', border: 'rgba(140,80,100,0.2)', dotC: '#6b4050' },
    'expenses':   { c: '#e8a0b0', bg: '#1e1015', border: 'rgba(192,57,79,0.2)',  dotC: '#9b4a60' },
    'streak':     { c: '#c97080', bg: '#1e1015', border: 'rgba(176,48,80,0.18)', dotC: '#7a3848' },
    'periods':    { c: '#e8a0b0', bg: '#2a1018', border: 'rgba(192,57,79,0.3)',  dotC: '#9b4a60' },
  }
  return map[label] ?? { c: '#e8a0b0', bg: '#1e1015', border: 'rgba(176,48,80,0.2)', dotC: '#9b4a60' }
}

export default function DashboardPage() {
  const supabase  = useMemo(() => createClient(), [])
  const isPeriod  = usePeriod() // ← from shared context, no extra fetch
  const [greeting, setGreeting] = useState('')
  const [vibe,     setVibe]     = useState('')
  const [date,     setDate]     = useState('')
  const [userName, setUserName] = useState('')
  const [metrics,  setMetrics]  = useState<MetricState>(DEFAULT_METRICS)

  const fetchMetrics = useCallback(async (userId: string) => {
    const today     = new Date().toISOString().slice(0, 10)
    const thisMonth = today.slice(0, 7)
    const monthEnd  = lastDayOfMonth(thisMonth)

    const [moodRes, habitsRes, logsRes, attRes, studyRes, expRes, streakRes, periodRes] =
      await Promise.all([
        supabase.from('mood_entries').select('mood, emoji').eq('user_id', userId).gte('created_at', `${today}T00:00:00`).lte('created_at', `${today}T23:59:59`).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('habits').select('id').eq('user_id', userId).eq('archived', false),
        supabase.from('habit_logs').select('habit_id').eq('user_id', userId).eq('date', today),
        supabase.from('attendance').select('status').eq('user_id', userId).gte('date', `${thisMonth}-01`).lte('date', monthEnd),
        supabase.from('study_sessions').select('duration_mins').eq('user_id', userId).eq('date', today),
        supabase.from('expenses').select('amount').eq('user_id', userId).gte('date', `${thisMonth}-01`).lte('date', monthEnd),
        supabase.from('habit_logs').select('date').eq('user_id', userId)
          .gte('date', (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10) })())
          .lte('date', today),
        supabase.from('period_entries').select('start_date, end_date').eq('user_id', userId).order('start_date', { ascending: false }).limit(2),
      ])

    const next: MetricState = { ...DEFAULT_METRICS }

    if (moodRes.data) next.mood = moodRes.data.emoji ?? moodRes.data.mood

    const totalHabits = habitsRes.data?.length ?? 0
    const doneHabits  = logsRes.data?.length ?? 0
    if (totalHabits > 0) {
      next.habits     = `${doneHabits} / ${totalHabits}`
      next.habitsDone = doneHabits === totalHabits
      next.habitSub   = doneHabits === totalHabits ? 'all done!' : `${totalHabits - doneHabits} remaining`
    }

    const attRows = (attRes.data ?? []) as { status: string }[]
    if (attRows.length > 0) {
      const present  = attRows.filter(a => a.status === 'present').length
      const absent   = attRows.filter(a => a.status === 'absent').length
      const workDays = present + absent
      next.attendance = workDays > 0 ? `${Math.round((present / workDays) * 100)}%` : '—%'
    }

    if (studyRes.data?.length)
      next.studyTime = formatStudyTime((studyRes.data as { duration_mins: number }[]).reduce((s, r) => s + r.duration_mins, 0))

    if (expRes.data?.length)
      next.expenses = formatExpenses((expRes.data as { amount: number }[]).reduce((s, r) => s + r.amount, 0))

    if (streakRes.data?.length) {
      const loggedDates = new Set((streakRes.data as { date: string }[]).map(l => l.date))
      let count = 0; const cursor = new Date()
      if (!loggedDates.has(today)) cursor.setDate(cursor.getDate() - 1)
      while (true) {
        const dateStr = cursor.toISOString().slice(0, 10)
        if (!loggedDates.has(dateStr)) break
        count++; cursor.setDate(cursor.getDate() - 1)
      }
      next.streak = String(count)
    }

    const periodEntries = periodRes.data
    if (periodEntries?.length) {
      const latest      = periodEntries[0]
      const cycleLength = periodEntries.length >= 2
        ? Math.round((new Date(periodEntries[0].start_date).getTime() - new Date(periodEntries[1].start_date).getTime()) / 86_400_000)
        : 28
      const now   = new Date()
      const nextDate = new Date(latest.start_date)
      nextDate.setDate(nextDate.getDate() + cycleLength)
      const daysLeft = Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000)
      next.period    = isPeriod ? 'active' : daysLeft > 0 ? `${daysLeft}d` : 'due'
      next.periodSub = isPeriod ? 'currently on your period' : daysLeft > 0 ? `next in ${daysLeft} days` : 'period due today'
    }

    setMetrics(next)
  }, [supabase, isPeriod])

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    setDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const full = user.user_metadata?.full_name as string | undefined
      if (full) { setUserName(full.split(' ')[0]) } else if (user.email) {
        const part = user.email.split('@')[0]
        setUserName(part.charAt(0).toUpperCase() + part.slice(1))
      }
      fetchMetrics(user.id)
    })
  }, [supabase, fetchMetrics])

  useEffect(() => {
    const pool = isPeriod ? periodVibes : vibes
    setVibe(pool[Math.floor(Math.random() * pool.length)])
  }, [isPeriod])

  const metricCards = useMemo(() => [
    { label: 'mood today', value: metrics.mood,       sub: metrics.mood === '—' ? 'not logged yet' : 'logged today', c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.1)',    dotC: '#e8a0b0', icon: 'ti-mood-smile'     },
    { label: 'habits',     value: metrics.habits,     sub: metrics.habitSub,                                          c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.25)', dotC: '#c9b8e8', icon: 'ti-checks'         },
    { label: 'study time', value: metrics.studyTime,  sub: "today's session",                                         c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.35)', dotC: '#f5ddb4', icon: 'ti-clock-hour-4'   },
    { label: 'attendance', value: metrics.attendance, sub: "this month's record",                                     c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.3)',  dotC: '#a8c9ae', icon: 'ti-calendar-stats' },
    { label: 'expenses',   value: metrics.expenses,   sub: 'this month',                                              c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.1)',    dotC: '#e8a0b0', icon: 'ti-receipt'        },
    { label: 'streak',     value: metrics.streak,     sub: 'days',                                                    c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.25)', dotC: '#c9b8e8', icon: 'ti-flame'          },
    { label: 'periods',    value: metrics.period,     sub: metrics.periodSub,                                         c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.25)', dotC: '#c9b8e8', icon: 'ti-calendar-heart' },
  ], [metrics])

  return (
    <>
      <style>{css}</style>
      <div className="sg">

        <motion.header className="sg-header"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44 }}>
          <div className="sg-header-left">
            {isPeriod && (
              <motion.div className="sg-period-badge"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <span className="sg-period-badge-dot" />
                period active — be gentle with yourself
              </motion.div>
            )}
            <p className="sg-eyebrow">
              <i className={`ti ${isPeriod ? 'ti-moon' : 'ti-leaf'} sg-petal-ico`} aria-hidden="true" />
              {date}
            </p>
            <h1 className="sg-name">
              {greeting},<br />
              <span className="accent">
                {userName || '...'}{' '}
                {isPeriod
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }} aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }} aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                }
              </span>
            </h1>
            <motion.span className="sg-vibe"
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <i className={`ti ${isPeriod ? 'ti-droplet' : 'ti-heart'} sg-vibe-heart`} aria-hidden="true" />
              {vibe}
            </motion.span>
          </div>
          <LiveTime />
        </motion.header>

        <Divider label={isPeriod ? 'your body, your day' : 'your day at a glance'} isPeriod={isPeriod} />

        <div className="sg-grid">
          {metricCards.map((m, i) => {
            const s = isPeriod ? periodCardStyle(m.label) : { c: m.c, bg: m.bg, border: m.border, dotC: m.dotC }
            return (
              <motion.div key={m.label} className="sg-card"
                style={{ background: s.bg, border: `1px solid ${s.border}`, ['--dot-c' as string]: s.dotC }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.36 }}>
                <i className={`ti ${m.icon} sg-card-ico`} aria-hidden="true" style={{ color: s.c }} />
                <p className="sg-card-lbl">
                  <span className="sg-card-lbl-dot" style={{ background: s.dotC }} />
                  {m.label}
                </p>
                {m.label === 'periods' && isPeriod ? (
                  <p className="sg-card-val" style={{ color: s.c }}>
                    <img src="/blood-drop.png" alt="Period active" width={56} height={56}
                      style={{ display: 'inline-block', objectFit: 'contain', borderRadius: '6px' }} />
                  </p>
                ) : (
                  <p className="sg-card-val" style={{ color: s.c }}>{m.value}</p>
                )}
                <p className="sg-card-sub">
                  {m.label === 'habits' && metrics.habitsDone
                    ? <><LeafIcon size={12} color={isPeriod ? '#9b7080' : '#5a8c63'} />{m.sub}</>
                    : m.sub}
                </p>
              </motion.div>
            )
          })}
        </div>

        <Divider label="quick actions" isPeriod={isPeriod} />

        <motion.div className="sg-acts"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          {actions.map((a, i) => (
            <motion.a key={a.label} href={a.href} className="sg-act"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.38 + i * 0.05 }}>
              <i className={`ti ${a.icon} sg-act-ico`} aria-hidden="true"
                style={{ color: isPeriod ? a.periodIconC : a.iconC }} />
              {a.label}
            </motion.a>
          ))}
        </motion.div>

        <motion.div className="sg-footer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <div>
            <p className="sg-footer-lbl">today's intention</p>
            <p className="sg-footer-msg">
              {isPeriod
                ? 'rest when you need to. your softness is a strength.'
                : 'log your mood, tend your habits, bloom gently.'}
            </p>
          </div>
          <div className="sg-footer-right">
            {isPeriod ? (
              <>
                <i className="ti ti-droplet sg-footer-ico" aria-hidden="true" />
                <i className="ti ti-moon sg-footer-ico" aria-hidden="true" />
              </>
            ) : (
              <>
                <i className="ti ti-heart sg-footer-ico" aria-hidden="true" />
                <i className="ti ti-flower sg-footer-ico" aria-hidden="true" />
              </>
            )}
          </div>
        </motion.div>

      </div>
    </>
  )
}

function Divider({ label, isPeriod }: { label: string; isPeriod?: boolean }) {
  return (
    <div className="sg-divider">
      <div className="sg-divider-line" />
      <i className={`ti ${isPeriod ? 'ti-droplet' : 'ti-circle'} sg-divider-flower`} aria-hidden="true" />
      <span className="sg-divider-label">{label}</span>
      <i className={`ti ${isPeriod ? 'ti-droplet' : 'ti-circle'} sg-divider-flower`} aria-hidden="true" />
      <div className="sg-divider-line" />
    </div>
  )
}

function LiveTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1_000)
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