'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── constants (mirror study page exactly) ────────────────────────────────────

const SUBJECTS = [
  { id: 'math',     label: 'Maths',    icon: 'ti-math-function', c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.18)',  dotC: '#e8a0b0' },
  { id: 'science',  label: 'Science',  icon: 'ti-flask',         c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.35)', dotC: '#a8c9ae' },
  { id: 'language', label: 'Language', icon: 'ti-language',      c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)',  dotC: '#c9b8e8' },
  { id: 'history',  label: 'History',  icon: 'ti-timeline',      c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)',  dotC: '#f5ddb4' },
  { id: 'coding',   label: 'Coding',   icon: 'ti-code',          c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.35)', dotC: '#a8c9ae' },
  { id: 'arts',     label: 'Arts',     icon: 'ti-palette',       c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.18)',  dotC: '#e8a0b0' },
  { id: 'music',    label: 'Music',    icon: 'ti-music',         c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)',  dotC: '#c9b8e8' },
  { id: 'other',    label: 'Other',    icon: 'ti-book',          c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)',  dotC: '#f5ddb4' },
]

const STATUS_OPTS = [
  { key: 'pending',     label: 'To Do',       icon: 'ti-circle',       c: '#b09aa4' },
  { key: 'in_progress', label: 'In Progress', icon: 'ti-loader-2',     c: '#b8860b' },
  { key: 'done',        label: 'Done',        icon: 'ti-circle-check', c: '#5a8c63' },
  { key: 'review',      label: 'Review',      icon: 'ti-refresh',      c: '#9b7ec8' },
]

