'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

type Status = 'present' | 'absent' | 'holiday'

type AttendanceRecord = {
  id: string
  user_id: string
  date: string
  status: Status
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  present: { label: 'Present',  icon: 'ti-check',        c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae', dot: '#5a8c63' },
  absent:  { label: 'Absent',   icon: 'ti-x',            c: '#d4607a', bg: '#fde8ee', border: '#e8a0b0', dot: '#d4607a' },
  holiday: { label: 'Holiday',  icon: 'ti-sun',          c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', dot: '#b8860b' },
} as const

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const todayIso = new Date().toISOString().slice(0, 10)

// ── CSS ──────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.at {
  --sage:    #5a8c63;
  --sage2:   #a8c9ae;
  --sage3:   #edf6ee;
  --rose:    #d4607a;
  --rose2:   #e8a0b0;
  --rose3:   #fde8ee;
  --butter:  #b8860b;
  --butter2: #f5ddb4;
  --butter3: #fef8e7;
  --cream:   #fdf7f0;
  --ink:     #3d2a35;
  --ink2:    #7a5c68;
  --ink3:    #b09aa4;
  --ink4:    #d4bfc5;
  --card:    #ffffff;
  --line:    rgba(61,42,53,0.08);
  font-family: 'DM Sans', sans-serif;
  background: var(--cream);
  color: var(--ink);
  min-height: 100vh;
  overflow-x: hidden;
}

.at-wrap { max-width: 900px; margin: 0 auto; padding: clamp(20px,4vw,48px) clamp(20px,4vw,40px) 80px; }

/* ── Header ── */
.at-header { margin-bottom: 40px; }
.at-eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: 3.5px;
  text-transform: uppercase; color: var(--sage); margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.at-eyebrow::before { content: ''; width: 20px; height: 1.5px; background: var(--sage); display: block; }
.at-h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(34px, 6vw, 56px); font-weight: 300; font-style: italic;
  letter-spacing: -1.5px; line-height: 1.0; color: var(--ink); margin-bottom: 10px;
}
.at-h1 em { color: var(--sage); font-style: italic; }
.at-sub { font-size: 13px; color: var(--ink3); display: flex; align-items: center; gap: 8px; }
.at-sub::before { content: ''; width: 1px; height: 22px; background: var(--sage2); display: block; }

/* ── Stats ── */
.at-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 36px; }
.at-stat { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 18px 16px; position: relative; overflow: hidden; transition: transform .2s; }
.at-stat:hover { transform: translateY(-3px); }
.at-stat::after { content: attr(data-n); position: absolute; bottom: -10px; right: 6px; font-family: 'Fraunces', serif; font-size: 56px; opacity: .04; pointer-events: none; line-height: 1; }
.at-stat-lbl { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; }
.at-stat-val { font-family: 'Fraunces', serif; font-size: clamp(22px,3vw,32px); font-weight: 300; letter-spacing: -1px; line-height: 1; margin-bottom: 4px; }
.at-stat-sub { font-size: 10px; color: var(--ink4); }

/* ── Month nav ── */
.at-monnav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.at-monlabel { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; font-style: italic; color: var(--ink); letter-spacing: -.5px; }
.at-monarrow { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--line); background: var(--card); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink3); font-size: 15px; transition: .15s; }
.at-monarrow:hover { color: var(--sage); background: var(--sage3); border-color: var(--sage2); }
.at-monarrow:disabled { opacity: .25; cursor: not-allowed; }
.at-monbtns { display: flex; gap: 8px; }

/* ── Calendar ── */
.at-cal { background: var(--card); border: 1px solid var(--line); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
.at-cal-days { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; margin-bottom: 8px; }
.at-cal-day-lbl { text-align: center; font-size: 9.5px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink4); padding: 6px 0; }
.at-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 5px; }

