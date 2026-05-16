'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/lib/useTheme'

const moods = [
  { label: 'Amazing', emoji: '🤩', score: 5, color: '#fbbf24', light: '#fffbeb' },
  { label: 'Happy', emoji: '😊', score: 4, color: '#34d399', light: '#ecfdf5' },
  { label: 'Focused', emoji: '🎯', score: 4, color: '#60a5fa', light: '#eff6ff' },
  { label: 'Okay', emoji: '😐', score: 3, color: '#a78bfa', light: '#f5f3ff' },
  { label: 'Tired', emoji: '😴', score: 2, color: '#94a3b8', light: '#f8fafc' },
  { label: 'Anxious', emoji: '😰', score: 2, color: '#f97316', light: '#fff7ed' },
  { label: 'Sad', emoji: '😢', score: 1, color: '#818cf8', light: '#eef2ff' },
  { label: 'Stressed', emoji: '😤', score: 1, color: '#f87171', light: '#fef2f2' },
]

type Entry = {
  id: string
  mood: string
  emoji: string
  note: string
  score: number
  created_at: string
}

export default function MoodPage() {
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  const [selected, setSelected] = useState<typeof moods[0] | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log')

  useEffect(() => { fetchEntries() }, [])

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('mood_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setEntries(data)
  }

  const handleLog = async () => {
    if (!selected) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('mood_entries').insert({
      user_id: user.id,
      mood: selected.label,
      emoji: selected.emoji,
      score: selected.score,
      note: note.trim() || null,
    })
    if (!error) {
      setSuccess(true)
      setSelected(null)
      setNote('')
      fetchEntries()
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const todayEntries = entries.filter(e =>
    new Date(e.created_at).toDateString() === new Date().toDateString()
  )
  const avgScore = todayEntries.length
    ? (todayEntries.reduce((a, e) => a + e.score, 0) / todayEntries.length).toFixed(1)
    : null
  const scoreToLabel = (s: number) =>
    s >= 4.5 ? 'Amazing ✨' : s >= 3.5 ? 'Good 😊' : s >= 2.5 ? 'Okay 😐' : s >= 1.5 ? 'Low 😴' : 'Rough 😤'

  const bg = dark ? '#08080f' : '#f8f7ff'
  const cardBg = dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.9)'
  const cardBorder = dark ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.25)'
  const text1 = dark ? '#e8e6ff' : '#1a1040'
  const text2 = dark ? 'rgba(232,230,255,0.4)' : 'rgba(26,16,64,0.5)'
  const text3 = dark ? 'rgba(232,230,255,0.25)' : 'rgba(26,16,64,0.3)'

  const statCards = [
    { label: 'avg score', value: avgScore || '—', icon: '📊', color: '#a78bfa' },
    { label: 'logs today', value: String(todayEntries.length), icon: '📝', color: '#34d399' },
    { label: 'total logs', value: String(entries.length), icon: '🗂️', color: '#60a5fa' },
    { label: "today's vibe", value: avgScore ? scoreToLabel(parseFloat(avgScore)) : '—', icon: '✨', color: '#fbbf24' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'DM Sans, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* SVG background */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: dark ? 0.4 : 0.15 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="rg1" cx="20%" cy="20%"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
          <radialGradient id="rg2" cx="80%" cy="80%"><stop offset="0%" stopColor="#34d399" stopOpacity="0.3" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></radialGradient>
          <radialGradient id="rg3" cx="60%" cy="30%"><stop offset="0%" stopColor="#f87171" stopOpacity="0.2" /><stop offset="100%" stopColor="#f87171" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx="200" cy="200" rx="400" ry="400" fill="url(#rg1)" />
        <ellipse cx="1200" cy="700" rx="350" ry="350" fill="url(#rg2)" />
        <ellipse cx="900" cy="200" rx="280" ry="280" fill="url(#rg3)" />
        <circle cx="100" cy="500" r="6" fill="#a78bfa" opacity="0.5" />
        <circle cx="1350" cy="150" r="8" fill="#34d399" opacity="0.4" />
        <circle cx="700" cy="800" r="5" fill="#fbbf24" opacity="0.5" />
        <path d="M0,450 C360,400 720,500 1080,420 C1260,380 1380,440 1440,430" stroke="#a78bfa" strokeWidth="1.5" fill="none" opacity="0.2" />
        <path d="M0,600 C400,550 800,650 1200,580 C1350,560 1420,600 1440,590" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.15" />
      </svg>

      <div style={{ position: 'relative', zIndex: 1, padding: '32px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{
                fontSize: '38px', fontWeight: 800, letterSpacing: '-1.5px',
                background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>mood tracker</h1>
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="#a78bfa" opacity="0.15" stroke="#a78bfa" strokeWidth="1.5" />
                <circle cx="14" cy="16" r="2.5" fill="#a78bfa" />
                <circle cx="26" cy="16" r="2.5" fill="#a78bfa" />
                <path d="M13,25 Q20,31 27,25" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ fontSize: '14px', color: text2 }}>how you feeling rn bestie? 👀</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', background: cardBg,
              outline: 'none',
              borderTop: `1px solid ${cardBorder}`,
              borderRight: `1px solid ${cardBorder}`,
              borderBottom: `1px solid ${cardBorder}`,
              borderLeft: `1px solid ${cardBorder}`,
              borderRadius: '20px', cursor: 'pointer', color: text1,
              fontSize: '13px', fontWeight: 500, backdropFilter: 'blur(10px)',
            }}>
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {dark ? 'light mode' : 'dark mode'}
          </motion.button>
        </motion.div>

        {/* Stat cards — plain divs, no border conflicts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {statCards.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -3 }}
              style={{
                background: cardBg,
                borderTop: `1px solid ${cardBorder}`,
                borderRight: `1px solid ${cardBorder}`,
                borderBottom: `1px solid ${cardBorder}`,
                borderLeft: `3px solid ${s.color}`,
                borderRadius: '16px', padding: '16px',
                backdropFilter: 'blur(20px)',
              }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: text2, marginTop: '2px' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['log', 'history'] as const).map(tab => (
            <motion.button key={tab} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                background: activeTab === tab ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : cardBg,
                borderTop: `1px solid ${activeTab === tab ? 'transparent' : cardBorder}`,
                borderRight: `1px solid ${activeTab === tab ? 'transparent' : cardBorder}`,
                borderBottom: `1px solid ${activeTab === tab ? 'transparent' : cardBorder}`,
                borderLeft: `1px solid ${activeTab === tab ? 'transparent' : cardBorder}`,
                borderRadius: '20px', color: activeTab === tab ? 'white' : text2,
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}>
              {tab === 'log' ? '🫠 log mood' : '📋 history'}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'log' ? (
            <motion.div key="log" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

                <div>
                  {/* Mood picker */}
                  <div style={{
                    background: cardBg,
                    borderTop: `1px solid ${cardBorder}`,
                    borderRight: `1px solid ${cardBorder}`,
                    borderBottom: `1px solid ${cardBorder}`,
                    borderLeft: `1px solid ${cardBorder}`,
                    borderRadius: '24px', padding: '24px', marginBottom: '16px',
                    backdropFilter: 'blur(20px)',
                  }}>
                    <div style={{ fontSize: '11px', color: text2, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
                      pick your vibe ✨
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {moods.map((m, i) => (
                        <motion.button key={m.label}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                          whileHover={{ scale: 1.1, y: -4 }} whileTap={{ scale: 0.92 }}
                          onClick={() => setSelected(selected?.label === m.label ? null : m)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            padding: '18px 8px',
                            background: selected?.label === m.label ? (dark ? `${m.color}25` : m.light) : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)'),
                            borderTop: `2px solid ${selected?.label === m.label ? m.color : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.15)')}`,
                            borderRight: `2px solid ${selected?.label === m.label ? m.color : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.15)')}`,
                            borderBottom: `2px solid ${selected?.label === m.label ? m.color : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.15)')}`,
                            borderLeft: `2px solid ${selected?.label === m.label ? m.color : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.15)')}`,
                            borderRadius: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                          }}>
                          <motion.span
                            animate={selected?.label === m.label ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.4 }}
                            style={{ fontSize: '30px' }}>{m.emoji}</motion.span>
                          <span style={{ fontSize: '11px', color: selected?.label === m.label ? m.color : text2, fontWeight: 600 }}>{m.label}</span>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[...Array(5)].map((_, di) => (
                              <div key={di} style={{ width: '4px', height: '4px', borderRadius: '50%', background: di < m.score ? m.color : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }} />
                            ))}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div style={{
                    background: cardBg,
                    borderTop: `1px solid ${cardBorder}`,
                    borderRight: `1px solid ${cardBorder}`,
                    borderBottom: `1px solid ${cardBorder}`,
                    borderLeft: `1px solid ${cardBorder}`,
                    borderRadius: '20px', padding: '20px', backdropFilter: 'blur(20px)',
                  }}>
                    <div style={{ fontSize: '11px', color: text2, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
                      spill the tea ☕ (optional)
                    </div>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="what's going on in that big brain of yours..."
                      rows={3}
                      style={{
                        width: '100%', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(167,139,250,0.05)',
                        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(167,139,250,0.2)'}`,
                        borderRadius: '12px', padding: '12px 16px',
                        color: text1, fontSize: '14px', resize: 'none',
                        outline: 'none', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6,
                      }} />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleLog} disabled={!selected || loading}
                      style={{
                        width: '100%', padding: '14px', marginTop: '12px',
                        background: selected ? `linear-gradient(135deg, ${selected.color}, #a78bfa)` : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(167,139,250,0.1)'),
                        borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: 'none',
                        borderRadius: '14px',
                        color: selected ? 'white' : text3,
                        fontSize: '15px', fontWeight: 700,
                        cursor: selected ? 'pointer' : 'not-allowed',
                      }}>
                      {loading ? '⏳ logging...' : success ? '🎉 logged!' : `log it ${selected ? selected.emoji : '👆 pick a mood first'}`}
                    </motion.button>
                  </div>
                </div>

                {/* Right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <AnimatePresence>
                    {selected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                          background: dark ? `${selected.color}15` : selected.light,
                          borderTop: `2px solid ${selected.color}40`,
                          borderRight: `2px solid ${selected.color}40`,
                          borderBottom: `2px solid ${selected.color}40`,
                          borderLeft: `2px solid ${selected.color}40`,
                          borderRadius: '20px', padding: '24px', textAlign: 'center',
                        }}>
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                          style={{ fontSize: '52px', marginBottom: '8px' }}>{selected.emoji}</motion.div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: selected.color }}>{selected.label}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                          {[...Array(5)].map((_, i) => (
                            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < selected.score ? selected.color : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }} />
                          ))}
                        </div>
                        <div style={{ fontSize: '12px', color: text2, marginTop: '6px' }}>score: {selected.score}/5</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{
                    background: cardBg,
                    borderTop: `1px solid ${cardBorder}`,
                    borderRight: `1px solid ${cardBorder}`,
                    borderBottom: `1px solid ${cardBorder}`,
                    borderLeft: `1px solid ${cardBorder}`,
                    borderRadius: '20px', padding: '20px', flex: 1,
                    backdropFilter: 'blur(20px)',
                  }}>
                    <div style={{ fontSize: '11px', color: text2, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
                      today's log 📅
                    </div>
                    {todayEntries.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🌚</div>
                        <div style={{ fontSize: '13px', color: text3 }}>no logs yet bestie</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {todayEntries.map((e, i) => (
                          <motion.div key={e.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(167,139,250,0.05)', borderRadius: '12px' }}>
                            <span style={{ fontSize: '22px' }}>{e.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: text1 }}>{e.mood}</div>
                              {e.note && <div style={{ fontSize: '11px', color: text3, marginTop: '1px' }}>{e.note}</div>}
                            </div>
                            <div style={{ fontSize: '10px', color: text3 }}>
                              {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{
                background: cardBg,
                borderTop: `1px solid ${cardBorder}`,
                borderRight: `1px solid ${cardBorder}`,
                borderBottom: `1px solid ${cardBorder}`,
                borderLeft: `1px solid ${cardBorder}`,
                borderRadius: '24px', padding: '24px', backdropFilter: 'blur(20px)',
              }}>
                <div style={{ fontSize: '11px', color: text2, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
                  all entries 🗂️
                </div>
                {entries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫙</div>
                    <div style={{ color: text3, fontSize: '14px' }}>nothing here yet. start logging!</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {entries.map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                          background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(167,139,250,0.04)',
                          borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(167,139,250,0.12)'}`,
                          borderRight: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(167,139,250,0.12)'}`,
                          borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(167,139,250,0.12)'}`,
                          borderLeft: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(167,139,250,0.12)'}`,
                          borderRadius: '14px',
                        }}>
                        <span style={{ fontSize: '28px' }}>{e.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: text1 }}>{e.mood}</div>
                          {e.note && <div style={{ fontSize: '12px', color: text2, marginTop: '2px' }}>"{e.note}"</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                            {[...Array(5)].map((_, di) => (
                              <div key={di} style={{ width: '6px', height: '6px', borderRadius: '50%', background: di < e.score ? (moods.find(m => m.label === e.mood)?.color || '#a78bfa') : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '11px', color: text3 }}>
                            {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}