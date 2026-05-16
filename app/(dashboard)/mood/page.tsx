'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

const moods = [
  { label: 'Amazing', emoji: '🤩', score: 5, color: '#fbbf24' },
  { label: 'Happy', emoji: '😊', score: 4, color: '#34d399' },
  { label: 'Focused', emoji: '🎯', score: 4, color: '#60a5fa' },
  { label: 'Okay', emoji: '😐', score: 3, color: '#a78bfa' },
  { label: 'Tired', emoji: '😴', score: 2, color: '#94a3b8' },
  { label: 'Anxious', emoji: '😰', score: 2, color: '#f97316' },
  { label: 'Sad', emoji: '😢', score: 1, color: '#60a5fa' },
  { label: 'Stressed', emoji: '😤', score: 1, color: '#f87171' },
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
  const [selected, setSelected] = useState<typeof moods[0] | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [success, setSuccess] = useState(false)

  useEffect(() => { fetchEntries() }, [])

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('mood_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
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

  return (
    <div style={{ padding: '32px', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', background: '#08080f' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '36px', fontWeight: 700, letterSpacing: '-1px',
          background: 'linear-gradient(135deg, #e8e6ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '6px',
        }}>mood tracker 🫠</h1>
        <p style={{ fontSize: '14px', color: 'rgba(232,230,255,0.4)' }}>how you feeling rn bestie?</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>

        {/* Left — logger */}
        <div>
          {/* Mood picker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(167,139,250,0.15)',
              borderRadius: '20px', padding: '24px', marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(232,230,255,0.4)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              pick your vibe
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {moods.map((m, i) => (
                <motion.button
                  key={m.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(m)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '16px 8px',
                    background: selected?.label === m.label ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                    border: selected?.label === m.label ? `2px solid ${m.color}` : '2px solid transparent',
                    borderRadius: '14px', cursor: 'pointer',
                    transition: 'background 0.2s, border 0.2s',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{m.emoji}</span>
                  <span style={{ fontSize: '11px', color: selected?.label === m.label ? m.color : 'rgba(232,230,255,0.5)', fontWeight: 500 }}>
                    {m.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(167,139,250,0.15)',
              borderRadius: '20px', padding: '24px', marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(232,230,255,0.4)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              spill the tea (optional)
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="what's on your mind..."
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '12px 16px',
                color: '#e8e6ff', fontSize: '14px', resize: 'none',
                outline: 'none', fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </motion.div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLog}
            disabled={!selected || loading}
            style={{
              width: '100%', padding: '16px',
              background: selected ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '14px',
              color: selected ? 'white' : 'rgba(232,230,255,0.3)',
              fontSize: '15px', fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'logging...' : success ? '✅ logged!' : `log mood ${selected ? selected.emoji : ''}`}
          </motion.button>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  marginTop: '12px', padding: '12px 16px',
                  background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: '12px', color: '#34d399', fontSize: '13px', textAlign: 'center',
                }}
              >
                mood logged bestie! 🎉
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — history */}
        <div>
          {/* Today stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))',
              border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '20px', padding: '20px', marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(232,230,255,0.4)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              today's vibe check
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#a78bfa' }}>
                  {avgScore || '—'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(232,230,255,0.3)' }}>avg score</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#60a5fa' }}>
                  {todayEntries.length}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(232,230,255,0.3)' }}>logs today</div>
              </div>
            </div>
          </motion.div>

          {/* Recent entries */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(167,139,250,0.15)',
              borderRadius: '20px', padding: '20px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(232,230,255,0.4)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              recent logs
            </div>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(232,230,255,0.2)', fontSize: '13px' }}>
                no logs yet bestie 🌚
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AnimatePresence>
                  {entries.map((e, i) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px', background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{e.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#e8e6ff' }}>{e.mood}</div>
                        {e.note && <div style={{ fontSize: '11px', color: 'rgba(232,230,255,0.3)', marginTop: '2px' }}>{e.note}</div>}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(232,230,255,0.25)', textAlign: 'right' }}>
                        {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}