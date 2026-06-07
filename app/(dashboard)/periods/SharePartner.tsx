'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function SharePartner() {
  const [supabase] = useState(() => createClient())
  const [open, setOpen] = useState(false)
  const [shares, setShares] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { fetchShares() }, [])

  const fetchShares = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('partner_shares')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setShares(data)
  }

  const createShare = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const code = generateCode()
    await supabase.from('partner_shares').insert({
      user_id: user.id,
      code,
      label: 'Partner share',
      active: true,
    })
    await fetchShares()
    setLoading(false)
  }

  const revokeShare = async (id: string) => {
    await supabase.from('partner_shares').update({ active: false }).eq('id', id)
    await fetchShares()
  }

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/shared/${code}`
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const activeShares = shares.filter(s => s.active)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[320px]"
          style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #fce4ec',
            boxShadow: '0 8px 40px rgba(255, 61, 139, 0.12), 0 2px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #fff0f5 0%, #fce4ec 100%)',
            padding: '16px 20px',
            borderBottom: '1px solid #fce4ec',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: '#e57399',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  marginBottom: '2px',
                }}>PARTNER ACCESS</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#c2185b' }}>
                  Share your cycle
                </p>
              </div>
              <button
                onClick={createShare}
                disabled={loading}
                style={{
                  background: '#ff3d8b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? '…' : '+ New link'}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#e57399', marginTop: '6px' }}>
              Read-only · cycle, symptoms &amp; mood
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 20px', maxHeight: '280px', overflowY: 'auto' }}>
            {activeShares.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔗</div>
                <p style={{ fontSize: '12px', color: '#c9a0b0', letterSpacing: '0.05em' }}>
                  No active links yet
                </p>
                <p style={{ fontSize: '11px', color: '#dbb8c8', marginTop: '4px' }}>
                  Create one to share with your partner
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeShares.map(share => (
                  <div
                    key={share.id}
                    style={{
                      background: '#fff5f8',
                      borderRadius: '14px',
                      border: '1px solid #fce4ec',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: '#e57399', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>code</p>
                        <p style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '18px',
                          color: '#ff3d8b',
                          letterSpacing: '0.2em',
                        }}>{share.code}</p>
                      </div>
                      <button
                        onClick={() => revokeShare(share.id)}
                        style={{
                          background: 'white',
                          border: '1px solid #ffcdd2',
                          borderRadius: '10px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          color: '#e57373',
                          cursor: 'pointer',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                    <button
                      onClick={() => copyLink(share.code)}
                      style={{
                        width: '100%',
                        background: copied === share.code ? '#fce4ec' : 'white',
                        border: '1px solid #f8bbd0',
                        borderRadius: '10px',
                        padding: '8px',
                        fontSize: '12px',
                        color: copied === share.code ? '#c2185b' : '#e91e8c',
                        cursor: 'pointer',
                        fontWeight: 500,
                        letterSpacing: '0.03em',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {copied === share.code ? '✓ Copied to clipboard!' : '🔗 Copy link'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid #fce4ec',
            background: '#fffafb',
          }}>
            <p style={{ fontSize: '10px', color: '#dbb8c8', textAlign: 'center', letterSpacing: '0.05em' }}>
              Links can be revoked anytime · view only
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(prev => !prev)}
        title="Share with partner"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #e91e8c, #ff6bb5)'
            : 'linear-gradient(135deg, #ff3d8b, #ff6bb5)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          boxShadow: '0 4px 20px rgba(255, 61, 139, 0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: open ? 'scale(0.95) rotate(45deg)' : 'scale(1) rotate(0deg)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = open ? 'scale(0.95) rotate(45deg)' : 'scale(1.08) rotate(0deg)')}
        onMouseLeave={e => (e.currentTarget.style.transform = open ? 'scale(0.95) rotate(45deg)' : 'scale(1) rotate(0deg)')}
      >
        {open ? '✕' : '🔗'}
      </button>
    </>
  )
}