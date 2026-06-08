'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const PROFESSIONS = [
  'Student',
  'Software Developer',
  'Designer',
  'Product Manager',
  'Data Scientist / Analyst',
  'Teacher / Educator',
  'Healthcare Professional',
  'Artist / Creative',
  'Writer / Content Creator',
  'Entrepreneur / Freelancer',
  'Marketing & PR',
  'Finance & Accounting',
  'Engineer (Non-tech)',
  'Researcher / Academic',
  'Other',
]

const STEPS = ['name', 'details', 'profession', 'done'] as const
type Step = (typeof STEPS)[number]

interface Props {
  userId: string
  onComplete: () => void
}

export default function OnboardingModal({ userId, onComplete }: Props) {
  const supabase = createClient()

  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [dob, setDob] = useState('')
  const [profession, setProfession] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay so the modal fades in nicely after login
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const stepIndex = STEPS.indexOf(step)
  const progress = (stepIndex / (STEPS.length - 1)) * 100

  const handleSave = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: name.trim(),
      nickname: nickname.trim() || null,
      date_of_birth: dob || null,
      profession: profession || null,
      onboarded: true,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setStep('done')
    setTimeout(() => {
      onComplete()
    }, 2200)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '14px',
    border: '1.5px solid rgba(200,178,188,0.25)',
    background: 'rgba(255,255,255,0.7)',
    color: '#3e2f35',
    fontSize: '14px',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11.5px',
    color: '#a09098',
    marginBottom: '7px',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }

  const btnPrimary: React.CSSProperties = {
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
    boxShadow: '0 6px 24px rgba(214,162,192,0.32)',
    opacity: loading ? 0.65 : 1,
    transition: 'opacity 0.2s, transform 0.15s',
  }

  const btnSecondary: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    borderRadius: '16px',
    border: '1.5px solid rgba(200,178,188,0.3)',
    background: 'rgba(255,255,255,0.5)',
    color: '#9a7a88',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'DM Sans, sans-serif',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: '8px',
  }

  const canProceedName = name.trim().length >= 2
  const canProceedDetails = dob !== ''
  const canProceedProfession = profession !== ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        .ob-overlay {
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .ob-overlay.visible {
          opacity: 1;
        }
        .ob-card {
          transform: translateY(24px) scale(0.97);
          opacity: 0;
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease;
        }
        .ob-overlay.visible .ob-card {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        .ob-input:focus {
          border-color: rgba(206,162,185,0.6) !important;
          background: rgba(255,255,255,0.92) !important;
        }
        .ob-input::placeholder { color: #c4b0b8; }
        .ob-select:focus {
          border-color: rgba(206,162,185,0.6) !important;
          background: rgba(255,255,255,0.92) !important;
        }
        .ob-btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .ob-btn-secondary:hover { background: rgba(255,255,255,0.8) !important; }
        .ob-profession-item {
          padding: 11px 14px;
          borderRadius: 12px;
          cursor: pointer;
          fontSize: 13.5px;
          fontFamily: 'DM Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
          color: #5a3f4a;
          border: 1.5px solid transparent;
        }
        .ob-profession-item.selected {
          background: rgba(224,160,188,0.18) !important;
          border-color: rgba(200,160,185,0.4) !important;
          color: #8a4a68 !important;
        }
        .ob-profession-item:hover:not(.selected) {
          background: rgba(245,235,240,0.8) !important;
        }
        @keyframes sparkle-in {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes bobDot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .done-icon { animation: sparkle-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .float-emoji {
          position: absolute;
          animation: float-up 1.8s ease-out forwards;
          pointer-events: none;
          font-size: 20px;
        }
      `}</style>

      {/* Backdrop overlay */}
      <div
        className={`ob-overlay${visible ? ' visible' : ''}`}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(240,228,234,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {/* Card */}
        <div
          className="ob-card"
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(255,255,255,0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            padding: '36px 30px 28px',
            position: 'relative',
            boxShadow: '0 12px 60px rgba(210,150,175,0.16), 0 2px 14px rgba(180,130,200,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Decorative bg orb */}
          <div style={{
            position: 'absolute',
            top: '-60px', right: '-60px',
            width: '200px', height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,170,255,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Bouncing dots */}
          <div style={{
            position: 'absolute', top: '-11px', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: '5px', alignItems: 'center',
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

          {step !== 'done' && (
            <>
              {/* Progress bar */}
              <div style={{
                height: '3px',
                background: 'rgba(200,175,185,0.18)',
                borderRadius: '99px',
                marginBottom: '26px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg,#e0a0bc,#c4aaff)',
                  borderRadius: '99px',
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>

              {/* Step label */}
              <p style={{
                fontSize: '11px',
                color: '#c0aab2',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}>
                step {stepIndex + 1} of {STEPS.length - 1}
              </p>
            </>
          )}

          {/* ── STEP: name ──────────────────────────── */}
          {step === 'name' && (
            <div>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '40px',
                lineHeight: 1,
                fontWeight: 500,
                color: '#36272d',
                marginBottom: '6px',
              }}>
                first things first,
              </h2>
              <p style={{ fontSize: '13px', color: '#a08a94', fontStyle: 'italic', marginBottom: '28px' }}>
                tell us your name ✨
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Your full name</label>
                <input
                  className="ob-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vaishnavi"
                  style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && canProceedName && setStep('details')}
                  autoFocus
                />
              </div>

              <button
                className="ob-btn-primary"
                onClick={() => setStep('details')}
                disabled={!canProceedName}
                style={{ ...btnPrimary, opacity: canProceedName ? 1 : 0.45, cursor: canProceedName ? 'pointer' : 'not-allowed' }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP: details ────────────────────────── */}
          {step === 'details' && (
            <div>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '40px',
                lineHeight: 1,
                fontWeight: 500,
                color: '#36272d',
                marginBottom: '6px',
              }}>
                a little more,
              </h2>
              <p style={{ fontSize: '13px', color: '#a08a94', fontStyle: 'italic', marginBottom: '28px' }}>
                we'll personalise your experience ♡
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nickname <span style={{ color: '#d0b8c0', fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="ob-input"
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="what should we call you?"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Date of birth</label>
                <input
                  className="ob-input"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'light' }}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <button
                className="ob-btn-primary"
                onClick={() => setStep('profession')}
                disabled={!canProceedDetails}
                style={{ ...btnPrimary, opacity: canProceedDetails ? 1 : 0.45, cursor: canProceedDetails ? 'pointer' : 'not-allowed' }}
              >
                Continue →
              </button>
              <button className="ob-btn-secondary" onClick={() => setStep('name')} style={btnSecondary}>
                ← Back
              </button>
            </div>
          )}

          {/* ── STEP: profession ─────────────────────── */}
          {step === 'profession' && (
            <div>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '40px',
                lineHeight: 1,
                fontWeight: 500,
                color: '#36272d',
                marginBottom: '6px',
              }}>
                what do you do?
              </h2>
              <p style={{ fontSize: '13px', color: '#a08a94', fontStyle: 'italic', marginBottom: '20px' }}>
                helps us tailor your mood context ✦
              </p>

              {error && (
                <div style={{
                  background: 'rgba(226,75,74,0.07)',
                  border: '1px solid rgba(226,75,74,0.13)',
                  borderRadius: '12px',
                  padding: '10px 13px',
                  fontSize: '12px',
                  color: '#b05555',
                  marginBottom: '14px',
                }}>{error}</div>
              )}

              {/* Scrollable profession list */}
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                marginBottom: '20px',
                paddingRight: '4px',
              }}>
                {PROFESSIONS.map(p => (
                  <div
                    key={p}
                    className={`ob-profession-item${profession === p ? ' selected' : ''}`}
                    onClick={() => setProfession(p)}
                    style={{
                      padding: '11px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      fontFamily: 'DM Sans, sans-serif',
                      color: profession === p ? '#8a4a68' : '#5a3f4a',
                      background: profession === p ? 'rgba(224,160,188,0.18)' : 'rgba(250,244,247,0.6)',
                      border: `1.5px solid ${profession === p ? 'rgba(200,160,185,0.4)' : 'transparent'}`,
                      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {p}
                    {profession === p && (
                      <span style={{ fontSize: '14px', color: '#c07090' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="ob-btn-primary"
                onClick={handleSave}
                disabled={!canProceedProfession || loading}
                style={{ ...btnPrimary, opacity: canProceedProfession && !loading ? 1 : 0.45, cursor: canProceedProfession && !loading ? 'pointer' : 'not-allowed' }}
              >
                {loading ? 'Saving...' : 'Set up my space ♡'}
              </button>
              <button className="ob-btn-secondary" onClick={() => setStep('details')} style={btnSecondary}>
                ← Back
              </button>
            </div>
          )}

          {/* ── STEP: done ───────────────────────────── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
              <div className="done-icon" style={{ fontSize: '64px', marginBottom: '20px', display: 'block' }}>
                🌸
              </div>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '44px',
                lineHeight: 1,
                fontWeight: 500,
                color: '#36272d',
                marginBottom: '10px',
              }}>
                you're all set,
              </h2>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '28px',
                fontStyle: 'italic',
                color: '#c07090',
                marginBottom: '10px',
              }}>
                {nickname.trim() || name.trim()} ✨
              </p>
              <p style={{ fontSize: '13px', color: '#a08a94' }}>
                your little digital safe space is ready
              </p>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '22px' }}>
                {['🌷', '✦', '🌿', '✦', '🌷'].map((e, i) => (
                  <span key={i} style={{
                    animation: `twinkle ${1.6 + i * 0.3}s ease-in-out ${i * 200}ms infinite`,
                    display: 'inline-block',
                    color: '#d4a8c0',
                  }}>{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}