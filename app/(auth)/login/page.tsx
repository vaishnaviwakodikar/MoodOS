'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      else { router.push('/dashboard'); router.refresh() }
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(127,119,221,0.2)',
        borderRadius: '16px',
        padding: '40px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#7F77DD', boxShadow: '0 0 12px rgba(127,119,221,0.8)',
            }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#e8e6ff' }}>MoodOS</span>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(232,230,255,0.4)' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{
            background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', color: '#f09595', marginBottom: '16px',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', color: '#5DCAA5', marginBottom: '16px',
          }}>{success}</div>
        )}

        {/* Google */}
        <button onClick={handleGoogle} style={{
          width: '100%', padding: '11px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', color: '#e8e6ff',
          fontSize: '14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px',
          marginBottom: '20px',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.28H1.85v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.51 10.53c-.16-.48-.25-.99-.25-1.53s.09-1.05.25-1.53V5.4H1.85A8 8 0 0 0 .98 9c0 1.29.31 2.51.87 3.6l2.66-2.07z"/>
            <path fill="#EA4335" d="M8.98 3.72c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9h2.53C4.14 5.12 6.22 3.72 8.98 3.72z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(232,230,255,0.3)' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(232,230,255,0.5)', display: 'block', marginBottom: '6px' }}>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" required
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e8e6ff', fontSize: '14px', outline: 'none' }}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(232,230,255,0.5)', display: 'block', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e8e6ff', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(232,230,255,0.5)', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={8}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e8e6ff', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px',
            background: '#7F77DD', border: 'none',
            borderRadius: '10px', color: 'white',
            fontSize: '14px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, marginTop: '4px',
          }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Toggle */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(232,230,255,0.35)', marginTop: '20px' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', color: '#7F77DD', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  )
}