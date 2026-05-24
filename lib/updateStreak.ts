import { createClient } from '@/lib/supabase'

export async function updateStreak() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!streak) {
    // first time
    await supabase.from('streaks').insert({
      user_id: user.id, current: 1, longest: 1, last_active: today
    })
    return
  }

  if (streak.last_active === today) return // already updated today

  const newCurrent = streak.last_active === yesterday
    ? (streak.current ?? 0) + 1  // continued streak
    : 1                           // streak broken, reset

  const newLongest = Math.max(newCurrent, streak.longest ?? 0)

  await supabase.from('streaks').upsert({
    user_id: user.id,
    current: newCurrent,
    longest: newLongest,
    last_active: today,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}