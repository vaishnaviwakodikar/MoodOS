'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { id: 'math',     label: 'Maths',    icon: 'ti-math-function', c: '#d4607a', bg: 'rgba(212,96,122,0.06)',  border: 'rgba(212,96,122,0.15)', dotC: '#e8a0b0' },
  { id: 'science',  label: 'Science',  icon: 'ti-flask',         c: '#4d9160', bg: 'rgba(77,145,96,0.06)',   border: 'rgba(77,145,96,0.15)',  dotC: '#a8c9ae' },
  { id: 'language', label: 'Language', icon: 'ti-language',      c: '#8b6ec4', bg: 'rgba(139,110,196,0.06)', border: 'rgba(139,110,196,0.15)',dotC: '#c9b8e8' },
  { id: 'history',  label: 'History',  icon: 'ti-timeline',      c: '#a67c00', bg: 'rgba(166,124,0,0.06)',   border: 'rgba(166,124,0,0.15)',  dotC: '#f5ddb4' },
  { id: 'coding',   label: 'Coding',   icon: 'ti-code',          c: '#4d9160', bg: 'rgba(77,145,96,0.06)',   border: 'rgba(77,145,96,0.15)',  dotC: '#a8c9ae' },
  { id: 'arts',     label: 'Arts',     icon: 'ti-palette',       c: '#d4607a', bg: 'rgba(212,96,122,0.06)',  border: 'rgba(212,96,122,0.15)', dotC: '#e8a0b0' },
  { id: 'music',    label: 'Music',    icon: 'ti-music',         c: '#8b6ec4', bg: 'rgba(139,110,196,0.06)', border: 'rgba(139,110,196,0.15)',dotC: '#c9b8e8' },
  { id: 'other',    label: 'Other',    icon: 'ti-book',          c: '#a67c00', bg: 'rgba(166,124,0,0.06)',   border: 'rgba(166,124,0,0.15)',  dotC: '#f5ddb4' },
]

const STATUS_OPTS = [
  { key: 'pending',     label: 'To Do',       icon: 'ti-circle',       c: '#9a8895' },
  { key: 'in_progress', label: 'In Progress', icon: 'ti-loader-2',     c: '#a67c00' },
  { key: 'done',        label: 'Done',        icon: 'ti-circle-check', c: '#4d9160' },
  { key: 'review',      label: 'Review',      icon: 'ti-refresh',      c: '#8b6ec4' },
]

const PRIORITY = [
  { key: 'low',    label: 'Low',    c: '#4d9160', bg: 'rgba(77,145,96,0.1)'   },
  { key: 'medium', label: 'Medium', c: '#a67c00', bg: 'rgba(166,124,0,0.1)'   },
  { key: 'high',   label: 'High',   c: '#d4607a', bg: 'rgba(212,96,122,0.1)'  },
]

const RANGE_OPTS = [
  { key: '7d',  label: 'This week'  },
  { key: '30d', label: 'This month' },
  { key: '90d', label: '3 months'   },
  { key: 'all', label: 'All time'   },
]

// ── types ────────────────────────────────────────────────────────────────────

