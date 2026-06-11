'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface SharePartnerProps {
  open: boolean
  onOpenChange: (val: boolean) => void
}

export default function SharePartner({ open, onOpenChange }: SharePartnerProps) {
  const [supabase] = useState(() => createClient())
  const [shares, setShares] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false })
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200)
  }

  const fetchShares = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('partner_shares')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (data) setShares(data)
  }, [supabase])

  useEffect(() => {
    if (open) fetchShares()
  }, [open, fetchShares])

  const createShare = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const code = generateCode()
    const { error } = await supabase.from('partner_shares').insert({
      user_id: user.id,
      code,
      label: 'Partner share',
      active: true,
    })
    if (error) {
      showToast('Failed to create link')
    } else {
      await fetchShares()
      showToast('New link created')
    }
    setLoading(false)
  }

  const revokeShare = async (id: string) => {
    const { error } = await supabase
      .from('partner_shares')
      .update({ active: false })
      .eq('id', id)
    if (error) {
      showToast('Failed to revoke link')
    } else {
      setShares(prev => prev.filter(s => s.id !== id))
      showToast('Link revoked')
    }
    setConfirmRevoke(null)
  }

  const copyLink = async (code: string) => {
    const url = `${window.location.origin}/shared/${code}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard')
    } catch {
      showToast('Could not copy — try manually')
    }
  }

  const shareNative = async (code: string) => {
    const url = `${window.location.origin}/shared/${code}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My cycle data', url })
      } catch { /* user cancelled */ }
    } else {
      await copyLink(code)
    }
  }

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
        boxShadow: '0 8px 40px rgba(255,61,139,0.12), 0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fff0f5 0%, #fce4ec 100%)',
          padding: '16px 20px',
          borderBottom: '1px solid #fce4ec',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#e57399', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 2px' }}>
                Partner access
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#c2185b', margin: 0 }}>
                  Share your cycle
                </p>
                {shares.length > 0 && (
                  <span style={{
                    fontSize: '11px', background: '#ff3d8b', color: 'white',
                    borderRadius: '20px', padding: '2px 8px', fontWeight: 500,
                  }}>
                    {shares.length} active
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={createShare}
                disabled={loading}
                style={{
                  background: loading ? '#ffb3d1' : '#ff3d8b',
                  color: 'white', border: 'none',
                  borderRadius: '20px', padding: '7px 14px', fontSize: '12px',
                  fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? (
                  <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
                ) : '＋'}
                {loading ? 'Creating…' : 'New link'}
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
            Read-only · cycle, symptoms &amp; mood
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', maxHeight: '320px', overflowY: 'auto' }}>
          {shares.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔗</div>
              <p style={{ fontSize: '12px', color: '#c9a0b0', margin: 0 }}>No active links yet</p>
              <p style={{ fontSize: '11px', color: '#dbb8c8', marginTop: '4px' }}>
                Create one to share with your partner
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shares.map(share => (
                <div key={share.id} style={{
                  border: '1px solid #f8bbd0',
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}>
                  {/* Code block */}
                  <div style={{
                    background: 'linear-gradient(135deg, #ff3d8b 0%, #ff6bb5 100%)',
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', margin: '0 0 4px' }}>
                        share code
                      </p>
                      <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '26px', color: 'white', letterSpacing: '0.35em', margin: 0 }}>
                        {share.code}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>created</p>
                      <p style={{ fontSize: '11px', color: 'white', margin: 0 }}>{timeAgo(share.created_at)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {confirmRevoke === share.id ? (
                    <div style={{
                      padding: '10px 12px', background: '#fff5f7',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    }}>
                      <p style={{ fontSize: '12px', color: '#c2185b', margin: 0 }}>Revoke this link?</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => revokeShare(share.id)}
                          style={{
                            background: '#ff3d8b', color: 'white', border: 'none',
                            borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                            fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          Yes, revoke
                        </button>
                        <button
                          onClick={() => setConfirmRevoke(null)}
                          style={{
                            background: 'white', color: '#e57399',
                            border: '1px solid #f8bbd0',
                            borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 12px', background: 'white', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => copyLink(share.code)}
                        style={{
                          flex: 1, background: 'white',
                          border: '1.5px solid #f8bbd0', borderRadius: '10px', padding: '9px',
                          fontSize: '12px', color: '#ff3d8b',
                          cursor: 'pointer', fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        }}
                      >
                        🔗 Copy link
                      </button>
                      <button
                        onClick={() => shareNative(share.code)}
                        title="Share"
                        style={{
                          background: 'white', border: '1.5px solid #f8bbd0',
                          borderRadius: '10px', padding: '9px 12px',
                          fontSize: '14px', cursor: 'pointer',
                        }}
                      >
                        ↗
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(share.id)}
                        style={{
                          background: 'white', border: '1.5px solid #ffcdd2',
                          borderRadius: '10px', padding: '9px 12px',
                          fontSize: '12px', color: '#e57373', cursor: 'pointer',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #fce4ec', background: '#fffafb' }}>
          <p style={{ fontSize: '10px', color: '#dbb8c8', textAlign: 'center', letterSpacing: '0.05em', margin: 0 }}>
            Links can be revoked anytime · view only
          </p>
        </div>
      </div>

      {/* Toast */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: `translateX(-50%) translateY(${toast.visible ? '0' : '80px'})`,
        background: '#333',
        color: 'white',
        padding: '8px 18px',
        borderRadius: '20px',
        fontSize: '13px',
        opacity: toast.visible ? 1 : 0,
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
        zIndex: 100,
        whiteSpace: 'nowrap',
      }}>
        {toast.msg}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}