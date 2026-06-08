import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getMoodPrediction } from '@/lib/getMoodPrediction'

function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
function parseYMD(s: string) {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
const LockIcon = ({ size = 56, color = '#d4607a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill={color}/>
  </svg>
)

const FlowerIcon = ({ size = 16, color = '#d4607a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill={color}/>
    <ellipse cx="12" cy="5" rx="2.5" ry="4" fill={color} opacity="0.7"/>
    <ellipse cx="12" cy="19" rx="2.5" ry="4" fill={color} opacity="0.7"/>
    <ellipse cx="5" cy="12" rx="4" ry="2.5" fill={color} opacity="0.7"/>
    <ellipse cx="19" cy="12" rx="4" ry="2.5" fill={color} opacity="0.7"/>
    <ellipse cx="7.05" cy="7.05" rx="2.5" ry="4" fill={color} opacity="0.5" transform="rotate(-45 7.05 7.05)"/>
    <ellipse cx="16.95" cy="7.05" rx="2.5" ry="4" fill={color} opacity="0.5" transform="rotate(45 16.95 7.05)"/>
    <ellipse cx="7.05" cy="16.95" rx="2.5" ry="4" fill={color} opacity="0.5" transform="rotate(45 7.05 16.95)"/>
    <ellipse cx="16.95" cy="16.95" rx="2.5" ry="4" fill={color} opacity="0.5" transform="rotate(-45 16.95 16.95)"/>
  </svg>
)

const LeafIcon = ({ size = 20, color = '#5a8c63' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.33L5.71 21 6 20.5C7 19 9.5 17 12 17c3 0 5.5-2 6.5-5 .5-1.5.5-3 .5-4.5L17 8z" fill={color} opacity="0.9"/>
    <path d="M3.82 19.33C5 17 8 12 12 12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const SparkleIcon = ({ size = 20, color = '#9b7ec8' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill={color}/>
    <circle cx="5" cy="5" r="1.5" fill={color} opacity="0.6"/>
    <circle cx="19" cy="19" r="1" fill={color} opacity="0.5"/>
  </svg>
)

const MoonIcon = ({ size = 20, color = '#b8860b' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" fill={color}/>
  </svg>
)

const HeartIcon = ({ size = 20, color = '#b09aa4' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={color}/>
  </svg>
)

const DropIcon = ({ size = 16, color = '#d4607a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6 10 4 14 4 16a8 8 0 0 0 16 0c0-2-2-6-8-14z" fill={color}/>
  </svg>
)

const SmileIcon = ({ size = 16, color = '#9b7ec8' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="10" r="1" fill={color}/>
    <circle cx="15" cy="10" r="1" fill={color}/>
  </svg>
)

const ThermometerIcon = ({ size = 16, color = '#9b7ec8' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="11.5" cy="18.5" r="2" fill={color}/>
  </svg>
)

const FrownIcon = ({ size = 16, color = '#b8860b' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <path d="M16 17s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="10" r="1" fill={color}/>
    <circle cx="15" cy="10" r="1" fill={color}/>
  </svg>
)

const CycleIcon = ({ size = 14, color = '#d4607a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="23 4 23 10 17 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="1 20 1 14 7 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ViewOnlyIcon = ({ size = 12, color = '#d4607a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5"/>
  </svg>
)

const BrainIcon = ({ size = 14, color = '#d4607a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 2a4.5 4.5 0 0 1 4.47 4H14a3 3 0 0 1 3 3 3 3 0 0 1-1.5 2.6A3.5 3.5 0 0 1 12 15v5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9.5 2A4.5 4.5 0 0 0 5 6.5v.02A3 3 0 0 0 3 9a3 3 0 0 0 1.5 2.6A3.5 3.5 0 0 0 8 15v5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 20h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 9h.01M12 7h.01M16 9h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// category icon for solutions
const CategoryIcon = ({ cat, size = 14, color }: { cat: string; size?: number; color: string }) => {
  if (cat === 'movement') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2" fill={color}/>
      <path d="M10 22v-6l-3-4 3-3 2 2 2-2 3 3-3 4v6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (cat === 'nutrition') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8c0 4-3 7-6 8s-6-4-6-8a6 6 0 0 1 12 0z" fill={color} opacity="0.8"/>
      <path d="M12 16v5M9 21h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  if (cat === 'mindset') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
      <path d="M12 8v4l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  if (cat === 'social') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke={color} strokeWidth="1.5"/>
      <circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth="1.5"/>
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 14c1.7 0 4 1.3 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  // self-care
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>
  )
}

const EnergyBar = ({ level, color }: { level: 'low' | 'medium' | 'high'; color: string }) => {
  const bars = level === 'low' ? 1 : level === 'medium' ? 2 : 3
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          width: 5,
          height: 6 + n * 4,
          borderRadius: '2px',
          background: n <= bars ? color : `${color}28`,
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  )
}

const PhaseIcon = ({ phase, color, size = 20 }: { phase: string; color: string; size?: number }) => {
  if (phase === 'menstrual')  return <FlowerIcon size={size} color={color} />
  if (phase === 'follicular') return <LeafIcon size={size} color={color} />
  if (phase === 'ovulation')  return <SparkleIcon size={size} color={color} />
  if (phase === 'luteal')     return <MoonIcon size={size} color={color} />
  return <HeartIcon size={size} color={color} />
}

export default async function SharedPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: anyShare } = await supabase
    .from('partner_shares')
    .select('user_id, active')
    .eq('code', code.toUpperCase())
    .single()

  if (anyShare && anyShare.active === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#fdf0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '420px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <LockIcon size={56} color="#d4607a" />
          </div>
          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif', fontSize: '32px', fontWeight: 300,
            color: '#3d1a26', margin: '0 0 12px 0', lineHeight: 1.2,
          }}>
            This link has been <span style={{ color: '#d4607a', fontStyle: 'italic' }}>revoked</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#b09aa4', lineHeight: 1.6, margin: '0 0 28px 0' }}>
            The person who shared this link has revoked access. Please ask them to generate a new share link if you&apos;d like to view their cycle.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(212,96,122,0.08)', border: '1px solid rgba(212,96,122,0.18)',
            borderRadius: '50px', padding: '10px 20px', fontSize: '12px', color: '#d4607a', fontWeight: 500,
          }}>
            <FlowerIcon size={14} color="#d4607a" />
            shared via MoodOS
          </div>
        </div>
      </div>
    )
  }

  if (!anyShare) return notFound()

  const userId = anyShare.user_id

  const [
    { data: periods },
    { data: symptoms },
    { data: moods },
    { data: painLogs },
    { data: profile },
  ] = await Promise.all([
    supabase.from('period_entries').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(12),
    supabase.from('daily_symptoms').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(10),
    supabase.from('mood_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('pain_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(10),
    supabase.from('cycle_profiles').select('*').eq('user_id', userId).single(),
  ])

  const avgCycle = profile?.cycle_length ?? 28
  const avgPeriod = profile?.period_length ?? 5
  const lastEntry = periods?.[0] ?? null
  const lastStart = lastEntry
    ? parseYMD(lastEntry.start_date)
    : profile?.last_period_date ? parseYMD(profile.last_period_date) : null

  const nextPredicted = lastStart ? addDays(lastStart, avgCycle) : null
  const daysUntilNext = nextPredicted ? diffDays(new Date(), nextPredicted) : null

  let phase = 'unknown'
  let phaseDay = 0
  let phaseTip = ''
  if (lastStart) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const day = diffDays(lastStart, today) + 1
    const d = ((day - 1) % avgCycle) + 1
    phaseDay = d
    if (d <= avgPeriod) { phase = 'menstrual'; phaseTip = 'Rest well, hydrate, and be gentle.' }
    else if (d <= avgCycle - 15) { phase = 'follicular'; phaseTip = 'Energy rising — great time to start new things.' }
    else if (d >= avgCycle - 14 && d <= avgCycle - 12) { phase = 'ovulation'; phaseTip = 'Peak energy & confidence — glowing.' }
    else { phase = 'luteal'; phaseTip = 'Wind down, nourish yourself, and rest.' }
  }

  // ── Build context and call OpenAI ──────────────────────────────────────
  const recentSymptoms = symptoms?.flatMap(s => s.symptoms ?? []).slice(0, 12) ?? []
  const recentMoods = moods?.map(m => m.mood).filter(Boolean).slice(0, 8) ?? []
  const recentPainTypes = painLogs?.map(p => p.type).filter(Boolean) ?? []
  const maxRecentPain = painLogs?.reduce((max, p) => Math.max(max, p.severity ?? 0), 0) ?? 0

  const prediction = phase !== 'unknown'
    ? await getMoodPrediction({
        phase, phaseDay, avgCycle, avgPeriod,
        recentSymptoms, recentMoods, recentPainTypes, maxRecentPain,
      })
    : null

  const phaseConfig: Record<string, { label: string; c: string; bg: string; border: string; icoBg: string }> = {
    menstrual:  { label: 'menstrual phase',  c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.2)',  icoBg: 'rgba(212,96,122,0.12)' },
    follicular: { label: 'follicular phase', c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.2)',   icoBg: 'rgba(90,140,99,0.12)'  },
    ovulation:  { label: 'ovulation phase',  c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.2)', icoBg: 'rgba(155,126,200,0.12)' },
    luteal:     { label: 'luteal phase',     c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.2)',  icoBg: 'rgba(184,134,11,0.12)' },
    unknown:    { label: 'phase unknown',    c: '#b09aa4', bg: '#f5f0f2', border: 'rgba(176,154,164,0.2)', icoBg: 'rgba(176,154,164,0.12)' },
  }
  const pc = phaseConfig[phase]

  const categoryColors: Record<string, { c: string; bg: string; border: string }> = {
    movement:   { c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.18)' },
    nutrition:  { c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.18)' },
    mindset:    { c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.18)' },
    social:     { c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.18)' },
    'self-care':{ c: '#c17fa0', bg: '#faeef5', border: 'rgba(193,127,160,0.18)' },
  }

  const flowColors: Record<string, { c: string; bg: string }> = {
    spotting:   { c: '#e8a0b0', bg: '#fff5f7' },
    light:      { c: '#d4607a', bg: '#fde8ee' },
    medium:     { c: '#9b7ec8', bg: '#f3edfb' },
    heavy:      { c: '#b8860b', bg: '#fef8e7' },
    very_heavy: { c: '#8b1a35', bg: '#fde0e7' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f3' }}>
      <div style={{
        minHeight: '100vh',
        background: '#fdf0f3',
        fontFamily: 'DM Sans, sans-serif',
        padding: '32px 20px 60px',
        maxWidth: '780px',
        margin: '0 auto',
      }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{
            fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#e8a0b0', fontWeight: 600, marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <HeartIcon size={12} color="#e8a0b0" />
            cycle tracker
          </p>
          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif', fontSize: '42px', fontWeight: 300,
            lineHeight: 1.15, color: '#3d1a26', margin: '0 0 8px 0',
          }}>
            her <span style={{ color: '#d4607a', fontStyle: 'italic' }}>cycle,</span><br />
            her rhythm
          </h1>
          <p style={{ fontSize: '14px', color: '#b09aa4', margin: '0 0 16px 0' }}>
            shared with you · read only view
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(212,96,122,0.08)', border: '1px solid rgba(212,96,122,0.18)',
            borderRadius: '50px', padding: '6px 14px', fontSize: '11px', color: '#d4607a', fontWeight: 500,
          }}>
            <ViewOnlyIcon size={12} color="#d4607a" />
            view only · shared via MoodOS
          </div>
        </div>

        {/* ── Phase Banner ── */}
        <div style={{
          background: pc.bg, border: `1px solid ${pc.border}`,
          borderRadius: '18px', padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '14px', background: pc.icoBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <PhaseIcon phase={phase} color={pc.c} size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: pc.c, marginBottom: '3px' }}>{pc.label}</div>
            <div style={{ fontSize: '12px', color: pc.c, opacity: 0.8 }}>
              {phase !== 'unknown' ? `day ${phaseDay} of cycle · ` : ''}{phaseTip}
            </div>
          </div>
          {phase !== 'unknown' && (
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke={pc.c} strokeOpacity="0.15" strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none" stroke={pc.c} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - phaseDay / avgCycle)}`}
                transform="rotate(-90 26 26)" />
              <text x="26" y="30" textAnchor="middle" fontSize="13"
                fontFamily="Fraunces,serif" fontWeight="300" fill={pc.c}>{phaseDay}</text>
            </svg>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'CYCLE LENGTH',  value: `${avgCycle}d`,  c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.18)' },
            { label: 'PERIOD LENGTH', value: `${avgPeriod}d`, c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(201,184,232,0.25)' },
            {
              label: 'NEXT PERIOD',
              value: daysUntilNext !== null
                ? daysUntilNext === 0 ? 'today'
                : daysUntilNext > 0 ? `in ${daysUntilNext}d`
                : `${Math.abs(daysUntilNext)}d late`
                : '—',
              c: daysUntilNext !== null && daysUntilNext < 0 ? '#8b1a35' : '#b8860b',
              bg: daysUntilNext !== null && daysUntilNext < 0 ? '#fde0e7' : '#fef8e7',
              border: 'rgba(245,221,180,0.35)',
            },
            { label: 'LOGGED CYCLES', value: String(periods?.length ?? 0), c: '#5a8c63', bg: '#edf6ee', border: 'rgba(168,201,174,0.3)' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: '18px', padding: '20px 18px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -10, bottom: -10,
                width: 70, height: 70, borderRadius: '50%',
                background: s.c, opacity: 0.06,
              }} />
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 300, color: s.c, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: s.c, marginTop: '6px', fontWeight: 600 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── AI Mood Prediction ── */}
        {prediction && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '24px 0', opacity: 0.5 }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(212,96,122,0.2)' }} />
              <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#d4607a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BrainIcon size={12} color="#d4607a" />
                TODAY&apos;S FORECAST
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(212,96,122,0.2)' }} />
            </div>

            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '16px',
              border: `1px solid ${pc.border}`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* subtle gradient wash in the phase color */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '20px',
                background: `linear-gradient(135deg, ${pc.bg} 0%, white 55%)`,
                opacity: 0.5, pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative' }}>
                {/* headline + energy */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
                  <div>
                    <div style={{
                      fontSize: '10px', letterSpacing: '0.12em', color: pc.c,
                      textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <BrainIcon size={11} color={pc.c} />
                      AI mood forecast
                    </div>
                    <div style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: '20px', fontWeight: 300, color: '#3d1a26', lineHeight: 1.3,
                    }}>
                      {prediction.headline}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    background: pc.icoBg, borderRadius: '12px', padding: '10px 12px', flexShrink: 0,
                  }}>
                    <EnergyBar level={prediction.energy} color={pc.c} />
                    <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: pc.c, fontWeight: 600, textTransform: 'uppercase' }}>
                      {prediction.energy}
                    </div>
                  </div>
                </div>

                {/* mood tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  {prediction.moods.map(mood => (
                    <span key={mood} style={{
                      background: pc.icoBg,
                      border: `1px solid ${pc.border}`,
                      borderRadius: '50px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      color: pc.c,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}>
                      {mood}
                    </span>
                  ))}
                </div>

                {/* solutions */}
                <div style={{
                  fontSize: '10px', letterSpacing: '0.12em', color: '#b09aa4',
                  textTransform: 'uppercase', fontWeight: 600, marginBottom: '10px',
                }}>
                  suggested for today
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prediction.solutions.map((sol, i) => {
                    const cc = categoryColors[sol.category] ?? categoryColors['self-care']
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '11px 13px',
                        background: cc.bg,
                        border: `1px solid ${cc.border}`,
                        borderRadius: '13px',
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '9px',
                          background: `${cc.c}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          marginTop: '1px',
                        }}>
                          <CategoryIcon cat={sol.category} size={14} color={cc.c} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: cc.c, fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                            {sol.category}
                          </div>
                          <div style={{ fontSize: '12px', color: '#3d1a26', lineHeight: 1.5 }}>
                            {sol.tip}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* disclaimer */}
                <div style={{
                  marginTop: '14px', fontSize: '10px', color: '#c9a0b0',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#c9a0b0" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="#c9a0b0" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  AI-generated based on cycle phase · not medical advice
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '24px 0', opacity: 0.5 }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(212,96,122,0.2)' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#d4607a', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CycleIcon size={12} color="#d4607a" />
            PERIOD HISTORY
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(212,96,122,0.2)' }} />
        </div>

        {/* ── Period Entries ── */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(212,96,122,0.08)' }}>
          <p style={{
            fontSize: '10px', letterSpacing: '0.12em', color: '#e8a0b0', textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <DropIcon size={12} color="#e8a0b0" />
            recent periods
          </p>
          {!periods?.length ? (
            <p style={{ fontSize: '13px', color: '#c9a0b0', textAlign: 'center', padding: '20px 0' }}>no entries yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {periods.map(p => {
                const fc = flowColors[p.flow] ?? flowColors.medium
                const start = parseYMD(p.start_date)
                const end = p.end_date ? parseYMD(p.end_date) : null
                const dur = end ? diffDays(start, end) + 1 : null
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '14px',
                    background: fc.bg, border: `1px solid ${fc.c}22`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '11px', background: `${fc.c}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <DropIcon size={16} color={fc.c} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#3d1a26' }}>
                        {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {end && ` → ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#b09aa4', marginTop: '2px' }}>
                        {p.flow?.replace('_', ' ')} flow
                        {p.symptoms?.length > 0 && ` · ${p.symptoms.slice(0, 3).join(', ')}`}
                      </div>
                    </div>
                    {dur && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 300, color: fc.c, lineHeight: 1 }}>{dur}</div>
                        <div style={{ fontSize: '9px', color: '#b09aa4', letterSpacing: '0.08em' }}>days</div>
                      </div>
                    )}
                    {!end && (
                      <span style={{ fontSize: '10px', color: fc.c, fontStyle: 'italic', background: `${fc.c}15`, padding: '3px 8px', borderRadius: '20px' }}>
                        ongoing
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Recent Moods ── */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(155,126,200,0.1)' }}>
          <p style={{
            fontSize: '10px', letterSpacing: '0.12em', color: '#c9b8e8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <SmileIcon size={12} color="#c9b8e8" />
            recent moods
          </p>
          {!moods?.length ? (
            <p style={{ fontSize: '13px', color: '#c9a0b0', textAlign: 'center', padding: '12px 0' }}>no mood entries yet</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {moods.slice(0, 12).map(m => (
                <span key={m.id} style={{
                  background: '#f3edfb', border: '1px solid #c9b8e8',
                  borderRadius: '50px', padding: '6px 12px',
                  fontSize: '12px', color: '#9b7ec8', fontWeight: 500,
                }}>
                  {m.mood}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Symptoms ── */}
        {symptoms && symptoms.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(155,126,200,0.08)' }}>
            <p style={{
              fontSize: '10px', letterSpacing: '0.12em', color: '#c9b8e8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <ThermometerIcon size={12} color="#c9b8e8" />
              recent symptoms
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {symptoms.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '12px',
                  background: 'rgba(155,126,200,0.05)', border: '1px solid rgba(155,126,200,0.1)',
                }}>
                  <span style={{ fontSize: '11px', color: '#b09aa4', minWidth: '80px' }}>
                    {parseYMD(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                    {s.symptoms?.slice(0, 4).map((sym: string) => (
                      <span key={sym} style={{
                        background: 'rgba(155,126,200,0.1)', color: '#9b7ec8',
                        borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                      }}>{sym}</span>
                    ))}
                  </div>
                  {s.mood && (
                    <span style={{ fontSize: '11px', color: '#9b7ec8', fontStyle: 'italic' }}>{s.mood}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pain Logs ── */}
        {painLogs && painLogs.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(184,134,11,0.1)' }}>
            <p style={{
              fontSize: '10px', letterSpacing: '0.12em', color: '#f5ddb4', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <FrownIcon size={12} color="#f5ddb4" />
              pain log
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {painLogs.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '12px',
                  background: '#fef8e7', border: '1px solid rgba(184,134,11,0.15)',
                }}>
                  <span style={{ fontSize: '11px', color: '#b09aa4', minWidth: '70px' }}>
                    {parseYMD(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: '12px', color: '#5a3a00', fontWeight: 500, flex: 1, textTransform: 'capitalize' }}>
                    {p.type?.replace('_', ' ')}
                  </span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: n <= p.severity ? '#b8860b' : 'rgba(184,134,11,0.15)',
                      }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', color: '#c9a0b0', letterSpacing: '0.05em',
          }}>
            <FlowerIcon size={12} color="#c9a0b0" />
            shared via MoodOS · this link can be revoked anytime
          </div>
        </div>

      </div>
    </div>
  )
}