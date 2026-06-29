import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import { PeriodProvider } from './PeriodContext'
import PeriodLayout from './PeriodLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <PeriodProvider>
      <PeriodLayout>
        <Sidebar user={user} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </PeriodLayout>
    </PeriodProvider>
  )
}