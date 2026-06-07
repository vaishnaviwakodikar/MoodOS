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
function getLastDayStr(y: number, m: number) {
  const last = new Date(y, m + 1, 0)
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}

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
  const firstDayStr = `${monthStr}-01`
  const lastDayStr  = getLastDayStr(viewMonth.year, viewMonth.month)

  const isCurrentMonth =
    viewMonth.year  === new Date().getFullYear() &&
    viewMonth.month === new Date().getMonth()

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setError('Not logged in. Please sign in to track attendance.')
        setLoading(false)
        return
      }
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch records ─────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstDayStr)
      .lte('date', lastDayStr)   // ✅ fixed: uses actual last day, not hardcoded -31
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
  }, [user, firstDayStr, lastDayStr])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDayClick = (dateStr: string) => {
    const existing = records.find(r => r.date === dateStr)
    setSelDate(dateStr)
    setSelStatus(existing?.status ?? null)
  }

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

  // ── Stats ─────────────────────────────────────────────────────────────────
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

  if (error && !user) {
    return (
      <div style={{ padding: 40, fontFamily: 'DM Sans, sans-serif', color: '#d4607a' }}>
        {error}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f0', fontFamily: 'DM Sans, sans-serif', padding: '24px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: '#3d2a35', margin: 0 }}>
              Attendance
            </h1>
            <p style={{ fontSize: 11, color: '#b09aa4', margin: '2px 0 0' }}>
              {MONTHS[viewMonth.month]} {viewMonth.year} · {pct}% present
            </p>
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => navMonth(-1)}
              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(61,42,53,.12)', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
              ‹
            </button>
            <button onClick={() => navMonth(1)}
              disabled={isCurrentMonth}
              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(61,42,53,.12)', background: '#fff', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', fontSize: 14, opacity: isCurrentMonth ? 0.35 : 1 }}>
              ›
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Present', value: present, ...STATUS_CONFIG.present },
            { label: 'Absent',  value: absent,  ...STATUS_CONFIG.absent  },
            { label: 'Holidays',value: holiday, ...STATUS_CONFIG.holiday },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: s.c, opacity: 0.7, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 300, color: s.c }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{ background: '#fff', border: '1px solid rgba(61,42,53,.09)', borderRadius: 14, padding: '14px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 8, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#d4bfc5', paddingBottom: 6 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
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
                    height: 40, borderRadius: 8, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                    cursor: isFuture ? 'not-allowed' : 'pointer',
                    border: `1.5px solid ${cfg ? cfg.border : isSel ? '#a8c9ae' : isToday ? '#d4bfc5' : 'transparent'}`,
                    background: cfg ? cfg.bg : isSel ? '#f0f8f0' : 'transparent',
                    opacity: isFuture ? 0.25 : 1,
                  }}>
                  <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: cfg ? cfg.c : isToday ? '#5a8c63' : '#7a5c68' }}>
                    {day}
                  </span>
                  {cfg && <div style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.c }} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Log form */}
        <div style={{ background: '#fff', border: '1px solid rgba(61,42,53,.09)', borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b09aa4', marginBottom: 12, margin: '0 0 12px' }}>
            Log attendance
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <input type="date" value={selDate} max={todayIso}
              onChange={e => { setSelDate(e.target.value); setSelStatus(null) }}
              style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(61,42,53,.12)', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fdf7f0' }} />
            <span style={{ fontSize: 11, color: '#b09aa4', whiteSpace: 'nowrap' }}>{selDateFormatted}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
              <button key={key}
                onClick={() => setSelStatus(selStatus === key ? null : key)}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: 9, cursor: 'pointer',
                  border: `1.5px solid ${selStatus === key ? cfg.border : 'rgba(61,42,53,.09)'}`,
                  background: selStatus === key ? cfg.bg : '#fdf7f0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  fontFamily: 'inherit', transition: '.15s',
                }}>
                <span style={{ fontSize: 16, color: selStatus === key ? cfg.c : '#b09aa4' }}>{cfg.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: selStatus === key ? cfg.c : '#b09aa4' }}>{cfg.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={saveAttendance}
            disabled={!selStatus || saving || !user}
            style={{
              width: '100%', padding: '9px', borderRadius: 8, border: 'none',
              cursor: selStatus && !saving ? 'pointer' : 'not-allowed',
              fontFamily: 'Georgia, serif', fontSize: 13, fontStyle: 'italic',
              background: selStatus ? '#3d2a35' : '#e8dde2', color: selStatus ? '#fff' : '#b09aa4',
              opacity: saving ? 0.6 : 1, transition: '.18s',
            }}>
            {saving ? 'Saving…' : saved ? 'Logged ✓' : selStatus ? `Mark as ${STATUS_CONFIG[selStatus].label}` : 'Select a status first'}
          </button>

          {saved && (
            <div style={{ marginTop: 8, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontStyle: 'italic', background: '#edf6ee', border: '1px solid #a8c9ae', color: '#5a8c63', textAlign: 'center' }}>
              Attendance logged — showing up matters 🌿
            </div>
          )}

          {error && (
            <div style={{ marginTop: 8, padding: '5px 10px', borderRadius: 6, fontSize: 11, background: '#fde8ee', border: '1px solid #e8a0b0', color: '#d4607a' }}>
              {error}
            </div>
          )}
        </div>

        {/* History */}
        <div style={{ background: '#fff', border: '1px solid rgba(61,42,53,.09)', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b09aa4', margin: 0 }}>
              {records.length} record{records.length !== 1 ? 's' : ''} · {MONTHS[viewMonth.month]}
            </p>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 12, fontStyle: 'italic', color: '#5a8c63' }}>{pct}% present</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#d4bfc5', fontSize: 12 }}>Loading…</div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#d4bfc5', fontSize: 12, fontStyle: 'italic' }}>
              Nothing logged for {MONTHS[viewMonth.month]} yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {records.map(rec => {
                const cfg = STATUS_CONFIG[rec.status]
                const d   = new Date(rec.date + 'T00:00:00')
                return (
                  <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 9, background: '#fdf7f0' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: cfg.c, flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#3d2a35' }}>
                        {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 10, color: '#b09aa4' }}>
                        {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                      </div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 600, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.c }}>
                      {cfg.label}
                    </span>
                    <button onClick={() => deleteRecord(rec.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4bfc5', fontSize: 13, padding: '2px 4px', borderRadius: 4 }}>
                      🗑
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}