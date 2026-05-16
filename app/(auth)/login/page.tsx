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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f3f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'DM Sans, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* soft background blobs */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(226, 190, 203, 0.25)',
          filter: 'blur(90px)',
          top: '-120px',
          left: '-120px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(201, 184, 255, 0.18)',
          filter: 'blur(90px)',
          bottom: '-100px',
          right: '-100px',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.7)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '32px',
          padding: '42px 34px',
          boxShadow: '0 10px 40px rgba(166, 132, 150, 0.08)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header */}
<div style={{ marginBottom: '34px', position: 'relative' }}>

  {/* floating glow blobs */}
  <div
    style={{
      position: 'absolute',
      top: '-30px',
      right: '10px',
      width: '120px',
      height: '120px',
      background: 'rgba(230, 186, 206, 0.25)',
      borderRadius: '50%',
      filter: 'blur(45px)',
      animation: 'floatBlob 6s ease-in-out infinite',
      zIndex: 0,
    }}
  />

  {/* tiny sparkles */}
  <div
    style={{
      position: 'absolute',
      top: '10px',
      right: '40px',
      fontSize: '14px',
      color: '#d8a7b6',
      animation: 'sparkle 2.5s ease-in-out infinite',
    }}
  >
    ✦
  </div>

  <div
    style={{
      position: 'absolute',
      top: '30px',
      right: '80px',
      fontSize: '10px',
      color: '#cdb8ff',
      animation: 'sparkle 3s ease-in-out infinite',
    }}
  >
    ✦
  </div>

  {/* MoodOS Brand */}
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '18px',
      position: 'relative',
      zIndex: 2,
    }}
  >
    {/* animated logo orb */}
    <div
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background:
          'linear-gradient(135deg, #e6a8b7 0%, #c8b5ff 100%)',
        boxShadow: '0 0 20px rgba(214, 168, 188, 0.65)',
        animation: 'pulseGlow 2.8s ease-in-out infinite',
      }}
    />

    {/* logo text */}
    <span
      style={{
        fontSize: '28px',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        background:
          'linear-gradient(135deg, #cf8ea4 0%, #a58cff 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      MoodOS
    </span>
  </div>

  {/* Main Heading */}
  <h1
    style={{
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '58px',
      lineHeight: 0.92,
      fontWeight: 500,
      color: '#34252b',
      marginBottom: '10px',
      position: 'relative',
      zIndex: 2,
    }}
  >
    {mode === 'signin'
      ? 'welcome back,'
      : 'join moodos,'}
  </h1>

  {/* subtitle */}
  <p
    style={{
      color: '#9d8b92',
      fontSize: '14px',
      fontStyle: 'italic',
      position: 'relative',
      zIndex: 2,
    }}
  >
    {mode === 'signin'
      ? 'your little digital safe space ♡'
      : 'start documenting your days beautifully'}
  </p>
</div>

{/* animations */}
<style jsx global>{`
  @keyframes pulseGlow {
    0% {
      transform: scale(1);
      box-shadow: 0 0 18px rgba(214, 168, 188, 0.45);
    }
    50% {
      transform: scale(1.12);
      box-shadow: 0 0 28px rgba(200, 181, 255, 0.7);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 18px rgba(214, 168, 188, 0.45);
    }
  }

  @keyframes floatBlob {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0px);
    }
  }

  @keyframes sparkle {
    0% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
    100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
  }
`}</style>

        {/* error */}
        {error && (
          <div
            style={{
              background: 'rgba(226,75,74,0.08)',
              border: '1px solid rgba(226,75,74,0.15)',
              borderRadius: '16px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#bc5b5b',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* success */}
        {success && (
          <div
            style={{
              background: 'rgba(29,158,117,0.08)',
              border: '1px solid rgba(29,158,117,0.15)',
              borderRadius: '16px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#4c9b7f',
              marginBottom: '16px',
            }}
          >
            {success}
          </div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '18px',
            border: '1px solid rgba(180,160,170,0.2)',
            background: 'rgba(255,255,255,0.55)',
            color: '#57464d',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            marginBottom: '22px',
            transition: '0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
            />
            <path
              fill="#34A853"
              d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.28H1.85v2.07A8 8 0 0 0 8.98 17z"
            />
            <path
              fill="#FBBC05"
              d="M4.51 10.53c-.16-.48-.25-.99-.25-1.53s.09-1.05.25-1.53V5.4H1.85A8 8 0 0 0 .98 9c0 1.29.31 2.51.87 3.6l2.66-2.07z"
            />
            <path
              fill="#EA4335"
              d="M8.98 3.72c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9h2.53C4.14 5.12 6.22 3.72 8.98 3.72z"
            />
          </svg>

          Continue with Google
        </button>

        {/* divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'rgba(180,160,170,0.2)',
            }}
          />

          <span
            style={{
              fontSize: '11px',
              color: '#b6a3aa',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            or
          </span>

          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'rgba(180,160,170,0.2)',
            }}
          />
        </div>

        {/* form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {mode === 'signup' && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#9c8b91',
                }}
              >
                Full name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(188,170,179,0.2)',
                  background: 'rgba(255,255,255,0.6)',
                  color: '#46363c',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#9c8b91',
              }}
            >
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(188,170,179,0.2)',
                background: 'rgba(255,255,255,0.6)',
                color: '#46363c',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#9c8b91',
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(188,170,179,0.2)',
                background: 'rgba(255,255,255,0.6)',
                color: '#46363c',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '18px',
              border: 'none',
              background:
                'linear-gradient(135deg, #d99cab 0%, #c7b2ff 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '6px',
              boxShadow: '0 8px 20px rgba(206, 161, 183, 0.25)',
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>

        {/* footer */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '13px',
            color: '#a08d94',
          }}
        >
          {mode === 'signin'
            ? "don't have an account?"
            : 'already have an account?'}

          <button
            onClick={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
              setError('')
              setSuccess('')
            }}
            style={{
              border: 'none',
              background: 'none',
              color: '#be7f94',
              marginLeft: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {mode === 'signin' ? 'sign up' : 'sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}