type StudySession = {
  id: string
  user_id: string
  subject: string
  duration_mins: number
  date: string
  notes: string | null
  created_at: string | null
}
type Task = {
  id: string
  user_id: string
  title: string
  subject: string
  priority: string
  status: string
  due_date: string | null
  notes: string | null
  created_at: string | null
}
type Note = {
  id: string
  user_id: string
  title: string
  body: string
  subject: string
  created_at: string | null
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getSubject(id: string) { return SUBJECTS.find(s => s.id === id) || SUBJECTS[7] }
function fmtMins(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
function getStartDate(range: string): string {
  const d = new Date()
  if (range === '7d')  d.setDate(d.getDate() - 6)
  if (range === '30d') d.setDate(d.getDate() - 29)
  if (range === '90d') d.setDate(d.getDate() - 89)
  if (range === 'all') return '2000-01-01'
  return d.toISOString().slice(0, 10)
}
function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}
function dayLabel(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --rose: #d4607a;
    --rose-dim: rgba(212,96,122,0.12);
    --petal: #fde8ee;
    --blush: #f2c4ce;
    --blush2: #e8a0b0;
    --lav: #ede5f8;
    --lav2: #c9b8e8;
    --purple: #8b6ec4;
    --cream: #fdf7f2;
    --paper: #fff9fb;
    --ink: #2e1f28;
    --ink2: #6b4d5a;
    --ink3: #a8899a;
    --ink4: #c5adb8;
    --sage: #daeadc;
    --sage2: #a8c9ae;
    --gold: #a67c00;
    --shadow-sm: 0 1px 3px rgba(46,31,40,0.06), 0 1px 2px rgba(46,31,40,0.04);
    --shadow-md: 0 4px 12px rgba(46,31,40,0.08), 0 2px 4px rgba(46,31,40,0.04);
    --shadow-lg: 0 8px 24px rgba(46,31,40,0.10), 0 3px 8px rgba(46,31,40,0.06);
  }

  .ins {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    padding: clamp(20px,3.5vw,40px) clamp(16px,3.5vw,36px) 60px;
    width: 100%;
    overflow-x: hidden;
    /* subtle noise texture */
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E");
  }

  /* ── header ────────────────────────────────────────────────── */
  .ins-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .ins-eyebrow {
    font-size: 10px;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .ins-eyebrow-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--blush2);
    display: inline-block;
  }
  .ins-h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(30px, 6vw, 52px);
    font-weight: 200;
    font-style: italic;
    letter-spacing: -1.5px;
    line-height: 1.02;
    margin-bottom: 14px;
    color: var(--ink);
  }
  .ins-h1 .accent { color: var(--rose); }
  .ins-h1 .accent2 { color: var(--purple); }
  .ins-vibe {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--petal);
    border: 1px solid rgba(212,96,122,0.2);
    border-radius: 999px;
    padding: 5px 14px 5px 10px;
    font-size: 11.5px;
    color: var(--rose);
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 300;
    letter-spacing: 0.2px;
    box-shadow: var(--shadow-sm);
  }
  .ins-vibe i { font-size: 13px; }

  /* ── clock ─────────────────────────────────────────────────── */
  .ins-clock {
    background: linear-gradient(135deg, var(--lav) 0%, rgba(237,229,248,0.6) 100%);
    border: 1px solid rgba(201,184,232,0.4);
    border-radius: 20px;
    padding: 16px 22px;
    text-align: right;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(8px);
  }
  .ins-clock-val {
    font-family: 'Fraunces', serif;
    font-size: clamp(20px, 3.2vw, 28px);
    font-weight: 200;
    color: var(--purple);
    letter-spacing: -0.5px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .ins-clock-sub {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--lav2);
    margin-top: 5px;
  }
  .ins-clock-date {
    font-size: 10px;
    color: var(--ink3);
    margin-top: 3px;
    font-weight: 300;
  }

  /* ── range tabs ─────────────────────────────────────────────── */
  .ins-range {
    display: flex;
    gap: 6px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .ins-range-btn {
    padding: 7px 18px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 500;
    border: 1px solid rgba(212,96,122,0.15);
    background: var(--paper);
    color: var(--ink3);
    cursor: pointer;
    transition: all 0.18s ease;
    font-family: 'DM Sans', sans-serif;
    box-shadow: var(--shadow-sm);
    letter-spacing: 0.2px;
  }
  .ins-range-btn.active {
    background: var(--rose);
    color: #fff;
    border-color: var(--rose);
    box-shadow: 0 2px 10px rgba(212,96,122,0.3);
  }
  .ins-range-btn:hover:not(.active) {
    background: var(--petal);
    color: var(--rose);
    border-color: rgba(212,96,122,0.25);
    transform: translateY(-1px);
  }

  /* ── divider ────────────────────────────────────────────────── */
  .ins-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 20px 0 16px;
  }
  .ins-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,96,122,0.15), transparent);
  }
  .ins-divider-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--ink4);
    white-space: nowrap;
  }
  .ins-divider-ico { font-size: 7px; color: var(--blush2); }

  /* ── stat cards ─────────────────────────────────────────────── */
  .ins-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 22px;
  }
  .ins-stat {
    border-radius: 22px;
    padding: 18px 16px 16px;
    position: relative;
    overflow: hidden;
    cursor: default;
    transition: transform 0.22s cubic-bezier(.22,.68,0,1.2), box-shadow 0.22s ease;
  }
  .ins-stat:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: var(--shadow-lg) !important;
  }
  /* decorative orb */
  .ins-stat::before {
    content: '';
    position: absolute;
    top: -24px; right: -24px;
    width: 72px; height: 72px;
    border-radius: 50%;
    background: var(--orb, rgba(242,196,206,0.35));
    pointer-events: none;
  }
  /* bottom shine */
  .ins-stat::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-line, rgba(212,96,122,0.3)), transparent);
    border-radius: 0 0 22px 22px;
    pointer-events: none;
  }
  .ins-stat-ico {
    font-size: 15px;
    opacity: 0.5;
    margin-bottom: 10px;
    display: block;
  }
  .ins-stat-val {
    font-family: 'Fraunces', serif;
    font-size: clamp(24px, 3.8vw, 34px);
    font-weight: 200;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 5px;
  }
  .ins-stat-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    opacity: 0.5;
  }
  .ins-stat-sub {
    font-size: 10.5px;
    margin-top: 6px;
    opacity: 0.55;
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 300;
  }

  /* ── base card ──────────────────────────────────────────────── */
  .ins-card {
    background: var(--paper);
    border: 1px solid rgba(212,96,122,0.1);
    border-radius: 24px;
    padding: clamp(16px, 2.2vw, 24px);
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s ease;
  }
  .ins-card:hover { box-shadow: var(--shadow-md); }
  .ins-card-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 2.8px;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .ins-card-lbl i { font-size: 13px; color: var(--rose); opacity: 0.8; }

  /* ── bar rows ───────────────────────────────────────────────── */
  .ins-bar-row { display: flex; align-items: center; gap: 10px; }
  .ins-bar-lbl { font-size: 10px; color: var(--ink2); width: 54px; flex-shrink: 0; text-align: right; font-weight: 500; }
  .ins-bar-track {
    flex: 1; height: 7px;
    border-radius: 999px;
    background: rgba(212,96,122,0.07);
    overflow: hidden;
  }
  .ins-bar-fill { height: 100%; border-radius: 999px; }
  .ins-bar-val { font-size: 10px; color: var(--ink3); width: 28px; flex-shrink: 0; font-weight: 500; }

  /* ── subject bar item ───────────────────────────────────────── */
  .ins-subj-row {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; border-radius: 14px;
    margin-bottom: 8px;
    transition: background 0.15s ease;
    cursor: default;
  }
  .ins-subj-row:hover { filter: brightness(0.97); }
  .ins-subj-label { font-size: 12px; font-weight: 500; color: var(--ink); flex: 1; }
  .ins-subj-time { font-size: 10px; color: var(--ink3); font-weight: 500; }

  /* ── weekly chart ───────────────────────────────────────────── */
  .ins-week-col { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }
  .ins-week-bar-wrap {
    display: flex; align-items: flex-end;
    height: 90px; width: 100%; justify-content: center;
  }
  .ins-week-bar {
    width: clamp(16px, 55%, 30px);
    border-radius: 8px 8px 0 0;
    transition: height 0.9s cubic-bezier(.22,.68,0,1.2);
  }
  .ins-week-day {
    font-size: 9px; color: var(--ink3);
    font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
  }
  .ins-week-val { font-size: 9px; color: var(--ink3); min-height: 13px; }

  /* ── streak ─────────────────────────────────────────────────── */
  .ins-streak-big {
    font-family: 'Fraunces', serif;
    font-size: clamp(56px, 11vw, 80px);
    font-weight: 200;
    color: var(--gold);
    line-height: 1;
    letter-spacing: -3px;
  }
  .ins-streak-sub {
    font-size: 9px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: var(--ink3); margin-top: 6px;
  }

  /* ── heat dot ───────────────────────────────────────────────── */
  .ins-heat-cell { width: 13px; height: 13px; border-radius: 4px; }

  /* ── reflection pill ────────────────────────────────────────── */
  .ins-pill {
    display: flex; align-items: flex-start; gap: 11px;
    padding: 13px 16px; border-radius: 18px; margin-bottom: 9px;
    font-size: 13px; font-family: 'Fraunces', serif;
    font-style: italic; font-weight: 300; line-height: 1.45;
    transition: transform 0.18s ease;
  }
  .ins-pill:hover { transform: translateX(3px); }
  .ins-pill i { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .ins-pill-num {
    font-size: 20px; font-weight: 200; flex-shrink: 0;
    align-self: center; letter-spacing: -0.5px;
  }

  /* ── today vs avg ───────────────────────────────────────────── */
  .ins-compare-num {
    font-family: 'Fraunces', serif;
    font-size: clamp(32px, 5vw, 42px);
    font-weight: 200; line-height: 1;
    letter-spacing: -1px;
  }
  .ins-compare-tag {
    padding: 9px 12px; border-radius: 12px;
    font-size: 12px; font-family: 'Fraunces', serif;
    font-style: italic; font-weight: 300; line-height: 1.35;
  }

  /* ── grid ───────────────────────────────────────────────────── */
  .ins-two   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .ins-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

  /* ── empty ──────────────────────────────────────────────────── */
  .ins-empty {
    text-align: center; padding: 32px 16px;
    color: var(--ink3); font-size: 12px;
    font-family: 'Fraunces', serif; font-style: italic;
  }
  .ins-empty i { font-size: 30px; display: block; margin-bottom: 10px; opacity: 0.3; }

  /* ── footer ─────────────────────────────────────────────────── */
  .ins-footer {
    background: linear-gradient(135deg, rgba(253,232,238,0.7) 0%, rgba(237,229,248,0.7) 100%);
    border: 1px solid rgba(212,96,122,0.13);
    border-radius: 24px;
    padding: 22px 26px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 14px;
    margin-top: 22px;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(4px);
  }
  .ins-footer-lbl {
    font-size: 9px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: var(--ink3); margin-bottom: 5px;
  }
  .ins-footer-msg {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 16px; font-weight: 200; color: var(--ink2);
    line-height: 1.3;
  }
  .ins-footer-icons { display: flex; align-items: center; gap: 8px; }
  .ins-footer-icons i { font-size: 22px; color: var(--blush2); opacity: 0.7; }

  /* ── loading ────────────────────────────────────────────────── */
  .ins-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 80px 16px; gap: 14px;
  }
  .ins-loading-ring {
    width: 40px; height: 40px; border-radius: 50%;
    border: 2px solid var(--rose-dim);
    border-top-color: var(--rose);
    animation: spin 0.9s linear infinite;
  }
  .ins-loading-text {
    font-family: 'Fraunces', serif; font-style: italic;
    color: var(--ink3); font-size: 14px; font-weight: 300;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── responsive ─────────────────────────────────────────────── */
  @media (max-width: 820px) {
    .ins-stats { grid-template-columns: repeat(2, 1fr); }
    .ins-two   { grid-template-columns: 1fr; }
    .ins-three { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 480px) {
    .ins { padding-left: 14px; padding-right: 14px; }
    .ins-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .ins-three { grid-template-columns: 1fr; }
    .ins-range-btn { padding: 6px 13px; font-size: 11px; }
  }
`

// ── motion variants ──────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: [0.22, 0.68, 0, 1.2] as [number, number, number, number] },
})

// ── component ────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const supabase = createClient()

  const [sessions, setSessions] = useState<StudySession[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [notes,    setNotes]    = useState<Note[]>([])
  const [range,    setRange]    = useState('30d')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: s }, { data: t }, { data: n }] = await Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('study_tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('study_notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setSessions(s || [])
    setTasks(t || [])
    setNotes(n || [])
    setLoading(false)
  }

  // ── derived ──
  const startDate        = getStartDate(range)
  const filteredSessions = sessions.filter(s => s.date >= startDate)
  const todayIso         = new Date().toISOString().slice(0, 10)
  const totalMins        = filteredSessions.reduce((a, s) => a + s.duration_mins, 0)
  const todayMins        = sessions.filter(s => s.date === todayIso).reduce((a, s) => a + s.duration_mins, 0)
  const doneTasks        = tasks.filter(t => t.status === 'done').length
  const sessionCount     = filteredSessions.length
  const uniqueDays       = new Set(filteredSessions.map(s => s.date)).size
  const avgMinsPerDay    = sessionCount > 0 ? Math.round(totalMins / Math.max(1, uniqueDays)) : 0

  // streak
  let streak = 0
  const sd = new Date()
  while (sessions.some(s => s.date === sd.toISOString().slice(0, 10))) {
    streak++; sd.setDate(sd.getDate() - 1)
  }

  // best day
  const dayTotals: Record<string, number> = {}
  filteredSessions.forEach(s => { dayTotals[s.date] = (dayTotals[s.date] || 0) + s.duration_mins })
  const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]
  const bestDayLabel = bestDay
    ? new Date(bestDay[0] + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—'

  // subjects
  const subjectTotals = SUBJECTS.map(subj => ({
    subj,
    mins: filteredSessions.filter(s => s.subject === subj.id).reduce((a, s) => a + s.duration_mins, 0),
  })).filter(x => x.mins > 0).sort((a, b) => b.mins - a.mins)
  const maxSubjMins = subjectTotals[0]?.mins || 1
  const topSubject  = subjectTotals[0]?.subj

  // weekly
  const last7       = getLast7Days()
  const weekData    = last7.map(date => ({
    date,
    label: dayLabel(date),
    mins: sessions.filter(s => s.date === date).reduce((a, s) => a + s.duration_mins, 0),
  }))
  const maxWeekMins = Math.max(...weekData.map(d => d.mins), 1)

  // notes by subject
  const notesBySubj = SUBJECTS.map(subj => ({
    subj,
    count: notes.filter(n => n.subject === subj.id).length,
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count)

  // stat cards
  const statCards = [
    {
      label: 'study time', value: fmtMins(totalMins),
      sub: RANGE_OPTS.find(r => r.key === range)?.label.toLowerCase() ?? 'all time',
      c: '#d4607a', bg: 'linear-gradient(135deg,#fff9fb 0%,#fde8ee 100%)',
      border: 'rgba(212,96,122,0.14)', orb: 'rgba(232,160,176,0.28)', accent: 'rgba(212,96,122,0.3)',
      icon: 'ti-clock',
    },
    {
      label: 'sessions', value: String(sessionCount),
      sub: `avg ${fmtMins(avgMinsPerDay)} / day`,
      c: '#8b6ec4', bg: 'linear-gradient(135deg,#fdf8ff 0%,#ede5f8 100%)',
      border: 'rgba(139,110,196,0.18)', orb: 'rgba(201,184,232,0.28)', accent: 'rgba(139,110,196,0.3)',
      icon: 'ti-flame',
    },
    {
      label: 'tasks done', value: `${doneTasks}/${tasks.length}`,
      sub: `${tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0}% complete`,
      c: '#4d9160', bg: 'linear-gradient(135deg,#f8fcf8 0%,#daeadc 100%)',
      border: 'rgba(77,145,96,0.18)', orb: 'rgba(168,201,174,0.28)', accent: 'rgba(77,145,96,0.3)',
      icon: 'ti-checks',
    },
    {
      label: 'day streak', value: `${streak}`,
      sub: streak > 0 ? 'keep it going 🌿' : 'start today',
      c: '#a67c00', bg: 'linear-gradient(135deg,#fffdf5 0%,#fef3c7 100%)',
      border: 'rgba(166,124,0,0.2)', orb: 'rgba(245,221,180,0.35)', accent: 'rgba(166,124,0,0.3)',
      icon: 'ti-trophy',
    },
  ]

  // reflections
  type Reflection = { icon: string; text: string; bg: string; border: string; iconC: string; textC: string; num?: string }
  const reflections: Reflection[] = []
  if (topSubject) reflections.push({
    icon: topSubject.icon, num: undefined,
    text: `you spend the most time on ${topSubject.label} — your dedication is showing`,
    bg: topSubject.bg, border: topSubject.border, iconC: topSubject.c, textC: topSubject.c,
  })
  if (streak >= 3) reflections.push({
    icon: 'ti-flame', num: `${streak}`,
    text: 'days in a row — your consistency is blooming beautifully',
    bg: 'rgba(166,124,0,0.05)', border: 'rgba(166,124,0,0.18)', iconC: '#a67c00', textC: '#a67c00',
  })
  if (bestDay) reflections.push({
    icon: 'ti-star', num: undefined,
    text: `your best day was ${bestDayLabel} with ${fmtMins(bestDay[1])} — incredible focus`,
    bg: 'rgba(212,96,122,0.05)', border: 'rgba(212,96,122,0.18)', iconC: 'var(--rose)', textC: 'var(--rose)',
  })
  if (doneTasks === tasks.length && tasks.length > 0) reflections.push({
    icon: 'ti-circle-check', num: `${tasks.length}`,
    text: 'tasks complete — you are absolutely on fire',
    bg: 'rgba(77,145,96,0.05)', border: 'rgba(77,145,96,0.2)', iconC: '#4d9160', textC: '#4d9160',
  })
  if (notes.length > 0) reflections.push({
    icon: 'ti-notebook', num: `${notes.length}`,
    text: 'notes saved — building a beautiful knowledge garden',
    bg: 'rgba(139,110,196,0.05)', border: 'rgba(139,110,196,0.2)', iconC: 'var(--purple)', textC: 'var(--purple)',
  })

  return (
    <>
      <style>{css}</style>
      <div className="ins">

        {/* ── Header ── */}
        <motion.div className="ins-header" {...fadeUp(0)}>
          <div>
            <p className="ins-eyebrow">
              <span className="ins-eyebrow-dot" />
              <i className="ti ti-chart-bar" style={{ fontSize: 12, color: 'var(--blush2)' }} />
              analytics
            </p>
            <h1 className="ins-h1">
              your <span className="accent">insights</span><br />
              & <span className="accent2">growth</span>
            </h1>
            <span className="ins-vibe">
              <i className="ti ti-sparkles" />
              data with a soft heart
            </span>
          </div>
          <InsightsClock />
        </motion.div>

        {/* ── Range tabs ── */}
        <motion.div className="ins-range" {...fadeUp(0.06)}>
          {RANGE_OPTS.map(r => (
            <button
              key={r.key}
              className={`ins-range-btn ${range === r.key ? 'active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="ins-loading">
            <div className="ins-loading-ring" />
            <span className="ins-loading-text">gathering your data…</span>
          </div>
        ) : (
          <>
            {/* ── Stat cards ── */}
            <InsDivider label="at a glance" />
            <div className="ins-stats">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="ins-stat"
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    boxShadow: 'var(--shadow-sm)',
                    ['--orb' as string]: s.orb,
                    ['--accent-line' as string]: s.accent,
                  }}
                  {...fadeUp(0.07 * i)}
                >
                  <i className={`ti ${s.icon} ins-stat-ico`} style={{ color: s.c }} />
                  <div className="ins-stat-val" style={{ color: s.c }}>{s.value}</div>
                  <div className="ins-stat-lbl" style={{ color: s.c }}>{s.label}</div>
                  <div className="ins-stat-sub">{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* ── Weekly activity ── */}
            <InsDivider label="weekly activity" />
            <motion.div className="ins-card" style={{ marginBottom: 14 }} {...fadeUp(0.12)}>
              <p className="ins-card-lbl"><i className="ti ti-calendar-week" />last 7 days</p>
              {weekData.every(d => d.mins === 0) ? (
                <div className="ins-empty"><i className="ti ti-calendar" />no sessions in the last 7 days</div>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', paddingBottom: 4 }}>
                  {weekData.map((day, i) => {
                    const isToday = day.date === todayIso
                    const barH    = Math.round((day.mins / maxWeekMins) * 90)
                    return (
                      <div key={day.date} className="ins-week-col">
                        <div className="ins-week-val" style={{ color: isToday ? 'var(--rose)' : undefined, fontWeight: isToday ? 600 : undefined }}>
                          {day.mins > 0 ? fmtMins(day.mins) : ''}
                        </div>
                        <div className="ins-week-bar-wrap">
                          <motion.div
                            className="ins-week-bar"
                            style={{
                              background: isToday
                                ? 'linear-gradient(180deg,var(--rose) 0%,rgba(212,96,122,0.5) 100%)'
                                : 'linear-gradient(180deg,var(--blush) 0%,rgba(242,196,206,0.4) 100%)',
                              height: 0,
                              boxShadow: isToday ? '0 -2px 8px rgba(212,96,122,0.3)' : undefined,
                            }}
                            animate={{ height: `${barH}px` }}
                            transition={{ delay: 0.05 * i, duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
                          />
                        </div>
                        <div className="ins-week-day" style={{ color: isToday ? 'var(--rose)' : undefined }}>
                          {day.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* ── Breakdown ── */}
            <InsDivider label="breakdown" />
            <div className="ins-two" style={{ marginBottom: 14 }}>

              {/* Subject time */}
              <motion.div className="ins-card" {...fadeUp(0.16)}>
                <p className="ins-card-lbl"><i className="ti ti-chart-bar" />time by subject</p>
                {subjectTotals.length === 0 ? (
                  <div className="ins-empty"><i className="ti ti-hourglass" />complete sessions to see breakdown</div>
                ) : (
                  <div>
                    {subjectTotals.map(({ subj, mins }, i) => (
                      <div
                        key={subj.id}
                        className="ins-subj-row"
                        style={{ background: subj.bg, border: `1px solid ${subj.border}` }}
                      >
                        <i className={`ti ${subj.icon}`} style={{ fontSize: 13, color: subj.c, flexShrink: 0 }} />
                        <span className="ins-subj-label">{subj.label}</span>
                        <div style={{ flex: 2, marginInline: '8px' }}>
                          <div className="ins-bar-track">
                            <motion.div
                              className="ins-bar-fill"
                              style={{ background: `linear-gradient(90deg,${subj.c},${subj.dotC})`, width: 0 }}
                              animate={{ width: `${Math.round((mins / maxSubjMins) * 100)}%` }}
                              transition={{ delay: 0.05 * i, duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        <span className="ins-subj-time">{fmtMins(mins)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Task status */}
              <motion.div className="ins-card" {...fadeUp(0.19)}>
                <p className="ins-card-lbl"><i className="ti ti-circle-check" />task status</p>
                {tasks.length === 0 ? (
                  <div className="ins-empty"><i className="ti ti-list" />no tasks yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {STATUS_OPTS.map(s => {
                      const count = tasks.filter(t => t.status === s.key).length
                      const pct   = tasks.length ? Math.round((count / tasks.length) * 100) : 0
                      return (
                        <div key={s.key}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                            <i className={`ti ${s.icon}`} style={{ fontSize: 12, color: s.c }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{s.label}</span>
                            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontWeight: 500 }}>{count}</span>
                          </div>
                          <div className="ins-bar-track">
                            <motion.div
                              className="ins-bar-fill"
                              style={{ background: s.c, width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )
                    })}

                    <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid rgba(212,96,122,0.09)' }}>
                      <p style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="ti ti-flag" style={{ fontSize: 11, color: 'var(--rose)' }} />by priority
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {PRIORITY.map(p => {
                          const count = tasks.filter(t => t.priority === p.key).length
                          const pct   = tasks.length ? Math.round((count / tasks.length) * 100) : 0
                          return (
                            <div key={p.key} className="ins-bar-row">
                              <span className="ins-bar-lbl" style={{ color: p.c }}>{p.label}</span>
                              <div className="ins-bar-track">
                                <motion.div
                                  className="ins-bar-fill"
                                  style={{ background: p.c, width: 0, opacity: 0.8 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.7 }}
                                />
                              </div>
                              <span className="ins-bar-val">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Deep look ── */}
            <InsDivider label="deep look" />
            <div className="ins-three" style={{ marginBottom: 14 }}>

              {/* Streak */}
              <motion.div className="ins-card" {...fadeUp(0.22)}>
                <p className="ins-card-lbl"><i className="ti ti-flame" />study streak</p>
                <div style={{ textAlign: 'center', paddingTop: 6 }}>
                  <div className="ins-streak-big">{streak}</div>
                  <div className="ins-streak-sub">day{streak !== 1 ? 's' : ''} in a row</div>
                  <p style={{ marginTop: 10, fontSize: 12, fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontWeight: 300, color: streak > 0 ? '#4d9160' : 'var(--ink3)' }}>
                    {streak === 0 ? 'study today to begin ✨' : streak >= 7 ? 'one full week! incredible 🔥' : "you're on a roll! 🌱"}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                    {last7.map(date => {
                      const has = sessions.some(s => s.date === date)
                      const isToday = date === todayIso
                      return (
                        <div
                          key={date}
                          className="ins-heat-cell"
                          title={date}
                          style={{
                            background: has ? '#a67c00' : 'rgba(166,124,0,0.09)',
                            boxShadow: isToday && has ? '0 0 6px rgba(166,124,0,0.4)' : undefined,
                            outline: isToday ? '2px solid rgba(166,124,0,0.35)' : undefined,
                            outlineOffset: '1px',
                          }}
                        />
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 5, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>last 7 days</div>
                </div>
              </motion.div>

              {/* Notes by subject */}
              <motion.div className="ins-card" {...fadeUp(0.26)}>
                <p className="ins-card-lbl"><i className="ti ti-notebook" />notes saved</p>
                {notesBySubj.length === 0 ? (
                  <div className="ins-empty"><i className="ti ti-books" />no notes yet</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {notesBySubj.map(({ subj, count }) => (
                        <div
                          key={subj.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 11px', borderRadius: '12px', background: subj.bg, border: `1px solid ${subj.border}` }}
                        >
                          <i className={`ti ${subj.icon}`} style={{ color: subj.c, fontSize: 13 }} />
                          <span style={{ fontSize: 12, fontWeight: 500, color: subj.c, flex: 1 }}>{subj.label}</span>
                          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 19, fontWeight: 200, color: subj.c }}>{count}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, textAlign: 'right', fontFamily: 'Fraunces,serif', fontSize: 12, fontStyle: 'italic', fontWeight: 300, color: 'var(--ink3)' }}>
                      {notes.length} total note{notes.length !== 1 ? 's' : ''}
                    </div>
                  </>
                )}
              </motion.div>

              {/* Today vs average */}
              <motion.div className="ins-card" {...fadeUp(0.30)}>
                <p className="ins-card-lbl"><i className="ti ti-trending-up" />today vs average</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: 2 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>today</div>
                    <div className="ins-compare-num" style={{ color: 'var(--rose)' }}>{fmtMins(todayMins)}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 4 }}>
                      {sessions.filter(s => s.date === todayIso).length} session{sessions.filter(s => s.date === todayIso).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(212,96,122,0.09)' }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>daily average</div>
                    <div className="ins-compare-num" style={{ color: 'var(--purple)' }}>{fmtMins(avgMinsPerDay)}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 4 }}>over selected period</div>
                  </div>
                  <div
                    className="ins-compare-tag"
                    style={{
                      background: todayMins >= avgMinsPerDay ? 'rgba(77,145,96,0.07)' : 'rgba(212,96,122,0.06)',
                      border: `1px solid ${todayMins >= avgMinsPerDay ? 'rgba(77,145,96,0.2)' : 'rgba(212,96,122,0.16)'}`,
                      color: todayMins >= avgMinsPerDay ? '#4d9160' : 'var(--rose)',
                    }}
                  >
                    {todayMins === 0
                      ? 'nothing yet today — you can do it 🌸'
                      : todayMins >= avgMinsPerDay
                      ? 'above average today! 🌿'
                      : 'a little below average today'}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Gentle reflections ── */}
            {reflections.length > 0 && (
              <>
                <InsDivider label="gentle reflections" />
                <motion.div {...fadeUp(0.34)}>
                  {reflections.map((r, i) => (
                    <div
                      key={i}
                      className="ins-pill"
                      style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.textC }}
                    >
                      <i className={`ti ${r.icon}`} style={{ color: r.iconC, marginTop: 2 }} />
                      {r.num && (
                        <span className="ins-pill-num" style={{ color: r.iconC }}>{r.num}</span>
                      )}
                      <span>{r.text}</span>
                    </div>
                  ))}
                </motion.div>
              </>
            )}

            {/* ── Footer ── */}
            <motion.div className="ins-footer" {...fadeUp(0.5)}>
              <div>
                <p className="ins-footer-lbl">your growth story</p>
                <p className="ins-footer-msg">
                  {totalMins > 0
                    ? `${fmtMins(totalMins)} of beautiful, intentional study.`
                    : 'every session you log is a petal that blooms.'}
                </p>
              </div>
              <div className="ins-footer-icons">
                <i className="ti ti-chart-bar" />
                <i className="ti ti-sparkles" />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </>
  )
}

// ── sub-components ───────────────────────────────────────────────────────────

function InsDivider({ label }: { label: string }) {
  return (
    <div className="ins-divider">
      <div className="ins-divider-line" />
      <i className="ti ti-circle ins-divider-ico" />
      <span className="ins-divider-label">{label}</span>
      <i className="ti ti-circle ins-divider-ico" />
      <div className="ins-divider-line" />
    </div>
  )
}

function InsightsClock() {
  const [time,    setTime]    = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDateStr(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="ins-clock"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.22, duration: 0.4 }}
    >
      <p className="ins-clock-val">{time}</p>
      <p className="ins-clock-sub">IST</p>
      <p className="ins-clock-date">{dateStr}</p>
    </motion.div>
  )
}