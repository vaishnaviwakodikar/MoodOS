'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ── Canvas animation types ──────────────────────────────────────────────────

const PALETTES = [
  ['#f9c6d8', '#e8b4d0', '#d4a0e8'],
  ['#c8b2ff', '#e0b8d8', '#f7d4e6'],
  ['#f2c4de', '#dbb8f5', '#c6d0ff'],
  ['#ffd6e8', '#e8c6f8', '#c8d8ff'],
  ['#f5b8d0', '#e2b2f8', '#b8c8ff'],
]

function randColor() {
  const p = PALETTES[Math.floor(Math.random() * PALETTES.length)]
  return p[Math.floor(Math.random() * p.length)]
}

class Petal {
  x = 0; y = 0; size = 0; speedY = 0; speedX = 0
  rot = 0; rotSpeed = 0; opacity = 0; color = ''
  swing = 0; swingSpeed = 0; w = 0; h = 0

  constructor(w: number, h: number, initial = false) {
    this.w = w; this.h = h
    this.reset(initial)
  }

  reset(initial = false) {
    this.x = Math.random() * this.w
    this.y = initial ? Math.random() * this.h : -18
    this.size = 5 + Math.random() * 9
    this.speedY = 0.4 + Math.random() * 0.7
    this.speedX = (Math.random() - 0.5) * 0.5
    this.rot = Math.random() * Math.PI * 2
    this.rotSpeed = (Math.random() - 0.5) * 0.025
    this.opacity = 0.25 + Math.random() * 0.45
    this.color = randColor()
    this.swing = Math.random() * Math.PI * 2
    this.swingSpeed = 0.012 + Math.random() * 0.015
  }