const PRIORITY = [
  { key: 'low',    label: 'Low',    c: '#5a8c63', bg: 'rgba(90,140,99,0.1)'  },
  { key: 'medium', label: 'Medium', c: '#b8860b', bg: 'rgba(184,134,11,0.1)' },
  { key: 'high',   label: 'High',   c: '#d4607a', bg: 'rgba(212,96,122,0.1)' },
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

function getSubject(id: string) {
  return SUBJECTS.find(s => s.id === id) || SUBJECTS[7]
}
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
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}
function dayLabel(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ins {
    --rose:#d4607a; --petal:#fde8ee; --blush:#f2c4ce; --blush2:#e8a0b0;
    --lav:#e8daf5; --lav2:#c9b8e8; --purple:#9b7ec8;
    --cream:#fdf7f0; --ink:#3d2a35; --ink2:#7a5c68; --ink3:#b09aa4; --card:#fff9fb;
    --sage:#d4e8d8; --sage2:#a8c9ae;
    font-family: 'DM Sans', sans-serif;
    background: var(--cream); color: var(--ink);
    min-height: 100vh;
    padding: clamp(16px,3vw,32px) clamp(16px,3vw,32px) 48px;
    width: 100%; overflow-x: hidden;
  }

  /* header */
  .ins-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:16px; flex-wrap:wrap; }
  .ins-eyebrow { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--ink3); margin-bottom:8px; display:flex; align-items:center; gap:7px; }
  .ins-h1 { font-family:'Fraunces',serif; font-size:clamp(28px,5.5vw,44px); font-weight:300; font-style:italic; letter-spacing:-1px; line-height:1.05; margin-bottom:12px; }
  .ins-h1 .accent { color:var(--rose); }
  .ins-vibe { display:inline-flex; align-items:center; gap:8px; background:var(--petal); border:1px solid rgba(212,96,122,0.18); border-radius:999px; padding:6px 16px; font-size:12px; color:var(--rose); font-family:'Fraunces',serif; font-style:italic; }

  /* clock */
  .ins-clock { background:var(--lav); border:1px solid rgba(201,184,232,0.5); border-radius:18px; padding:14px 18px; text-align:right; flex-shrink:0; }
  .ins-clock-val { font-family:'Fraunces',serif; font-size:clamp(18px,3vw,26px); font-weight:300; color:var(--ink); letter-spacing:-0.5px; line-height:1; }
  .ins-clock-sub { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--ink3); margin-top:4px; }

  /* divider */
  .ins-divider { display:flex; align-items:center; gap:10px; margin:16px 0; }
  .ins-divider-line { flex:1; height:1px; background:rgba(212,96,122,0.12); }
  .ins-divider-label { font-size:9px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:var(--ink3); white-space:nowrap; }
  .ins-divider-ico { font-size:11px; color:var(--blush2); }

  /* range tabs */
  .ins-range { display:flex; gap:6px; margin-bottom:20px; flex-wrap:wrap; }
  .ins-range-btn { padding:6px 15px; border-radius:999px; font-size:11px; font-weight:600; border:1px solid rgba(212,96,122,0.18); background:var(--card); color:var(--ink3); cursor:pointer; transition:all 0.15s ease; font-family:'DM Sans',sans-serif; }
  .ins-range-btn.active { background:var(--rose); color:#fff; border-color:var(--rose); }
  .ins-range-btn:hover:not(.active) { background:var(--petal); color:var(--rose); }

  /* stat cards */
  .ins-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
  .ins-stat { border-radius:20px; padding:16px; position:relative; overflow:hidden; transition:transform 0.2s; }
  .ins-stat:hover { transform:translateY(-3px); }
  .ins-stat::after { content:''; position:absolute; bottom:-18px; right:-18px; width:56px; height:56px; border-radius:50%; opacity:0.22; pointer-events:none; background:var(--dot-c,#f2c4ce); }
  .ins-stat-ico { font-size:16px; opacity:0.45; margin-bottom:8px; }
  .ins-stat-val { font-family:'Fraunces',serif; font-size:clamp(22px,3.5vw,30px); font-weight:300; letter-spacing:-0.5px; line-height:1; margin-bottom:4px; }
  .ins-stat-lbl { font-size:9px; font-weight:500; letter-spacing:2px; text-transform:uppercase; opacity:0.55; }
  .ins-stat-sub { font-size:10px; margin-top:4px; opacity:0.6; }

  /* section card */
  .ins-card { background:var(--card); border:1px solid rgba(212,96,122,0.12); border-radius:22px; padding:clamp(16px,2vw,22px); }
  .ins-card-lbl { font-size:9px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:var(--ink3); margin-bottom:14px; display:flex; align-items:center; gap:6px; }
  .ins-card-lbl i { font-size:12px; color:var(--rose); }

  /* bar chart rows */
  .ins-bar-row { display:flex; align-items:center; gap:10px; }
  .ins-bar-lbl { font-size:10px; color:var(--ink2); width:58px; flex-shrink:0; text-align:right; font-weight:500; }
  .ins-bar-track { flex:1; height:8px; border-radius:999px; background:rgba(212,96,122,0.07); overflow:hidden; }
  .ins-bar-fill { height:100%; border-radius:999px; }
  .ins-bar-val { font-size:10px; color:var(--ink3); width:32px; flex-shrink:0; }

  /* weekly chart */
  .ins-week-col { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
  .ins-week-bar-wrap { display:flex; align-items:flex-end; height:80px; width:100%; justify-content:center; }
  .ins-week-bar { width:clamp(18px,60%,32px); border-radius:6px 6px 0 0; transition:height 0.8s cubic-bezier(.22,.68,0,1.2); }
  .ins-week-day { font-size:9px; color:var(--ink3); font-weight:500; text-transform:uppercase; letter-spacing:1px; }
  .ins-week-val { font-size:9px; color:var(--ink3); }

  /* mood scatter */
  .ins-mood-row { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:12px; background:rgba(253,247,240,0.7); border:1px solid rgba(212,96,122,0.08); }
  .ins-mood-ico { font-size:20px; flex-shrink:0; }
  .ins-mood-lbl { font-size:11px; font-weight:600; color:var(--ink); flex:1; }
  .ins-mood-sub { font-size:10px; color:var(--ink3); }
  .ins-mood-cnt { font-family:'Fraunces',serif; font-size:20px; font-weight:300; color:var(--rose); flex-shrink:0; }

  /* habit heat */
  .ins-heat-grid { display:flex; gap:3px; flex-wrap:wrap; }
  .ins-heat-cell { width:12px; height:12px; border-radius:3px; }

  /* streak */
  .ins-streak-big { font-family:'Fraunces',serif; font-size:clamp(52px,10vw,72px); font-weight:300; color:#b8860b; line-height:1; }
  .ins-streak-sub { font-size:9px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:var(--ink3); margin-top:6px; }

  /* reflection pills */
  .ins-pill { display:flex; align-items:flex-start; gap:9px; padding:11px 14px; border-radius:16px; margin-bottom:8px; font-size:12px; font-family:'Fraunces',serif; font-style:italic; line-height:1.4; }
  .ins-pill i { font-size:14px; flex-shrink:0; margin-top:1px; }

  /* grid layouts */
  .ins-two { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .ins-three { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }

  /* empty */
  .ins-empty { text-align:center; padding:28px 16px; color:var(--ink3); font-size:13px; font-style:italic; }
  .ins-empty i { font-size:28px; display:block; margin-bottom:10px; opacity:0.35; }

  /* footer */
  .ins-footer { background:linear-gradient(135deg,var(--petal) 0%,var(--lav) 100%); border:1px solid rgba(212,96,122,0.14); border-radius:20px; padding:18px 22px; display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:20px; }
  .ins-footer-lbl { font-size:9px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:var(--ink3); margin-bottom:4px; }
  .ins-footer-msg { font-family:'Fraunces',serif; font-style:italic; font-size:15px; font-weight:300; color:var(--ink2); }
  .ins-footer-ico { font-size:20px; color:var(--blush2); }

  @keyframes spin { to { transform:rotate(360deg); } }
  .spinning { animation:spin 0.9s linear infinite; display:inline-block; }

  @media (max-width:768px) {
    .ins-stats { grid-template-columns:repeat(2,1fr); }
    .ins-two   { grid-template-columns:1fr; }
    .ins-three { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:420px) {
    .ins { padding-left:14px; padding-right:14px; }
    .ins-three { grid-template-columns:1fr; }
  }
`

// ── main component ───────────────────────────────────────────────────────────

export default function InsightsPage() {
  const supabase = createClient()

  const [sessions, setSessions] = useState<StudySession[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [notes,    setNotes]    = useState<Note[]>([])
  const [range,    setRange]    = useState('30d')
  const [loading,  setLoading]  = useState(true)
  const [dateStr,  setDateStr]  = useState('')

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))
    fetchAll()
  }, [])

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

  // ── filter sessions by selected range ──
  const startDate = getStartDate(range)
  const filteredSessions = sessions.filter(s => s.date >= startDate)

  // ── derived stats ──
  const todayIso       = new Date().toISOString().slice(0, 10)
  const totalMins      = filteredSessions.reduce((a, s) => a + s.duration_mins, 0)
  const todayMins      = sessions.filter(s => s.date === todayIso).reduce((a, s) => a + s.duration_mins, 0)
  const doneTasks      = tasks.filter(t => t.status === 'done').length
  const sessionCount   = filteredSessions.length
  const avgMinsPerDay  = sessionCount > 0 ? Math.round(totalMins / Math.max(1, new Set(filteredSessions.map(s => s.date)).size)) : 0

  // ── streak ──
  let streak = 0
  const d = new Date()
  while (sessions.some(s => s.date === d.toISOString().slice(0, 10))) {
    streak++; d.setDate(d.getDate() - 1)
  }

  // ── best day ──
  const dayTotals: Record<string, number> = {}
  filteredSessions.forEach(s => {
    dayTotals[s.date] = (dayTotals[s.date] || 0) + s.duration_mins
  })
  const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]
  const bestDayLabel = bestDay
    ? new Date(bestDay[0] + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—'

  // ── subject breakdown ──
  const subjectTotals = SUBJECTS.map(subj => ({
    subj,
    mins: filteredSessions.filter(s => s.subject === subj.id).reduce((a, s) => a + s.duration_mins, 0),
  })).filter(x => x.mins > 0).sort((a, b) => b.mins - a.mins)
  const maxSubjMins = subjectTotals[0]?.mins || 1

  // ── top subject ──
  const topSubject = subjectTotals[0]?.subj

  // ── weekly chart: last 7 days of ALL sessions ──
  const last7 = getLast7Days()
  const weekData = last7.map(date => ({
    date,
    label: dayLabel(date),
    mins: sessions.filter(s => s.date === date).reduce((a, s) => a + s.duration_mins, 0),
  }))
  const maxWeekMins = Math.max(...weekData.map(d => d.mins), 1)

  // ── task priority breakdown ──
  const priorityData = PRIORITY.map(p => ({
    p,
    count: tasks.filter(t => t.priority === p.key).length,
  })).filter(x => x.count > 0)
  const maxPriCount = Math.max(...priorityData.map(x => x.count), 1)

  // ── notes by subject ──
  const notesBySubj = SUBJECTS.map(subj => ({
    subj,
    count: notes.filter(n => n.subject === subj.id).length,
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count)

  // ── stat cards ──
  const statCards = [
    {
      label: 'study time',
      value: fmtMins(totalMins),
      sub: `${range === 'all' ? 'all time' : RANGE_OPTS.find(r => r.key === range)?.label.toLowerCase()}`,
      c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.12)', dotC: '#e8a0b0', icon: 'ti-clock',
    },
    {
      label: 'sessions',
      value: String(sessionCount),
      sub: `avg ${fmtMins(avgMinsPerDay)} / day`,
      c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.25)', dotC: '#c9b8e8', icon: 'ti-flame',
    },
    {
      label: 'tasks done',
      value: `${doneTasks}/${tasks.length}`,
      sub: `${tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0}% complete`,
      c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.3)', dotC: '#a8c9ae', icon: 'ti-checks',
    },
    {
      label: 'day streak',
      value: `${streak}d`,
      sub: streak > 0 ? 'keep going! 🌿' : 'start today',
      c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)', dotC: '#f5ddb4', icon: 'ti-trophy',
    },
  ]

  // ── reflections ──
  const reflections: { icon: string; text: string; bg: string; border: string; iconC: string; textC: string }[] = []
  if (topSubject) reflections.push({
    icon: topSubject.icon,
    text: `you spend the most time on ${topSubject.label} — your dedication shows`,
    bg: topSubject.bg, border: topSubject.border, iconC: topSubject.c, textC: topSubject.c,
  })
  if (streak >= 3) reflections.push({
    icon: 'ti-flame',
    text: `${streak} days in a row — your consistency is blooming beautifully`,
    bg: '#fffdf5', border: 'rgba(245,221,180,0.35)', iconC: '#b8860b', textC: '#b8860b',
  })
  if (bestDay) reflections.push({
    icon: 'ti-star',
    text: `your best study day was ${bestDayLabel} with ${fmtMins(bestDay[1])} — incredible focus`,
    bg: 'var(--petal)', border: 'rgba(212,96,122,0.18)', iconC: 'var(--rose)', textC: 'var(--rose)',
  })
  if (doneTasks === tasks.length && tasks.length > 0) reflections.push({
    icon: 'ti-circle-check',
    text: `all ${tasks.length} tasks complete — you are absolutely blooming`,
    bg: '#f8fcf8', border: 'rgba(168,201,174,0.3)', iconC: '#5a8c63', textC: '#5a8c63',
  })
  if (notes.length > 0) reflections.push({
    icon: 'ti-notebook',
    text: `${notes.length} notes saved — you're building a beautiful knowledge garden`,
    bg: 'var(--lav)', border: 'rgba(201,184,232,0.3)', iconC: 'var(--purple)', textC: 'var(--purple)',
  })

  return (
    <>
      <style>{css}</style>
      <div className="ins">

        {/* Header */}
        <motion.div className="ins-header"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44 }}>
          <div>
            <p className="ins-eyebrow">
              <i className="ti ti-chart-bar" style={{ color: '#e8a0b0', fontSize: 13 }} />
              {dateStr}
            </p>
            <h1 className="ins-h1">your <span className="accent">insights</span><br />& growth</h1>
            <span className="ins-vibe">
              <i className="ti ti-sparkles" style={{ fontSize: 12, color: '#e8a0b0' }} />
              data with a soft heart
            </span>
          </div>
          <InsightsClock />
        </motion.div>

        {/* Range selector */}
        <div className="ins-range">
          {RANGE_OPTS.map(r => (
            <button key={r.key}
              className={`ins-range-btn ${range === r.key ? 'active' : ''}`}
              onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <i className="ti ti-loader-2 spinning" style={{ fontSize: 28, color: 'var(--rose)' }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <InsDivider label="at a glance" />
            <div className="ins-stats">
              {statCards.map((s, i) => (
                <motion.div key={s.label} className="ins-stat"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, ['--dot-c' as string]: s.dotC }}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i }}>
                  <i className={`ti ${s.icon} ins-stat-ico`} style={{ color: s.c }} />
                  <div className="ins-stat-val" style={{ color: s.c }}>{s.value}</div>
                  <div className="ins-stat-lbl" style={{ color: s.c }}>{s.label}</div>
                  <div className="ins-stat-sub">{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Weekly activity */}
            <InsDivider label="weekly activity" />
            <motion.div className="ins-card" style={{ marginBottom: 14 }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="ins-card-lbl"><i className="ti ti-calendar-week" /> last 7 days</p>
              {weekData.every(d => d.mins === 0) ? (
                <div className="ins-empty"><i className="ti ti-calendar" />no sessions in the last 7 days</div>
              ) : (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                  {weekData.map((day, i) => (
                    <div key={day.date} className="ins-week-col">
                      <div className="ins-week-val">{day.mins > 0 ? fmtMins(day.mins) : ''}</div>
                      <div className="ins-week-bar-wrap">
                        <motion.div className="ins-week-bar"
                          style={{ background: day.date === todayIso ? 'var(--rose)' : 'var(--blush)', height: 0 }}
                          animate={{ height: `${Math.round((day.mins / maxWeekMins) * 80)}px` }}
                          transition={{ delay: 0.05 * i, duration: 0.7, ease: [0.22, 0.68, 0, 1.2] }} />
                      </div>
                      <div className="ins-week-day" style={{ color: day.date === todayIso ? 'var(--rose)' : undefined }}>
                        {day.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Subject breakdown + Task status */}
            <InsDivider label="breakdown" />
            <div className="ins-two" style={{ marginBottom: 14 }}>

              {/* Study time by subject */}
              <motion.div className="ins-card"
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <p className="ins-card-lbl"><i className="ti ti-chart-bar" /> time by subject</p>
                {subjectTotals.length === 0 ? (
                  <div className="ins-empty"><i className="ti ti-hourglass" />complete sessions to see breakdown</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {subjectTotals.map(({ subj, mins }, i) => (
                      <div key={subj.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                          <i className={`ti ${subj.icon}`} style={{ fontSize: 12, color: subj.c }} />
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{subj.label}</span>
                          <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{fmtMins(mins)}</span>
                        </div>
                        <div className="ins-bar-track">
                          <motion.div className="ins-bar-fill"
                            style={{ background: `linear-gradient(90deg,${subj.c},${subj.dotC})`, width: 0 }}
                            animate={{ width: `${Math.round((mins / maxSubjMins) * 100)}%` }}
                            transition={{ delay: 0.05 * i, duration: 0.8, ease: 'easeOut' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Task status */}
              <motion.div className="ins-card"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
                <p className="ins-card-lbl"><i className="ti ti-circle-check" /> task status</p>
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
                            <i className={`ti ${s.icon}`} style={{ fontSize: 11, color: s.c }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{s.label}</span>
                            <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{count}</span>
                          </div>
                          <div className="ins-bar-track">
                            <motion.div className="ins-bar-fill"
                              style={{ background: s.c, width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }} />
                          </div>
                        </div>
                      )
                    })}
                    {/* priority mini */}
                    <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(212,96,122,0.1)' }}>
                      <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="ti ti-flag" style={{ fontSize: 11, color: 'var(--rose)' }} /> by priority
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {PRIORITY.map(p => {
                          const count = tasks.filter(t => t.priority === p.key).length
                          const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0
                          return (
                            <div key={p.key} className="ins-bar-row">
                              <span className="ins-bar-lbl" style={{ color: p.c }}>{p.label}</span>
                              <div className="ins-bar-track">
                                <motion.div className="ins-bar-fill"
                                  style={{ background: p.c, width: 0, opacity: 0.75 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.7 }} />
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

            {/* Streak + Notes + Top session */}
            <InsDivider label="deep look" />
            <div className="ins-three" style={{ marginBottom: 14 }}>

              {/* Streak card */}
              <motion.div className="ins-card"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="ins-card-lbl"><i className="ti ti-flame" /> study streak</p>
                <div style={{ textAlign: 'center', paddingTop: 8 }}>
                  <div className="ins-streak-big">{streak}</div>
                  <div className="ins-streak-sub">day streak</div>
                  {streak > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'Fraunces,serif', fontStyle: 'italic', color: '#5a8c63' }}>
                      you're on fire! 🔥
                    </div>
                  )}
                  {streak === 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'Fraunces,serif', fontStyle: 'italic', color: 'var(--ink3)' }}>
                      study today to begin
                    </div>
                  )}
                  {/* mini calendar dots */}
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                    {last7.map(date => {
                      const hasSession = sessions.some(s => s.date === date)
                      return (
                        <div key={date} className="ins-heat-cell"
                          style={{ background: hasSession ? '#b8860b' : 'rgba(184,134,11,0.1)' }} />
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 5, letterSpacing: '1px' }}>last 7 days</div>
                </div>
              </motion.div>

              {/* Notes by subject */}
              <motion.div className="ins-card"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <p className="ins-card-lbl"><i className="ti ti-notebook" /> notes saved</p>
                {notesBySubj.length === 0 ? (
                  <div className="ins-empty"><i className="ti ti-books" />no notes yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notesBySubj.map(({ subj, count }) => (
                      <div key={subj.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '11px', background: subj.bg, border: `1px solid ${subj.border}` }}>
                        <i className={`ti ${subj.icon}`} style={{ color: subj.c, fontSize: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: subj.c, flex: 1 }}>{subj.label}</span>
                        <span style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 300, color: subj.c }}>{count}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 4, textAlign: 'right', fontFamily: 'Fraunces,serif', fontSize: 12, fontStyle: 'italic', color: 'var(--ink3)' }}>
                      {notes.length} total note{notes.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Today vs average */}
              <motion.div className="ins-card"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                <p className="ins-card-lbl"><i className="ti ti-trending-up" /> today vs average</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: 4 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>today</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontSize: 34, fontWeight: 300, color: 'var(--rose)', lineHeight: 1 }}>{fmtMins(todayMins)}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 4 }}>{sessions.filter(s => s.date === todayIso).length} session{sessions.filter(s => s.date === todayIso).length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(212,96,122,0.1)' }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>daily average</div>
                    <div style={{ fontFamily: 'Fraunces,serif', fontSize: 34, fontWeight: 300, color: '#9b7ec8', lineHeight: 1 }}>{fmtMins(avgMinsPerDay)}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 4 }}>over selected period</div>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: '10px', background: todayMins >= avgMinsPerDay ? '#f8fcf8' : 'var(--petal)', border: `1px solid ${todayMins >= avgMinsPerDay ? 'rgba(168,201,174,0.3)' : 'rgba(212,96,122,0.18)'}` }}>
                    <span style={{ fontSize: 11, fontFamily: 'Fraunces,serif', fontStyle: 'italic', color: todayMins >= avgMinsPerDay ? '#5a8c63' : 'var(--rose)' }}>
                      {todayMins === 0 ? 'nothing yet today — you can do it 🌸' : todayMins >= avgMinsPerDay ? 'above average today! 🌿' : 'a little below average today'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Gentle reflections */}
            {reflections.length > 0 && (
              <>
                <InsDivider label="gentle reflections" />
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                  {reflections.map((r, i) => (
                    <div key={i} className="ins-pill"
                      style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.textC }}>
                      <i className={`ti ${r.icon}`} style={{ color: r.iconC }} />
                      {r.text}
                    </div>
                  ))}
                </motion.div>
              </>
            )}

            {/* Footer */}
            <motion.div className="ins-footer"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <div>
                <p className="ins-footer-lbl">your growth story</p>
                <p className="ins-footer-msg">
                  {totalMins > 0
                    ? `${fmtMins(totalMins)} of beautiful, intentional study.`
                    : 'every session you log is a petal that blooms.'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-chart-bar ins-footer-ico" />
                <i className="ti ti-sparkles ins-footer-ico" />
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
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <motion.div className="ins-clock"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
      <p className="ins-clock-val">{time}</p>
      <p className="ins-clock-sub">IST</p>
    </motion.div>
  )
}