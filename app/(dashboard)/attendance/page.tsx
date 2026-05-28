'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

type Status = 'present' | 'absent' | 'holiday'

type AttendanceRecord = {
  id: string
  user_id: string
  date: string
  status: Status
  created_at: string
}

const STATUS_CONFIG = {
  present: { label: 'Present', icon: 'ti-check', c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae', dot: '#5a8c63' },
  absent:  { label: 'Absent',  icon: 'ti-x',     c: '#d4607a', bg: '#fde8ee', border: '#e8a0b0', dot: '#d4607a' },
  holiday: { label: 'Holiday', icon: 'ti-sun',   c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', dot: '#b8860b' },
} as const

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const todayIso = new Date().toISOString().slice(0, 10)

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.at {
  --sage:   #5a8c63; --sage2: #a8c9ae; --sage3: #edf6ee;
  --rose:   #d4607a; --rose2: #e8a0b0; --rose3: #fde8ee;
  --butter: #b8860b; --butter2: #f5ddb4; --butter3: #fef8e7;
  --cream:  #fdf7f0; --ink: #3d2a35; --ink2: #7a5c68;
  --ink3:   #b09aa4; --ink4: #d4bfc5; --card: #ffffff;
  --line:   rgba(61,42,53,0.08);
  font-family: 'DM Sans', sans-serif;
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
  color: var(--ink);
  background: var(--cream);
}

/* ── Sidebar ── */
.at-side {
  width: 210px;
  flex-shrink: 0;
  background: var(--ink);
  display: flex;
  flex-direction: column;
  padding: 24px 16px 18px;
  gap: 0;
  overflow: hidden;
}

.at-eyebrow {
  font-size: 8px; font-weight: 600; letter-spacing: 3px;
  text-transform: uppercase; color: var(--sage2);
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
}
.at-eyebrow::before { content: ''; width: 12px; height: 1px; background: var(--sage2); display: block; }

.at-h1 {
  font-family: 'Fraunces', serif;
  font-size: 23px; font-weight: 300; font-style: italic;
  letter-spacing: -0.5px; line-height: 1.1; color: #fff; margin-bottom: 3px;
}
.at-h1 em { color: var(--sage2); }
.at-sub { font-size: 10px; color: rgba(255,255,255,.3); margin-bottom: 16px; }

.at-stats { display: flex; flex-direction: column; gap: 6px; }

.at-stat {
  border-radius: 9px; padding: 10px 12px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07);
  flex-shrink: 0;
}
.at-stat-lbl { font-size: 7.5px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,.3); margin-bottom: 2px; }
.at-stat-val { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; letter-spacing: -1px; line-height: 1; margin-bottom: 1px; }
.at-stat-sub { font-size: 9px; color: rgba(255,255,255,.25); }
.at-bar { height: 2px; border-radius: 999px; background: rgba(255,255,255,.1); overflow: hidden; margin-top: 6px; }
.at-bar-fill { height: 100%; border-radius: 999px; transition: width .7s cubic-bezier(.16,1,.3,1); }

.at-spacer { flex: 1; }

.at-side-footer {
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}
.at-footer-lbl { font-size: 7px; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,255,255,.25); margin-bottom: 3px; }
.at-footer-txt { font-family: 'Fraunces', serif; font-style: italic; font-size: 11px; font-weight: 300; color: rgba(255,255,255,.45); line-height: 1.55; }

/* ── Main area ── */
.at-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--cream);
}

/* Topbar */
.at-topbar {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px 11px;
  border-bottom: 1px solid var(--line);
  background: var(--cream);
}
.at-monlabel { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 300; font-style: italic; color: var(--ink); letter-spacing: -.3px; }
.at-monbtns  { display: flex; gap: 5px; }
.at-monarrow {
  width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--line);
  background: var(--card); display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink3); font-size: 11px; transition: .15s;
}
.at-monarrow:hover { color: var(--sage); background: var(--sage3); border-color: var(--sage2); }
.at-monarrow:disabled { opacity: .25; cursor: not-allowed; }

/* Scrollable content area */
.at-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.at-content::-webkit-scrollbar { width: 3px; }
.at-content::-webkit-scrollbar-thumb { background: var(--ink4); border-radius: 99px; }

/* ── Calendar ── */
.at-cal { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px; flex-shrink: 0; }
.at-cal-days { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 2px; }
.at-cal-day-lbl { text-align: center; font-size: 8px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--ink4); padding: 2px 0 4px; }
.at-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }

