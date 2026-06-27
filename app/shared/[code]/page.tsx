'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import {
  addDays,
  diffDays,
  parseYMD,
  toYMD,
  getPhase,
  phaseConfig,
  flowMeta,
  type Flow,
} from '@/lib/cycleUtils'

// ── Types ──────────────────────────────────────────────────────────────────
type SharedProfile = {
  cycle_length: number
  period_length: number
  cycle_regularity: string
  has_pcos_pcod: boolean
  pcos_type: string | null
  trying_to_conceive: boolean
  last_period_date: string | null
} | null

type SharedEntry = { start_date: string; end_date: string | null; flow: Flow; symptoms: string[] | null; mood: string | null }
type SharedPain = { date: string; type: string; severity: number; duration_hours: number | null; relief_used: string | null }
type SharedSymptom = { date: string; symptoms: string[] | null; mood: string | null; energy: number | null }

type SharedPayload = {
  valid: boolean
  label?: string | null
  name?: string | null
  profile?: SharedProfile
  entries?: SharedEntry[]
  pain_logs?: SharedPain[]
  symptoms?: SharedSymptom[]
}

type SectionKey = 'overview' | 'next' | 'mood' | 'symptoms' | 'pain' | 'cravings'

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: 'overview',  label: 'overview',    icon: 'ti-layout-dashboard' },
  { key: 'next',      label: 'next cycle',  icon: 'ti-calendar-heart' },
  { key: 'mood',      label: 'mood',        icon: 'ti-mood-smile' },
  { key: 'symptoms',  label: 'symptoms',    icon: 'ti-stethoscope' },
  { key: 'pain',      label: 'pain',        icon: 'ti-bolt' },
  { key: 'cravings',  label: 'cravings',    icon: 'ti-cookie' },
]