.at-day {
  aspect-ratio: 1; border-radius: 12px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px;
  cursor: pointer; border: 1.5px solid transparent;
  transition: all .15s; position: relative; font-size: 12px; font-weight: 500;
}
.at-day:hover { border-color: var(--sage2); background: var(--sage3); }
.at-day.empty { cursor: default; pointer-events: none; }
.at-day.today { border-color: var(--sage2) !important; }
.at-day.today .at-day-num { font-weight: 700; }
.at-day-num { font-size: 12px; font-weight: 500; color: var(--ink2); line-height: 1; }
.at-day-dot { width: 5px; height: 5px; border-radius: 50%; }
.at-day.future { opacity: .35; cursor: not-allowed; pointer-events: none; }

/* ── Log strip ── */
.at-logstrip { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 20px 22px; margin-bottom: 24px; }
.at-logstrip-title { font-size: 9.5px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.at-logstrip-title i { font-size: 13px; color: var(--sage); }
.at-status-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }

.at-status-btn {
  flex: 1; min-width: 100px; padding: 14px 12px; border-radius: 16px;
  border: 1.5px solid var(--line); background: var(--cream);
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  cursor: pointer; transition: all .18s; font-family: 'DM Sans', sans-serif;
}
.at-status-btn:hover { transform: translateY(-2px); }
.at-status-btn i { font-size: 20px; }
.at-status-btn span { font-size: 11px; font-weight: 600; letter-spacing: .3px; }

