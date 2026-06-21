'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
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

type SharedEntry = { start_date: string; end_date: string | null; flow: Flow }
type SharedSymptom = { date: string; symptoms: string[]; mood: string | null; energy: number | null }

type SharedPayload = {
  valid: boolean
  label?: string | null
  name?: string | null
  profile?: SharedProfile
  entries?: SharedEntry[]
  symptoms?: SharedSymptom[]
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
    padding: clamp(20px,5vw,48px) clamp(20px,4vw,40px);
  }
  .ps-wrap { max-width: 640px; margin: 0 auto; }
  .ps-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
  .ps-h1 { font-family: 'Fraunces', serif; font-size: clamp(28px,5vw,40px); font-weight: 300; font-style: italic; letter-spacing: -1px; line-height: 1.1; color: var(--ink); margin-bottom: 6px; }
  .ps-h1 .accent { color: var(--rose); }
  .ps-sub { font-size: 13px; color: var(--ink3); margin-bottom: 20px; }
  .ps-readonly { display: inline-flex; align-items: center; gap: 6px; background: var(--petal); border: 1px solid rgba(212,96,122,0.18); border-radius: 999px; padding: 5px 14px; font-size: 11px; color: var(--rose); font-weight: 600; margin-bottom: 22px; }

  .ps-phase { display: flex; align-items: center; gap: 14px; border-radius: 20px; padding: 18px 20px; margin-bottom: 16px; }
  .ps-phase-ico { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .ps-phase-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 500; margin-bottom: 3px; text-transform: capitalize; }
  .ps-phase-sub { font-size: 12px; line-height: 1.5; }

  .ps-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .ps-stat { border-radius: 16px; padding: 14px; }
  .ps-stat-lbl { font-size: 9px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.75; margin-bottom: 8px; }
  .ps-stat-val { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; }

  .ps-card { background: var(--card); border: 1px solid rgba(212,96,122,0.1); border-radius: 20px; padding: 18px 20px; margin-bottom: 16px; }
  .ps-card-lbl { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
  .ps-empty { font-size: 12px; color: var(--ink3); font-style: italic; padding: 8px 0; display: flex; align-items: center; gap: 8px; }

  .ps-hitem { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(212,96,122,0.07); }
  .ps-hitem:last-child { border-bottom: none; }
  .ps-hitem-ico { width: 34px; height: 34px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .ps-hitem-name { font-size: 13px; font-weight: 500; color: var(--ink); }
  .ps-hitem-sub { font-size: 11px; color: var(--ink3); margin-top: 2px; text-transform: capitalize; }

  .ps-sym-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid rgba(212,96,122,0.07); }
  .ps-sym-row:last-child { border-bottom: none; }
  .ps-sym-date { font-size: 11.5px; font-weight: 600; color: var(--ink2); min-width: 76px; flex-shrink: 0; }
  .ps-sym-chip { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 600; background: var(--lavender); color: #6a4a98; margin: 2px 4px 2px 0; }

  .ps-footer { text-align: center; font-size: 11.5px; color: var(--ink3); margin-top: 24px; line-height: 1.6; }

  .ps-center { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 10px; }
  .ps-center-emoji { font-size: 36px; margin-bottom: 4px; }
  .ps-center-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 400; font-style: italic; color: var(--ink); }
  .ps-center-sub { font-size: 13px; color: var(--ink3); max-width: 320px; line-height: 1.6; }

  @media (max-width: 480px) {
    .ps-stats { grid-template-columns: 1fr 1fr; }
    .ps-stats > :last-child:nth-child(3) { grid-column: span 2; }
  }
`

export default function SharedCyclePage() {
  const params = useParams<{ code: string | string[] }>()
  const code = Array.isArray(params?.code) ? params.code[0] : params?.code ?? ''
  const supabase = useMemo(() => createClient(), [])

  const [status, setStatus] = useState<'loading' | 'invalid' | 'ready'>('loading')
  const [data, setData] = useState<SharedPayload | null>(null)

  useEffect(() => {
    if (!code) {
      setStatus('invalid')
      return
    }
    let cancelled = false

    ;(async () => {
      const { data: result, error } = await supabase.rpc('get_partner_shared_data', {
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

  // ── Render: loading ────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <>
        <style>{css}</style>
        <div className="ps">
          <div className="ps-center">
            <div className="ps-center-emoji">🌸</div>
            <p className="ps-center-sub">loading shared cycle...</p>
          </div>
        </div>
      </>
    )
  }

  // ── Render: invalid / revoked ─────────────────────────────────────────
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

  // ── Render: ready ────────────────────────────────────────────────────
  const displayName = data?.name ? `${data.name}'s` : 'their'

  return (
    <>
      <style>{css}</style>
      <div className="ps">
        <div className="ps-wrap">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="ps-eyebrow">
              <i className="ti ti-heart" aria-hidden="true" />
              shared with you
            </p>
            <h1 className="ps-h1">
              {displayName} <span className="accent">cycle</span>
            </h1>
            <p className="ps-sub">a gentle, read-only view of where they're at</p>
            <span className="ps-readonly">
              <i className="ti ti-eye" aria-hidden="true" />
              view only · cycle, symptoms &amp; mood
            </span>
          </motion.div>

          {/* Phase banner */}
          <motion.div
            className="ps-phase"
            style={{ background: pc.bg, border: `1px solid ${pc.border}` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="ps-phase-ico" style={{ background: pc.icoBg }}>
              {pc.emoji}
            </div>
            <div>
              <div className="ps-phase-name" style={{ color: pc.c }}>
                {pc.label}
              </div>
              <div className="ps-phase-sub" style={{ color: pc.c }}>
                {phase !== 'unknown' ? `day ${phaseDay} of their cycle · ` : ''}
                {tip}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
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
              <motion.div
                key={s.label}
                className="ps-stat"
                style={{ background: s.bg }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <div className="ps-stat-lbl" style={{ color: s.c }}>
                  {s.label}
                </div>
                <div className="ps-stat-val" style={{ color: s.c }}>
                  {s.value}
                </div>
              </motion.div>
            ))}
          </div>

          {profile?.has_pcos_pcod || profile?.trying_to_conceive ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {profile.has_pcos_pcod && (
                <span className="ps-readonly" style={{ marginBottom: 0, background: '#f3edfb', color: '#6a4a98', borderColor: 'rgba(155,126,200,0.25)' }}>
                  <i className="ti ti-ribbon" /> {profile.pcos_type?.toUpperCase() ?? 'PCOS/PCOD'}
                </span>
              )}
              {profile.trying_to_conceive && (
                <span className="ps-readonly" style={{ marginBottom: 0, background: '#edf6ee', color: '#3a6b42', borderColor: 'rgba(90,140,99,0.25)' }}>
                  <i className="ti ti-heart" /> trying to conceive
                </span>
              )}
            </div>
          ) : null}

          {/* Recent periods */}
          <div className="ps-card">
            <p className="ps-card-lbl">
              <i className="ti ti-droplet" /> recent periods
            </p>
            {entries.length === 0 ? (
              <div className="ps-empty">
                <i className="ti ti-calendar-heart" /> no cycles logged yet
              </div>
            ) : (
              entries.map((e, i) => {
                const f = flowMeta[e.flow]
                const dur = e.end_date ? diffDays(parseYMD(e.start_date), parseYMD(e.end_date)) + 1 : null
                return (
                  <motion.div
                    key={`${e.start_date}-${i}`}
                    className="ps-hitem"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="ps-hitem-ico" style={{ background: f.bg }}>
                      <i className="ti ti-droplet" style={{ color: f.c }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="ps-hitem-name">
                        {parseYMD(e.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {e.end_date &&
                          ` → ${parseYMD(e.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
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

          {/* Recent symptoms / mood */}
          <div className="ps-card">
            <p className="ps-card-lbl">
              <i className="ti ti-mood-smile" /> recent mood &amp; symptoms
            </p>
            {symptoms.length === 0 ? (
              <div className="ps-empty">
                <i className="ti ti-stethoscope" /> nothing logged recently
              </div>
            ) : (
              symptoms.map((s, i) => (
                <motion.div
                  key={`${s.date}-${i}`}
                  className="ps-sym-row"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="ps-sym-date">
                    {parseYMD(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ flex: 1 }}>
                    {s.mood && <span className="ps-sym-chip" style={{ background: '#fde8ee', color: '#a13a5a' }}>{s.mood}</span>}
                    {s.energy != null && (
                      <span className="ps-sym-chip" style={{ background: '#fef8e7', color: '#8a6a10' }}>
                        energy {s.energy}/5
                      </span>
                    )}
                    {s.symptoms?.map((sym) => (
                      <span key={sym} className="ps-sym-chip">
                        {sym}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <p className="ps-footer">
            <i className="ti ti-lock" /> This view updates automatically and shows only what was shared.
            <br />
            They can revoke this link anytime.
          </p>
        </div>
      </div>
    </>
  )
}