const painTypeMeta: Record<string, { label: string; icon: string; c: string; bg: string }> = {
  cramps:      { label: 'Cramps',      icon: 'ti-bolt',       c: '#d4607a', bg: '#fde8ee' },
  headache:    { label: 'Headache',    icon: 'ti-brain',      c: '#9b7ec8', bg: '#f3edfb' },
  migraine:    { label: 'Migraine',    icon: 'ti-brain',      c: '#8b1a8b', bg: '#f5e8fb' },
  backache:    { label: 'Back Pain',   icon: 'ti-accessible', c: '#b8860b', bg: '#fef8e7' },
  breast_pain: { label: 'Breast Pain', icon: 'ti-heart',      c: '#c05878', bg: '#fde4ec' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ps {
    --rose: #d4607a; --blush2: #e8a0b0; --petal: #fde8ee;
    --lavender: #e8daf5; --lav2: #c9b8e8; --cream: #fdf7f0;
    --ink: #3d2a35; --ink2: #7a5c68; --ink3: #b09aa4; --card: #fff9fb;
    font-family: 'DM Sans', sans-serif;
    background: var(--cream); color: var(--ink);
    min-height: 100vh; width: 100%;
  }

  .ps-shell { display: flex; min-height: 100vh; }

  /* ── Sidebar (desktop) ── */
  .ps-sidebar {
    width: 220px; flex-shrink: 0;
    border-right: 1px solid rgba(212,96,122,0.1);
    padding: 28px 16px;
    display: flex; flex-direction: column; gap: 4px;
    position: sticky; top: 0; height: 100vh;
  }
  .ps-sidebar-brand { display: flex; align-items: center; gap: 8px; padding: 0 10px; margin-bottom: 22px; }
  .ps-sidebar-brand-icon { font-size: 17px; color: var(--rose); }
  .ps-sidebar-brand-text { font-family: 'Fraunces', serif; font-size: 16px; font-style: italic; font-weight: 500; color: var(--ink); }
  .ps-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 13px; border-radius: 13px; border: none;
    background: transparent; color: var(--ink3);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; text-align: left; width: 100%;
    transition: background 0.15s, color 0.15s;
  }
  .ps-nav-item i { font-size: 15px; width: 18px; flex-shrink: 0; }
  .ps-nav-item.active { background: var(--petal); color: var(--rose); font-weight: 600; }
  .ps-nav-item:hover:not(.active) { background: rgba(212,96,122,0.06); }
  .ps-sidebar-foot { margin-top: auto; padding: 10px; font-size: 10.5px; color: var(--ink3); line-height: 1.6; }

  /* ── Top tabs (mobile) ── */
  .ps-tabbar {
    display: none;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    gap: 6px; padding: 14px clamp(16px,4vw,24px) 10px;
    border-bottom: 1px solid rgba(212,96,122,0.1);
    position: sticky; top: 0; background: var(--cream); z-index: 5;
  }
  .ps-tabbar::-webkit-scrollbar { display: none; }
  .ps-tab-item {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    padding: 8px 13px; border-radius: 999px; border: 1.5px solid rgba(212,96,122,0.14);
    background: var(--card); color: var(--ink3);
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
  }
  .ps-tab-item i { font-size: 13px; }
  .ps-tab-item.active { background: var(--petal); border-color: rgba(212,96,122,0.3); color: var(--rose); font-weight: 600; }

  .ps-main { flex: 1; min-width: 0; padding: clamp(20px,5vw,44px) clamp(20px,4vw,40px); }
  .ps-wrap { max-width: 680px; margin: 0 auto; }

  .ps-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
  .ps-h1 { font-family: 'Fraunces', serif; font-size: clamp(26px,4.4vw,36px); font-weight: 300; font-style: italic; letter-spacing: -1px; line-height: 1.1; color: var(--ink); margin-bottom: 6px; text-transform: capitalize; }
  .ps-h1 .accent { color: var(--rose); }
  .ps-sub { font-size: 13px; color: var(--ink3); margin-bottom: 20px; }
  .ps-readonly { display: inline-flex; align-items: center; gap: 6px; background: var(--petal); border: 1px solid rgba(212,96,122,0.18); border-radius: 999px; padding: 5px 14px; font-size: 11px; color: var(--rose); font-weight: 600; }

  .ps-phase { display: flex; align-items: center; gap: 14px; border-radius: 20px; padding: 18px 20px; margin-bottom: 16px; }
  .ps-phase-ico { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .ps-phase-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 500; margin-bottom: 3px; text-transform: capitalize; }
  .ps-phase-sub { font-size: 12px; line-height: 1.5; }

  .ps-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .ps-stat { border-radius: 16px; padding: 14px; }
  .ps-stat-lbl { font-size: 9px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.75; margin-bottom: 8px; }
  .ps-stat-val { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; }

  .ps-phasegrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
  .ps-phasecell { padding: 10px 10px 8px; border-radius: 14px; background: rgba(255,255,255,0.5); border: 1.5px solid rgba(212,96,122,0.08); display: flex; flex-direction: column; gap: 5px; }
  .ps-phasecell.active { background: var(--petal); }

  .ps-card { background: var(--card); border: 1px solid rgba(212,96,122,0.1); border-radius: 20px; padding: 18px 20px; margin-bottom: 16px; }
  .ps-card-lbl { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
  .ps-empty { font-size: 12px; color: var(--ink3); font-style: italic; padding: 8px 0; display: flex; align-items: center; gap: 8px; }

  .ps-hitem { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(212,96,122,0.07); }
  .ps-hitem:last-child { border-bottom: none; }
  .ps-hitem-ico { width: 34px; height: 34px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .ps-hitem-name { font-size: 13px; font-weight: 500; color: var(--ink); }
  .ps-hitem-sub { font-size: 11px; color: var(--ink3); margin-top: 2px; text-transform: capitalize; }
  .ps-hitem-right { margin-left: auto; text-align: right; flex-shrink: 0; }
  .ps-hitem-days { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 400; }
  .ps-hitem-days-lbl { font-size: 9px; color: var(--ink3); text-transform: uppercase; letter-spacing: 1px; }

  .ps-sym-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid rgba(212,96,122,0.07); }
  .ps-sym-row:last-child { border-bottom: none; }
  .ps-sym-date { font-size: 11.5px; font-weight: 600; color: var(--ink2); min-width: 76px; flex-shrink: 0; }
  .ps-sym-chip { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 600; background: var(--lavender); color: #6a4a98; margin: 2px 4px 2px 0; }

  .ps-bar-row { display: flex; align-items: center; gap: 10px; }
  .ps-bar-track { flex: 1; height: 6px; border-radius: 999px; background: rgba(212,96,122,0.1); overflow: hidden; }
  .ps-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #d4607a, #9b7ec8); }

  .ps-footer { text-align: center; font-size: 11.5px; color: var(--ink3); margin-top: 24px; line-height: 1.6; }

  .ps-center { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 10px; padding: 24px; }
  .ps-center-emoji { font-size: 36px; margin-bottom: 4px; }
  .ps-center-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 400; font-style: italic; color: var(--ink); }
  .ps-center-sub { font-size: 13px; color: var(--ink3); max-width: 320px; line-height: 1.6; }

  @media (max-width: 860px) {
    .ps-sidebar { display: none; }
    .ps-tabbar { display: flex; }
    .ps-shell { flex-direction: column; }
  }
  @media (max-width: 480px) {
    .ps-stats { grid-template-columns: 1fr 1fr; }
    .ps-stats > :last-child:nth-child(3) { grid-column: span 2; }
    .ps-phasegrid { grid-template-columns: 1fr 1fr; }
  }
`

export default function SharedCyclePage() {
  const params = useParams<{ code: string | string[] }>()
  const code = Array.isArray(params?.code) ? params.code[0] : params?.code ?? ''
  const supabase = useMemo(() => createClient(), [])

  const [status, setStatus] = useState<'loading' | 'invalid' | 'ready'>('loading')
  const [data, setData] = useState<SharedPayload | null>(null)
  const [section, setSection] = useState<SectionKey>('overview')

  useEffect(() => {
    if (!code) {
      setStatus('invalid')
      return
    }
    let cancelled = false

    ;(async () => {
      const { data: result, error } = await (supabase as any).rpc('get_partner_shared_data', {
        p_code: code,
      })
      if (cancelled) return
      if (error || !result || !result.valid) {
        setStatus('invalid')
        return
      }
      setData(result as SharedPayload)
      setStatus('ready')
    })()

    return () => {
      cancelled = true
    }
  }, [code, supabase])

  // ── Derived cycle math (mirrors the owner's periods page) ────────────────
  const profile = data?.profile ?? null
  const entries = data?.entries ?? []
  const painLogs = data?.pain_logs ?? []
  const symptoms = data?.symptoms ?? []

  const lastStart = entries[0]
    ? parseYMD(entries[0].start_date)
    : profile?.last_period_date
    ? parseYMD(profile.last_period_date)
    : null

  const avgCycle = profile?.cycle_length ?? 28
  const avgPeriod = profile?.period_length ?? 5

  const nextPredicted = lastStart ? addDays(lastStart, avgCycle) : null
  const daysUntilNext = nextPredicted ? diffDays(new Date(), nextPredicted) : null

  const { phase, day: phaseDay, tip } = getPhase(lastStart, avgCycle, {
    periodLength: avgPeriod,
    hasPcos: profile?.has_pcos_pcod ?? false,
  })
  const pc = phaseConfig[phase]

  const nextPeriodLabel =
    daysUntilNext === null
      ? '—'
      : daysUntilNext === 0
      ? 'today'
      : daysUntilNext > 0
      ? `in ${daysUntilNext}d`
      : `${Math.abs(daysUntilNext)}d late`

  // Mood: pulled from both period entries and daily symptoms
  const moodEvents = useMemo(() => {
    const fromEntries = entries
      .filter(e => e.mood)
      .map(e => ({ date: e.start_date, mood: e.mood as string, source: 'period' as const }))
    const fromSymptoms = symptoms
      .filter(s => s.mood)
      .map(s => ({ date: s.date, mood: s.mood as string, source: 'daily' as const, energy: s.energy }))
    return [...fromEntries, ...fromSymptoms].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [entries, symptoms])

  // ── Today + past-5-days helpers (shared shape for mood & symptoms) ──────
  const todayYMD = toYMD(new Date())
  const last5YMDs = useMemo(() => {
    const days: string[] = []
    for (let i = 0; i < 5; i++) days.push(toYMD(addDays(new Date(), -i)))
    return days
  }, [])

  // One row per day in the moodEvents list, deduped to the latest entry for that day
  const moodByDate = useMemo(() => {
    const map: Record<string, { mood: string; energy?: number | null }> = {}
    moodEvents.forEach(m => {
      if (!map[m.date]) map[m.date] = { mood: m.mood, energy: 'energy' in m ? m.energy : undefined }
    })
    return map
  }, [moodEvents])

  const todayMood = moodByDate[todayYMD] ?? null
  const last5Mood = last5YMDs.map(d => ({ date: d, entry: moodByDate[d] ?? null }))

  // One row per day in symptom logs (period entries + daily symptoms), excluding "cravings"
  const symptomsByDate = useMemo(() => {
    const map: Record<string, string[]> = {}
    const add = (date: string, syms: string[] | null | undefined) => {
      const cleaned = (syms ?? []).filter(s => s !== 'cravings')
      if (!cleaned.length) return
      if (!map[date]) map[date] = []
      cleaned.forEach(s => { if (!map[date].includes(s)) map[date].push(s) })
    }
    entries.forEach(e => add(e.start_date, e.symptoms))
    symptoms.forEach(s => add(s.date, s.symptoms))
    return map
  }, [entries, symptoms])

  const todaySymptoms = symptomsByDate[todayYMD] ?? []
  const last5Symptoms = last5YMDs.map(d => ({ date: d, symptoms: symptomsByDate[d] ?? [] }))


  // Cravings: just the subset of logs that mention it
  const cravingEvents = useMemo(() => {
    const fromEntries = entries
      .filter(e => e.symptoms?.includes('cravings'))
      .map(e => ({ date: e.start_date, source: 'period log' as const }))
    const fromSymptoms = symptoms
      .filter(s => s.symptoms?.includes('cravings'))
      .map(s => ({ date: s.date, source: 'daily log' as const }))
    return [...fromEntries, ...fromSymptoms].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [entries, symptoms])

  const displayName = data?.name ? `${data.name}'s` : 'their'

  // ── Loading ────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <>
        <style>{css}</style>
        <div className="ps">
          <div className="ps-center">
            <div className="ps-center-emoji">🌸</div>
            <p className="ps-center-sub">loading shared dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  // ── Invalid / revoked ────────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <>
        <style>{css}</style>
        <div className="ps">
          <div className="ps-center">
            <div className="ps-center-emoji">🥀</div>
            <h1 className="ps-center-title">this link isn&apos;t active</h1>
            <p className="ps-center-sub">
              It may have been revoked, or the code is incorrect. Ask your partner to send a fresh share link.
            </p>
          </div>
        </div>
      </>
    )
  }

  // ── Ready ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="ps">
        <div className="ps-shell">

          {/* Sidebar (desktop) */}
          <nav className="ps-sidebar">
            <div className="ps-sidebar-brand">
              <i className="ti ti-heart ps-sidebar-brand-icon" />
              <span className="ps-sidebar-brand-text">shared with you</span>
            </div>
            {SECTIONS.map(s => (
              <button
                key={s.key}
                className={`ps-nav-item${section === s.key ? ' active' : ''}`}
                onClick={() => setSection(s.key)}
              >
                <i className={`ti ${s.icon}`} />
                {s.label}
              </button>
            ))}
            <div className="ps-sidebar-foot">
              <i className="ti ti-lock" /> read-only · updates automatically.
              <br />They can revoke this anytime.
            </div>
          </nav>

          {/* Top tabs (mobile) */}
          <div className="ps-tabbar">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                className={`ps-tab-item${section === s.key ? ' active' : ''}`}
                onClick={() => setSection(s.key)}
              >
                <i className={`ti ${s.icon}`} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <main className="ps-main">
            <div className="ps-wrap">

              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <p className="ps-eyebrow">
                  <i className="ti ti-eye" aria-hidden="true" />
                  view only · {displayName} cycle
                </p>
                <h1 className="ps-h1">
                  {SECTIONS.find(s => s.key === section)?.label}
                </h1>
              </motion.div>

              <AnimatePresence mode="wait">

                {/* ── OVERVIEW ── */}
                {section === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div
                      className="ps-phase"
                      style={{ background: pc.bg, border: `1px solid ${pc.border}` }}
                    >
                      <div className="ps-phase-ico" style={{ background: pc.icoBg }}>
                        {/* @ts-ignore emoji fallback not in phaseConfig type, ico class used instead */}
                        <i className={`ti ${pc.ico}`} style={{ color: pc.c }} />
                      </div>
                      <div>
                        <div className="ps-phase-name" style={{ color: pc.c }}>{pc.label}</div>
                        <div className="ps-phase-sub" style={{ color: pc.c }}>
                          {phase !== 'unknown' ? `day ${phaseDay} of their cycle · ` : ''}
                          {tip}
                        </div>
                      </div>
                    </div>

                    <div className="ps-stats">
                      {[
                        { label: 'cycle length', value: `${avgCycle}d`, c: '#d4607a', bg: '#fde8ee' },
                        { label: 'period length', value: `${avgPeriod}d`, c: '#9b7ec8', bg: '#f3edfb' },
                        {
                          label: 'next period',
                          value: nextPeriodLabel,
                          c: daysUntilNext !== null && daysUntilNext < 0 ? '#8b1a35' : '#b8860b',
                          bg: daysUntilNext !== null && daysUntilNext < 0 ? '#fde0e7' : '#fef8e7',
                        },
                      ].map((s, i) => (
                        <motion.div key={s.label} className="ps-stat" style={{ background: s.bg }}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                          <div className="ps-stat-lbl" style={{ color: s.c }}>{s.label}</div>
                          <div className="ps-stat-val" style={{ color: s.c }}>{s.value}</div>
                        </motion.div>
                      ))}
                    </div>

                    {(profile?.has_pcos_pcod || profile?.trying_to_conceive) && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {profile.has_pcos_pcod && (
                          <span className="ps-readonly" style={{ background: '#f3edfb', color: '#6a4a98', borderColor: 'rgba(155,126,200,0.25)' }}>
                            <i className="ti ti-ribbon" /> {profile.pcos_type?.toUpperCase() ?? 'PCOS/PCOD'}
                          </span>
                        )}
                        {profile.trying_to_conceive && (
                          <span className="ps-readonly" style={{ background: '#edf6ee', color: '#3a6b42', borderColor: 'rgba(90,140,99,0.25)' }}>
                            <i className="ti ti-heart" /> trying to conceive
                          </span>
                        )}
                      </div>
                    )}

                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-droplet" /> recent periods</p>
                      {entries.length === 0 ? (
                        <div className="ps-empty"><i className="ti ti-calendar-heart" /> no cycles logged yet</div>
                      ) : (
                        entries.slice(0, 5).map((e, i) => {
                          const f = flowMeta[e.flow]
                          const dur = e.end_date ? diffDays(parseYMD(e.start_date), parseYMD(e.end_date)) + 1 : null
                          return (
                            <motion.div key={`${e.start_date}-${i}`} className="ps-hitem"
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                              <div className="ps-hitem-ico" style={{ background: f.bg }}>
                                <i className="ti ti-droplet" style={{ color: f.c }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="ps-hitem-name">
                                  {parseYMD(e.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  {e.end_date && ` → ${parseYMD(e.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                </div>
                                <div className="ps-hitem-sub">
                                  {f.label} flow{dur ? ` · ${dur} day${dur > 1 ? 's' : ''}` : ' · ongoing'}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── NEXT CYCLE ── */}
                {section === 'next' && (
                  <motion.div key="next" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div
                      className="ps-phase"
                      style={{ background: pc.bg, border: `1px solid ${pc.border}` }}
                    >
                      <div className="ps-phase-ico" style={{ background: pc.icoBg }}>
                        <i className={`ti ${pc.ico}`} style={{ color: pc.c }} />
                      </div>
                      <div>
                        <div className="ps-phase-name" style={{ color: pc.c }}>{pc.label}</div>
                        <div className="ps-phase-sub" style={{ color: pc.c }}>
                          {phase !== 'unknown' ? `day ${phaseDay} of their cycle · ` : ''}{tip}
                        </div>
                      </div>
                    </div>

                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-clock" /> next period</p>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 300, color: daysUntilNext !== null && daysUntilNext < 0 ? '#8b1a35' : '#d4607a', marginBottom: '6px' }}>
                        {nextPeriodLabel}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--ink3)' }}>
                        {nextPredicted ? `predicted for ${nextPredicted.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}` : 'not enough data yet'}
                      </p>
                    </div>

                    {phase !== 'unknown' && (() => {
                      const periodLen = avgPeriod
                      const phases = [
                        { key: 'menstrual' as const, label: 'menstrual', startDay: 1, endDay: periodLen, icon: 'ti-droplet' },
                        { key: 'follicular' as const, label: 'follicular', startDay: periodLen + 1, endDay: avgCycle - 15, icon: 'ti-leaf' },
                        { key: 'ovulation' as const, label: 'ovulation', startDay: avgCycle - 14, endDay: avgCycle - 12, icon: 'ti-sparkles' },
                        { key: 'luteal' as const, label: 'luteal', startDay: avgCycle - 11, endDay: avgCycle, icon: 'ti-moon' },
                      ]
                      return (
                        <div className="ps-phasegrid">
                          {phases.map(ph => {
                            const cfg2 = phaseConfig[ph.key]
                            const isActive = phase === ph.key
                            const daysUntilStart = ph.startDay - phaseDay
                            const daysUntilEnd = ph.endDay - phaseDay
                            const label = isActive
                              ? daysUntilEnd === 0 ? 'ends today' : `${daysUntilEnd}d left`
                              : daysUntilStart <= 0 ? 'passed' : `in ${daysUntilStart}d`
                            const isPast = !isActive && daysUntilStart <= 0
                            return (
                              <div key={ph.key}
                                className={`ps-phasecell${isActive ? ' active' : ''}`}
                                style={{ opacity: isPast ? 0.45 : 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <i className={`ti ${ph.icon}`} style={{ fontSize: '12px', color: isActive ? cfg2.c : '#b09aa4' }} />
                                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: isActive ? cfg2.c : '#b09aa4' }}>{ph.label}</span>
                                </div>
                                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 300, color: isActive ? cfg2.c : isPast ? '#b09aa4' : '#7a5c68' }}>
                                  {isActive ? '● now' : label}
                                </div>
                                <div style={{ fontSize: '9.5px', color: '#b09aa4' }}>day {ph.startDay}–{ph.endDay}</div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </motion.div>
                )}

                {/* ── MOOD ── */}
                {section === 'mood' && (
                  <motion.div key="mood" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-sun" /> today</p>
                      {todayMood ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="ps-sym-chip" style={{ background: '#fde8ee', color: '#a13a5a', fontSize: '12px', padding: '5px 14px' }}>
                            {todayMood.mood}
                          </span>
                          {todayMood.energy != null && (
                            <span className="ps-sym-chip" style={{ background: '#fef8e7', color: '#8a6a10', fontSize: '12px', padding: '5px 14px' }}>
                              energy {todayMood.energy}/5
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="ps-empty"><i className="ti ti-mood-smile" /> nothing logged today yet</div>
                      )}
                    </div>

                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-calendar" /> past 5 days</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {last5Mood.map(({ date, entry }, i) => (
                          <div key={date} className="ps-sym-row">
                            <div className="ps-sym-date">
                              {i === 0 ? 'today' : parseYMD(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                            <div style={{ flex: 1 }}>
                              {entry ? (
                                <>
                                  <span className="ps-sym-chip" style={{ background: '#fde8ee', color: '#a13a5a' }}>{entry.mood}</span>
                                  {entry.energy != null && (
                                    <span className="ps-sym-chip" style={{ background: '#fef8e7', color: '#8a6a10' }}>energy {entry.energy}/5</span>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: '11.5px', color: 'var(--ink3)', fontStyle: 'italic' }}>nothing logged</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── SYMPTOMS ── */}
                {section === 'symptoms' && (
                  <motion.div key="symptoms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-sun" /> today</p>
                      {todaySymptoms.length > 0 ? (
                        <div>
                          {todaySymptoms.map(sym => (
                            <span key={sym} className="ps-sym-chip">{sym}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="ps-empty"><i className="ti ti-stethoscope" /> nothing logged today yet</div>
                      )}
                    </div>

                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-calendar" /> past 5 days</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {last5Symptoms.map(({ date, symptoms: syms }, i) => (
                          <div key={date} className="ps-sym-row">
                            <div className="ps-sym-date">
                              {i === 0 ? 'today' : parseYMD(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                            <div style={{ flex: 1 }}>
                              {syms.length > 0 ? (
                                syms.map(sym => (
                                  <span key={sym} className="ps-sym-chip">{sym}</span>
                                ))
                              ) : (
                                <span style={{ fontSize: '11.5px', color: 'var(--ink3)', fontStyle: 'italic' }}>nothing logged</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}


                {/* ── PAIN ── */}
                {section === 'pain' && (
                  <motion.div key="pain" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-bolt" style={{ color: '#b8860b' }} /> pain history</p>
                      {painLogs.length === 0 ? (
                        <div className="ps-empty"><i className="ti ti-heart" /> no pain logged — that's good news</div>
                      ) : (
                        painLogs.slice(0, 12).map((p, i) => {
                          const meta = painTypeMeta[p.type] ?? { label: p.type, icon: 'ti-bolt', c: '#b8860b', bg: '#fef8e7' }
                          return (
                            <motion.div key={`${p.date}-${i}`} className="ps-hitem"
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                              <div className="ps-hitem-ico" style={{ background: meta.bg }}>
                                <i className={`ti ${meta.icon}`} style={{ color: meta.c }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="ps-hitem-name">{meta.label}</div>
                                <div className="ps-hitem-sub">
                                  {parseYMD(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  {p.relief_used && ` · ${p.relief_used}`}
                                </div>
                              </div>
                              <div className="ps-hitem-right">
                                <div className="ps-hitem-days" style={{ color: meta.c }}>{p.severity}/5</div>
                                <div className="ps-hitem-days-lbl">severity</div>
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                    </div>

                    {painLogs.length > 0 && (
                      <div className="ps-card">
                        <p className="ps-card-lbl"><i className="ti ti-chart-bar" /> pain patterns</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {Object.entries(painTypeMeta).map(([key, meta]) => {
                            const logs = painLogs.filter(p => p.type === key)
                            if (!logs.length) return null
                            const avgSev = (logs.reduce((a, p) => a + p.severity, 0) / logs.length).toFixed(1)
                            return (
                              <div key={key} className="ps-bar-row">
                                <span style={{ fontSize: '13px', color: 'var(--ink)', minWidth: '90px' }}>{meta.label}</span>
                                <div className="ps-bar-track">
                                  <motion.div className="ps-bar-fill" initial={{ width: 0 }} animate={{ width: `${(Number(avgSev) / 5) * 100}%` }} transition={{ duration: 0.5 }} />
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--ink3)', minWidth: '48px', textAlign: 'right' }}>avg {avgSev}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── CRAVINGS ── */}
                {section === 'cravings' && (
                  <motion.div key="cravings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="ps-card">
                      <p className="ps-card-lbl"><i className="ti ti-cookie" /> cravings log</p>
                      {cravingEvents.length === 0 ? (
                        <div className="ps-empty"><i className="ti ti-cookie" /> no cravings logged yet</div>
                      ) : (
                        <>
                          <p style={{ fontSize: '12px', color: 'var(--ink3)', marginBottom: '14px', lineHeight: 1.5 }}>
                            logged on {cravingEvents.length} day{cravingEvents.length > 1 ? 's' : ''} — maybe a good excuse to bring snacks 🍫
                          </p>
                          {cravingEvents.slice(0, 14).map((c, i) => (
                            <div key={`${c.date}-${i}`} className="ps-hitem">
                              <div className="ps-hitem-ico" style={{ background: '#fef8e7' }}>
                                <i className="ti ti-cookie" style={{ color: '#b8860b' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="ps-hitem-name">
                                  {parseYMD(c.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                                <div className="ps-hitem-sub">{c.source}</div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              <p className="ps-footer">
                <i className="ti ti-lock" /> This view updates automatically and shows only what was shared.
                <br />
                They can revoke this link anytime.
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}