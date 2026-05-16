'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
  { label: 'Mood', href: '/mood', icon: '◉' },
  { label: 'Habits', href: '/habits', icon: '◈' },
  { label: 'Study', href: '/study', icon: '◎' },
  { label: 'Expenses', href: '/expenses', icon: '◇' },
  { label: 'Attendance', href: '/attendance', icon: '◆' },
  { label: 'Insights', href: '/insights', icon: '◐' },
]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase()

  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      background: '#0d0d15',
      borderRight: '1px solid rgba(127,119,221,0.15)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(127,119,221,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#7F77DD',
            boxShadow: '0 0 8px rgba(127,119,221,0.8)',
          }} />
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#e8e6ff' }}>MoodOS</span>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(232,230,255,0.3)', marginTop: '4px', marginLeft: '16px' }}>
          Student life, sorted.
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px',
                background: isActive ? 'rgba(127,119,221,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(127,119,221,0.25)' : '1px solid transparent',
                color: isActive ? '#a8a3f0' : 'rgba(232,230,255,0.45)',
                fontSize: '13px', cursor: 'pointer',
                textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(127,119,221,0.1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 12px', marginBottom: '4px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(127,119,221,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600, color: '#a8a3f0',
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#e8e6ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.user_metadata?.full_name || 'Student'}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(232,230,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '8px 12px',
            background: 'transparent',
            border: '1px solid rgba(226,75,74,0.2)',
            borderRadius: '8px', color: 'rgba(226,75,74,0.6)',
            fontSize: '12px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}