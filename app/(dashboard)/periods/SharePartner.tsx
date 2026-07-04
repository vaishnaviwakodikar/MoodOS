'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

interface SharePartnerProps {
  open: boolean
  onOpenChange: (val: boolean) => void
}

export default function SharePartner({ open, onOpenChange }: SharePartnerProps) {
  const [supabase] = useState(() => createClient())
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
      user_id: user.id, code, label: 'Partner share', active: true,
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

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.15)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 50,
        width: '320px',
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #fce4ec',
        boxShadow: '0 8px 40px rgba(255, 61, 139, 0.12), 0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fff0f5 0%, #fce4ec 100%)',
          padding: '16px 20px',
          borderBottom: '1px solid #fce4ec',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#e57399', textTransform: 'uppercase', fontWeight: 500, marginBottom: '2px' }}>
                PARTNER ACCESS
              </p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#c2185b', margin: 0 }}>
                Share your cycle
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={createShare}
                disabled={loading}
                style={{
                  background: '#ff3d8b', color: 'white', border: 'none',
                  borderRadius: '20px', padding: '7px 14px', fontSize: '12px',
                  fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '…' : '+ New link'}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid #f8bbd0', background: 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px', color: '#e57399',
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#e57399', marginTop: '6px', marginBottom: 0 }}>
            Cycle, symptoms &amp; mood
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', maxHeight: '280px', overflowY: 'auto' }}>
          {activeShares.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ 
  marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
}}>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4607a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
</div>
              <p style={{ fontSize: '12px', color: '#c9a0b0', letterSpacing: '0.05em', margin: 0 }}>No active links yet</p>
              <p style={{ fontSize: '11px', color: '#dbb8c8', marginTop: '4px' }}>Create one to share with your partner</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeShares.map(share => (
                <div key={share.id} style={{
                  background: 'linear-gradient(135deg, #fff0f5 0%, #fce4ec 100%)',
                  borderRadius: '14px', border: '1px solid #f8bbd0', padding: '14px',
                }}>
                  {/* Code block */}
                  <div style={{
                    background: 'linear-gradient(135deg, #ff3d8b 0%, #ff6bb5 100%)',
                    borderRadius: '12px', padding: '14px 16px', marginBottom: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(255, 61, 139, 0.3)',
                  }}>
                    <div>
                      <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', marginBottom: '4px', margin: '0 0 4px 0' }}>
                        share code
                      </p>
                      <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '26px', color: 'white', letterSpacing: '0.35em', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        {share.code}
                      </p>
                    </div>
                    <div style={{
                      width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                    }}>🔗</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => copyLink(share.code)}
                      style={{
                        flex: 1, background: copied === share.code ? '#fce4ec' : 'white',
                        border: '1.5px solid #f8bbd0', borderRadius: '10px', padding: '9px',
                        fontSize: '12px', color: copied === share.code ? '#c2185b' : '#ff3d8b',
                        cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease',
                      }}
                    >
                      {copied === share.code ? '✓ Copied!' : '🔗 Copy link'}
                    </button>
                    <button
                      onClick={() => revokeShare(share.id)}
                      style={{
                        background: 'white', border: '1.5px solid #ffcdd2',
                        borderRadius: '10px', padding: '9px 12px',
                        fontSize: '11px', color: '#e57373', cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #fce4ec', background: '#fffafb' }}>
          <p style={{ fontSize: '10px', color: '#dbb8c8', textAlign: 'center', letterSpacing: '0.05em', margin: 0 }}>
            Links can be revoked anytime 
          </p>
        </div>
      </div>
    </>
  )
}