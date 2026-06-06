'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Status = 'present' | 'absent' | 'holiday'

type AttendanceRecord = {
  id: string
  user_id: string
  date: string
  status: Status
  created_at: string
}

const STATUS_CONFIG = {
  present: { label: 'Present', icon: '✓', c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae' },
  absent:  { label: 'Absent',  icon: '✗', c: '#d4607a', bg: '#fde8ee', border: '#e8a0b0' },
  holiday: { label: 'Holiday', icon: '☀', c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4' },
} as const

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const todayIso = new Date().toISOString().slice(0, 10)

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay() }

export default function AttendancePage() {
  const supabase = createClient()

  const [user,      setUser]      = useState<User | null>(null)
  const [records,   setRecords]   = useState<AttendanceRecord[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [selStatus, setSelStatus] = useState<Status | null>(null)
  const [selDate,   setSelDate]   = useState(todayIso)
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const monthStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`
  const isCurrentMonth =
    viewMonth.year  === new Date().getFullYear() &&
    viewMonth.month === new Date().getMonth()

  // ── Auth: get current user on mount ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setError('Not logged in. Please sign in to track attendance.')
        setLoading(false)
        return
      }
      setUser(data.user)
    })

    // Listen for auth changes (e.g. token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch records whenever user or viewed month changes ───────────────────
  const fetchRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${monthStr}-01`)
      .lte('date', `${monthStr}-31`)
      .order('date', { ascending: false })

    if (error) {
      setError(`Failed to load records: ${error.message}`)
    } else {
      setRecords(
        (data ?? []).map(r => ({
          ...r,
          status: (r.status ?? 'present') as Status,
          created_at: r.created_at ?? '',
        }))
      )
    }
    setLoading(false)
  }, [user, monthStr])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // ── Clicking a calendar day pre-fills the form ────────────────────────────
  const handleDayClick = (dateStr: string) => {
    const existing = records.find(r => r.date === dateStr)
    setSelDate(dateStr)
    setSelStatus(existing?.status ?? null)
  }

  // ── Save / upsert a record ────────────────────────────────────────────────
  const saveAttendance = async () => {
    if (!selStatus || !user) return
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('attendance')
      .upsert(
        { user_id: user.id, date: selDate, status: selStatus },
        { onConflict: 'user_id,date' }
      )

    if (error) {
      setError(`Save failed: ${error.message}`)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      await fetchRecords()
    }
    setSaving(false)
  }

  // ── Delete a record ───────────────────────────────────────────────────────
  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('attendance').delete().eq('id', id)
    if (error) setError(`Delete failed: ${error.message}`)
    else await fetchRecords()
  }

  const navMonth = (dir: -1 | 1) => {
    setViewMonth(prev => {
      const d = new Date(prev.year, prev.month + dir, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const holiday = records.filter(r => r.status === 'holiday').length
  const total   = present + absent
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0

  const daysInMonth = getDaysInMonth(viewMonth.year, viewMonth.month)
  const firstDay    = getFirstDay(viewMonth.year, viewMonth.month)
  const recordMap   = Object.fromEntries(records.map(r => [r.date, r]))

  const selDateFormatted = selDate
    ? new Date(selDate + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : ''

  // ── Render ────────────────────────────────────────────────────────────────
  if (error && !user) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#d4607a' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: 210, background: '#3d2a35', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 8 }}>
        <h1 style={{ fontFamily: 'serif', color: '#fff', fontSize: 22, fontWeight: 300, fontStyle: 'italic', marginBottom: 4 }}>
          show up,<br /><span style={{ color: '#a8c9ae' }}>every day</span>
        </h1>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>track your presence</p>

        {[
          { label: 'Attendance', value: `${pct}%`,      color: '#a8c9ae' },
          { label: 'Present',    value: String(present), color: '#a8c9ae' },
          { label: 'Absent',     value: String(absent),  color: '#e8a0b0' },
          { label: 'Holidays',   value: String(holiday), color: '#f5ddb4' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 300, color: s.color }}>{s.value}</div>
          </div>
        ))}

        {error && (
          <div style={{ marginTop: 8, padding: '6px 8px', background: '#fde8ee', borderRadius: 6, fontSize: 10, color: '#d4607a' }}>
            {error}
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fdf7f0' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(61,42,53,.09)' }}>
          <span style={{ fontFamily: 'serif', fontSize: 16, fontStyle: 'italic', fontWeight: 300 }}>
            {MONTHS[viewMonth.month]} {viewMonth.year}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[-1, 1].map(dir => (
              <button key={dir}
                onClick={() => navMonth(dir as -1 | 1)}
                disabled={dir === 1 && isCurrentMonth}
                style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(61,42,53,.09)', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                {dir === -1 ? '‹' : '›'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Calendar */}
          <div style={{ background: '#fff', border: '1px solid rgba(61,42,53,.09)', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 7.5, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#d4bfc5', paddingBottom: 6 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day     = i + 1
                const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
                const rec     = recordMap[dateStr]
                const cfg     = rec ? STATUS_CONFIG[rec.status] : null
                const isToday  = dateStr === todayIso
                const isFuture = dateStr > todayIso
                const isSel    = dateStr === selDate
                return (
                  <div key={day}
                    onClick={() => !isFuture && handleDayClick(dateStr)}
                    style={{
                      height: 38, borderRadius: 7, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 2, cursor: isFuture ? 'not-allowed' : 'pointer',
                      border: `1.5px solid ${cfg ? cfg.border : isToday || isSel ? '#a8c9ae' : 'transparent'}`,
                      background: cfg ? cfg.bg : 'transparent',
                      opacity: isFuture ? 0.28 : 1,
                      outline: isSel && !cfg ? '2px solid #a8c9ae' : 'none',
                      outlineOffset: 1,
                    }}>
                    <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: cfg ? cfg.c : isToday ? '#5a8c63' : '#7a5c68' }}>
                      {day}
                    </span>
                    {cfg && <div style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.c }} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Log + History row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Log form */}
            <div style={{ background: '#fff', border: '1px solid rgba(61,42,53,.09)', borderRadius: 12, padding: 12 }}>
              <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b09aa4', marginBottom: 10 }}>Log attendance</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="date" value={selDate} max={todayIso}
                  onChange={e => { setSelDate(e.target.value); setSelStatus(null) }}
                  style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(61,42,53,.09)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                <span style={{ fontSize: 9.5, color: '#b09aa4', whiteSpace: 'nowrap' }}>{selDateFormatted}</span>
              </div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                  <button key={key}
                    onClick={() => setSelStatus(selStatus === key ? null : key)}
                    style={{
                      flex: 1, padding: '7px 3px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${selStatus === key ? cfg.border : 'rgba(61,42,53,.09)'}`,
                      background: selStatus === key ? cfg.bg : '#fdf7f0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      fontFamily: 'inherit',
                    }}>
                    <span style={{ fontSize: 14, color: selStatus === key ? cfg.c : '#b09aa4' }}>{cfg.icon}</span>
                    <span style={{ fontSize: 8.5, fontWeight: 600, color: selStatus === key ? cfg.c : '#b09aa4' }}>{cfg.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={saveAttendance}
                disabled={!selStatus || saving || !user}
                style={{
                  width: '100%', padding: '8px', borderRadius: 7, border: 'none', cursor: selStatus ? 'pointer' : 'not-allowed',
                  fontFamily: 'Georgia, serif', fontSize: 12, fontStyle: 'italic',
                  background: selStatus ? '#5a8c63' : '#3d2a35', color: '#fff', opacity: (!selStatus || saving) ? 0.4 : 1,
                  transition: '.18s',
                }}>
                {saving ? 'Saving…' : saved ? 'Logged ✓' : selStatus ? `Mark as ${STATUS_CONFIG[selStatus].label}` : 'Select a status first'}
              </button>

              {saved && (
                <div style={{ marginTop: 8, padding: '4px 8px', borderRadius: 5, fontSize: 10, fontStyle: 'italic', background: '#edf6ee', border: '1px solid #a8c9ae', color: '#5a8c63', textAlign: 'center' }}>
                  Attendance logged — showing up matters 🌿
                </div>
              )}
            </div>

            {/* History */}
            <div style={{ background: '#fff', border: '1px solid rgba(61,42,53,.09)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', maxHeight: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b09aa4' }}>
                  {records.length} record{records.length !== 1 ? 's' : ''} · {MONTHS[viewMonth.month]}
                </p>
                <span style={{ fontFamily: 'serif', fontSize: 12, fontStyle: 'italic', color: '#5a8c63' }}>{pct}% present</span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#d4bfc5', fontSize: 11 }}>Loading…</div>
                ) : records.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#d4bfc5', fontSize: 11, fontStyle: 'italic' }}>
                    Nothing logged for {MONTHS[viewMonth.month]} yet
                  </div>
                ) : records.map(rec => {
                  const cfg = STATUS_CONFIG[rec.status]
                  const d   = new Date(rec.date + 'T00:00:00')
                  return (
                    <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 6px', borderRadius: 7, marginBottom: 2 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: cfg.c, flexShrink: 0 }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 500, color: '#3d2a35' }}>
                          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 8.5, color: '#b09aa4' }}>
                          {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                        </div>
                      </div>
                      <span style={{ padding: '2px 6px', borderRadius: 999, fontSize: 7.5, fontWeight: 600, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.c }}>
                        {cfg.label}
                      </span>
                      <button onClick={() => deleteRecord(rec.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4bfc5', fontSize: 11, padding: '2px 4px', borderRadius: 4 }}>
                        🗑
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}