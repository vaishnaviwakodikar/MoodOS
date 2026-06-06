'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateStreak } from '@/lib/updateStreak'
import { useTheme } from '@/lib/useTheme'
import { createClient } from '@/lib/supabase'

// ── Constants ──────────────────────────────────────────────────────────────

const moods = [
  { label: 'Amazing',  score: 5, c: '#d4607a', bg: '#fde8ee', border: '#f2b3c0', lightBg: '#fde8ee', lightBorder: '#e8a0b0', lightText: '#7a1a35', icon: 'ti-star' },
  { label: 'Happy',    score: 4, c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae', lightBg: '#edf6ee', lightBorder: '#a8c9ae', lightText: '#2a5c33', icon: 'ti-mood-smile' },
  { label: 'Focused',  score: 4, c: '#9b7ec8', bg: '#f3edfb', border: '#c9b8e8', lightBg: '#f3edfb', lightBorder: '#c9b8e8', lightText: '#4a2a80', icon: 'ti-target' },
  { label: 'Okay',     score: 3, c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', lightBg: '#fef8e7', lightBorder: '#f5ddb4', lightText: '#7a5c00', icon: 'ti-minus' },
  { label: 'Tired',    score: 2, c: '#b09aa4', bg: '#f5f0f2', border: '#d4c4ca', lightBg: '#f5f0f2', lightBorder: '#d4c4ca', lightText: '#5c3d4a', icon: 'ti-zzz' },
  { label: 'Anxious',  score: 2, c: '#c07840', bg: '#fdf0e6', border: '#e8c4a0', lightBg: '#fdf0e6', lightBorder: '#e8c4a0', lightText: '#7a4010', icon: 'ti-alert-triangle' },
  { label: 'Sad',      score: 1, c: '#7a8cb8', bg: '#eef0f8', border: '#b8c0e0', lightBg: '#eef0f8', lightBorder: '#b8c0e0', lightText: '#2a3468', icon: 'ti-mood-sad' },
  { label: 'Stressed', score: 1, c: '#c05878', bg: '#fbe8ee', border: '#e8b0c0', lightBg: '#fbe8ee', lightBorder: '#e8b0c0', lightText: '#6b1a30', icon: 'ti-flame' },
] as const

// Pre-build a lookup map so getMoodConfig is O(1) instead of O(n)
const moodMap = new Map(moods.map(m => [m.label, m]))

const TABS = [
  { key: 'log',     label: 'log mood',  icon: 'ti-pencil'  },
  { key: 'history', label: 'history',   icon: 'ti-history' },
  { key: 'ai',      label: 'AI report', icon: 'ti-brain'   },
] as const

type TabKey = typeof TABS[number]['key']

const SCORE_DOTS = [0, 1, 2, 3, 4] // stable array — avoids [...Array(5)] on every render

// ── Types ──────────────────────────────────────────────────────────────────

type Mood = typeof moods[number]

type Entry = {
  id: string
  user_id: string
  mood: string
  emoji: string
  note: string | null
  score: number
  created_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Cast entry.mood to Mood['label'] so moodMap.get() accepts it
const getMoodConfig = (entry: Entry): Mood | null =>
  moodMap.get(entry.mood as Mood['label']) ?? null

const scoreToLabel = (s: number) =>
  s >= 4.5 ? 'blooming' : s >= 3.5 ? 'glowing' : s >= 2.5 ? 'gentle' : s >= 1.5 ? 'tender' : 'healing'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ── CSS ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .mp { font-family: 'DM Sans', sans-serif; min-height: 100vh; position: relative; overflow-x: hidden; width: 100%; }

  .mp-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(ellipse 60% 50% at 10% 10%, rgba(242,180,200,0.35) 0%, transparent 60%),
      radial-gradient(ellipse 50% 45% at 90% 85%, rgba(212,232,216,0.3) 0%, transparent 60%),
      radial-gradient(ellipse 40% 35% at 75% 15%, rgba(232,218,245,0.3) 0%, transparent 55%),
      radial-gradient(ellipse 35% 30% at 20% 88%, rgba(254,243,226,0.4) 0%, transparent 55%);
  }
  .mp-bg-dark {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(ellipse 65% 50% at 15% 15%, rgba(212,96,122,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 85% 80%, rgba(90,140,99,0.1) 0%, transparent 60%),
      radial-gradient(ellipse 40% 35% at 70% 20%, rgba(155,126,200,0.1) 0%, transparent 55%),
      radial-gradient(ellipse 35% 30% at 30% 85%, rgba(184,134,11,0.08) 0%, transparent 55%);
  }

  .mp-inner { position: relative; z-index: 1; padding: clamp(18px,4vw,36px) clamp(16px,4vw,36px); }
  @media (max-width: 768px) { .mp-inner { padding: 72px 18px 88px; } }
  @media (max-width: 380px) { .mp-inner { padding: 68px 14px 84px; } }

  .mp-hrow { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
  .mp-h1 { font-family: 'Fraunces', serif; font-size: clamp(28px,5.5vw,44px); font-weight: 300; font-style: italic; letter-spacing: -1px; line-height: 1.0; margin-bottom: 6px; overflow: visible; word-break: break-word; }
  .mp-sub { font-size: 13px; font-weight: 400; }
  .mp-hbtns { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; }

  .mp-btn-pill { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 999px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease; white-space: nowrap; }
  .mp-btn-pill:hover { transform: scale(1.04); }
  .mp-btn-pill:active { transform: scale(0.97); }
  .mp-btn-pill i { font-size: 14px; }

  .mp-live { display: flex; align-items: center; gap: 7px; margin-bottom: 18px; }
  .mp-live-dot { width: 7px; height: 7px; border-radius: 50%; animation: live-pulse 2.4s ease-in-out infinite; }
  @keyframes live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
  .mp-live-txt { font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }

  .mp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr)); gap: 11px; margin-bottom: 22px; }
  .mp-stat { border-radius: 20px; padding: 16px; transition: transform 0.2s ease; }
  .mp-stat:hover { transform: translateY(-3px); }
  .mp-stat-val { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; letter-spacing: -0.5px; margin-bottom: 4px; }
  .mp-stat-lbl { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.55; }
  .mp-stat-ico { font-size: 16px; margin-bottom: 8px; opacity: 0.6; }

  .mp-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .mp-tab { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; border-radius: 999px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; letter-spacing: 0.2px; transition: transform 0.15s ease; }
  .mp-tab:hover { transform: scale(1.03); }
  .mp-tab i { font-size: 13px; }

  .mp-log-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap: 18px; }
  .mp-card { border-radius: 22px; padding: clamp(18px,2.5vw,26px); }
  .mp-card-lbl { font-size: 10px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 16px; opacity: 0.4; }

  .mp-moodgrid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
  .mp-moodbtn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 6px; border-radius: 16px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: transform 0.18s ease; }
  .mp-moodbtn:hover { transform: translateY(-3px) scale(1.06); }
  .mp-moodbtn:active { transform: scale(0.94); }
  .mp-moodbtn-ico { font-size: 22px; }
  .mp-moodbtn-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.2px; }

  .mp-dots { display: flex; gap: 3px; margin-top: 2px; }
  .mp-dot  { width: 4px; height: 4px; border-radius: 50%; }

  .mp-note { width: 100%; border-radius: 14px; padding: 12px 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; resize: none; outline: none; line-height: 1.6; margin-bottom: 12px; }
  .mp-submit { width: 100%; padding: 13px; border-radius: 999px; border: none; font-family: 'Fraunces', serif; font-size: 15px; font-weight: 300; font-style: italic; letter-spacing: 0.2px; cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease; }
  .mp-submit:hover { transform: scale(1.02); }
  .mp-submit:active { transform: scale(0.98); }
  .mp-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .mp-preview { border-radius: 22px; padding: 24px; text-align: center; }
  .mp-preview-ico { font-size: 44px; margin-bottom: 12px; }
  .mp-preview-lbl { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; font-style: italic; letter-spacing: -0.3px; margin-bottom: 10px; }
  .mp-preview-sub { font-size: 12px; opacity: 0.45; margin-top: 8px; }

  .mp-loglist { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
  .mp-logitem { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; }
  .mp-logitem-ico  { font-size: 18px; flex-shrink: 0; }
  .mp-logitem-name { font-size: 13px; font-weight: 600; }
  .mp-logitem-note { font-size: 11px; margin-top: 2px; opacity: 0.45; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mp-logitem-time { font-size: 10px; opacity: 0.35; margin-left: auto; flex-shrink: 0; }

  .mp-score-badge { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; font-size: 10px; font-weight: 700; flex-shrink: 0; }

  .mp-histitem { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; }
  .mp-histitem-ico { font-size: 20px; flex-shrink: 0; }
  .mp-hist-note { font-size: 12px; margin-top: 3px; font-style: italic; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .mp-ai-avatar { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .mp-ai-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; font-style: italic; }
  .mp-ai-sub   { font-size: 12px; opacity: 0.4; margin-top: 2px; }
  .mp-ai-body  { border-radius: 16px; padding: 20px; font-size: 14px; line-height: 1.85; font-style: italic; }

  .mp-spin { width: 32px; height: 32px; border-radius: 50%; margin: 0 auto 14px; border-width: 3px; border-style: solid; animation: spin 1.1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .mp-toast { padding: 10px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; text-align: center; margin-top: 10px; font-style: italic; }

  .mp-empty { text-align: center; padding: 28px 16px; }
  .mp-empty-ico { font-size: 32px; display: block; margin-bottom: 8px; }
  .mp-empty-txt { font-size: 13px; font-style: italic; }

  @media (max-width: 580px) {
    .mp-moodgrid { grid-template-columns: repeat(4,1fr); gap: 6px; }
    .mp-log-grid { grid-template-columns: 1fr; }
    .mp-stats    { grid-template-columns: repeat(2,1fr); }
    .mp-hbtns    { gap: 6px; }
    .mp-btn-pill { padding: 7px 12px; font-size: 11px; }
    .mp-tabs     { gap: 6px; }
    .mp-tab      { padding: 7px 13px; font-size: 11px; }
    .mp-moodbtn  { padding: 10px 4px; }
    .mp-moodbtn-ico { font-size: 18px; }
    .mp-moodbtn-lbl { font-size: 9px; }
  }
`

// ── Dot row sub-component — avoids re-creating [...Array(5)] inline ────────

function ScoreDots({ score, activeColor, inactiveColor, size = 4 }: {
  score: number
  activeColor: string
  inactiveColor: string
  size?: number
}) {
  return (
    <div className="mp-dots">
      {SCORE_DOTS.map(di => (
        <div key={di} className="mp-dot"
          style={{ width: size, height: size, background: di < score ? activeColor : inactiveColor }} />
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MoodPage() {
  const supabase = useMemo(() => createClient(), [])
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  const [selected,  setSelected]  = useState<Mood | null>(null)
  const [note,      setNote]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [entries,   setEntries]   = useState<Entry[]>([])
  const [fetching,  setFetching]  = useState(true)
  const [success,   setSuccess]   = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('log')
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    setFetching(true)
    const { data, error } = await supabase
      .from('mood_entries')
      .select('id, user_id, mood, emoji, note, score, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) console.error('fetch mood_entries:', error)
    if (data) setEntries(data as Entry[])
    setFetching(false)
  }, [supabase])

  useEffect(() => {
    fetchEntries()

    channelRef.current = supabase
      .channel('mood-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_entries' }, payload => {
        setEntries(prev => [payload.new as Entry, ...prev])
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [supabase, fetchEntries])

  // ── Log mood ─────────────────────────────────────────────────────────────

  const handleLog = useCallback(async () => {
    if (!selected) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from('mood_entries').insert({
      user_id: user.id,
      mood:    selected.label,
      emoji:   selected.icon,
      score:   selected.score,
      note:    note.trim() || null,
    } as any)

    if (error) {
      console.error('mood insert error:', error)
      setLoading(false)
      return
    }

    await updateStreak()
    setSuccess(true)
    setSelected(null)
    setNote('')
    setTimeout(() => setSuccess(false), 3_000)
    setLoading(false)
  }, [selected, note, supabase])

  // ── AI summary ────────────────────────────────────────────────────────────

  const handleAISummary = useCallback(async () => {
    setAiLoading(true)
    setActiveTab('ai')
    const res  = await fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: entries.map(e => ({ mood: e.mood, score: e.score, note: e.note, created_at: e.created_at })),
      }),
    })
    const data = await res.json()
    setAiSummary(data.summary)
    setAiLoading(false)
  }, [entries])

  // ── Derived stats (memoized) ──────────────────────────────────────────────

  const todayStr     = useMemo(() => new Date().toDateString(), [])
  const todayEntries = useMemo(() => entries.filter(e => new Date(e.created_at).toDateString() === todayStr), [entries, todayStr])
  const avgScore     = useMemo(() => todayEntries.length
    ? (todayEntries.reduce((a, e) => a + e.score, 0) / todayEntries.length).toFixed(1)
    : null, [todayEntries])

  // ── Design tokens (memoized on dark) ─────────────────────────────────────

  const tk = useMemo(() => ({
    root: dark ? '#1a0f13' : '#fdf7f0',
    card: dark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    bord: dark ? 'rgba(255,255,255,0.09)' : 'rgba(212,96,122,0.1)',
    txt1: dark ? '#f5eef0' : '#3d2a35',
    txt2: dark ? 'rgba(245,238,240,0.45)' : '#b09aa4',
    txt3: dark ? 'rgba(245,238,240,0.22)' : '#d4bfc5',
  }), [dark])

  const statCards = useMemo(() => [
    { label: 'avg score',    value: avgScore ?? '—',                                      c: '#d4607a', bg: dark ? 'rgba(212,96,122,0.12)'  : '#fde8ee', border: dark ? 'rgba(212,96,122,0.25)'  : '#f2b3c0', icon: 'ti-chart-line' },
    { label: "today's logs", value: String(todayEntries.length),                          c: '#5a8c63', bg: dark ? 'rgba(90,140,99,0.12)'   : '#edf6ee', border: dark ? 'rgba(90,140,99,0.25)'   : '#a8c9ae', icon: 'ti-check'      },
    { label: 'total entries', value: String(entries.length),                              c: '#9b7ec8', bg: dark ? 'rgba(155,126,200,0.12)' : '#f3edfb', border: dark ? 'rgba(155,126,200,0.25)' : '#c9b8e8', icon: 'ti-database'   },
    { label: "today's vibe", value: avgScore ? scoreToLabel(parseFloat(avgScore)) : '—', c: '#b8860b', bg: dark ? 'rgba(184,134,11,0.12)'  : '#fef8e7', border: dark ? 'rgba(184,134,11,0.25)'  : '#f5ddb4', icon: 'ti-sparkles'   },
  ], [avgScore, todayEntries.length, entries.length, dark])

  const tabActiveStyle = useMemo(() => ({
    log:     dark ? { bg: 'rgba(212,96,122,0.18)',  border: 'rgba(212,96,122,0.5)',  color: '#f2b3c0' } : { bg: '#fde8ee', border: '#e8a0b0', color: '#7a1a35' },
    history: dark ? { bg: 'rgba(155,126,200,0.18)', border: 'rgba(155,126,200,0.5)', color: '#c9b8e8' } : { bg: '#f3edfb', border: '#c9b8e8', color: '#4a2a80' },
    ai:      dark ? { bg: 'rgba(90,140,99,0.18)',   border: 'rgba(90,140,99,0.5)',   color: '#a8c9ae' } : { bg: '#edf6ee', border: '#a8c9ae', color: '#2a5c33' },
  }), [dark])

  // ── Render ────────────────────────────────────────────────────────────────

  const { root, card, bord, txt1, txt2, txt3 } = tk

  return (
    <>
      <style>{css}</style>
      <div className="mp" style={{ background: root, color: txt1 }}>
        <div className={dark ? 'mp-bg-dark' : 'mp-bg'} />

        <div className="mp-inner">

          {/* ── Header ── */}
          <motion.div className="mp-hrow"
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44 }}>
            <div>
              <h1 className="mp-h1" style={{ color: dark ? '#f2b3c0' : '#d4607a' }}>mood journal</h1>
              <p className="mp-sub" style={{ color: txt2 }}>how is your heart feeling today?</p>
            </div>
            <div className="mp-hbtns">
              <motion.button className="mp-btn-pill" whileTap={{ scale: 0.96 }}
                onClick={handleAISummary}
                disabled={aiLoading || entries.length === 0}
                style={{
                  background: dark ? 'rgba(212,96,122,0.12)' : '#fde8ee',
                  border: `1px solid ${dark ? 'rgba(212,96,122,0.3)' : '#e8a0b0'}`,
                  color: dark ? '#f2b3c0' : '#7a1a35',
                  opacity: entries.length === 0 ? 0.4 : 1,
                  cursor:  entries.length === 0 ? 'not-allowed' : 'pointer',
                }}>
                <i className="ti ti-brain" aria-hidden="true" />
                {aiLoading ? 'reading...' : 'AI reflection'}
              </motion.button>
            </div>
          </motion.div>

          {/* ── Live indicator ── */}
          <div className="mp-live">
            <div className="mp-live-dot" style={{ background: dark ? '#a8c9ae' : '#5a8c63' }} />
            <span className="mp-live-txt" style={{ color: dark ? '#a8c9ae' : '#5a8c63' }}>
              {fetching ? 'loading...' : 'live updates on'}
            </span>
          </div>

          {/* ── Stat cards ── */}
          <div className="mp-stats">
            {statCards.map((s, i) => (
              <motion.div key={s.label} className="mp-stat"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * i }}>
                <i className={`ti ${s.icon} mp-stat-ico`} aria-hidden="true" style={{ color: s.c }} />
                <div className="mp-stat-val" style={{ color: s.c }}>{s.value}</div>
                <div className="mp-stat-lbl" style={{ color: s.c }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="mp-tabs">
            {TABS.map(t => {
              const active = activeTab === t.key
              const cfg    = tabActiveStyle[t.key]
              return (
                <motion.button key={t.key} className="mp-tab"
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: active ? cfg.bg   : card,
                    border:     active ? `1px solid ${cfg.border}` : `1px solid ${bord}`,
                    color:      active ? cfg.color : txt2,
                  }}>
                  <i className={`ti ${t.icon}`} aria-hidden="true" />
                  {t.label}
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ══ LOG TAB ══ */}
            {activeTab === 'log' && (
              <motion.div key="log"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div className="mp-log-grid">

                  {/* Left col */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Mood picker */}
                    <div className="mp-card" style={{ background: card, border: `1px solid ${bord}` }}>
                      <p className="mp-card-lbl" style={{ color: txt1 }}>pick your vibe</p>
                      <div className="mp-moodgrid">
                        {moods.map((m, i) => {
                          const isActive = selected?.label === m.label
                          const chipBg   = dark ? (isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)') : (isActive ? m.lightBg : m.lightBg + 'bb')
                          const chipBord = dark ? `1px solid ${isActive ? m.border + 'cc' : 'rgba(255,255,255,0.07)'}` : `1px solid ${isActive ? m.lightBorder : m.lightBorder + '88'}`
                          const chipTxt  = dark ? (isActive ? m.c : tk.txt2) : (isActive ? m.lightText : m.lightText + 'bb')
                          return (
                            <motion.button key={m.label} className="mp-moodbtn"
                              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => setSelected(isActive ? null : m)}
                              style={{ background: chipBg, border: chipBord }}>
                              <i className={`ti ${m.icon} mp-moodbtn-ico`} aria-hidden="true"
                                style={{ color: dark ? (isActive ? m.c : tk.txt2) : m.lightText }} />
                              <span className="mp-moodbtn-lbl" style={{ color: chipTxt }}>{m.label}</span>
                              <ScoreDots score={m.score}
                                activeColor={dark ? m.c : m.lightBorder}
                                inactiveColor={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Note + submit */}
                    <div className="mp-card" style={{ background: card, border: `1px solid ${bord}` }}>
                      <p className="mp-card-lbl" style={{ color: txt1 }}>add a little note</p>
                      <textarea className="mp-note"
                        value={note} onChange={e => setNote(e.target.value)}
                        placeholder="what's on your heart..." rows={3}
                        style={{
                          background: dark ? 'rgba(255,255,255,0.035)' : '#fdf0f3',
                          border: `1px solid ${dark ? 'rgba(212,96,122,0.15)' : '#f2b3c0'}`,
                          color: txt1,
                        }} />
                      <button className="mp-submit"
                        onClick={handleLog} disabled={!selected || loading}
                        style={{
                          background: selected
                            ? (dark ? `linear-gradient(135deg, ${selected.c}, #9b7ec8)` : `linear-gradient(135deg, ${selected.lightBorder}, ${selected.c})`)
                            : (dark ? 'rgba(255,255,255,0.05)' : '#f5eef0'),
                          color: selected ? '#fff' : txt3,
                        }}>
                        {loading ? 'saving...' : success ? 'saved, lovely ♡' : selected ? `log — ${selected.label}` : 'pick a feeling first'}
                      </button>
                      <AnimatePresence>
                        {success && (
                          <motion.div className="mp-toast"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={dark
                              ? { background: 'rgba(90,140,99,0.15)', border: '1px solid rgba(90,140,99,0.35)', color: '#a8c9ae' }
                              : { background: '#edf6ee', border: '1px solid #a8c9ae', color: '#2a5c33' }}>
                            mood bloomed into your journal ✿
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right col */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Selected mood preview */}
                    <AnimatePresence>
                      {selected && (
                        <motion.div className="mp-preview"
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          style={{
                            background: dark ? selected.bg.replace('#', 'rgba(').replace(/(..)(..)(..)/, (_,r,g,b) => `${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.15)`) : selected.lightBg,
                            border: `1px solid ${dark ? selected.border : selected.lightBorder}`,
                          }}>
                          <motion.div animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
                            <i className={`ti ${selected.icon} mp-preview-ico`} aria-hidden="true"
                              style={{ color: dark ? selected.c : selected.lightText }} />
                          </motion.div>
                          <div className="mp-preview-lbl" style={{ color: dark ? selected.c : selected.lightText }}>
                            {selected.label}
                          </div>
                          <ScoreDots score={selected.score} size={8}
                            activeColor={dark ? selected.c : selected.lightBorder}
                            inactiveColor={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                          <p className="mp-preview-sub" style={{ color: dark ? txt1 : selected.lightText }}>
                            score: {selected.score} / 5
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Today's log */}
                    <div className="mp-card" style={{ background: card, border: `1px solid ${bord}`, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <p className="mp-card-lbl" style={{ color: txt1, marginBottom: 0 }}>today's entries</p>
                        <div className="mp-live-dot" style={{ flexShrink: 0, background: dark ? '#a8c9ae' : '#5a8c63' }} />
                      </div>

                      {fetching ? (
                        <div className="mp-empty">
                          <i className="ti ti-loader mp-empty-ico" aria-hidden="true" style={{ color: txt3 }} />
                        </div>
                      ) : todayEntries.length === 0 ? (
                        <div className="mp-empty">
                          <i className="ti ti-flower mp-empty-ico" aria-hidden="true" style={{ color: txt3 }} />
                          <span className="mp-empty-txt" style={{ color: txt3 }}>nothing yet, darling</span>
                        </div>
                      ) : (
                        <div className="mp-loglist">
                          <AnimatePresence>
                            {todayEntries.map((entry, i) => {
                              const m         = getMoodConfig(entry)
                              const iconClass = m?.icon ?? entry.emoji ?? 'ti-circle'
                              const color     = dark ? (m?.c ?? '#d4607a') : (m?.lightText ?? '#7a1a35')
                              const rowBg     = dark ? 'rgba(255,255,255,0.03)' : (m?.lightBg ?? '#fde8ee')
                              const rowBord   = dark ? undefined : `1px solid ${(m?.lightBorder ?? '#f2b3c0')}66`
                              return (
                                <motion.div key={entry.id} className="mp-logitem"
                                  initial={{ opacity: 0, x: 16, scale: 0.95 }}
                                  animate={{ opacity: 1, x: 0, scale: 1 }}
                                  transition={{ delay: i * 0.04 }}
                                  style={{ background: rowBg, border: rowBord }}>
                                  <i className={`ti ${iconClass} mp-logitem-ico`} aria-hidden="true" style={{ color }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="mp-logitem-name" style={{ color: dark ? txt1 : (m?.lightText ?? '#3d2a35') }}>
                                      {entry.mood}
                                    </div>
                                    {entry.note && (
                                      <div className="mp-logitem-note" style={{ color: txt2 }}>{entry.note}</div>
                                    )}
                                  </div>
                                  <span className="mp-score-badge" style={{ background: `${color}${dark ? '22' : '18'}`, color }}>
                                    {entry.score}
                                  </span>
                                  <div className="mp-logitem-time" style={{ color: txt2 }}>{formatTime(entry.created_at)}</div>
                                </motion.div>
                              )
                            })}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ HISTORY TAB ══ */}
            {activeTab === 'history' && (
              <motion.div key="history"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div className="mp-card" style={{ background: card, border: `1px solid ${bord}` }}>
                  <p className="mp-card-lbl" style={{ color: txt1 }}>all entries ({entries.length})</p>
                  {fetching ? (
                    <div className="mp-empty" style={{ padding: '48px' }}>
                      <i className="ti ti-loader mp-empty-ico" aria-hidden="true" style={{ color: txt3 }} />
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="mp-empty" style={{ padding: '48px' }}>
                      <i className="ti ti-leaf mp-empty-ico" aria-hidden="true" style={{ color: txt3 }} />
                      <span className="mp-empty-txt" style={{ color: txt3 }}>your journal is empty, start blooming</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {entries.map((entry, i) => {
                        const m         = getMoodConfig(entry)
                        const iconClass = m?.icon ?? entry.emoji ?? 'ti-circle'
                        const color     = dark ? (m?.c ?? '#d4607a') : (m?.lightText ?? '#7a1a35')
                        return (
                          <motion.div key={entry.id} className="mp-histitem"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025 }}
                            style={dark
                              ? { background: 'rgba(255,255,255,0.025)', border: `1px solid ${m?.border ?? 'rgba(255,255,255,0.07)'}` }
                              : { background: m?.lightBg ?? '#fde8ee', border: `1px solid ${m?.lightBorder ?? '#f2b3c0'}` }}>
                            <i className={`ti ${iconClass} mp-histitem-ico`} aria-hidden="true" style={{ color }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: dark ? txt1 : (m?.lightText ?? '#3d2a35') }}>
                                  {entry.mood}
                                </span>
                                <ScoreDots score={entry.score} size={5}
                                  activeColor={dark ? (m?.c ?? '#d4607a') : (m?.lightBorder ?? '#e8a0b0')}
                                  inactiveColor={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                              </div>
                              {entry.note && (
                                <div className="mp-hist-note" style={{ color: txt2 }}>"{entry.note}"</div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, color, marginBottom: '2px' }}>{formatDate(entry.created_at)}</div>
                              <div style={{ fontSize: '10px', color: txt3 }}>{formatTime(entry.created_at)}</div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ AI TAB ══ */}
            {activeTab === 'ai' && (
              <motion.div key="ai"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="mp-card"
                  style={{ background: card, border: `1px solid ${dark ? 'rgba(212,96,122,0.25)' : '#f2b3c0'}`, maxWidth: '680px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div className="mp-ai-avatar"
                      style={{ background: dark ? 'rgba(212,96,122,0.15)' : '#fde8ee', border: `1px solid ${dark ? 'rgba(212,96,122,0.3)' : '#e8a0b0'}` }}>
                      <i className="ti ti-heart" aria-hidden="true" style={{ fontSize: '20px', color: dark ? '#f2b3c0' : '#d4607a' }} />
                    </div>
                    <div>
                      <div className="mp-ai-title" style={{ color: txt1 }}>AI mood reflection</div>
                      <div className="mp-ai-sub"   style={{ color: txt2 }}>based on your {entries.length} journal {entries.length === 1 ? 'entry' : 'entries'}</div>
                    </div>
                  </div>

                  {aiLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="mp-spin"
                        style={{ borderColor: dark ? 'rgba(212,96,122,0.18)' : '#fde8ee', borderTopColor: dark ? '#f2b3c0' : '#d4607a' }} />
                      <div style={{ color: txt2, fontSize: '13px', fontStyle: 'italic' }}>reading your heart...</div>
                    </div>
                  ) : aiSummary ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="mp-ai-body"
                        style={dark
                          ? { background: 'rgba(212,96,122,0.07)', border: 'rgba(212,96,122,0.18)', color: txt1 }
                          : { background: '#fde8ee', border: '1px solid #f2b3c0', color: '#3d2a35' }}>
                        {aiSummary}
                      </div>
                      <motion.button className="mp-btn-pill" whileTap={{ scale: 0.97 }}
                        onClick={handleAISummary}
                        style={{ marginTop: '14px',
                          background: dark ? 'rgba(212,96,122,0.15)' : '#fde8ee',
                          border: `1px solid ${dark ? 'rgba(212,96,122,0.3)' : '#e8a0b0'}`,
                          color: dark ? '#f2b3c0' : '#7a1a35' }}>
                        <i className="ti ti-refresh" aria-hidden="true" />
                        reflect again
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px' }}>
                      <i className="ti ti-flower" aria-hidden="true"
                        style={{ fontSize: '38px', color: dark ? '#f2b3c0' : '#d4607a', display: 'block', marginBottom: '12px', opacity: 0.6 }} />
                      <div style={{ color: txt2, fontSize: '13px', marginBottom: '18px', fontStyle: 'italic' }}>
                        let AI gently reflect on your {entries.length} mood {entries.length === 1 ? 'entry' : 'entries'}
                      </div>
                      <motion.button className="mp-btn-pill" whileTap={{ scale: 0.97 }}
                        onClick={handleAISummary}
                        disabled={entries.length === 0}
                        style={{
                          background: dark ? 'rgba(212,96,122,0.15)' : '#fde8ee',
                          border: `1px solid ${dark ? 'rgba(212,96,122,0.3)' : '#e8a0b0'}`,
                          color: dark ? '#f2b3c0' : '#7a1a35',
                          opacity: entries.length === 0 ? 0.4 : 1,
                          cursor:  entries.length === 0 ? 'not-allowed' : 'pointer',
                        }}>
                        <i className="ti ti-sparkles" aria-hidden="true" />
                        reflect on my mood
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  )
}