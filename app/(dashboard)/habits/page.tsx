'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── categories — tinted with the dashboard palette ──────────────────────────
const CATEGORIES = [
  { id: 'health',    label: 'Health',    icon: 'ti-heart-pulse', c: '#d4607a', dotC: '#e8a0b0', bg: '#fff9fb', border: 'rgba(212,96,122,0.15)'  },
  { id: 'study',     label: 'Study',     icon: 'ti-book',        c: '#b8860b', dotC: '#f5ddb4', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)'  },
  { id: 'fitness',   label: 'Fitness',   icon: 'ti-run',         c: '#5a8c63', dotC: '#a8c9ae', bg: '#f8fcf8', border: 'rgba(168,201,174,0.4)'  },
  { id: 'mindful',   label: 'Mindful',   icon: 'ti-brain',       c: '#9b7ec8', dotC: '#c9b8e8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)'  },
  { id: 'sleep',     label: 'Sleep',     icon: 'ti-moon',        c: '#9b7ec8', dotC: '#c9b8e8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)'  },
  { id: 'nutrition', label: 'Nutrition', icon: 'ti-salad',       c: '#5a8c63', dotC: '#a8c9ae', bg: '#f8fcf8', border: 'rgba(168,201,174,0.4)'  },
  { id: 'social',    label: 'Social',    icon: 'ti-users',       c: '#d4607a', dotC: '#e8a0b0', bg: '#fff9fb', border: 'rgba(212,96,122,0.15)'  },
  { id: 'other',     label: 'Other',     icon: 'ti-sparkles',    c: '#9b7ec8', dotC: '#c9b8e8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)'  },
]

const FREQ = ['daily', 'weekdays', 'weekends', 'weekly']

function getWeekDates() {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    return { label: ['M','T','W','T','F','S','S'][i], iso: d.toISOString().slice(0, 10) }
  })
}
const todayIso = new Date().toISOString().slice(0, 10)

