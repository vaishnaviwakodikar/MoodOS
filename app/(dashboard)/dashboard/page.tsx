'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const metrics = [
  { label: 'Mood today', value: '—', sub: 'Not logged yet', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', emoji: '🫠' },
  { label: 'Habits done', value: '0/0', sub: 'No habits added', color: '#34d399', bg: 'rgba(52,211,153,0.08)', emoji: '⚡' },
  { label: 'Study hours', value: '0h', sub: 'Today', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', emoji: '📚' },
  { label: 'Attendance', value: '—%', sub: 'This month', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', emoji: '🎯' },
  { label: 'Expenses', value: '₹0', sub: 'This month', color: '#f87171', bg: 'rgba(248,113,113,0.08)', emoji: '💸' },
  { label: 'Streak', value: '0 days', sub: 'Keep going!', color: '#e879f9', bg: 'rgba(232,121,249,0.08)', emoji: '🔥' },
]

const actions = [
  { label: 'Log mood', href: '/mood', emoji: '🫠', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { label: 'Study timer', href: '/study', emoji: '⏱️', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { label: 'Add expense', href: '/expenses', emoji: '💸', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { label: 'Attendance', href: '/attendance', emoji: '✅', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  { label: 'Habits', href: '/habits', emoji: '⚡', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  { label: 'Insights', href: '/insights', emoji: '📊', color: '#e879f9', bg: 'rgba(232,121,249,0.1)' },
]

const vibes = ['you got this 💪', 'stay focused bestie ✨', 'big brain energy 🧠', 'no cap, you\'re doing great 🔥', 'main character energy 👑']

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('')
  const [vibe, setVibe] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'gm ☀️' : hour < 17 ? 'good afternoon' : 'good evening 🌙')
    setVibe(vibes[Math.floor(Math.random() * vibes.length)])
    setDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))
  }, [])

  return (
    <div style={{
      padding: '32px',
      fontFamily: 'DM Sans, sans-serif',
      minHeight: '100vh',
      background: '#08080f',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background blobs */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-150px', left: '-150px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 500,
                color: 'rgba(232,230,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '2px',
                marginBottom: '8px',
              }}>{date}</div>
              <h1 style={{
                fontSize: '42px', fontWeight: 700,
                background: 'linear-gradient(135deg, #e8e6ff 0%, #a78bfa 50%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '8px',
              }}>
                {greeting}, Vaishnavi
              </h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: '20px', padding: '4px 14px',
                  fontSize: '13px', color: '#a78bfa',
                }}
              >
                {vibe}
              </motion.div>
            </div>

            {/* Live time */}
            <LiveTime />
          </div>
        </motion.div>

        {/* Metric cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '32px',
        }}>
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              style={{
                background: m.bg,
                border: `1px solid ${m.color}25`,
                borderRadius: '16px',
                padding: '20px',
                cursor: 'default',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: '-10px', right: '-10px',
                fontSize: '48px', opacity: 0.15,
                transform: 'rotate(15deg)',
              }}>{m.emoji}</div>
              <div style={{ fontSize: '11px', color: 'rgba(232,230,255,0.4)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: m.color, marginBottom: '4px', letterSpacing: '-1px' }}>
                {m.value}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(232,230,255,0.3)' }}>{m.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{
            fontSize: '11px', fontWeight: 600,
            color: 'rgba(232,230,255,0.3)',
            textTransform: 'uppercase', letterSpacing: '2px',
            marginBottom: '14px',
          }}>quick actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {actions.map((a, i) => (
              <motion.a
                key={a.label}
                href={a.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '14px 16px',
                  background: a.bg,
                  border: `1px solid ${a.color}20`,
                  borderRadius: '12px',
                  color: 'rgba(232,230,255,0.8)',
                  fontSize: '13px', fontWeight: 500,
                  textDecoration: 'none',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span style={{ fontSize: '18px' }}>{a.emoji}</span>
                {a.label}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Bottom vibe card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(96,165,250,0.08))',
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', color: 'rgba(232,230,255,0.4)', marginBottom: '4px' }}>today's mission</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#e8e6ff' }}>
              Log your mood, crush your habits, stay on track 🚀
            </div>
          </div>
          <div style={{ fontSize: '36px' }}>✨</div>
        </motion.div>

      </div>
    </div>
  )
}

function LiveTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '12px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#e8e6ff', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
        {time}
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(232,230,255,0.3)', marginTop: '2px' }}>IST</div>
    </motion.div>
  )
}