/* FIXED: compact day cells — no aspect-ratio trap */
.at-day {
  height: 38px;
  border-radius: 7px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px;
  cursor: pointer; border: 1.5px solid transparent; transition: all .12s;
}
.at-day:hover:not(.empty):not(.future) { border-color: var(--sage2); background: var(--sage3); }
.at-day.empty { cursor: default; pointer-events: none; }
.at-day.today { border-color: var(--sage2) !important; }
.at-day.today .at-day-num { font-weight: 700; color: var(--sage) !important; }
.at-day-num { font-size: 11px; font-weight: 500; color: var(--ink2); line-height: 1; }
.at-day-dot { width: 4px; height: 4px; border-radius: 50%; }
.at-day.future { opacity: .28; cursor: not-allowed; pointer-events: none; }

/* ── Bottom two-col row ── */
.at-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex: 1; min-height: 0; }

.at-card {
  background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px;
  display: flex; flex-direction: column; min-height: 0;
}

.at-sec-title {
  font-size: 8px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
  color: var(--ink3); margin-bottom: 10px; display: flex; align-items: center; gap: 5px; flex-shrink: 0;
}
.at-sec-title i { font-size: 12px; color: var(--sage); }

/* Log form */
.at-date-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; flex-shrink: 0; }
.at-date-in {
  flex: 1; padding: 6px 9px; border-radius: 7px; background: var(--cream);
  border: 1px solid var(--line); color: var(--ink); font-size: 12px;
  font-family: 'DM Sans', sans-serif; outline: none; transition: .15s; min-width: 0;
}
.at-date-in:focus { border-color: rgba(90,140,99,.4); background: #fff; box-shadow: 0 0 0 3px rgba(90,140,99,.06); }
.at-date-label { font-size: 10px; color: var(--ink3); white-space: nowrap; flex-shrink: 0; }

.at-status-row { display: flex; gap: 5px; margin-bottom: 9px; flex-shrink: 0; }
.at-status-btn {
  flex: 1; padding: 8px 4px; border-radius: 9px;
  border: 1.5px solid var(--line); background: var(--cream);
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  cursor: pointer; transition: all .12s; font-family: 'DM Sans', sans-serif;
}
.at-status-btn:hover { transform: translateY(-1px); }
.at-status-btn i { font-size: 14px; }
.at-status-btn span { font-size: 9px; font-weight: 600; }

.at-save-btn {
  width: 100%; padding: 8px; border-radius: 8px; border: none;
  font-family: 'Fraunces', serif; font-size: 12.5px; font-style: italic; font-weight: 300;
  cursor: pointer; transition: .18s; background: var(--ink); color: #fff; flex-shrink: 0;
}
.at-save-btn:hover:not(:disabled) { background: var(--sage); transform: translateY(-1px); }
.at-save-btn:disabled { opacity: .35; cursor: not-allowed; }
.at-save-btn.ready { background: var(--sage); }
.at-save-btn.ready:hover { background: #3d6b45; }

.at-toast {
  padding: 5px 9px; border-radius: 6px; font-size: 10.5px; font-style: italic;
  font-family: 'Fraunces', serif; background: var(--sage3); border: 1px solid var(--sage2);
  color: var(--sage); text-align: center; margin-top: 8px; flex-shrink: 0;
}

/* History */
.at-hist-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-shrink: 0; }
.at-hist-pct  { font-family: 'Fraunces', serif; font-size: 12px; font-weight: 300; color: var(--sage); font-style: italic; }

.at-hist-inner {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}
.at-hist-inner::-webkit-scrollbar { width: 2px; }
.at-hist-inner::-webkit-scrollbar-thumb { background: var(--ink4); border-radius: 99px; }

.at-hist-item {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 7px; border-radius: 8px; margin-bottom: 3px; transition: .12s;
}
.at-hist-item:hover { background: var(--cream); }
.at-hist-icon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.at-hist-date { font-size: 11px; font-weight: 500; color: var(--ink); flex: 1; min-width: 0; }
.at-hist-day  { font-size: 9px; color: var(--ink3); margin-top: 1px; }
.at-hist-badge { padding: 2px 7px; border-radius: 999px; font-size: 8px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
.at-hist-del  { background: none; border: none; cursor: pointer; color: var(--ink4); font-size: 11px; padding: 2px 4px; border-radius: 5px; transition: .12s; flex-shrink: 0; }
.at-hist-del:hover { color: var(--rose); background: var(--rose3); }

.at-empty { text-align: center; padding: 20px 12px; color: var(--ink4); font-size: 11px; font-style: italic; font-family: 'Fraunces', serif; }
.at-empty i { font-size: 18px; display: block; margin-bottom: 7px; opacity: .3; }

/* ── Responsive ── */
@media (max-width: 860px) {
  .at-side { width: 185px; padding: 20px 14px 16px; }
  .at-row2  { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .at { flex-direction: column; height: auto; overflow: auto; }
  .at-side {
    width: 100%; flex-direction: row; flex-wrap: wrap;
    padding: 14px; gap: 10px; overflow: visible;
  }
  .at-side > div:first-child { width: 100%; }
  .at-stats { flex-direction: row; flex-wrap: wrap; gap: 6px; }
  .at-stat { flex: 1 1 calc(50% - 3px); }
  .at-spacer, .at-side-footer { display: none; }
  .at-main { overflow: visible; height: auto; }
  .at-content { overflow: visible; }
  .at-row2 { grid-template-columns: 1fr; }
}
`

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay() }

export default function AttendancePage() {
  const supabase = createClient()

  const [records,   setRecords]   = useState<AttendanceRecord[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [selStatus, setSelStatus] = useState<Status | null>(null)
  const [selDate,   setSelDate]   = useState(todayIso)
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }
  })

  const isCurrentMonth = viewMonth.year === new Date().getFullYear() && viewMonth.month === new Date().getMonth()
  const monthStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('attendance').select('*')
      .eq('user_id', user.id)
      .gte('date', `${monthStr}-01`)
      .lte('date', `${monthStr}-31`)
      .order('date', { ascending: false })
    setRecords((data || []).map(r => ({ ...r, status: (r.status ?? 'present') as Status, created_at: r.created_at ?? '' })))
    setLoading(false)
  }, [monthStr])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // When clicking a calendar date, pre-fill the form
  const handleDayClick = (dateStr: string) => {
    const existing = records.find(r => r.date === dateStr)
    setSelDate(dateStr)
    setSelStatus(existing?.status ?? null)
  }

  const saveAttendance = async () => {
    if (!selStatus) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await (supabase.from('attendance') as any).upsert(
      { user_id: user.id, date: selDate, status: selStatus },
      { onConflict: 'user_id,date' }
    )
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    fetchRecords()
  }

  const deleteRecord = async (id: string) => {
    await supabase.from('attendance').delete().eq('id', id)
    fetchRecords()
  }

  const navMonth = (dir: -1 | 1) => {
    setViewMonth(prev => {
      const d = new Date(prev.year, prev.month + dir, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const daysInMonth = getDaysInMonth(viewMonth.year, viewMonth.month)
  const firstDay    = getFirstDay(viewMonth.year, viewMonth.month)
  const recordMap   = Object.fromEntries(records.map(r => [r.date, r]))

  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const holiday = records.filter(r => r.status === 'holiday').length
  const total   = present + absent
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0
  const barColor = pct >= 75 ? '#5a8c63' : pct >= 50 ? '#b8860b' : '#d4607a'

  const footerMsg =
    pct >= 90 ? 'Excellent attendance — you show up beautifully.' :
    pct >= 75 ? 'Good consistency — keep the momentum.' :
    pct >= 50 ? 'Halfway there — every day counts.' :
    records.length > 0 ? 'Small steps still move you forward.' :
    'Start tracking — every day is a new leaf.'

  const selDateFormatted = selDate
    ? new Date(selDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : ''

  return (
    <>
      <style>{css}</style>
      <div className="at">

        {/* ── Sidebar ── */}
        <div className="at-side">
          <div>
            <p className="at-eyebrow">attendance tracker</p>
            <h1 className="at-h1">show up,<br /><em>every day</em></h1>
            <p className="at-sub">track your presence</p>
          </div>

          <div className="at-stats">
            {[
              { label: 'Attendance', value: `${pct}%`,      sub: `${present} of ${total} days`, color: '#a8c9ae', bar: true  },
              { label: 'Present',    value: String(present), sub: 'days present',                color: '#a8c9ae', bar: false },
              { label: 'Absent',     value: String(absent),  sub: 'days absent',                 color: '#e8a0b0', bar: false },
              { label: 'Holidays',   value: String(holiday), sub: 'days off',                    color: '#f5ddb4', bar: false },
            ].map((s, i) => (
              <motion.div key={s.label} className="at-stat"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: .06 * i + .08 }}>
                <div className="at-stat-lbl">{s.label}</div>
                <div className="at-stat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="at-stat-sub">{s.sub}</div>
                {s.bar && (
                  <div className="at-bar">
                    <motion.div className="at-bar-fill"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: .8, ease: [.16, 1, .3, 1] }}
                      style={{ background: barColor }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="at-spacer" />

          <div className="at-side-footer">
            <p className="at-footer-lbl">your story</p>
            <p className="at-footer-txt">{footerMsg}</p>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="at-main">

          <div className="at-topbar">
            <span className="at-monlabel">{MONTHS[viewMonth.month]} {viewMonth.year}</span>
            <div className="at-monbtns">
              <button className="at-monarrow" onClick={() => navMonth(-1)}>
                <i className="ti ti-chevron-left" />
              </button>
              <button className="at-monarrow" onClick={() => navMonth(1)} disabled={isCurrentMonth}>
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>

          <div className="at-content">

            {/* Calendar */}
            <motion.div className="at-cal"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}>
              <div className="at-cal-days">
                {DAYS.map(d => <div key={d} className="at-cal-day-lbl">{d}</div>)}
              </div>
              <div className="at-cal-grid">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} className="at-day empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day     = i + 1
                  const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
                  const rec     = recordMap[dateStr]
                  const cfg     = rec ? STATUS_CONFIG[rec.status] : null
                  const isToday = dateStr === todayIso
                  const isFuture = dateStr > todayIso
                  const isSelected = dateStr === selDate
                  return (
                    <motion.div key={day}
                      className={`at-day${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`}
                      style={{
                        background: cfg ? cfg.bg : 'transparent',
                        borderColor: cfg ? cfg.border
                          : isSelected ? 'var(--sage2)'
                          : isToday ? 'var(--sage2)'
                          : 'transparent',
                        outline: isSelected && !cfg ? '2px solid var(--sage2)' : 'none',
                        outlineOffset: '1px',
                      }}
                      onClick={() => !isFuture && handleDayClick(dateStr)}
                      whileHover={!isFuture ? { scale: 1.07 } : {}}
                      whileTap={!isFuture   ? { scale: 0.93 } : {}}>
                      <span className="at-day-num"
                        style={{ color: cfg ? cfg.c : isToday ? 'var(--sage)' : 'var(--ink2)' }}>
                        {day}
                      </span>
                      {cfg && <div className="at-day-dot" style={{ background: cfg.dot }} />}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Log + History */}
            <div className="at-row2">

              {/* Log */}
              <motion.div className="at-card"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 }}>
                <p className="at-sec-title"><i className="ti ti-calendar-plus" /> Log attendance</p>

                <div className="at-date-row">
                  <input type="date" className="at-date-in" value={selDate} max={todayIso}
                    onChange={e => { setSelDate(e.target.value); setSelStatus(null) }} />
                  {selDateFormatted && (
                    <span className="at-date-label">{selDateFormatted}</span>
                  )}
                </div>

                <div className="at-status-row">
                  {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                    <button key={key} className="at-status-btn"
                      onClick={() => setSelStatus(selStatus === key ? null : key)}
                      style={selStatus === key ? { background: cfg.bg, borderColor: cfg.border } : {}}>
                      <i className={`ti ${cfg.icon}`} style={{ color: selStatus === key ? cfg.c : 'var(--ink3)' }} />
                      <span style={{ color: selStatus === key ? cfg.c : 'var(--ink3)' }}>{cfg.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  className={`at-save-btn${selStatus ? ' ready' : ''}`}
                  onClick={saveAttendance}
                  disabled={!selStatus || saving}>
                  {saving ? 'Saving…' : saved ? 'Logged ✓' : selStatus ? `Mark as ${STATUS_CONFIG[selStatus].label}` : 'Select a status first'}
                </button>

                <AnimatePresence>
                  {saved && (
                    <motion.div className="at-toast"
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      Attendance logged — showing up matters 🌿
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* History */}
              <motion.div className="at-card"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22 }}>
                <div className="at-hist-head">
                  <p className="at-sec-title" style={{ marginBottom: 0 }}>
                    <i className="ti ti-clock" />
                    {records.length} record{records.length !== 1 ? 's' : ''} · {MONTHS[viewMonth.month]}
                  </p>
                  <span className="at-hist-pct">{pct}% present</span>
                </div>

                <div className="at-hist-inner">
                  {loading ? (
                    <div className="at-empty"><i className="ti ti-loader-2" /></div>
                  ) : records.length === 0 ? (
                    <div className="at-empty">
                      <i className="ti ti-calendar" />
                      Nothing logged for {MONTHS[viewMonth.month]} yet
                    </div>
                  ) : (
                    <AnimatePresence>
                      {records.map((rec, i) => {
                        const cfg = STATUS_CONFIG[rec.status]
                        const d   = new Date(rec.date + 'T00:00:00')
                        return (
                          <motion.div key={rec.id} className="at-hist-item"
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }} transition={{ delay: i * .02 }}>
                            <div className="at-hist-icon"
                              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                              <i className={`ti ${cfg.icon}`} style={{ color: cfg.c }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="at-hist-date">
                                {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="at-hist-day">
                                {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                              </div>
                            </div>
                            <span className="at-hist-badge"
                              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.c }}>
                              {cfg.label}
                            </span>
                            <button className="at-hist-del" onClick={() => deleteRecord(rec.id)}>
                              <i className="ti ti-trash" />
                            </button>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </div>

      </div>
    </>
  )
}