'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/lib/useTheme'

const moods = [
  { label: 'Amazing',  score: 5, c: '#ffcf40', bg: 'rgba(255,207,64,0.12)',  border: 'rgba(255,207,64,0.3)',  lightBg: '#fff7d6', lightBorder: '#f5c800', lightText: '#7a5c00', icon: 'ti-star' },
  { label: 'Happy',    score: 4, c: '#00e5a0', bg: 'rgba(0,229,160,0.1)',    border: 'rgba(0,229,160,0.28)',  lightBg: '#d0fff2', lightBorder: '#00c987', lightText: '#005c41', icon: 'ti-mood-smile' },
  { label: 'Focused',  score: 4, c: '#38bdff', bg: 'rgba(56,189,255,0.1)',   border: 'rgba(56,189,255,0.28)', lightBg: '#d6f2ff', lightBorder: '#009de0', lightText: '#003f5c', icon: 'ti-target' },
  { label: 'Okay',     score: 3, c: '#bf7fff', bg: 'rgba(191,127,255,0.1)',  border: 'rgba(191,127,255,0.28)',lightBg: '#f0e0ff', lightBorder: '#a84fff', lightText: '#4a0080', icon: 'ti-minus' },
  { label: 'Tired',    score: 2, c: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.25)',lightBg: '#e8ecf2', lightBorder: '#64748b', lightText: '#2d3748', icon: 'ti-zzz' },
  { label: 'Anxious',  score: 2, c: '#ff9340', bg: 'rgba(255,147,64,0.1)',   border: 'rgba(255,147,64,0.28)', lightBg: '#ffe9d4', lightBorder: '#e06b00', lightText: '#6b2d00', icon: 'ti-alert-triangle' },
  { label: 'Sad',      score: 1, c: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.28)',lightBg: '#e8e9ff', lightBorder: '#5860e0', lightText: '#1a1f70', icon: 'ti-mood-sad' },
  { label: 'Stressed', score: 1, c: '#ff6b8a', bg: 'rgba(255,107,138,0.1)', border: 'rgba(255,107,138,0.28)',lightBg: '#ffe0e7', lightBorder: '#e0003a', lightText: '#6b001e', icon: 'ti-flame' },
]

