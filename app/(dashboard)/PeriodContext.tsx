'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

const PeriodContext = createContext(false)
export const usePeriod = () => useContext(PeriodContext)

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [isPeriod, setIsPeriod] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('period_entries')
        .select('start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!data) return
      const now   = new Date()
      const start = new Date(data.start_date)
      const end   = data.end_date ? new Date(data.end_date) : null
      setIsPeriod(!!end && now >= start && now <= end)
    })
  }, [supabase])

  return (
    <PeriodContext.Provider value={isPeriod}>
      {children}
    </PeriodContext.Provider>
  )
}