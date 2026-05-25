'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ins {
    --blush: #f2c4ce; --blush2: #e8a0b0; --rose: #d4607a; --petal: #fde8ee;
    --lavender: #e8daf5; --lav2: #c9b8e8; --butter: #fef3e2; --butter2: #f5ddb4;
    --sage: #d4e8d8; --sage2: #a8c9ae; --cream: #fdf7f0;
    --ink: #3d2a35; --ink2: #7a5c68; --ink3: #b09aa4; --card: #fff9fb;
    font-family: 'DM Sans', sans-serif;
    background: var(--cream); color: var(--ink);
    min-height: 100vh; padding: clamp(20px,5vw,48px) clamp(20px,4vw,40px);
    overflow-x: hidden; width: 100%;
  }

  .ins-eyebrow { font-size: 10px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; }
  .ins-petal-ico { font-size: 13px; color: var(--blush2); }
  .ins-title { font-family: 'Fraunces', serif; font-size: clamp(28px,6vw,42px); font-weight: 300; font-style: italic; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 6px; }
  .ins-title .accent { color: var(--rose); }
  .ins-sub { font-size: 12px; color: var(--ink3); margin-bottom: 22px; }

  .tab-row { display: flex; gap: 6px; margin-bottom: 22px; overflow-x: auto; padding-bottom: 2px; }
  .tab-row::-webkit-scrollbar { display: none; }
  .tab { padding: 6px 16px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid rgba(212,96,122,0.18); background: var(--card); color: var(--ink2); cursor: pointer; white-space: nowrap; transition: all 0.18s ease; font-family: 'DM Sans', sans-serif; }
  .tab.active { background: var(--rose); color: #fff; border-color: var(--rose); }
  .tab:hover:not(.active) { background: var(--petal); border-color: rgba(212,96,122,0.3); color: var(--rose); }

  .sg-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .sg-divider-line { flex: 1; height: 1px; background: rgba(212,96,122,0.12); }
  .sg-divider-label { font-size: 9px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); white-space: nowrap; }
  .sg-divider-flower { font-size: 11px; color: var(--blush2); }

  .stat-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat-card { border-radius: 20px; padding: clamp(14px,2vw,18px) clamp(12px,1.5vw,16px); position: relative; overflow: hidden; }
  .stat-card::after { content: ''; position: absolute; bottom: -16px; right: -16px; width: 52px; height: 52px; border-radius: 50%; opacity: 0.22; pointer-events: none; background: var(--dot-c, #f2c4ce); }
  .stat-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 9px; display: flex; align-items: center; gap: 5px; }
  .stat-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .stat-val { font-family: 'Fraunces', serif; font-size: clamp(22px,3.5vw,30px); font-weight: 300; letter-spacing: -0.5px; line-height: 1; margin-bottom: 5px; }
  .stat-sub { font-size: 10px; color: var(--ink3); }
  .stat-ico { position: absolute; top: 12px; right: 12px; font-size: 15px; opacity: 0.2; }
  .trend-up { color: #5a8c63; }
  .trend-dn { color: var(--rose); }

  .chart-card { background: var(--card); border: 1px solid rgba(212,96,122,0.1); border-radius: 20px; padding: 16px 18px 14px; margin-bottom: 14px; }
  .chart-title { font-size: 11px; font-weight: 500; color: var(--ink2); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }

  .bar-group { display: flex; flex-direction: column; gap: 8px; }
  .bar-row { display: flex; align-items: center; gap: 10px; }
  .bar-lbl { font-size: 10px; color: var(--ink3); width: 58px; flex-shrink: 0; text-align: right; line-height: 1.2; }
  .bar-track { flex: 1; height: 8px; border-radius: 999px; background: rgba(212,96,122,0.07); overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 999px; transition: width 0.9s cubic-bezier(.22,.68,0,1.2); }
  .bar-val { font-size: 10px; color: var(--ink3); width: 32px; flex-shrink: 0; }

  .mood-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
  .mood-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .mood-cell { width: 100%; aspect-ratio: 1; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; }
  .mood-day { font-size: 8px; color: var(--ink3); letter-spacing: 0.5px; }

  .insight-card { border-radius: 16px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 10px; }
  .insight-ico { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .insight-text { font-family: 'Fraunces', serif; font-style: italic; font-size: 13px; font-weight: 300; line-height: 1.5; }

  .period-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .period-pill { border-radius: 16px; padding: 14px 16px; text-align: center; }
  .period-pill-val { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px; }
  .period-pill-lbl { font-size: 10px; color: var(--ink3); letter-spacing: 1.5px; text-transform: uppercase; }

  .expense-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .exp-tag { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--ink2); }
  .exp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  @media (max-width: 768px) {
    .ins { padding: 72px 20px 88px; }
    .stat-row { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 380px) {
    .ins { padding-left: 16px; padding-right: 16px; }
    .ins-title { font-size: 24px; }
  }
`

type TabRange = 'week' | 'month' | '3month'

type MoodEntry = { mood: string; emoji: string; created_at: string }
type HabitRow  = { id: string; name: string }
type HabitLog  = { habit_id: string; date: string }
type StudyRow  = { duration_minutes: number; created_at: string }
type ExpenseRow = { amount: number; category: string; date: string }
type AttRow    = { status: string; date: string }
type PeriodRow = { start_date: string; end_date: string | null }

const MOOD_MAP: Record<string, { emoji: string; bg: string }> = {
  happy:     { emoji: '😄', bg: 'rgba(90,140,99,0.22)'    },
  good:      { emoji: '😊', bg: 'rgba(168,201,174,0.3)'   },
  okay:      { emoji: '😐', bg: 'rgba(245,221,180,0.3)'   },
  sad:       { emoji: '😔', bg: 'rgba(212,96,122,0.12)'   },
  anxious:   { emoji: '😟', bg: 'rgba(201,184,232,0.3)'   },
  tired:     { emoji: '😴', bg: 'rgba(212,96,122,0.08)'   },
  energetic: { emoji: '⚡', bg: 'rgba(245,221,180,0.45)'  },
}
const DEFAULT_MOOD = { emoji: '·', bg: 'rgba(176,154,164,0.1)' }

const HABIT_COLORS = ['#9b7ec8','#d4607a','#5a8c63','#b8860b','#e8a0b0','#a8c9ae']
const EXPENSE_COLORS: Record<string, string> = {
  food: '#d4607a', transport: '#9b7ec8', study: '#b8860b',
  'self-care': '#5a8c63', health: '#5a8c63', misc: '#b09aa4',
  shopping: '#e8a0b0', entertainment: '#c9b8e8',
}

function getDateRange(tab: TabRange): { start: string; end: string } {
  const now   = new Date()
  const today = now.toISOString().slice(0, 10)
  if (tab === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - 6)
    return { start: d.toISOString().slice(0, 10), end: today }
  }
  if (tab === 'month') {
    return { start: `${today.slice(0, 7)}-01`, end: today }
  }
  const d = new Date(now); d.setMonth(d.getMonth() - 3)
  return { start: d.toISOString().slice(0, 10), end: today }
}

function daysBetween(start: string, end: string): string[] {
  const days: string[] = []
  const cur = new Date(start)
  const fin = new Date(end)
  while (cur <= fin) { days.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1) }
  return days
}

export default function InsightsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<TabRange>('week')
  const [loaded, setLoaded] = useState(false)

  // mood
  const [moodDays,    setMoodDays]    = useState<{ date: string; mood: string }[]>([])
  const [avgMood,     setAvgMood]     = useState('—')
  const [moodTrend,   setMoodTrend]   = useState<'up'|'dn'|null>(null)

  // habits
  const [habitStats,  setHabitStats]  = useState<{ name: string; pct: number; color: string }[]>([])
  const [habitSummary,setHabitSummary]= useState({ done: 0, total: 0, pct: 0 })

  // study
  const [studyDays,   setStudyDays]   = useState<{ label: string; hours: number }[]>([])
  const [totalStudy,  setTotalStudy]  = useState('0h')

  // expenses
  const [expCats,     setExpCats]     = useState<{ name: string; amount: number; pct: number; color: string }[]>([])
  const [totalExp,    setTotalExp]    = useState('₹0')

  // attendance
  const [attPct,      setAttPct]      = useState('—%')
  const [attTrend,    setAttTrend]    = useState<'up'|'dn'|null>(null)

  // period
  const [periodNext,  setPeriodNext]  = useState('—')
  const [periodPhase, setPeriodPhase] = useState('not tracked')

  // insights
  const [insights,    setInsights]    = useState<{ text: string; color: string; bg: string; icon: string }[]>([])

  useEffect(() => {
    setLoaded(false)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      fetchAll(user.id, tab).then(() => setLoaded(true))
    })
  }, [tab])

  async function fetchAll(userId: string, range: TabRange) {
    const { start, end } = getDateRange(range)
    const days = daysBetween(start, end)

    // ── Mood ──────────────────────────────────────────
    const { data: moodRaw } = await (supabase
      .from('moods')
      .select('mood, emoji, created_at')
      .eq('user_id', userId)
      .gte('created_at', `${start}T00:00:00`)
      .lte('created_at', `${end}T23:59:59`)
      .order('created_at', { ascending: true }) as any) as { data: MoodEntry[] | null }

    const moodByDate: Record<string, string> = {}
    ;(moodRaw ?? []).forEach(m => { moodByDate[m.created_at.slice(0, 10)] = m.mood })

    const moodArr = days.map(d => ({ date: d, mood: moodByDate[d] ?? '' }))
    setMoodDays(moodArr)

    const MOOD_SCORE: Record<string, number> = { happy: 5, energetic: 5, good: 4, okay: 3, anxious: 2, tired: 2, sad: 1 }
    const scores = moodArr.filter(m => m.mood).map(m => MOOD_SCORE[m.mood] ?? 3)
    if (scores.length) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      setAvgMood(avg.toFixed(1))
      setMoodTrend(avg >= 3.5 ? 'up' : 'dn')
    }

    // ── Habits ────────────────────────────────────────
    const { data: habitsRaw } = await supabase
      .from('habits').select('id, name').eq('user_id', userId).eq('archived', false)
    const habits = (habitsRaw ?? []) as HabitRow[]

    const { data: logsRaw } = await supabase
      .from('habit_logs').select('habit_id, date').eq('user_id', userId)
      .gte('date', start).lte('date', end)
    const logs = (logsRaw ?? []) as HabitLog[]

    const totalSlots = habits.length * days.length
    const habitStatArr = habits.map((h, i) => {
      const done = logs.filter(l => l.habit_id === h.id).length
      return { name: h.name, pct: days.length ? Math.round((done / days.length) * 100) : 0, color: HABIT_COLORS[i % HABIT_COLORS.length] }
    })
    setHabitStats(habitStatArr)
    const totalDone = logs.length
    setHabitSummary({ done: totalDone, total: totalSlots, pct: totalSlots ? Math.round((totalDone / totalSlots) * 100) : 0 })

    // ── Study ─────────────────────────────────────────
    const { data: studyRaw } = await supabase
      .from('study_sessions').select('duration_minutes, created_at').eq('user_id', userId)
      .gte('created_at', `${start}T00:00:00`).lte('created_at', `${end}T23:59:59`)
    const studySessions = (studyRaw ?? []) as StudyRow[]

    const studyByDate: Record<string, number> = {}
    studySessions.forEach(s => {
      const d = s.created_at.slice(0, 10)
      studyByDate[d] = (studyByDate[d] ?? 0) + (s.duration_minutes ?? 0)
    })

    const visibleDays = range === 'week' ? days : days.filter((_, i) => i % Math.ceil(days.length / 10) === 0)
    const studyArr = visibleDays.map(d => ({
      label: new Date(d).toLocaleDateString('en-IN', { weekday: 'short' }),
      hours: parseFloat(((studyByDate[d] ?? 0) / 60).toFixed(1)),
    }))
    setStudyDays(studyArr)

    const totalMins = studySessions.reduce((a, s) => a + (s.duration_minutes ?? 0), 0)
    setTotalStudy(totalMins >= 60 ? `${(totalMins / 60).toFixed(1)}h` : `${totalMins}m`)

    // ── Expenses ──────────────────────────────────────
    const { data: expRaw } = await supabase
      .from('expenses').select('amount, category, date').eq('user_id', userId)
      .gte('date', start).lte('date', end)
    const expenses = (expRaw ?? []) as ExpenseRow[]

    const catTotals: Record<string, number> = {}
    expenses.forEach(e => { catTotals[e.category ?? 'misc'] = (catTotals[e.category ?? 'misc'] ?? 0) + e.amount })
    const grandTotal = Object.values(catTotals).reduce((a, b) => a + b, 0)
    const catArr = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount]) => ({
        name, amount,
        pct: grandTotal ? Math.round((amount / grandTotal) * 100) : 0,
        color: EXPENSE_COLORS[name.toLowerCase()] ?? '#b09aa4',
      }))
    setExpCats(catArr)
    setTotalExp(
      grandTotal >= 100000 ? `₹${(grandTotal / 100000).toFixed(1)}L`
      : grandTotal >= 1000  ? `₹${(grandTotal / 1000).toFixed(1)}k`
      : `₹${Math.round(grandTotal)}`
    )

    // ── Attendance ────────────────────────────────────
    const { data: attRaw } = await supabase
      .from('attendance').select('status, date').eq('user_id', userId)
      .gte('date', start).lte('date', end)
    const attRows = (attRaw ?? []) as AttRow[]
    if (attRows.length) {
      const pct = Math.round((attRows.filter(a => a.status === 'present').length / attRows.length) * 100)
      setAttPct(`${pct}%`)
      setAttTrend(pct >= 80 ? 'up' : 'dn')
    }

    // ── Period ────────────────────────────────────────
    const { data: periodRaw } = await (supabase
      .from('period_entries').select('start_date, end_date')
      .eq('user_id', userId).order('start_date', { ascending: false }).limit(1).maybeSingle() as any) as { data: PeriodRow | null }
    if (periodRaw) {
      const last   = new Date(periodRaw.start_date)
      const next   = new Date(last); next.setDate(next.getDate() + 28)
      const daysLeft = Math.ceil((next.getTime() - Date.now()) / 86400000)
      if (periodRaw.end_date) {
        const endD = new Date(periodRaw.end_date)
        const today2 = new Date()
        if (today2 >= last && today2 <= endD) { setPeriodPhase('on period'); setPeriodNext('now') }
        else { setPeriodNext(daysLeft > 0 ? `${daysLeft}d` : 'due'); setPeriodPhase(daysLeft > 0 ? `in ${daysLeft} days` : 'due today') }
      } else {
        setPeriodNext(daysLeft > 0 ? `${daysLeft}d` : 'due')
        setPeriodPhase(daysLeft > 0 ? `in ${daysLeft} days` : 'due today')
      }
    }

    // ── Insights ──────────────────────────────────────
    const built: { text: string; color: string; bg: string; icon: string }[] = []

    if (scores.length) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg >= 4) built.push({ text: 'you\'ve been radiating warmth this week — keep tending to that joy', color: 'var(--rose)', bg: 'var(--petal)', icon: 'ti-heart' })
      else if (avg <= 2.5) built.push({ text: 'some tough days lately — be gentle with yourself, it\'s enough to just keep going', color: '#9b7ec8', bg: 'var(--lavender)', icon: 'ti-heart-handshake' })
    }

    if (habitStatArr.length) {
      const best = [...habitStatArr].sort((a, b) => b.pct - a.pct)[0]
      if (best && best.pct >= 80) built.push({ text: `${best.name} is your superpower right now — ${best.pct}% consistency is beautiful`, color: '#5a8c63', bg: '#f0f8f1', icon: 'ti-sparkles' })
    }

    const totalH = totalMins / 60
    if (totalH >= 15) built.push({ text: `${totalH.toFixed(0)} hours of focused study — your dedication is quietly impressive`, color: '#b8860b', bg: 'var(--butter)', icon: 'ti-bulb' })

    if (!built.length) built.push({ text: 'keep logging your days — patterns will bloom into insights soon', color: 'var(--ink2)', bg: 'rgba(212,96,122,0.06)', icon: 'ti-leaf' })

    setInsights(built)
  }

  const maxStudy = Math.max(...studyDays.map(s => s.hours), 0.1)
  const maxExp   = Math.max(...expCats.map(e => e.amount), 0.1)

  return (
    <>
      <style>{css}</style>
      <div className="ins">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="ins-eyebrow"><i className="ti ti-chart-bar ins-petal-ico" aria-hidden="true" />your insights</p>
          <h1 className="ins-title">how you've been <span className="accent">blooming</span></h1>
          <p className="ins-sub">a gentle look at your patterns</p>
        </motion.div>

        {/* Tabs */}
        <div className="tab-row">
          {(['week', 'month', '3month'] as TabRange[]).map(t => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'week' ? 'this week' : t === 'month' ? 'this month' : '3 months'}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <motion.div className="stat-row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: loaded ? 1 : 0.4, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="stat-card" style={{ background: '#fff9fb', border: '1px solid rgba(212,96,122,0.12)', ['--dot-c' as string]: '#e8a0b0' }}>
            <i className="ti ti-mood-smile stat-ico" aria-hidden="true" style={{ color: 'var(--rose)' }} />
            <p className="stat-lbl"><span className="stat-dot" style={{ background: '#e8a0b0' }} />avg mood</p>
            <p className="stat-val" style={{ color: 'var(--rose)' }}>{avgMood}</p>
            <p className="stat-sub">
              {moodTrend === 'up' && <span className="trend-up">↑ looking bright</span>}
              {moodTrend === 'dn' && <span className="trend-dn">↓ hang in there</span>}
              {!moodTrend && 'not enough data'}
            </p>
          </div>
          <div className="stat-card" style={{ background: '#fdf8ff', border: '1px solid rgba(201,184,232,0.25)', ['--dot-c' as string]: '#c9b8e8' }}>
            <i className="ti ti-checks stat-ico" aria-hidden="true" style={{ color: '#9b7ec8' }} />
            <p className="stat-lbl"><span className="stat-dot" style={{ background: '#c9b8e8' }} />habits</p>
            <p className="stat-val" style={{ color: '#9b7ec8' }}>{habitSummary.pct}%</p>
            <p className="stat-sub">{habitSummary.done} / {habitSummary.total} done</p>
          </div>
          <div className="stat-card" style={{ background: '#fffdf5', border: '1px solid rgba(245,221,180,0.35)', ['--dot-c' as string]: '#f5ddb4' }}>
            <i className="ti ti-clock-hour-4 stat-ico" aria-hidden="true" style={{ color: '#b8860b' }} />
            <p className="stat-lbl"><span className="stat-dot" style={{ background: '#f5ddb4' }} />study</p>
            <p className="stat-val" style={{ color: '#b8860b' }}>{totalStudy}</p>
            <p className="stat-sub">total sessions</p>
          </div>
          <div className="stat-card" style={{ background: '#f8fcf8', border: '1px solid rgba(168,201,174,0.3)', ['--dot-c' as string]: '#a8c9ae' }}>
            <i className="ti ti-calendar-stats stat-ico" aria-hidden="true" style={{ color: '#5a8c63' }} />
            <p className="stat-lbl"><span className="stat-dot" style={{ background: '#a8c9ae' }} />attendance</p>
            <p className="stat-val" style={{ color: '#5a8c63' }}>{attPct}</p>
            <p className="stat-sub">
              {attTrend === 'up' && <span className="trend-up">↑ great streak</span>}
              {attTrend === 'dn' && <span className="trend-dn">↓ can improve</span>}
              {!attTrend && 'this period'}
            </p>
          </div>
        </motion.div>

        {/* Mood week */}
        {moodDays.length > 0 && (
          <>
            <div className="sg-divider"><div className="sg-divider-line" /><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><span className="sg-divider-label">mood log</span><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><div className="sg-divider-line" /></div>
            <motion.div className="chart-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <p className="chart-title"><i className="ti ti-mood-smile" aria-hidden="true" style={{ color: 'var(--rose)' }} />daily mood</p>
              <div className="mood-grid">
                {moodDays.slice(-7).map(m => {
                  const info = MOOD_MAP[m.mood] ?? DEFAULT_MOOD
                  const label = new Date(m.date).toLocaleDateString('en-IN', { weekday: 'short' })
                  return (
                    <div key={m.date} className="mood-col">
                      <div className="mood-cell" style={{ background: info.bg }}>{info.emoji}</div>
                      <span className="mood-day">{label}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}

        {/* Habits */}
        {habitStats.length > 0 && (
          <>
            <div className="sg-divider"><div className="sg-divider-line" /><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><span className="sg-divider-label">habit breakdown</span><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><div className="sg-divider-line" /></div>
            <motion.div className="chart-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="chart-title"><i className="ti ti-checks" aria-hidden="true" style={{ color: '#9b7ec8' }} />completion by habit</p>
              <div className="bar-group">
                {habitStats.map(h => (
                  <div key={h.name} className="bar-row">
                    <span className="bar-lbl">{h.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${h.pct}%`, background: h.color }} />
                    </div>
                    <span className="bar-val">{h.pct}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Study */}
        {studyDays.length > 0 && studyDays.some(s => s.hours > 0) && (
          <>
            <div className="sg-divider"><div className="sg-divider-line" /><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><span className="sg-divider-label">study sessions</span><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><div className="sg-divider-line" /></div>
            <motion.div className="chart-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <p className="chart-title"><i className="ti ti-clock-hour-4" aria-hidden="true" style={{ color: '#b8860b' }} />hours per day</p>
              <div className="bar-group">
                {studyDays.map(s => (
                  <div key={s.label} className="bar-row">
                    <span className="bar-lbl">{s.label}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(s.hours / maxStudy) * 100}%`, background: 'linear-gradient(to right,#f5ddb4,#b8860b)' }} />
                    </div>
                    <span className="bar-val">{s.hours}h</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Expenses */}
        {expCats.length > 0 && (
          <>
            <div className="sg-divider"><div className="sg-divider-line" /><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><span className="sg-divider-label">spending</span><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><div className="sg-divider-line" /></div>
            <motion.div className="chart-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="chart-title"><i className="ti ti-receipt" aria-hidden="true" style={{ color: 'var(--rose)' }} />expenses by category &nbsp;<span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 400 }}>total: {totalExp}</span></p>
              <div className="expense-legend">
                {expCats.map(e => (
                  <span key={e.name} className="exp-tag">
                    <span className="exp-dot" style={{ background: e.color }} />
                    {e.name} {e.pct}%
                  </span>
                ))}
              </div>
              <div className="bar-group">
                {expCats.map(e => (
                  <div key={e.name} className="bar-row">
                    <span className="bar-lbl">{e.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(e.amount / maxExp) * 100}%`, background: e.color }} />
                    </div>
                    <span className="bar-val" style={{ fontSize: 9 }}>
                      {e.amount >= 1000 ? `₹${(e.amount / 1000).toFixed(1)}k` : `₹${Math.round(e.amount)}`}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Period */}
        {periodNext !== '—' && (
          <>
            <div className="sg-divider"><div className="sg-divider-line" /><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><span className="sg-divider-label">cycle</span><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><div className="sg-divider-line" /></div>
            <motion.div className="chart-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <p className="chart-title"><i className="ti ti-calendar-heart" aria-hidden="true" style={{ color: '#9b7ec8' }} />period tracker</p>
              <div className="period-row">
                <div className="period-pill" style={{ background: 'var(--lavender)', border: '1px solid rgba(201,184,232,0.3)' }}>
                  <p className="period-pill-val" style={{ color: '#9b7ec8' }}>{periodNext}</p>
                  <p className="period-pill-lbl">next period</p>
                </div>
                <div className="period-pill" style={{ background: 'var(--petal)', border: '1px solid rgba(212,96,122,0.15)' }}>
                  <p className="period-pill-val" style={{ color: 'var(--rose)', fontSize: 14, paddingTop: 6 }}>{periodPhase}</p>
                  <p className="period-pill-lbl">phase</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Gentle reflections */}
        {insights.length > 0 && (
          <>
            <div className="sg-divider"><div className="sg-divider-line" /><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><span className="sg-divider-label">gentle reflections</span><i className="ti ti-circle sg-divider-flower" aria-hidden="true" /><div className="sg-divider-line" /></div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              {insights.map((ins, i) => (
                <div key={i} className="insight-card" style={{ background: ins.bg, border: `1px solid ${ins.color}22` }}>
                  <i className={`ti ${ins.icon} insight-ico`} aria-hidden="true" style={{ color: ins.color }} />
                  <p className="insight-text" style={{ color: ins.color }}>{ins.text}</p>
                </div>
              ))}
            </motion.div>
          </>
        )}

      </div>
    </>
  )
}