// ── CSS — mirrors sg- dashboard exactly, extends with habit-specific rules ───
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sg {
    --blush:     #f2c4ce;
    --blush2:    #e8a0b0;
    --rose:      #d4607a;
    --petal:     #fde8ee;
    --lavender:  #e8daf5;
    --lav2:      #c9b8e8;
    --butter:    #fef3e2;
    --butter2:   #f5ddb4;
    --sage:      #d4e8d8;
    --sage2:     #a8c9ae;
    --cream:     #fdf7f0;
    --ink:       #3d2a35;
    --ink2:      #7a5c68;
    --ink3:      #b09aa4;
    --card:      #fff9fb;
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
    animation: hbeat 2.4s ease-in-out infinite; display: inline-block;
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
  .sg-clock-sub { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-top: 4px; }

  /* ── divider ── */
  .sg-divider {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }
  .sg-divider-line   { flex: 1; height: 1px; background: rgba(212,96,122,0.12); }
  .sg-divider-label  { font-size: 9px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); white-space: nowrap; }
  .sg-divider-flower { font-size: 11px; color: var(--blush2); }

  /* ── stat cards ── */
  .sg-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }

  .sg-card {
    border-radius: 20px; padding: clamp(14px,2vw,20px) clamp(12px,1.5vw,16px);
    position: relative; overflow: hidden;
    transition: transform 0.2s ease; cursor: default;
  }
  .sg-card:hover { transform: translateY(-3px); }
  .sg-card::after {
    content: ''; position: absolute; bottom: -18px; right: -18px;
    width: 56px; height: 56px; border-radius: 50%; opacity: 0.22;
    pointer-events: none; background: var(--dot-c, #f2c4ce);
  }
  .sg-card-lbl {
    font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink3); margin-bottom: 10px;
    display: flex; align-items: center; gap: 5px;
  }
  .sg-card-lbl-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .sg-card-val {
    font-family: 'Fraunces', serif;
    font-size: clamp(22px,3vw,30px); font-weight: 300; letter-spacing: -0.5px; line-height: 1;
    margin-bottom: 5px;
  }
  .sg-card-sub  { font-size: 11px; color: var(--ink3); }
  .sg-card-ico  { position: absolute; top: 14px; right: 14px; font-size: 16px; opacity: 0.22; }

  /* ── tabs — styled like sg-act but horizontal pills ── */
  .sg-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

  .sg-tab {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 18px; border-radius: 999px;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.2px;
    cursor: pointer; border: 1px solid rgba(212,96,122,0.12);
    background: var(--card); color: var(--ink2);
    transition: all 0.17s ease;
  }
  .sg-tab:hover  { background: var(--petal); border-color: rgba(212,96,122,0.25); color: var(--rose); }
  .sg-tab:active { transform: scale(0.97); }
  .sg-tab.active {
    background: var(--petal); border-color: rgba(212,96,122,0.3); color: var(--rose);
  }
  .sg-tab i { font-size: 13px; }

  /* ── content card shell — same as sg-act card feel ── */
  .sg-content-card {
    background: var(--card); border: 1px solid rgba(212,96,122,0.1);
    border-radius: 20px; padding: clamp(18px,2.5vw,24px);
  }

  .sg-content-lbl {
    font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink3); margin-bottom: 14px;
  }

  /* ── habit list ── */
  .hlist { display: flex; flex-direction: column; gap: 9px; }

  .hitem {
    display: flex; align-items: center; gap: 11px;
    border-radius: 14px; padding: 12px 14px;
    transition: transform 0.18s ease, background 0.18s ease;
    border: 1px solid rgba(212,96,122,0.08);
    background: rgba(253,247,240,0.6);
  }
  .hitem:hover { transform: translateX(2px); }
  .hitem.done  { background: var(--petal); border-color: rgba(212,96,122,0.2); }

  .hitem-check {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 12px; border: none;
    transition: transform 0.15s ease;
  }
  .hitem-check:hover  { transform: scale(1.14); }
  .hitem-check:active { transform: scale(0.9);  }

  .hitem-ico  { font-size: 15px; flex-shrink: 0; }
  .hitem-name { font-size: 13px; font-weight: 500; color: var(--ink); }
  .hitem-meta { font-size: 10px; color: var(--ink3); margin-top: 2px; }

  .hitem-streak { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500; color: #b8860b; flex-shrink: 0; }
  .hitem-streak i { font-size: 11px; }

  /* week dots */
  .week-strip { display: flex; gap: 4px; flex-shrink: 0; }
  .wday { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .wday-lbl { font-size: 8px; font-weight: 500; color: var(--ink3); }
  .wday-dot  { width: 8px; height: 8px; border-radius: 50%; background: rgba(212,96,122,0.12); }
  .wday-dot.logged  { background: var(--rose); }
  .wday-dot.today   { outline: 2px solid var(--rose); outline-offset: 1px; }

  /* archive btn */
  .arch-btn {
    background: none; border: none; cursor: pointer; flex-shrink: 0;
    color: var(--ink3); font-size: 13px; padding: 4px;
    transition: color 0.15s ease;
  }
  .arch-btn:hover { color: var(--rose); }

  /* ── progress ring ── */
  .ring-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 14px; }

  /* ── category bars ── */
  .cat-bar-row   { display: flex; flex-direction: column; gap: 10px; }
  .cat-bar-label { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
  .cat-bar-track { height: 3px; border-radius: 999px; background: rgba(212,96,122,0.1); overflow: hidden; }
  .cat-bar-fill  { height: 100%; border-radius: 999px; }

  /* ── add form ── */
  .hp-form { display: flex; flex-direction: column; gap: 16px; }

  .hp-input {
    width: 100%; border-radius: 12px; padding: 11px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400;
    background: rgba(253,232,238,0.35);
    border: 1px solid rgba(212,96,122,0.18);
    color: var(--ink); outline: none;
    transition: border-color 0.2s ease;
  }
  .hp-input::placeholder { color: var(--ink3); }
  .hp-input:focus { border-color: rgba(212,96,122,0.45); }

  .form-lbl {
    font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink3); margin-bottom: 10px;
  }

  /* category grid */
  .cat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; }
  .cat-btn {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 11px 6px; border-radius: 14px; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    background: rgba(253,247,240,0.8); border: 1px solid rgba(212,96,122,0.1);
    transition: all 0.17s ease;
  }
  .cat-btn:hover { transform: translateY(-2px); border-color: rgba(212,96,122,0.25); }
  .cat-btn.active { border-width: 1.5px; }
  .cat-btn i   { font-size: 16px; }
  .cat-btn-lbl { font-size: 9px; font-weight: 500; letter-spacing: 0.3px; }

  /* frequency */
  .freq-row { display: flex; gap: 7px; flex-wrap: wrap; }
  .freq-btn {
    padding: 6px 14px; border-radius: 999px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400;
    text-transform: capitalize; background: var(--card);
    border: 1px solid rgba(212,96,122,0.12); color: var(--ink2);
    transition: all 0.17s ease;
  }
  .freq-btn:hover  { background: var(--petal); color: var(--rose); border-color: rgba(212,96,122,0.3); }
  .freq-btn.active { background: var(--petal); color: var(--rose); border-color: rgba(212,96,122,0.3); }

  /* submit */
  .hp-submit {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px; border-radius: 999px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; border: 1px solid transparent;
    transition: all 0.17s ease; align-self: flex-start;
  }
  .hp-submit:hover  { transform: translateY(-2px); }
  .hp-submit:active { transform: scale(0.97); }
  .hp-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .hp-submit i { font-size: 13px; }

  /* toast */
  .sg-toast {
    padding: 9px 14px; border-radius: 12px; font-size: 11px; font-weight: 400;
    font-family: 'Fraunces', serif; font-style: italic;
    background: var(--sage); border: 1px solid rgba(168,201,174,0.5);
    color: #5a8c63; text-align: center;
  }

  /* empty */
  .empty { text-align: center; padding: 40px 20px; }
  .empty i { font-size: 28px; display: block; margin-bottom: 10px; color: var(--blush2); opacity: 0.5; }
  .empty-txt { font-size: 13px; color: var(--ink3); font-family: 'Fraunces', serif; font-style: italic; }

  /* spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinning { animation: spin 0.9s linear infinite; }

  /* footer — same as dashboard */
  .sg-footer {
    background: linear-gradient(135deg, var(--petal) 0%, var(--lavender) 100%);
    border: 1px solid rgba(212,96,122,0.14);
    border-radius: 20px; padding: 18px 22px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    margin-top: 16px;
  }
  .sg-footer-lbl {
    font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink3); margin-bottom: 5px;
  }
  .sg-footer-msg {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 15px; font-weight: 300; color: var(--ink2);
  }
  .sg-footer-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .sg-footer-ico   { font-size: 20px; color: var(--blush2); }

  /* archive item */
  .arch-item {
    display: flex; align-items: center; gap: 11px; padding: 12px 14px;
    border-radius: 14px; background: rgba(253,247,240,0.5);
    border: 1px solid rgba(212,96,122,0.08);
    transition: transform 0.15s ease;
  }
  .arch-item:hover { transform: translateX(2px); }
  .arch-item-ico { font-size: 14px; flex-shrink: 0; }

  .arch-action {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 999px; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
    transition: transform 0.15s ease;
  }
  .arch-action:hover { transform: scale(1.06); }

  /* ── responsive ── */
  @media (max-width: 768px) {
    .sg { padding: 72px 20px 88px; }
    .sg-header { flex-direction: column; }
    .sg-clock-card { align-self: flex-start; text-align: left; }
    .sg-grid  { grid-template-columns: repeat(2,1fr); }
    .main-split { grid-template-columns: 1fr !important; }
    .week-strip { display: none; }
  }
  @media (max-width: 380px) {
    .sg { padding-left: 16px; padding-right: 16px; }
    .sg-grid { grid-template-columns: repeat(2,1fr); }
    .cat-grid { grid-template-columns: repeat(4,1fr); }
  }
