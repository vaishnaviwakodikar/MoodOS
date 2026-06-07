import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function SharedPage({ params }: { params: { code: string } }) {
  const supabase = await createClient()

  // Resolve the share code → user_id
  const { data: share } = await supabase
    .from('partner_shares')
    .select('user_id, label')
    .eq('code', params.code.toUpperCase())
    .eq('active', true)
    .single()

  if (!share) return notFound()

  const userId = share.user_id

  // Fetch data in parallel
  const [
    { data: periods },
    { data: symptoms },
    { data: moods },
    { data: painLogs },
  ] = await Promise.all([
    supabase.from('period_entries').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(12),
    supabase.from('daily_symptoms').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(30),
    supabase.from('mood_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    supabase.from('pain_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(30),
  ])

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center py-6">
        <div className="text-4xl mb-2">🌸</div>
        <h1 className="text-2xl font-bold text-pink-700">Shared Cycle View</h1>
        <p className="text-sm text-gray-500 mt-1">Read-only · Updated in real time</p>
      </div>

      {/* Recent Periods */}
      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-pink-600 mb-3">🩸 Recent Periods</h2>
        {periods?.length ? periods.map(p => (
          <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-pink-50 last:border-0">
            <span className="text-gray-700">{p.start_date}{p.end_date ? ` → ${p.end_date}` : ' (ongoing)'}</span>
            <span className="text-pink-500 capitalize">{p.flow} flow</span>
          </div>
        )) : <p className="text-sm text-gray-400">No entries yet</p>}
      </section>

      {/* Recent Moods */}
      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-purple-600 mb-3">💜 Recent Moods</h2>
        <div className="flex flex-wrap gap-2">
          {moods?.length ? moods.slice(0, 14).map(m => (
            <span key={m.id} className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full">
              {m.emoji} {m.mood}
            </span>
          )) : <p className="text-sm text-gray-400">No entries yet</p>}
        </div>
      </section>

      {/* Pain Logs */}
      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-red-500 mb-3">😣 Pain Log</h2>
        {painLogs?.length ? painLogs.slice(0, 7).map(p => (
          <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-red-50 last:border-0">
            <span className="text-gray-700">{p.date} · {p.type}</span>
            <span className="text-red-400">Severity {p.severity}/10</span>
          </div>
        )) : <p className="text-sm text-gray-400">No entries yet</p>}
      </section>

      {/* Symptoms */}
      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-orange-500 mb-3">🌡️ Recent Symptoms</h2>
        {symptoms?.length ? symptoms.slice(0, 7).map(s => (
          <div key={s.id} className="text-sm py-1.5 border-b border-orange-50 last:border-0">
            <span className="text-gray-500 mr-2">{s.date}</span>
            <span className="text-gray-700">{s.symptoms?.join(', ') || '—'}</span>
          </div>
        )) : <p className="text-sm text-gray-400">No entries yet</p>}
      </section>

      <p className="text-center text-xs text-gray-400 pb-6">Shared via MoodOS · This link can be revoked anytime</p>
    </main>
  )
}