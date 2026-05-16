import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e8e6ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 600 }}>Welcome to MoodOS 👋</div>
      <div style={{ fontSize: '14px', color: 'rgba(232,230,255,0.4)' }}>
        Logged in as: {user.email}
      </div>
      <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(232,230,255,0.25)' }}>
        Dashboard modules coming next ✦
      </div>
    </div>
  )
}