`

export default function HabitsPage() {
  const supabase = createClient()

  const [habits,    setHabits]    = useState([])
  const [logs,      setLogs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [date,      setDate]      = useState('')

  const [name,   setName]   = useState('')
  const [catId,  setCatId]  = useState('health')
  const [freq,   setFreq]   = useState('daily')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const channelRef = useRef(null)
  const week = getWeekDates()

  useEffect(() => {
    setDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))
    fetchAll()
    channelRef.current = supabase
      .channel('habits-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' },    fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' },fetchAll)
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('habit_logs').select('habit_id,date').eq('user_id', user.id),
    ])
    setHabits(h || []); setLogs(l || []); setLoading(false)
  }

  const toggleLog = async (habitId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const done = isLogged(habitId, todayIso)
    if (done) {
      await supabase.from('habit_logs').delete()
        .eq('habit_id', habitId).eq('date', todayIso).eq('user_id', user.id)
    } else {
      await supabase.from('habit_logs').insert({ habit_id: habitId, date: todayIso, user_id: user.id })
    }
    fetchAll()
  }

  const addHabit = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('habits').insert({
      user_id: user.id, name: name.trim(), category: catId, frequency: freq, archived: false,
    })
    setName(''); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setSaving(false); fetchAll()
  }

  const archiveHabit = async (id) => {
    await supabase.from('habits').update({ archived: true }).eq('id', id); fetchAll()
  }
  const restoreHabit = async (id) => {
    await supabase.from('habits').update({ archived: false }).eq('id', id); fetchAll()
  }
  const deleteHabit  = async (id) => {
    await supabase.from('habits').delete().eq('id', id); fetchAll()
  }

  const isLogged = (hid, date) => logs.some(l => l.habit_id === hid && l.date === date)
  const streakOf = (hid) => {
    let s = 0, d = new Date()
    while (logs.some(l => l.habit_id === hid && l.date === d.toISOString().slice(0, 10))) {
      s++; d.setDate(d.getDate() - 1)
    }
    return s
  }
  const cat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7]

  const activeHabits = habits.filter(h => !h.archived)
  const archived     = habits.filter(h => h.archived)
  const todayDone    = activeHabits.filter(h => isLogged(h.id, todayIso)).length
  const totalToday   = activeHabits.length
  const pct          = totalToday ? Math.round((todayDone / totalToday) * 100) : 0
  const bestStreak   = activeHabits.reduce((b, h) => Math.max(b, streakOf(h.id)), 0)

  // ring
  const R = 40, CX = 48, CY = 48, CIRC = 2 * Math.PI * R
  const dash = (CIRC * pct) / 100

  const statCards = [
    { label: 'done today',  value: `${todayDone}/${totalToday}`, sub: 'habits today',      c: '#d4607a', dotC: '#e8a0b0', bg: '#fff9fb', border: 'rgba(212,96,122,0.12)', icon: 'ti-checks' },
    { label: 'completion',  value: `${pct}%`,                    sub: 'of daily habits',   c: '#5a8c63', dotC: '#a8c9ae', bg: '#f8fcf8', border: 'rgba(168,201,174,0.3)', icon: 'ti-chart-pie' },
    { label: 'best streak', value: `${bestStreak}d`,             sub: 'consecutive days',  c: '#b8860b', dotC: '#f5ddb4', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)', icon: 'ti-flame' },
    { label: 'total logs',  value: String(logs.length),          sub: 'all time',          c: '#9b7ec8', dotC: '#c9b8e8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)', icon: 'ti-database' },
  ]

  const tabs = [
    { key: 'today',   label: "today's habits", icon: 'ti-list-check' },
    { key: 'add',     label: 'add a habit',     icon: 'ti-plus' },
    { key: 'archive', label: 'archive',          icon: 'ti-archive' },
  ]

  return (
    <>
      <style>{css}</style>
      <div className="sg">

        {/* ── Header — identical structure to dashboard ── */}
        <motion.header className="sg-header"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44 }}>
          <div className="sg-header-left">
            <p className="sg-eyebrow">
              <i className="ti ti-leaf sg-petal-ico" aria-hidden="true" />
              {date}
            </p>
            <h1 className="sg-name">
              your<br />
              <span className="accent">habits</span>
            </h1>
            <motion.span className="sg-vibe"
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              <i className="ti ti-heart sg-vibe-heart" aria-hidden="true" />
              small steps, big blooms
            </motion.span>
          </div>
          <LiveTime />
        </motion.header>

        {/* ── Divider ── */}
        <Divider label="your day at a glance" />

        {/* ── Stat cards — same .sg-card pattern ── */}
        <div className="sg-grid">
          {statCards.map((s, i) => (
            <motion.div key={s.label} className="sg-card"
              style={{ background: s.bg, border: `1px solid ${s.border}`, '--dot-c': s.dotC }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.36 }}>
              <i className={`ti ${s.icon} sg-card-ico`} style={{ color: s.c }} aria-hidden="true" />
              <p className="sg-card-lbl">
                <span className="sg-card-lbl-dot" style={{ background: s.dotC }} />
                {s.label}
              </p>
              <p className="sg-card-val" style={{ color: s.c }}>{s.value}</p>
              <p className="sg-card-sub">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs divider + tabs ── */}
        <Divider label="manage habits" />

        <motion.div className="sg-tabs"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          {tabs.map(t => (
            <button key={t.key}
              className={`sg-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}>
              <i className={`ti ${t.icon}`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* ── Tab panels ── */}
        <AnimatePresence mode="wait">

          {/* TODAY */}
          {activeTab === 'today' && (
            <motion.div key="today"
              initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}>
              <div className="main-split" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '14px', alignItems: 'start' }}>

                {/* Habit list */}
                <div className="sg-content-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <p className="sg-content-lbl" style={{ marginBottom: 0 }}>
                      {totalToday === 0 ? 'no habits yet' : todayDone === totalToday ? 'all bloomed today' : `${totalToday - todayDone} left to tend`}
                    </p>
                    {totalToday > 0 && (
                      <span style={{ fontSize: '10px', color: todayDone === totalToday ? '#5a8c63' : 'var(--ink3)', fontWeight: 500 }}>
                        {todayDone} / {totalToday}
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div style={{ padding: '36px', textAlign: 'center' }}>
                      <i className="ti ti-loader-2 spinning" style={{ fontSize: '24px', color: 'var(--rose)', display: 'block', marginBottom: '8px' }} />
                      <div style={{ fontSize: '12px', color: 'var(--ink3)', fontFamily: 'Fraunces', fontStyle: 'italic' }}>gathering your habits...</div>
                    </div>
                  ) : activeHabits.length === 0 ? (
                    <div className="empty">
                      <i className="ti ti-seedling" />
                      <p className="empty-txt">no habits yet — plant your first one</p>
                    </div>
                  ) : (
                    <div className="hlist">
                      <AnimatePresence>
                        {activeHabits.map((h, i) => {
                          const c    = cat(h.category)
                          const done = isLogged(h.id, todayIso)
                          const str  = streakOf(h.id)
                          return (
                            <motion.div key={h.id}
                              className={`hitem${done ? ' done' : ''}`}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -16 }} transition={{ delay: i * 0.04 }}>

                              {/* checkbox */}
                              <button className="hitem-check" onClick={() => toggleLog(h.id)}
                                style={{
                                  background: done ? c.c : 'rgba(212,96,122,0.08)',
                                  border: `1.5px solid ${done ? c.c : 'rgba(212,96,122,0.2)'}`,
                                }}>
                                {done && <i className="ti ti-check" style={{ color: '#fff', fontSize: '11px' }} />}
                              </button>

                              <i className={`ti ${c.icon} hitem-ico`}
                                style={{ color: done ? c.c : 'var(--ink3)' }} aria-hidden="true" />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="hitem-name" style={{
                                  textDecoration: done ? 'line-through' : 'none',
                                  opacity: done ? 0.6 : 1,
                                  color: done ? c.c : 'var(--ink)',
                                }}>{h.name}</div>
                                <div className="hitem-meta">{c.label} · {h.frequency}</div>
                              </div>

                              {str > 0 && (
                                <div className="hitem-streak">
                                  <i className="ti ti-flame" />{str}
                                </div>
                              )}

                              {/* week dots */}
                              <div className="week-strip">
                                {week.map(w => {
                                  const logged  = isLogged(h.id, w.iso)
                                  const isToday = w.iso === todayIso
                                  return (
                                    <div key={w.iso} className="wday">
                                      <span className="wday-lbl" style={{ color: isToday ? c.c : undefined }}>{w.label}</span>
                                      <div className={`wday-dot${logged ? ' logged' : ''}${isToday ? ' today' : ''}`}
                                        style={{ background: logged ? c.c : undefined }} />
                                    </div>
                                  )
                                })}
                              </div>

                              <button className="arch-btn" title="archive" onClick={() => archiveHabit(h.id)}>
                                <i className="ti ti-archive" />
                              </button>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Right side — ring + category bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Progress ring */}
                  <div className="sg-content-card" style={{ textAlign: 'center' }}>
                    <p className="sg-content-lbl">today's bloom</p>
                    <div className="ring-wrap">
                      <svg width={CX * 2} height={CY * 2}>
                        <circle cx={CX} cy={CY} r={R} fill="none"
                          stroke="rgba(212,96,122,0.1)" strokeWidth="6" />
                        <motion.circle cx={CX} cy={CY} r={R} fill="none"
                          stroke="url(#ring-sg)" strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={CIRC}
                          initial={{ strokeDashoffset: CIRC }}
                          animate={{ strokeDashoffset: CIRC - dash }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                          transform={`rotate(-90 ${CX} ${CY})`} />
                        <defs>
                          <linearGradient id="ring-sg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stopColor="#d4607a" />
                            <stop offset="100%" stopColor="#c9b8e8" />
                          </linearGradient>
                        </defs>
                        <text x={CX} y={CY - 4} textAnchor="middle"
                          fontSize="18" fontWeight="300" fontFamily="Fraunces, serif"
                          fill="#3d2a35">{pct}%</text>
                        <text x={CX} y={CY + 11} textAnchor="middle"
                          fontSize="8" fontWeight="500" fontFamily="DM Sans" letterSpacing="1.5"
                          fill="#b09aa4">DONE</text>
                      </svg>
                    </div>
                    {todayDone === totalToday && totalToday > 0 && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                          display: 'inline-block', padding: '5px 14px', borderRadius: '999px',
                          background: 'var(--sage)', border: '1px solid rgba(168,201,174,0.5)',
                          fontSize: '11px', fontFamily: 'Fraunces', fontStyle: 'italic', color: '#5a8c63',
                        }}>
                        fully bloomed
                      </motion.div>
                    )}
                  </div>

                  {/* Category breakdown */}
                  <div className="sg-content-card">
                    <p className="sg-content-lbl">by garden</p>
                    <div className="cat-bar-row">
                      {CATEGORIES
                        .filter(c => activeHabits.some(h => h.category === c.id))
                        .map(c => {
                          const total  = activeHabits.filter(h => h.category === c.id).length
                          const done   = activeHabits.filter(h => h.category === c.id && isLogged(h.id, todayIso)).length
                          const pctCat = total ? Math.round((done / total) * 100) : 0
                          return (
                            <div key={c.id}>
                              <div className="cat-bar-label">
                                <i className={`ti ${c.icon}`} style={{ fontSize: '11px', color: c.c }} aria-hidden="true" />
                                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{c.label}</span>
                                <span style={{ fontSize: '10px', color: 'var(--ink3)' }}>{done}/{total}</span>
                              </div>
                              <div className="cat-bar-track">
                                <motion.div className="cat-bar-fill"
                                  initial={{ width: 0 }} animate={{ width: `${pctCat}%` }}
                                  transition={{ duration: 0.65, ease: 'easeOut' }}
                                  style={{ background: c.c }} />
                              </div>
                            </div>
                          )
                        })}
                      {activeHabits.length === 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--ink3)', fontFamily: 'Fraunces', fontStyle: 'italic' }}>no habits planted yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <motion.div className="sg-footer"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
                <div>
                  <p className="sg-footer-lbl">today's intention</p>
                  <p className="sg-footer-msg">
                    {pct === 100
                      ? 'you bloomed fully today — be proud.'
                      : `${totalToday - todayDone} habit${totalToday - todayDone === 1 ? '' : 's'} left — tend them gently.`}
                  </p>
                </div>
                <div className="sg-footer-right">
                  <i className="ti ti-heart   sg-footer-ico" aria-hidden="true" />
                  <i className="ti ti-flower  sg-footer-ico" aria-hidden="true" />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ADD HABIT */}
          {activeTab === 'add' && (
            <motion.div key="add"
              initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}>
              <div className="sg-content-card" style={{ maxWidth: '520px' }}>
                <p className="sg-content-lbl">plant a new habit</p>
                <div className="hp-form">

                  <input className="hp-input"
                    placeholder="what will you tend to? e.g. read 20 pages"
                    value={name} onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addHabit()} />

                  <div>
                    <p className="form-lbl">category</p>
                    <div className="cat-grid">
                      {CATEGORIES.map(c => (
                        <button key={c.id}
                          className={`cat-btn${catId === c.id ? ' active' : ''}`}
                          onClick={() => setCatId(c.id)}
                          style={{
                            background: catId === c.id ? c.bg : undefined,
                            borderColor: catId === c.id ? c.c : undefined,
                          }}>
                          <i className={`ti ${c.icon}`}
                            style={{ color: catId === c.id ? c.c : 'var(--ink3)' }} aria-hidden="true" />
                          <span className="cat-btn-lbl"
                            style={{ color: catId === c.id ? c.c : 'var(--ink3)' }}>
                            {c.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="form-lbl">frequency</p>
                    <div className="freq-row">
                      {FREQ.map(f => (
                        <button key={f}
                          className={`freq-btn${freq === f ? ' active' : ''}`}
                          onClick={() => setFreq(f)}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="hp-submit" onClick={addHabit}
                    disabled={!name.trim() || saving}
                    style={{
                      background: name.trim() ? 'var(--petal)' : 'rgba(212,96,122,0.05)',
                      border: `1px solid ${name.trim() ? 'rgba(212,96,122,0.3)' : 'rgba(212,96,122,0.1)'}`,
                      color: name.trim() ? 'var(--rose)' : 'var(--ink3)',
                    }}>
                    <i className={`ti ${saving ? 'ti-loader-2 spinning' : saved ? 'ti-check' : 'ti-plus'}`} aria-hidden="true" />
                    {saving ? 'planting...' : saved ? 'habit planted' : 'plant habit'}
                  </button>

                  <AnimatePresence>
                    {saved && (
                      <motion.div className="sg-toast"
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        habit planted and growing
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ARCHIVE */}
          {activeTab === 'archive' && (
            <motion.div key="archive"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="sg-content-card">
                <p className="sg-content-lbl">resting habits</p>
                {archived.length === 0 ? (
                  <div className="empty">
                    <i className="ti ti-archive" />
                    <p className="empty-txt">nothing resting yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {archived.map((h, i) => {
                      const c = cat(h.category)
                      return (
                        <motion.div key={h.id} className="arch-item"
                          initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}>
                          <i className={`ti ${c.icon} arch-item-ico`}
                            style={{ color: c.c, opacity: 0.5 }} aria-hidden="true" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', opacity: 0.5 }}>{h.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--ink3)', marginTop: '2px' }}>{c.label} · {h.frequency}</div>
                          </div>
                          <button className="arch-action" onClick={() => restoreHabit(h.id)}
                            style={{ background: 'var(--sage)', border: '1px solid rgba(168,201,174,0.4)', color: '#5a8c63' }}>
                            <i className="ti ti-restore" style={{ fontSize: '11px' }} />
                            restore
                          </button>
                          <button className="arch-action" onClick={() => deleteHabit(h.id)}
                            style={{ background: 'var(--petal)', border: '1px solid rgba(212,96,122,0.25)', color: 'var(--rose)' }}>
                            <i className="ti ti-trash" style={{ fontSize: '11px' }} />
                            delete
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ── Divider — exact copy from dashboard ─────────────────────────────────────
function Divider({ label }) {
  return (
    <div className="sg-divider">
      <div className="sg-divider-line" />
      <i className="ti ti-circle sg-divider-flower" aria-hidden="true" />
      <span className="sg-divider-label">{label}</span>
      <i className="ti ti-circle sg-divider-flower" aria-hidden="true" />
      <div className="sg-divider-line" />
    </div>
  )
}

// ── LiveTime — exact copy from dashboard ─────────────────────────────────────
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