type Entry = {
  id: string
  mood: string
  note: string
  score: number
  created_at: string
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .mp { font-family: 'DM Sans', sans-serif; min-height: 100vh; position: relative; overflow-x: hidden; width: 100%; }

  /* ── dark bg gradients ── */
  .mp-bg-dark {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(ellipse 65% 50% at 15% 15%, rgba(191,127,255,0.14) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 85% 80%, rgba(0,229,160,0.1) 0%, transparent 60%),
      radial-gradient(ellipse 40% 35% at 70% 20%, rgba(255,107,138,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 35% 30% at 30% 85%, rgba(56,189,255,0.08) 0%, transparent 55%);
  }

  /* ── light bg: punchy warm off-white with vivid blob accents ── */
  .mp-bg-light {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(ellipse 55% 45% at 10% 10%, rgba(255,207,64,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 90% 85%, rgba(0,229,160,0.18) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 75% 15%, rgba(255,107,138,0.15) 0%, transparent 50%),
      radial-gradient(ellipse 35% 30% at 20% 90%, rgba(56,189,255,0.14) 0%, transparent 50%),
      radial-gradient(ellipse 30% 25% at 50% 50%, rgba(191,127,255,0.10) 0%, transparent 50%);
  }

  .mp-inner {
    position: relative; z-index: 1;
    padding: clamp(18px,4vw,36px) clamp(16px,4vw,36px);
  }

  /* ── mobile: clear fixed topbar + bottom tab bar ── */
  @media (max-width: 768px) {
    .mp-inner {
      padding: 72px 18px 88px 18px;
    }
  }

  @media (max-width: 380px) {
    .mp-inner {
      padding: 68px 14px 84px 14px;
    }
  }

  /* ── header ── */
  .mp-hrow {
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 18px;
  }

  .mp-h1 {
    font-size: clamp(24px,5.5vw,42px); font-weight: 800; letter-spacing: -1.5px;
    line-height: 1.0; margin-bottom: 8px;
    background: linear-gradient(110deg, #bf7fff 0%, #ff6b8a 40%, #ffcf40 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    overflow: visible; word-break: break-word;
  }

  /* light mode headline: darker, punchier gradient */
  .mp-h1-light {
    background: linear-gradient(110deg, #7000d4 0%, #e0003a 45%, #e06b00 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .mp-sub { font-size: 13px; font-weight: 400; }

  .mp-hbtns { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; }

  .mp-btn-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 100px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease;
    white-space: nowrap;
  }
  .mp-btn-pill:hover { transform: scale(1.04); }
  .mp-btn-pill:active { transform: scale(0.97); }
  .mp-btn-pill i { font-size: 14px; }

  /* ── live dot ── */
  .mp-live { display: flex; align-items: center; gap: 7px; margin-bottom: 18px; }
  .mp-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #00e5a0;
    animation: live-pulse 2s ease-in-out infinite; }
  @keyframes live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
  .mp-live-txt { font-size: 11px; font-weight: 700; color: #00e5a0; letter-spacing: 0.3px; }

  /* ── stat cards ── */
  .mp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr));
    gap: 11px; margin-bottom: 22px; }

  .mp-stat { border-radius: 16px; padding: 16px; transition: transform 0.2s ease; }
  .mp-stat:hover { transform: translateY(-3px); }
  .mp-stat-val { font-size: 22px; font-weight: 800; letter-spacing: -0.8px; margin-bottom: 4px; }
  .mp-stat-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; opacity: 0.55; }
  .mp-stat-ico { font-size: 16px; margin-bottom: 8px; opacity: 0.7; }

  /* ── tabs ── */
  .mp-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }

  .mp-tab {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 18px; border-radius: 100px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.2px;
    transition: transform 0.15s ease;
  }
  .mp-tab:hover { transform: scale(1.03); }
  .mp-tab i { font-size: 13px; }

  /* ── log panel grid ── */
  .mp-log-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap: 18px; }

  /* ── card shell ── */
  .mp-card { border-radius: 22px; padding: clamp(18px,2.5vw,26px); backdrop-filter: blur(20px); }

  .mp-card-lbl { font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; margin-bottom: 16px; opacity: 0.4; }

  /* ── mood grid ── */
  .mp-moodgrid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }

  .mp-moodbtn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 6px; border-radius: 14px;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: transform 0.18s ease;
  }
  .mp-moodbtn:hover { transform: translateY(-3px) scale(1.06); }
  .mp-moodbtn:active { transform: scale(0.94); }

  .mp-moodbtn-ico { font-size: 22px; }
  .mp-moodbtn-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.3px; }

  .mp-dots { display: flex; gap: 3px; margin-top: 2px; }
  .mp-dot { width: 4px; height: 4px; border-radius: 50%; }

  /* ── note area ── */
  .mp-note { width: 100%; border-radius: 12px; padding: 12px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; resize: none;
    outline: none; line-height: 1.6; margin-bottom: 12px; }

  /* ── submit ── */
  .mp-submit {
    width: 100%; padding: 13px; border-radius: 13px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 800;
    letter-spacing: 0.2px; cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .mp-submit:hover { transform: scale(1.02); }
  .mp-submit:active { transform: scale(0.98); }
  .mp-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── selected preview ── */
  .mp-preview { border-radius: 20px; padding: 24px; text-align: center; }
  .mp-preview-ico { font-size: 44px; margin-bottom: 12px; }
  .mp-preview-lbl { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 10px; }
  .mp-preview-sub { font-size: 12px; opacity: 0.45; margin-top: 8px; }

  /* ── log list ── */
  .mp-loglist { display: flex; flex-direction: column; gap: 8px;
    max-height: 300px; overflow-y: auto; }

  .mp-logitem { display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px; }

  .mp-logitem-ico { font-size: 18px; flex-shrink: 0; }
  .mp-logitem-name { font-size: 13px; font-weight: 700; }
  .mp-logitem-note { font-size: 11px; margin-top: 2px; opacity: 0.4; }
  .mp-logitem-time { font-size: 10px; opacity: 0.3; margin-left: auto; flex-shrink: 0; }

  /* ── history list ── */
  .mp-histitem { display: flex; align-items: center; gap: 14px; padding: 14px 16px;
    border-radius: 14px; }

  .mp-histitem-ico { font-size: 20px; flex-shrink: 0; }

  /* ── AI tab ── */
  .mp-ai-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .mp-ai-avatar { width: 44px; height: 44px; border-radius: 13px; display: flex;
    align-items: center; justify-content: center; font-size: 20px;
    background: linear-gradient(135deg, #bf7fff, #ff6b8a); flex-shrink: 0; }
  .mp-ai-title { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; }
  .mp-ai-sub { font-size: 12px; opacity: 0.4; margin-top: 2px; }
  .mp-ai-body { border-radius: 16px; padding: 20px; font-size: 14px; line-height: 1.8; }

  /* ── spinner ── */
  .mp-spin { width: 32px; height: 32px; border-radius: 50%; margin: 0 auto 14px;
    border-width: 3px; border-style: solid; border-color: rgba(191,127,255,0.2);
    border-top-color: #bf7fff; animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── success toast ── */
  .mp-toast { padding: 10px 14px; border-radius: 11px; font-size: 12px;
    font-weight: 600; text-align: center; margin-top: 10px; }

  /* ── responsive ── */
  @media (max-width: 580px) {
    .mp-moodgrid { grid-template-columns: repeat(4,1fr); gap: 6px; }
    .mp-log-grid { grid-template-columns: 1fr; }
    .mp-stats { grid-template-columns: repeat(2,1fr); }
    .mp-hbtns { gap: 6px; }
    .mp-btn-pill { padding: 7px 12px; font-size: 11px; }
    .mp-tabs { gap: 6px; }
    .mp-tab { padding: 7px 13px; font-size: 11px; }
    .mp-moodbtn { padding: 10px 4px; }
    .mp-moodbtn-ico { font-size: 18px; }
    .mp-moodbtn-lbl { font-size: 9px; }
  }
`

export default function MoodPage() {
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  const [selected, setSelected] = useState<typeof moods[0] | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'ai'>('log')
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    fetchEntries()
    channelRef.current = supabase
      .channel('mood-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_entries' }, (payload) => {
        setEntries(prev => [payload.new as Entry, ...prev])
      })
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const fetchEntries = async () => {
    const { data } = await supabase.from('mood_entries').select('*').order('created_at', { ascending: false }).limit(20)
    if (data) setEntries(data)
  }

  const handleLog = async () => {
    if (!selected) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('mood_entries').insert({ user_id: user.id, mood: selected.label, score: selected.score, note: note.trim() || null })
    setSuccess(true); setSelected(null); setNote('')
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  const handleAISummary = async () => {
    setAiLoading(true); setActiveTab('ai')
    const res = await fetch('/api/ai-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) })
    const data = await res.json()
    setAiSummary(data.summary)
    setAiLoading(false)
  }

  const todayEntries = entries.filter(e => new Date(e.created_at).toDateString() === new Date().toDateString())
  const avgScore = todayEntries.length ? (todayEntries.reduce((a, e) => a + e.score, 0) / todayEntries.length).toFixed(1) : null
  const scoreToLabel = (s: number) => s >= 4.5 ? 'stellar' : s >= 3.5 ? 'solid' : s >= 2.5 ? 'alright' : s >= 1.5 ? 'low' : 'rough'

  // ── tokens ──
  const root = dark ? '#070710' : '#fef9f0'
  const card = dark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const bord = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'
  const txt1 = dark ? '#f0eeff' : '#0a0a0f'
  const txt2 = dark ? 'rgba(240,238,255,0.38)' : 'rgba(10,10,15,0.55)'
  const txt3 = dark ? 'rgba(240,238,255,0.2)'  : 'rgba(10,10,15,0.3)'

  // light mode stat card configs — fully opaque, vivid
  const statCards = dark
    ? [
        { label: 'avg score',   value: avgScore || '—',              c: '#bf7fff', bg: 'rgba(191,127,255,0.12)', border: 'rgba(191,127,255,0.22)', icon: 'ti-chart-line' },
        { label: 'today logs',  value: String(todayEntries.length),  c: '#00e5a0', bg: 'rgba(0,229,160,0.1)',    border: 'rgba(0,229,160,0.2)',    icon: 'ti-check' },
        { label: 'total logs',  value: String(entries.length),       c: '#38bdff', bg: 'rgba(56,189,255,0.1)',   border: 'rgba(56,189,255,0.2)',   icon: 'ti-database' },
        { label: "today's vibe",value: avgScore ? scoreToLabel(parseFloat(avgScore)) : '—', c: '#ffcf40', bg: 'rgba(255,207,64,0.1)', border: 'rgba(255,207,64,0.2)', icon: 'ti-sparkles' },
      ]
    : [
        { label: 'avg score',   value: avgScore || '—',              c: '#4a0080', bg: '#f0e0ff', border: '#a84fff', icon: 'ti-chart-line' },
        { label: 'today logs',  value: String(todayEntries.length),  c: '#005c41', bg: '#d0fff2', border: '#00c987', icon: 'ti-check' },
        { label: 'total logs',  value: String(entries.length),       c: '#003f5c', bg: '#d6f2ff', border: '#009de0', icon: 'ti-database' },
        { label: "today's vibe",value: avgScore ? scoreToLabel(parseFloat(avgScore)) : '—', c: '#7a5c00', bg: '#fff7d6', border: '#f5c800', icon: 'ti-sparkles' },
      ]

  const tabs: { key: 'log' | 'history' | 'ai'; label: string; icon: string }[] = [
    { key: 'log',     label: 'log mood', icon: 'ti-pencil' },
    { key: 'history', label: 'history',  icon: 'ti-history' },
    { key: 'ai',      label: 'AI report', icon: 'ti-brain' },
  ]

  // light tab active colors
  const tabActiveConfigs: Record<string, { bg: string; border: string; color: string }> = {
    log:     dark ? { bg: 'rgba(191,127,255,0.22)', border: 'rgba(191,127,255,0.55)', color: '#bf7fff' }
                  : { bg: '#f0e0ff',                 border: '#a84fff',               color: '#4a0080' },
    history: dark ? { bg: 'rgba(191,127,255,0.22)', border: 'rgba(191,127,255,0.55)', color: '#bf7fff' }
                  : { bg: '#d6f2ff',                 border: '#009de0',               color: '#003f5c' },
    ai:      dark ? { bg: 'rgba(255,107,138,0.22)', border: 'rgba(255,107,138,0.55)', color: '#ff6b8a' }
                  : { bg: '#ffe0e7',                 border: '#e0003a',               color: '#6b001e' },
  }

  return (
    <>
      <style>{css}</style>
      <div className="mp" style={{ background: root, color: txt1 }}>
        {/* conditional bg layer */}
        <div className={dark ? 'mp-bg-dark' : 'mp-bg-light'} />

        <div className="mp-inner">

          {/* Header */}
          <motion.div className="mp-hrow"
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
            <div>
              <h1 className={`mp-h1 ${!dark ? 'mp-h1-light' : ''}`}>mood tracker</h1>
              <p className="mp-sub" style={{ color: txt2 }}>how are you feeling right now?</p>
            </div>
            <div className="mp-hbtns">
              <motion.button className="mp-btn-pill" whileTap={{ scale: 0.96 }}
                onClick={handleAISummary} disabled={aiLoading || entries.length === 0}
                style={dark
                  ? { background: 'rgba(191,127,255,0.1)', border: '1px solid rgba(191,127,255,0.22)', color: '#bf7fff', opacity: entries.length === 0 ? 0.4 : 1, cursor: entries.length === 0 ? 'not-allowed' : 'pointer' }
                  : { background: '#f0e0ff', border: '2px solid #a84fff', color: '#4a0080', opacity: entries.length === 0 ? 0.4 : 1, cursor: entries.length === 0 ? 'not-allowed' : 'pointer' }
                }>
                <i className="ti ti-brain" aria-hidden="true" />
                {aiLoading ? 'analyzing...' : 'AI summary'}
              </motion.button>

              <motion.button className="mp-btn-pill" whileTap={{ scale: 0.96 }}
                onClick={toggle}
                style={dark
                  ? { background: card, border: `1px solid ${bord}`, color: txt1 }
                  : { background: '#fff7d6', border: '2px solid #f5c800', color: '#7a5c00' }
                }>
                <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true"
                  style={{ color: dark ? '#ffcf40' : '#7a5c00' }} />
                {dark ? 'light' : 'dark'}
              </motion.button>
            </div>
          </motion.div>

          {/* Live indicator */}
          <div className="mp-live">
            <div className="mp-live-dot" style={{ background: dark ? '#00e5a0' : '#00a36a' }} />
            <span className="mp-live-txt" style={{ color: dark ? '#00e5a0' : '#00a36a' }}>live updates on</span>
          </div>

          {/* Stat cards */}
          <div className="mp-stats">
            {statCards.map((s, i) => (
              <motion.div key={s.label} className="mp-stat"
                style={{ background: s.bg, border: `2px solid ${s.border}` }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * i }}>
                <i className={`ti ${s.icon} mp-stat-ico`} aria-hidden="true" style={{ color: s.c }} />
                <div className="mp-stat-val" style={{ color: s.c }}>{s.value}</div>
                <div className="mp-stat-lbl" style={{ color: s.c }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mp-tabs">
            {tabs.map(t => {
              const active = activeTab === t.key
              const cfg = tabActiveConfigs[t.key]
              return (
                <motion.button key={t.key} className="mp-tab"
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: active ? cfg.bg : card,
                    border: active ? `2px solid ${cfg.border}` : `1px solid ${bord}`,
                    color: active ? cfg.color : txt2,
                  }}>
                  <i className={`ti ${t.icon}`} aria-hidden="true" />
                  {t.label}
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ── LOG TAB ── */}
            {activeTab === 'log' && (
              <motion.div key="log" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div className="mp-log-grid">

                  {/* Left col */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Mood picker */}
                    <div className="mp-card" style={{ background: card, border: `1px solid ${bord}` }}>
                      <p className="mp-card-lbl" style={{ color: txt1 }}>pick your vibe</p>
                      <div className="mp-moodgrid">
                        {moods.map((m, i) => {
                          const isActive = selected?.label === m.label
                          // light mode: each mood chip has its own opaque bg color
                          const chipBg   = dark
                            ? (isActive ? m.bg : 'rgba(255,255,255,0.03)')
                            : (isActive ? m.lightBg : m.lightBg + 'aa')   // slightly muted when inactive
                          const chipBord = dark
                            ? `2px solid ${isActive ? m.border : 'rgba(255,255,255,0.06)'}`
                            : `2px solid ${isActive ? m.lightBorder : m.lightBorder + '66'}`
                          const chipTxt  = dark
                            ? (isActive ? m.c : txt2)
                            : (isActive ? m.lightText : m.lightText + 'aa')

                          return (
                            <motion.button key={m.label} className="mp-moodbtn"
                              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => setSelected(isActive ? null : m)}
                              style={{ background: chipBg, border: chipBord }}>
                              <i className={`ti ${m.icon} mp-moodbtn-ico`} aria-hidden="true"
                                style={{ color: dark ? (isActive ? m.c : txt2) : m.lightText }} />
                              <span className="mp-moodbtn-lbl" style={{ color: chipTxt }}>{m.label}</span>
                              <div className="mp-dots">
                                {[...Array(5)].map((_, di) => (
                                  <div key={di} className="mp-dot"
                                    style={{ background: di < m.score
                                      ? (dark ? m.c : m.lightBorder)
                                      : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)') }} />
                                ))}
                              </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Note + submit */}
                    <div className="mp-card" style={{ background: card, border: `1px solid ${bord}` }}>
                      <p className="mp-card-lbl" style={{ color: txt1 }}>add a note</p>
                      <textarea className="mp-note" value={note} onChange={e => setNote(e.target.value)}
                        placeholder="what's on your mind..."
                        rows={3}
                        style={{
                          background: dark ? 'rgba(255,255,255,0.04)' : '#f5f0ff',
                          border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(168,79,255,0.25)'}`,
                          color: txt1,
                        }} />
                      <button className="mp-submit" onClick={handleLog} disabled={!selected || loading}
                        style={{
                          background: selected
                            ? (dark
                                ? `linear-gradient(135deg, ${selected.c}, #bf7fff)`
                                : `linear-gradient(135deg, ${selected.lightBorder}, ${selected.lightText})`)
                            : (dark ? 'rgba(255,255,255,0.06)' : '#ede8f5'),
                          color: selected ? '#fff' : txt3,
                        }}>
                        {loading ? 'logging...' : success ? 'logged!' : selected ? `log — ${selected.label}` : 'pick a mood first'}
                      </button>
                      <AnimatePresence>
                        {success && (
                          <motion.div className="mp-toast"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={dark
                              ? { background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.28)', color: '#00e5a0' }
                              : { background: '#d0fff2', border: '2px solid #00c987', color: '#005c41' }
                            }>
                            mood saved in realtime
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right col */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Selected preview */}
                    <AnimatePresence>
                      {selected && (
                        <motion.div className="mp-preview"
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          style={dark
                            ? { background: selected.bg, border: `2px solid ${selected.border}` }
                            : { background: selected.lightBg, border: `3px solid ${selected.lightBorder}` }
                          }>
                          <motion.div animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
                            <i className={`ti ${selected.icon} mp-preview-ico`} aria-hidden="true"
                              style={{ color: dark ? selected.c : selected.lightText }} />
                          </motion.div>
                          <div className="mp-preview-lbl" style={{ color: dark ? selected.c : selected.lightText }}>{selected.label}</div>
                          <div className="mp-dots" style={{ justifyContent: 'center', gap: '5px' }}>
                            {[...Array(5)].map((_, i) => (
                              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%',
                                background: i < selected.score
                                  ? (dark ? selected.c : selected.lightBorder)
                                  : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)') }} />
                            ))}
                          </div>
                          <p className="mp-preview-sub" style={{ color: dark ? txt1 : selected.lightText }}>score: {selected.score} / 5</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Today's log */}
                    <div className="mp-card" style={{ background: card, border: `1px solid ${bord}`, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <p className="mp-card-lbl" style={{ color: txt1, marginBottom: 0 }}>today's log</p>
                        <div className="mp-live-dot" style={{ flexShrink: 0, background: dark ? '#00e5a0' : '#00a36a' }} />
                      </div>
                      {todayEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                          <i className="ti ti-moon" aria-hidden="true"
                            style={{ fontSize: '32px', color: txt3, display: 'block', marginBottom: '8px' }} />
                          <span style={{ fontSize: '13px', color: txt3 }}>no entries yet</span>
                        </div>
                      ) : (
                        <div className="mp-loglist">
                          <AnimatePresence>
                            {todayEntries.map((e, i) => {
                              const m = moods.find(x => x.label === e.mood)
                              return (
                                <motion.div key={e.id} className="mp-logitem"
                                  initial={{ opacity: 0, x: 16, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                                  transition={{ delay: i * 0.04 }}
                                  style={dark
                                    ? { background: 'rgba(255,255,255,0.03)' }
                                    : { background: m?.lightBg || '#f0e0ff', border: `1px solid ${m?.lightBorder || '#a84fff'}44` }
                                  }>
                                  <i className={`ti ${m?.icon || 'ti-circle'} mp-logitem-ico`}
                                    aria-hidden="true" style={{ color: dark ? (m?.c || '#bf7fff') : (m?.lightText || '#4a0080') }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="mp-logitem-name" style={{ color: dark ? txt1 : (m?.lightText || '#0a0a0f') }}>{e.mood}</div>
                                    {e.note && <div className="mp-logitem-note" style={{ color: txt2 }}>{e.note}</div>}
                                  </div>
                                  <div className="mp-logitem-time" style={{ color: txt2 }}>
                                    {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
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

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div className="mp-card" style={{ background: card, border: `1px solid ${bord}` }}>
                  <p className="mp-card-lbl" style={{ color: txt1 }}>all entries</p>
                  {entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                      <i className="ti ti-database-off" aria-hidden="true"
                        style={{ fontSize: '40px', color: txt3, display: 'block', marginBottom: '10px' }} />
                      <span style={{ fontSize: '14px', color: txt3 }}>nothing here yet</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {entries.map((e, i) => {
                        const m = moods.find(x => x.label === e.mood)
                        return (
                          <motion.div key={e.id} className="mp-histitem"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            style={dark
                              ? { background: 'rgba(255,255,255,0.025)', border: `1px solid ${m?.border || 'rgba(255,255,255,0.06)'}` }
                              : { background: m?.lightBg || '#f0e0ff', border: `2px solid ${m?.lightBorder || '#a84fff'}` }
                            }>
                            <i className={`ti ${m?.icon || 'ti-circle'} mp-histitem-ico`}
                              aria-hidden="true" style={{ color: dark ? (m?.c || '#bf7fff') : (m?.lightText || '#4a0080') }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: dark ? txt1 : (m?.lightText || '#0a0a0f') }}>{e.mood}</div>
                              {e.note && <div style={{ fontSize: '12px', color: txt2, marginTop: '2px' }}>"{e.note}"</div>}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div className="mp-dots" style={{ justifyContent: 'flex-end', marginBottom: '5px' }}>
                                {[...Array(5)].map((_, di) => (
                                  <div key={di} className="mp-dot"
                                    style={{ width: '5px', height: '5px', background: di < e.score
                                      ? (dark ? (m?.c || '#bf7fff') : (m?.lightBorder || '#a84fff'))
                                      : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)') }} />
                                ))}
                              </div>
                              <div style={{ fontSize: '10px', color: dark ? txt3 : (m?.lightText || '#0a0a0f'), opacity: 0.6 }}>
                                {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {' · '}
                                {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── AI TAB ── */}
            {activeTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="mp-card" style={{ background: card, border: dark ? '1px solid rgba(191,127,255,0.25)' : '2px solid #a84fff', maxWidth: '680px' }}>
                  <div className="mp-ai-header">
                    <div className="mp-ai-avatar">
                      <i className="ti ti-brain" aria-hidden="true" style={{ fontSize: '20px', color: '#fff' }} />
                    </div>
                    <div>
                      <div className="mp-ai-title" style={{ color: txt1 }}>AI mood analysis</div>
                      <div className="mp-ai-sub" style={{ color: txt2 }}>powered by Llama 3.1 via Groq</div>
                    </div>
                  </div>

                  {aiLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="mp-spin" />
                      <div style={{ color: txt2, fontSize: '13px' }}>analyzing your mood patterns...</div>
                    </div>
                  ) : aiSummary ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="mp-ai-body"
                        style={dark
                          ? { background: 'rgba(191,127,255,0.06)', border: `1px solid rgba(191,127,255,0.15)`, color: txt1 }
                          : { background: '#f0e0ff', border: `2px solid #a84fff`, color: '#0a0a0f' }
                        }>
                        {aiSummary}
                      </div>
                      <motion.button className="mp-btn-pill" whileTap={{ scale: 0.97 }}
                        onClick={handleAISummary}
                        style={{ marginTop: '14px', background: 'linear-gradient(135deg, #7000d4, #e0003a)', border: 'none', color: '#fff' }}>
                        <i className="ti ti-refresh" aria-hidden="true" />
                        regenerate
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px' }}>
                      <i className="ti ti-brain" aria-hidden="true"
                        style={{ fontSize: '38px', color: dark ? '#bf7fff' : '#7000d4', display: 'block', marginBottom: '12px', opacity: 0.7 }} />
                      <div style={{ color: txt2, fontSize: '13px', marginBottom: '18px' }}>
                        click AI summary to analyze your mood patterns
                      </div>
                      <motion.button className="mp-btn-pill" whileTap={{ scale: 0.97 }}
                        onClick={handleAISummary} disabled={entries.length === 0}
                        style={{ background: 'linear-gradient(135deg, #7000d4, #e0003a)', border: 'none', color: '#fff', opacity: entries.length === 0 ? 0.4 : 1 }}>
                        <i className="ti ti-sparkles" aria-hidden="true" />
                        analyze my mood
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