  update() {
    this.swing += this.swingSpeed
    this.x += this.speedX + Math.sin(this.swing) * 0.5
    this.y += this.speedY
    this.rot += this.rotSpeed
    if (this.y > this.h + 20) this.reset(false)
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rot)
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.ellipse(0, 0, this.size * 0.55, this.size, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

class Bokeh {
  x = 0; y = 0; r = 0; opacity = 0; color = ''
  speedY = 0; drift = 0; phase = 0; w = 0; h = 0

  constructor(w: number, h: number, initial = false) {
    this.w = w; this.h = h
    this.reset(initial)
  }

  reset(initial = false) {
    this.x = Math.random() * this.w
    this.y = initial ? Math.random() * this.h : this.h + 20
    this.r = 18 + Math.random() * 46
    this.opacity = 0.04 + Math.random() * 0.09
    this.color = randColor()
    this.speedY = -(0.06 + Math.random() * 0.12)
    this.drift = (Math.random() - 0.5) * 0.06
    this.phase = Math.random() * Math.PI * 2
  }

  update() {
    this.phase += 0.008
    this.x += this.drift + Math.sin(this.phase) * 0.15
    this.y += this.speedY
    if (this.y < -this.r * 2) this.reset(false)
  }

  draw(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r)
    grad.addColorStop(0, this.color + 'cc')
    grad.addColorStop(1, this.color + '00')
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

class StarParticle {
  x = 0; y = 0; size = 0; opacity = 0
  twinkleSpeed = 0; phase = 0; color = ''; w = 0; h = 0

  constructor(w: number, h: number) {
    this.w = w; this.h = h
    this.reset()
  }

  reset() {
    this.x = Math.random() * this.w
    this.y = Math.random() * this.h
    this.size = 1 + Math.random() * 2
    this.opacity = 0.2 + Math.random() * 0.6
    this.twinkleSpeed = 0.02 + Math.random() * 0.04
    this.phase = Math.random() * Math.PI * 2
    this.color = PALETTES[Math.floor(Math.random() * PALETTES.length)][0]
  }

  update() {
    this.phase += this.twinkleSpeed
    this.opacity = 0.15 + 0.5 * (0.5 + 0.5 * Math.sin(this.phase))
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── Canvas animation ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let petals: Petal[] = []
    let bokeh: Bokeh[] = []
    let stars: StarParticle[] = []

    function init(w: number, h: number) {
      petals = Array.from({ length: 28 }, () => new Petal(w, h, true))
      bokeh = Array.from({ length: 14 }, () => new Bokeh(w, h, true))
      stars = Array.from({ length: 30 }, () => new StarParticle(w, h))
    }

    function resize() {
      const parent = canvas!.parentElement!
      canvas!.width = parent.offsetWidth
      canvas!.height = parent.offsetHeight
    }

    resize()
    init(canvas.width, canvas.height)

    const ro = new ResizeObserver(() => {
      resize()
      init(canvas!.width, canvas!.height)
    })
    ro.observe(canvas.parentElement!)

    function drawBg() {
      const w = canvas!.width, h = canvas!.height
      const grad = ctx!.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#fdf0f4')
      grad.addColorStop(0.45, '#f5ecfa')
      grad.addColorStop(1, '#ece8ff')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, w, h)
    }

    function loop() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      drawBg()
      bokeh.forEach(b => { b.update(); b.draw(ctx!) })
      stars.forEach(s => { s.update(); s.draw(ctx!) })
      petals.forEach(p => { p.update(); p.draw(ctx!) })
      rafRef.current = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
      else setSuccess('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next)
    setError('')
    setSuccess('')
  }

  // ── Styles (inline to match original pattern) ─────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 15px',
    borderRadius: '14px',
    border: '1.5px solid rgba(200,178,188,0.22)',
    background: 'rgba(255,255,255,0.65)',
    color: '#3e2f35',
    fontSize: '13.5px',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11.5px',
    color: '#a09098',
    marginBottom: '6px',
    fontWeight: 500,
    letterSpacing: '0.02em',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        .moodos-input:focus {
          border-color: rgba(206,162,185,0.55) !important;
          background: rgba(255,255,255,0.9) !important;
        }
        .moodos-input::placeholder { color: #c0aab2; }

        .moodos-google:hover {
          background: rgba(255,255,255,0.88) !important;
          box-shadow: 0 2px 12px rgba(200,160,180,0.14);
        }

        .moodos-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .moodos-submit:active { transform: translateY(0) !important; }

        .moodos-tab {
          flex: 1;
          padding: 9px;
          text-align: center;
          font-size: 12.5px;
          font-family: 'DM Sans', sans-serif;
          border: none;
          background: transparent;
          color: #a89298;
          border-radius: 11px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          font-weight: 500;
        }
        .moodos-tab.active {
          background: rgba(255,255,255,0.9);
          color: #7a4a62;
          box-shadow: 0 2px 8px rgba(200,155,180,0.14);
        }

        @keyframes pulseOrb {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,178,255,0.4); transform: scale(1); }
          50%       { box-shadow: 0 0 0 6px rgba(200,178,255,0); transform: scale(1.15); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50%       { opacity: 1;    transform: scale(1.2); }
        }
        @keyframes bobDot {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        {/* Animated canvas background */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255,255,255,0.62)',
          border: '1px solid rgba(255,255,255,0.75)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderRadius: '28px',
          padding: '36px 30px 28px',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 8px 48px rgba(210,150,175,0.13), 0 2px 12px rgba(180,130,200,0.08)',
        }}>

          {/* Bouncing dots ribbon */}
          <div style={{
            position: 'absolute',
            top: '-11px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}>
            {[0, 300, 600].map((delay, i) => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: i === 1
                  ? 'linear-gradient(135deg,#cdb4ff,#e8a8bf)'
                  : 'linear-gradient(135deg,#e8aabf,#c8b2ff)',
                animation: `bobDot 2.4s ease-in-out ${delay}ms infinite`,
              }} />
            ))}
          </div>

          {/* Header */}
          <div style={{ marginBottom: '26px', position: 'relative' }}>
            {/* Sparkle accents */}
            <span style={{
              position: 'absolute', top: '4px', right: '0',
              fontSize: '13px', color: '#d8a7b6',
              animation: 'twinkle 2.5s ease-in-out infinite',
            }}>✦</span>
            <span style={{
              position: 'absolute', top: '20px', right: '18px',
              fontSize: '9px', color: '#c3b4f5',
              animation: 'twinkle 3.2s ease-in-out 0.8s infinite',
            }}>✦</span>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#e8a8bf 0%,#c8b2ff 100%)',
                animation: 'pulseOrb 3s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg,#cf8ea6 0%,#a58cff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>MoodOS</span>
            </div>

            <h1 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '50px',
              lineHeight: 0.94,
              fontWeight: 500,
              color: '#36272d',
              marginBottom: '8px',
            }}>
              {mode === 'signin' ? 'welcome back,' : 'join moodos,'}
            </h1>

            <p style={{ fontSize: '13px', color: '#a08a94', fontStyle: 'italic' }}>
              {mode === 'signin'
                ? 'your little digital safe space ♡'
                : 'start documenting your days beautifully ✦'}
            </p>
          </div>

          {/* Mode tab switcher */}
          <div style={{
            display: 'flex',
            borderRadius: '14px',
            background: 'rgba(245,235,240,0.7)',
            padding: '4px',
            gap: '4px',
            marginBottom: '22px',
          }}>
            <button
              className={`moodos-tab${mode === 'signin' ? ' active' : ''}`}
              onClick={() => switchMode('signin')}
            >sign in</button>
            <button
              className={`moodos-tab${mode === 'signup' ? ' active' : ''}`}
              onClick={() => switchMode('signup')}
            >sign up</button>
          </div>

          {/* Alerts */}
          {error && (
            <div style={{
              background: 'rgba(226,75,74,0.07)',
              border: '1px solid rgba(226,75,74,0.13)',
              borderRadius: '14px',
              padding: '11px 13px',
              fontSize: '12.5px',
              color: '#b05555',
              marginBottom: '14px',
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: 'rgba(29,158,117,0.07)',
              border: '1px solid rgba(29,158,117,0.13)',
              borderRadius: '14px',
              padding: '11px 13px',
              fontSize: '12.5px',
              color: '#4a9a7a',
              marginBottom: '14px',
            }}>{success}</div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="moodos-google"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '16px',
              border: '1px solid rgba(200,175,185,0.22)',
              background: 'rgba(255,255,255,0.6)',
              color: '#574850',
              fontSize: '13.5px',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '18px',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.28H1.85v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.53c-.16-.48-.25-.99-.25-1.53s.09-1.05.25-1.53V5.4H1.85A8 8 0 0 0 .98 9c0 1.29.31 2.51.87 3.6l2.66-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.72c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9h2.53C4.14 5.12 6.22 3.72 8.98 3.72z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(190,165,175,0.22)' }} />
            <span style={{ fontSize: '10px', color: '#c0aab2', letterSpacing: '0.15em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(190,165,175,0.22)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Full name</label>
                <input
                  className="moodos-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name ✨"
                  required
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input
                className="moodos-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                className="moodos-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="moodos-submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg,#e0a0bc 0%,#c4aaff 60%,#d8a6c0 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                boxShadow: '0 6px 24px rgba(214,162,192,0.32)',
                transition: 'opacity 0.2s, transform 0.15s',
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in ♡' : 'Create account ♡'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12.5px', color: '#a89298' }}>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              style={{
                border: 'none',
                background: 'none',
                color: '#c07090',
                marginLeft: '5px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12.5px',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {mode === 'signin' ? 'sign up' : 'sign in'}
            </button>
          </p>
        </div>
      </div>
    </>
  )
}