.at-date-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.at-date-in { flex: 1; padding: 10px 13px; border-radius: 10px; background: var(--cream); border: 1px solid var(--line); color: var(--ink); font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: .15s; }
.at-date-in:focus { border-color: rgba(90,140,99,.4); background: #fff; box-shadow: 0 0 0 3px rgba(90,140,99,.06); }

.at-save-btn { width: 100%; padding: 13px; border-radius: 12px; border: none; font-family: 'Fraunces', serif; font-size: 15px; font-style: italic; font-weight: 300; cursor: pointer; transition: .18s; background: var(--ink); color: #fff; }
.at-save-btn:hover:not(:disabled) { background: var(--sage); transform: translateY(-1px); }
.at-save-btn:disabled { opacity: .35; cursor: not-allowed; }
.at-save-btn.ready { background: var(--sage); }
.at-save-btn.ready:hover { background: #3d6b45; }

/* ── Toast ── */
.at-toast { padding: 10px 14px; border-radius: 10px; font-size: 12px; font-style: italic; font-family: 'Fraunces', serif; background: var(--sage3); border: 1px solid var(--sage2); color: var(--sage); text-align: center; margin-top: 10px; }

/* ── History list ── */
.at-history { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 20px 22px; }
.at-history-title { font-size: 9.5px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
.at-history-title i { font-size: 13px; color: var(--sage); }
.at-hist-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; margin-bottom: 6px; transition: .15s; }
.at-hist-item:hover { background: var(--cream); }
.at-hist-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.at-hist-date { font-size: 13px; font-weight: 500; color: var(--ink); flex: 1; }
.at-hist-day  { font-size: 10px; color: var(--ink3); margin-top: 1px; }
.at-hist-badge { padding: 4px 11px; border-radius: 999px; font-size: 10px; font-weight: 600; letter-spacing: .3px; }
.at-hist-del { background: none; border: none; cursor: pointer; color: var(--ink4); font-size: 13px; padding: 4px 6px; border-radius: 6px; transition: .15s; }
.at-hist-del:hover { color: var(--rose); background: var(--rose3); }

/* ── Empty ── */
.at-empty { text-align: center; padding: 36px 20px; color: var(--ink4); font-size: 13px; font-style: italic; font-family: 'Fraunces', serif; }
.at-empty i { font-size: 28px; display: block; margin-bottom: 10px; opacity: .3; }

/* ── Progress bar ── */
.at-bar { height: 6px; border-radius: 999px; background: rgba(61,42,53,.07); overflow: hidden; margin-top: 8px; }
.at-bar-fill { height: 100%; border-radius: 999px; transition: width .7s cubic-bezier(.16,1,.3,1); }

/* ── Footer ── */
.at-footer { margin-top: 36px; padding: 22px 26px; border-radius: 20px; background: var(--card); border: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.at-footer-msg { font-family: 'Fraunces', serif; font-style: italic; font-size: 15px; font-weight: 300; color: var(--ink2); }
.at-footer-lbl { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--ink4); margin-bottom: 4px; }
.at-footer-icons { display: flex; gap: 8px; font-size: 19px; color: var(--sage2); flex-shrink: 0; }

@media (max-width: 640px) {
  .at-stats { grid-template-columns: repeat(2,1fr); }
  .at-day-num { font-size: 10px; }
  .at-status-btn { min-width: 80px; padding: 11px 8px; }
}
`

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function AttendancePage() {
  const supabase = createClient()

  const [records,    setRecords]    = useState<AttendanceRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [selStatus,  setSelStatus]  = useState<Status | null>(null)
  const [selDate,    setSelDate]    = useState(todayIso)

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const isCurrentMonth = viewMonth.year === new Date().getFullYear() && viewMonth.month === new Date().getMonth()

  const monthStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${monthStr}-01`)
      .lte('date', `${monthStr}-31`)
      .order('date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }, [monthStr])

  useEffect(() => { fetchRecords() }, [fetchRecords])

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

  // ── Calendar data ──
  const daysInMonth  = getDaysInMonth(viewMonth.year, viewMonth.month)
  const firstDay     = getFirstDayOfMonth(viewMonth.year, viewMonth.month)
  const recordMap    = Object.fromEntries(records.map(r => [r.date, r]))

  // ── Stats ──
  const present  = records.filter(r => r.status === 'present').length
  const absent   = records.filter(r => r.status === 'absent').length
  const holiday  = records.filter(r => r.status === 'holiday').length
  const total    = present + absent
  const pct      = total > 0 ? Math.round((present / total) * 100) : 0

  const footerMsg =
    pct >= 90 ? 'Excellent attendance — you show up beautifully.' :
    pct >= 75 ? 'Good consistency — keep the momentum.' :
    pct >= 50 ? 'Halfway there — every day counts.' :
    records.length > 0 ? 'Small steps still move you forward.' :
    'Start tracking — every day is a new leaf.'

  return (
    <>
      <style>{css}</style>
      <div className="at">
        <div className="at-wrap">

          {/* Header */}
          <motion.div className="at-header"
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
            <p className="at-eyebrow">attendance tracker</p>
            <h1 className="at-h1">show up,<br /><em>every day</em></h1>
            <p className="at-sub">track your presence with intention</p>
          </motion.div>

          {/* Stats */}
          <div className="at-stats">
            {[
              { label: 'attendance',  value: `${pct}%`,         sub: `${present} of ${total} days`,  color: '#5a8c63', n: '%' },
              { label: 'present',     value: String(present),   sub: 'days present',                 color: '#5a8c63', n: '✓' },
              { label: 'absent',      value: String(absent),    sub: 'days absent',                  color: '#d4607a', n: '✗' },
              { label: 'holidays',    value: String(holiday),   sub: 'days off',                     color: '#b8860b', n: '☀' },
            ].map((s, i) => (
              <motion.div key={s.label} className="at-stat" data-n={s.n}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .06 * i + .1 }}>
                <div className="at-stat-lbl">{s.label}</div>
                <div className="at-stat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="at-stat-sub">{s.sub}</div>
                {s.label === 'attendance' && (
                  <div className="at-bar" style={{ marginTop: 10 }}>
                    <motion.div className="at-bar-fill"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: .8, ease: [.16,1,.3,1] }}
                      style={{ background: pct >= 75 ? '#5a8c63' : pct >= 50 ? '#b8860b' : '#d4607a' }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Month nav */}
          <div className="at-monnav">
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

          {/* Calendar */}
          <motion.div className="at-cal"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .2 }}>
            <div className="at-cal-days">
              {DAYS.map(d => <div key={d} className="at-cal-day-lbl">{d}</div>)}
            </div>
            <div className="at-cal-grid">
              {/* empty cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} className="at-day empty" />
              ))}
              {/* day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day     = i + 1
                const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
                const rec     = recordMap[dateStr]
                const cfg     = rec ? STATUS_CONFIG[rec.status] : null
                const isToday = dateStr === todayIso
                const isFuture = dateStr > todayIso

                return (
                  <motion.div
                    key={day}
                    className={`at-day${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`}
                    style={{
                      background: cfg ? cfg.bg : 'transparent',
                      borderColor: cfg ? cfg.border : isToday ? 'var(--sage2)' : 'transparent',
                    }}
                    onClick={() => { if (!isFuture) { setSelDate(dateStr); setSelStatus(rec?.status ?? null) } }}
                    whileHover={!isFuture ? { scale: 1.06 } : {}}
                    whileTap={!isFuture ? { scale: 0.94 } : {}}
                  >
                    <span className="at-day-num" style={{ color: cfg ? cfg.c : isToday ? 'var(--sage)' : 'var(--ink2)' }}>
                      {day}
                    </span>
                    {cfg && <div className="at-day-dot" style={{ background: cfg.dot }} />}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Log strip */}
          <motion.div className="at-logstrip"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .28 }}>
            <p className="at-logstrip-title"><i className="ti ti-calendar-plus" /> Log attendance</p>

            <div className="at-date-row">
              <input
                type="date"
                className="at-date-in"
                value={selDate}
                max={todayIso}
                onChange={e => setSelDate(e.target.value)}
              />
              {selDate && (
                <span style={{ fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                  {new Date(selDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>

            <div className="at-status-row">
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  className="at-status-btn"
                  onClick={() => setSelStatus(selStatus === key ? null : key)}
                  style={selStatus === key ? { background: cfg.bg, borderColor: cfg.border } : {}}
                >
                  <i className={`ti ${cfg.icon}`} style={{ color: selStatus === key ? cfg.c : 'var(--ink3)' }} />
                  <span style={{ color: selStatus === key ? cfg.c : 'var(--ink3)' }}>{cfg.label}</span>
                </button>
              ))}
            </div>

            <button
              className={`at-save-btn${selStatus ? ' ready' : ''}`}
              onClick={saveAttendance}
              disabled={!selStatus || saving}
            >
              {saving ? 'Saving…' : saved ? 'Logged ✓' : selStatus ? `Mark as ${STATUS_CONFIG[selStatus].label}` : 'Select a status first'}
            </button>

            <AnimatePresence>
              {saved && (
                <motion.div className="at-toast"
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  Attendance logged — showing up matters 🌿
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* History */}
          <motion.div className="at-history"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .34 }}>
            <div className="at-history-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-clock" />
                {records.length} record{records.length !== 1 ? 's' : ''} in {MONTHS[viewMonth.month]}
              </span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 300, color: 'var(--sage)', fontStyle: 'italic' }}>
                {pct}% present
              </span>
            </div>

            {loading ? (
              <div className="at-empty">
                <i className="ti ti-loader-2" style={{ fontSize: 24, color: 'var(--ink4)', display: 'block', marginBottom: 10 }} />
              </div>
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
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * .03 }}>
                      <div className="at-hist-icon" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <i className={`ti ${cfg.icon}`} style={{ color: cfg.c }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="at-hist-date">
                          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="at-hist-day">
                          {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                        </div>
                      </div>
                      <span className="at-hist-badge" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.c }}>
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
          </motion.div>

          {/* Footer */}
          <motion.div className="at-footer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}>
            <div>
              <p className="at-footer-lbl">your attendance story</p>
              <p className="at-footer-msg">{footerMsg}</p>
            </div>
            <div className="at-footer-icons">
              <i className="ti ti-leaf" />
              <i className="ti ti-calendar-check" />
            </div>
          </motion.div>

        </div>
      </div>
    </>
  )
}