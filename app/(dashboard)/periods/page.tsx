'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import styles from './periods.module.css'
import SharePartner from './SharePartner'

type Flow = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy'
type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown'

type CycleProfile = {
  cycle_length: number
  period_length: number
  cycle_regularity: 'regular' | 'irregular' | 'very_irregular'
  has_pcos_pcod: boolean
  pcos_type: 'pcos' | 'pcod' | null
  on_birth_control: boolean
  birth_control_type: string | null
  trying_to_conceive: boolean
  age: number | null
  last_period_date: string | null
  notes: string | null
}

type Entry = {
  id: string
  user_id: string
  start_date: string
  end_date: string | null
  flow: Flow
  symptoms: string[]
  mood: string | null
  cravings: string[]
  notes: string | null
  created_at: string
}

type SexLog = {
  id: string
  user_id: string
  date: string
  protected: boolean | null
  notes: string | null
  created_at: string | null
}

type PainLog = {
  id: string
  user_id: string
  date: string
  type: 'cramps' | 'headache' | 'migraine' | 'backache' | 'breast_pain'
  severity: 1 | 2 | 3 | 4 | 5
  duration_hours: number | null
  relief_used: string | null
  notes: string | null
  created_at: string
}

type DailySymptom = {
  id: string
  user_id: string
  date: string
  symptoms: string[]
  mood: string | null
  energy: number | null
  notes: string | null
  created_at: string
}

const symptomList = [
  { label: 'cramps',      icon: 'ti-bolt' },
  { label: 'bloating',    icon: 'ti-circle' },
  { label: 'headache',    icon: 'ti-brain' },
  { label: 'fatigue',     icon: 'ti-zzz' },
  { label: 'backache',    icon: 'ti-accessible' },
  { label: 'nausea',      icon: 'ti-mood-sick' },
  { label: 'mood swings', icon: 'ti-mood-crazy-happy' },
  { label: 'spotting',    icon: 'ti-droplet' },
  { label: 'breast pain', icon: 'ti-heart' },
  { label: 'acne',        icon: 'ti-circle-dot' },
  { label: 'insomnia',    icon: 'ti-moon' },
  { label: 'hot flashes', icon: 'ti-flame' },
  { label: 'discharge',   icon: 'ti-droplets' },
]

const cravingOpts: { label: string; icon: string; c: string }[] = [
  { label: 'sweet',     icon: 'ti-candy',      c: '#d4607a' },
  { label: 'salty',     icon: 'ti-grain',      c: '#b8860b' },
  { label: 'chocolate', icon: 'ti-cookie',     c: '#7a4a2a' },
  { label: 'carbs',     icon: 'ti-bread',      c: '#c08850' },
  { label: 'spicy',     icon: 'ti-pepper',     c: '#c0503a' },
  { label: 'fried',     icon: 'ti-soup',       c: '#b8860b' },
  { label: 'fruity',    icon: 'ti-apple',      c: '#5a8c63' },
  { label: 'dairy',     icon: 'ti-milk',       c: '#7a8cb8' },
  { label: 'none',      icon: 'ti-circle-off', c: '#b09aa4' },
]

const flows: { key: Flow; label: string; c: string; bg: string; border: string; dots: number }[] = [
  { key: 'spotting',   label: 'spotting',   c: '#e8a0b0', bg: '#fff5f7', border: '#f2d0d9', dots: 0 },
  { key: 'light',      label: 'light',      c: '#d4607a', bg: '#fde8ee', border: '#f2b3c0', dots: 1 },
  { key: 'medium',     label: 'medium',     c: '#9b7ec8', bg: '#f3edfb', border: '#c9b8e8', dots: 2 },
  { key: 'heavy',      label: 'heavy',      c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', dots: 3 },
  { key: 'very_heavy', label: 'very heavy', c: '#8b1a35', bg: '#fde0e7', border: '#e89aaa', dots: 4 },
]

const moodOpts = [
  { label: 'great',     icon: 'ti-star',          c: '#d4607a' },
  { label: 'okay',      icon: 'ti-minus',          c: '#b8860b' },
  { label: 'low',       icon: 'ti-mood-sad',       c: '#7a8cb8' },
  { label: 'anxious',   icon: 'ti-alert-triangle', c: '#c07840' },
  { label: 'irritable', icon: 'ti-flame',          c: '#c05878' },
  { label: 'emotional', icon: 'ti-heart',          c: '#9b7ec8' },
  { label: 'foggy',     icon: 'ti-cloud',          c: '#8899aa' },
]

const painTypes = [
  { key: 'cramps',      label: 'Cramps',      icon: 'ti-bolt',       c: '#d4607a', bg: '#fde8ee' },
  { key: 'headache',    label: 'Headache',    icon: 'ti-brain',      c: '#9b7ec8', bg: '#f3edfb' },
  { key: 'migraine',    label: 'Migraine',    icon: 'ti-brain',      c: '#8b1a8b', bg: '#f5e8fb' },
  { key: 'backache',    label: 'Back Pain',   icon: 'ti-accessible', c: '#b8860b', bg: '#fef8e7' },
  { key: 'breast_pain', label: 'Breast Pain', icon: 'ti-heart',      c: '#c05878', bg: '#fde4ec' },
]

const reliefOptions = ['ibuprofen', 'paracetamol', 'heat pad', 'rest', 'yoga', 'massage', 'ice pack', 'nothing']

// ─── Error logging helper ───────────────────────────────────────────────────
// Supabase/PostgREST errors don't serialize well with plain console.error
// (they often render as `{}` in Next's overlay). This pulls out the fields
// that actually matter so they show up in the console.
function logSupabaseError(label: string, error: any) {
  if (!error) {
    console.error(label, error)
    return
  }
  console.error(label, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    status: error.status,
    name: error.name,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
function toYMD(d: Date) {
  return d.toISOString().split('T')[0]
}
function parseYMD(s: string) {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function getPhase(lastStart: Date | null, cycleLen: number, profile: CycleProfile | null) {
  if (!lastStart) return { phase: 'unknown' as Phase, day: 0, tip: 'Log your first period to see your cycle phase.' }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const day = diffDays(lastStart, today) + 1
  const d = ((day - 1) % cycleLen) + 1
  const periodLen = profile?.period_length ?? 5
  const hasPcos = profile?.has_pcos_pcod ?? false
  if (d <= periodLen)
    return { phase: 'menstrual' as Phase, day: d, tip: hasPcos ? 'Rest, hydrate & heat pad — PCOS cramps can be stronger.' : 'Rest well, hydrate, and be gentle with yourself.' }
  if (d <= cycleLen - 15)
    return { phase: 'follicular' as Phase, day: d, tip: 'Energy rising — great time to start new things.' }
  if (d >= cycleLen - 14 && d <= cycleLen - 12)
    return { phase: 'ovulation' as Phase, day: d, tip: "Peak energy & confidence — you're glowing." }
  return { phase: 'luteal' as Phase, day: d, tip: hasPcos ? 'Luteal phase with PCOS can bring stronger symptoms — be extra gentle.' : 'Wind down, nourish yourself, and rest more.' }
}

const phaseConfig = {
  menstrual:  { label: 'menstrual phase',  c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.2)',  ico: 'ti-droplet',        icoBg: 'rgba(212,96,122,0.12)' },
  follicular: { label: 'follicular phase', c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.2)',   ico: 'ti-leaf',           icoBg: 'rgba(90,140,99,0.12)'  },
  ovulation:  { label: 'ovulation phase',  c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.2)', ico: 'ti-sparkles',       icoBg: 'rgba(155,126,200,0.12)' },
  luteal:     { label: 'luteal phase',     c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.2)',  ico: 'ti-moon',           icoBg: 'rgba(184,134,11,0.12)' },
  unknown:    { label: 'phase unknown',    c: '#b09aa4', bg: '#f5f0f2', border: 'rgba(176,154,164,0.2)', ico: 'ti-calendar-heart', icoBg: 'rgba(176,154,164,0.12)' },
}

const validRegularity = ['regular', 'irregular', 'very_irregular'] as const
function isValidRegularity(v: unknown): v is CycleProfile['cycle_regularity'] {
  return (validRegularity as readonly unknown[]).includes(v)
}

// ─── Onboarding Portal ────────────────────────────────────────────────────────

const ONBOARD_STEPS = 6

function OnboardingPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

function OnboardingFlow({ onComplete }: { onComplete: (profile: CycleProfile) => void }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Partial<CycleProfile>>({
    cycle_length: 28,
    period_length: 5,
    cycle_regularity: 'regular',
    has_pcos_pcod: false,
    pcos_type: null,
    on_birth_control: false,
    birth_control_type: null,
    trying_to_conceive: false,
    age: null,
    last_period_date: toYMD(new Date()),
    notes: null,
  })

  const update = (k: keyof CycleProfile, v: any) => setProfile(p => ({ ...p, [k]: v }))
  const next = () => step < ONBOARD_STEPS - 1 ? setStep(s => s + 1) : onComplete(profile as CycleProfile)
  const back = () => setStep(s => Math.max(0, s - 1))

  const steps = [
    {
      icon: 'ti-calendar-heart',
      title: <>tell us about your <span className={styles.accent}>cycle</span></>,
      sub: 'This helps us give you accurate predictions and insights, especially if your cycle is irregular.',
      content: (
        <>
          <div className={styles['pt-input-lbl']}><i className="ti ti-rotate-clockwise" /> how long is your average cycle? (days)</div>
          <input type="range" className={styles['pt-range']} min={20} max={45}
            value={profile.cycle_length ?? 28}
            onChange={e => update('cycle_length', Number(e.target.value))} />
          <div className={styles['pt-range-labels']}>
            <span>20 days</span>
            <span style={{ color: '#d4607a', fontWeight: 600 }}>{profile.cycle_length} days</span>
            <span>45 days</span>
          </div>
          <div className={styles['pt-input-lbl']}><i className="ti ti-droplet" /> how long does your period last? (days)</div>
          <input type="range" className={styles['pt-range']} min={2} max={10}
            value={profile.period_length ?? 5}
            onChange={e => update('period_length', Number(e.target.value))} />
          <div className={styles['pt-range-labels']}>
            <span>2 days</span>
            <span style={{ color: '#d4607a', fontWeight: 600 }}>{profile.period_length} days</span>
            <span>10 days</span>
          </div>
        </>
      )
    },
    {
      icon: 'ti-activity',
      title: <>how <span className={styles.accent}>regular</span> are you?</>,
      sub: "Be honest — irregular cycles are very common and we'll adjust our predictions accordingly.",
      content: (
        <div className={styles['pt-radio-group']}>
          {[
            { key: 'regular',        label: 'Pretty regular',          sub: 'Within 1–2 days of expected',    icon: 'ti-clock',     c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.25)' },
            { key: 'irregular',      label: 'Somewhat irregular',      sub: 'Varies by 3–7 days',             icon: 'ti-clock-off', c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.25)' },
            { key: 'very_irregular', label: 'Very irregular',          sub: 'Unpredictable, can skip months', icon: 'ti-help',      c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.25)' },
          ].map(opt => (
            <button key={opt.key} className={styles['pt-radio-btn']}
              onClick={() => update('cycle_regularity', opt.key)}
              style={{
                background: profile.cycle_regularity === opt.key ? opt.bg : 'transparent',
                borderColor: profile.cycle_regularity === opt.key ? opt.border : 'rgba(212,96,122,0.12)',
                color: profile.cycle_regularity === opt.key ? opt.c : 'var(--ink)',
              }}>
              <i className={`ti ${opt.icon}`} style={{ color: opt.c }} />
              <div>
                <div style={{ fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )
    },
    {
      icon: 'ti-ribbon',
      title: <>do you have <span className={styles.accent}>PCOS or PCOD?</span></>,
      sub: "Polycystic ovary syndrome/disease affects cycle predictions significantly. We'll tailor insights accordingly.",
      content: (
        <>
          <div className={styles['pt-radio-group']}>
            {[
              { key: false,    label: "No, I don't",            sub: 'No known diagnosis',    icon: 'ti-check',  c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.25)' },
              { key: true,     label: 'Yes, I have PCOS/PCOD',  sub: 'Diagnosed by a doctor', icon: 'ti-ribbon', c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.25)' },
              { key: 'unsure', label: 'Not sure / undiagnosed', sub: 'I suspect I might',     icon: 'ti-help',   c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.25)' },
            ].map(opt => {
              const isActive = opt.key === true ? profile.has_pcos_pcod === true
                             : opt.key === false ? profile.has_pcos_pcod === false
                             : false
              return (
                <button key={String(opt.key)} className={styles['pt-radio-btn']}
                  onClick={() => update('has_pcos_pcod', opt.key === true)}
                  style={{
                    background: isActive ? opt.bg : 'transparent',
                    borderColor: isActive ? opt.border : 'rgba(212,96,122,0.12)',
                    color: isActive ? opt.c : 'var(--ink)',
                  }}>
                  <i className={`ti ${opt.icon}`} style={{ color: opt.c }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{opt.sub}</div>
                  </div>
                </button>
              )
            })}
          </div>
          {profile.has_pcos_pcod && (
            <div>
              <div className={styles['pt-input-lbl']}><i className="ti ti-stethoscope" /> which type?</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['pcos', 'pcod'] as const).map(t => (
                  <button key={t} className={styles['pt-radio-btn']}
                    onClick={() => update('pcos_type', t)}
                    style={{
                      flex: 1,
                      background: profile.pcos_type === t ? '#f3edfb' : 'transparent',
                      borderColor: profile.pcos_type === t ? '#c9b8e8' : 'rgba(212,96,122,0.12)',
                      color: profile.pcos_type === t ? '#9b7ec8' : 'var(--ink)',
                    }}>
                    <i className="ti ti-ribbon" style={{ color: '#9b7ec8' }} />
                    <div><div style={{ fontWeight: 600 }}>{t.toUpperCase()}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )
    },
    {
      icon: 'ti-pill',
      title: <>birth <span className={styles.accent}>control</span> &amp; health</>,
      sub: 'Contraceptives can significantly affect your cycle. This stays completely private.',
      content: (
        <>
          <div className={styles['pt-toggle-row']}>
            <span className={styles['pt-toggle-lbl']}><i className="ti ti-pill" /> On birth control?</span>
            <button className={`${styles['pt-toggle']} ${profile.on_birth_control ? styles.on : styles.off}`}
              onClick={() => update('on_birth_control', !profile.on_birth_control)} />
          </div>
          {profile.on_birth_control && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <div className={styles['pt-input-lbl']}><i className="ti ti-list" /> type of birth control</div>
              <div className={styles['pt-checkbox-group']}>
                {['pill', 'IUD (hormonal)', 'IUD (copper)', 'implant', 'injection', 'patch', 'ring', 'condoms only'].map(bc => (
                  <button key={bc} className={styles['pt-checkbox-btn']}
                    onClick={() => update('birth_control_type', bc)}
                    style={{
                      background: profile.birth_control_type === bc ? '#fde8ee' : 'transparent',
                      borderColor: profile.birth_control_type === bc ? '#e8a0b0' : 'rgba(212,96,122,0.12)',
                      color: profile.birth_control_type === bc ? '#7a1a35' : 'var(--ink)',
                    }}>
                    <i className={`ti ${profile.birth_control_type === bc ? 'ti-circle-check' : 'ti-circle'}`}
                      style={{ color: profile.birth_control_type === bc ? '#d4607a' : '#b09aa4' }} />
                    {bc}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          <div className={styles['pt-toggle-row']} style={{ marginBottom: 0 }}>
            <span className={styles['pt-toggle-lbl']}><i className="ti ti-heart" /> Trying to conceive?</span>
            <button className={`${styles['pt-toggle']} ${profile.trying_to_conceive ? styles.on : styles.off}`}
              onClick={() => update('trying_to_conceive', !profile.trying_to_conceive)} />
          </div>
        </>
      )
    },
    {
      icon: 'ti-calendar',
      title: <>last period &amp; <span className={styles.accent}>age</span></>,
      sub: 'When did your last period start? And your age helps us give age-appropriate insights.',
      content: (
        <>
          <div className={styles['pt-input-lbl']}><i className="ti ti-calendar-event" /> when did your last period start?</div>
          <input type="date" className={styles['pt-input']}
            value={profile.last_period_date ?? ''}
            onChange={e => update('last_period_date', e.target.value)} />
          <div className={styles['pt-input-lbl']} style={{ marginTop: '6px' }}><i className="ti ti-user" /> your age (optional)</div>
          <input type="number" className={styles['pt-input']} placeholder="e.g. 26"
            value={profile.age ?? ''}
            onChange={e => update('age', Number(e.target.value) || null)} />
          <div className={styles['pt-input-lbl']} style={{ marginTop: '6px' }}><i className="ti ti-pencil" /> anything else we should know? (optional)</div>
          <textarea className={styles['pt-input']} rows={3}
            placeholder="e.g. thyroid issues, endometriosis, stress-related delays..."
            value={profile.notes ?? ''}
            onChange={e => update('notes', e.target.value)}
            style={{ resize: 'none' }} />
        </>
      )
    },
    {
      icon: 'ti-check',
      title: <>you&apos;re all <span className={styles.accent}>set!!!</span></>,
      sub: 'Your cycle profile is ready. Everything can be updated any time from settings.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'cycle length',  value: `${profile.cycle_length} days`,                                             icon: 'ti-rotate-clockwise', c: '#d4607a', bg: '#fde8ee' },
            { label: 'period length', value: `${profile.period_length} days`,                                            icon: 'ti-droplet',          c: '#9b7ec8', bg: '#f3edfb' },
            { label: 'regularity',    value: profile.cycle_regularity ?? '—',                                            icon: 'ti-activity',         c: '#5a8c63', bg: '#edf6ee' },
            { label: 'PCOS/PCOD',     value: profile.has_pcos_pcod ? (profile.pcos_type?.toUpperCase() ?? 'yes') : 'no', icon: 'ti-ribbon',           c: '#b8860b', bg: '#fef8e7' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '14px', background: row.bg,
            }}>
              <i className={`ti ${row.icon}`} style={{ color: row.c, fontSize: '16px' }} />
              <span style={{ fontSize: '13px', color: 'var(--ink)', flex: 1 }}>{row.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: row.c }}>{row.value}</span>
            </div>
          ))}
        </div>
      )
    },
  ]

  const s = steps[step]

  return (
    <OnboardingPortal>
      <motion.div className={styles['pt-onboard-overlay']}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className={styles['pt-onboard-card']}
          key={step}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}>

          <div className={styles['pt-onboard-step']}>
            <i className={`ti ${s.icon}`} style={{ color: '#d4607a' }} />
            step {step + 1} of {ONBOARD_STEPS}
          </div>

          <h2 className={styles['pt-onboard-title']}>{s.title}</h2>
          <p className={styles['pt-onboard-sub']}>{s.sub}</p>

          <div className={styles['pt-onboard-progress']}>
            {[...Array(ONBOARD_STEPS)].map((_, i) => (
              <div key={i} className={`${styles['pt-onboard-pip']} ${i <= step ? styles.done : ''}`} />
            ))}
          </div>

          {s.content}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {step > 0 && (
              <button className={`${styles['pt-nav-btn']} ${styles.secondary}`} onClick={back}>back</button>
            )}
            <button className={styles['pt-nav-btn']} onClick={next}
              style={{ flex: 1, background: 'linear-gradient(135deg, #d4607a, #9b7ec8)', color: 'white' }}>
              {step === ONBOARD_STEPS - 1 ? 'start tracking ✨' : 'continue →'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </OnboardingPortal>
  )
}

// ─── Period Arrival Banner ────────────────────────────────────────────────────

type ArrivalBannerProps = {
  daysUntilNext: number | null
  predictedDate: Date | null
  onConfirm: (flow: Flow, date: string, symptoms: string[], mood: string | null, cravings: string[]) => Promise<void>
  onSnooze: () => void
  snoozed: boolean
}

function PeriodArrivalBanner({ daysUntilNext, predictedDate, onConfirm, onSnooze, snoozed }: ArrivalBannerProps) {
  const [step, setStep] = useState<'idle' | 'flow' | 'details' | 'done'>('idle')
  const [quickFlow, setQuickFlow] = useState<Flow | null>(null)
  const [bannerSymptoms, setBannerSymptoms] = useState<string[]>([])
  const [bannerMood, setBannerMood] = useState<string | null>(null)
  const [bannerCravings, setBannerCravings] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  if (daysUntilNext === null || predictedDate === null) return null
  if (daysUntilNext > 2 || daysUntilNext < -14) return null
  if (snoozed || step === 'done') return null

  const isOverdue  = daysUntilNext < 0
  const isDueToday = daysUntilNext === 0
  const overdueDays = Math.abs(daysUntilNext)

  const bannerBg     = isOverdue ? '#fde0e7' : isDueToday ? '#fde8ee' : '#fff5f7'
  const bannerBorder = isOverdue ? 'rgba(139,26,53,0.25)' : 'rgba(212,96,122,0.2)'
  const bannerColor  = isOverdue ? '#8b1a35' : '#d4607a'

  const headline = isOverdue
    ? `your period is ${overdueDays} day${overdueDays > 1 ? 's' : ''} late`
    : isDueToday ? 'your period is due today'
    : `your period is due in ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`

  const toggleBannerSymptom = (s: string) =>
    setBannerSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleBannerCraving = (c: string) =>
    setBannerCravings(prev => {
      if (c === 'none') return prev.includes('none') ? [] : ['none']
      const withoutNone = prev.filter(x => x !== 'none')
      return withoutNone.includes(c) ? withoutNone.filter(x => x !== c) : [...withoutNone, c]
    })

  const handleConfirm = async () => {
    if (!quickFlow) return
    setConfirming(true)
    await onConfirm(quickFlow, toYMD(new Date()), bannerSymptoms, bannerMood, bannerCravings)
    setStep('done')
    setConfirming(false)
  }

  const btnBase: React.CSSProperties = {
    borderRadius: '999px', fontSize: '12px', fontWeight: 700,
    border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.15s ease',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      style={{
        borderRadius: '18px', background: bannerBg,
        border: `1.5px solid ${bannerBorder}`,
        padding: '16px 18px', marginBottom: '16px', position: 'relative',
      }}>

      <button onClick={onSnooze} style={{
        position: 'absolute', top: 12, right: 12,
        width: 26, height: 26, borderRadius: '50%',
        border: '1px solid rgba(212,96,122,0.18)',
        background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: '#b09aa4',
      }}>
        <i className="ti ti-x" />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '12px', flexShrink: 0,
          background: 'rgba(212,96,122,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ti ti-droplet" style={{ color: bannerColor, fontSize: '17px' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: bannerColor, marginBottom: '2px' }}>
            {headline}
          </div>

          {step === 'idle' && (
            <>
              <div style={{ fontSize: '12px', color: '#b09aa4', lineHeight: 1.5, marginBottom: '12px' }}>
                {isOverdue
                  ? 'Did it arrive? Let us know so we can keep your predictions accurate.'
                  : 'Did it start? A quick tap keeps your cycle data on track.'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setStep('flow')} style={{
                  ...btnBase, padding: '7px 14px',
                  background: 'linear-gradient(135deg, #d4607a, #9b7ec8)', color: '#fff',
                }}>
                  <i className="ti ti-droplet" style={{ marginRight: '5px' }} />yes, it arrived
                </button>
                <button onClick={onSnooze} style={{
                  ...btnBase, padding: '7px 14px', fontWeight: 600,
                  background: 'transparent', color: '#b09aa4',
                  border: '1.5px solid rgba(212,96,122,0.18)',
                }}>
                  not yet
                </button>
              </div>
            </>
          )}

          <AnimatePresence>
            {step === 'flow' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', color: '#b09aa4', marginBottom: '8px', fontWeight: 600 }}>
                  <i className="ti ti-droplet" style={{ marginRight: '4px' }} />how&apos;s the flow?
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {flows.map(f => (
                    <button key={f.key} onClick={() => setQuickFlow(quickFlow === f.key ? null : f.key)}
                      style={{
                        ...btnBase, padding: '6px 12px', fontSize: '11px',
                        background: quickFlow === f.key ? f.bg : 'rgba(255,255,255,0.6)',
                        border: `1.5px solid ${quickFlow === f.key ? f.border : 'rgba(212,96,122,0.15)'}`,
                        color: quickFlow === f.key ? f.c : '#b09aa4',
                      }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => quickFlow && setStep('details')} disabled={!quickFlow} style={{
                    ...btnBase, flex: 1, padding: '9px',
                    background: quickFlow ? 'linear-gradient(135deg, #d4607a, #9b7ec8)' : 'rgba(212,96,122,0.08)',
                    color: quickFlow ? '#fff' : '#b09aa4',
                    cursor: quickFlow ? 'pointer' : 'not-allowed',
                  }}>
                    next → symptoms &amp; more
                  </button>
                  <button onClick={() => setStep('idle')} style={{
                    ...btnBase, padding: '9px 14px', fontWeight: 600,
                    background: 'transparent', color: '#b09aa4',
                    border: '1.5px solid rgba(212,96,122,0.18)',
                  }}>back</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step === 'details' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', color: '#b09aa4', marginBottom: '6px', fontWeight: 600 }}>
                  <i className="ti ti-stethoscope" style={{ marginRight: '4px' }} />any symptoms? (optional)
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {symptomList.map(s => {
                    const active = bannerSymptoms.includes(s.label)
                    return (
                      <button key={s.label} onClick={() => toggleBannerSymptom(s.label)} style={{
                        ...btnBase, padding: '5px 10px', fontSize: '11px', fontWeight: 600,
                        background: active ? '#fde8ee' : 'rgba(255,255,255,0.6)',
                        border: `1.5px solid ${active ? '#e8a0b0' : 'rgba(212,96,122,0.15)'}`,
                        color: active ? '#7a1a35' : '#b09aa4',
                      }}>
                        <i className={`ti ${s.icon}`} style={{ color: active ? '#d4607a' : '#b09aa4', marginRight: '3px' }} />
                        {s.label}
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: '12px', color: '#b09aa4', marginBottom: '6px', fontWeight: 600 }}>
                  <i className="ti ti-mood-smile" style={{ marginRight: '4px' }} />how are you feeling? (optional)
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {moodOpts.map(m => {
                    const active = bannerMood === m.label
                    return (
                      <button key={m.label} onClick={() => setBannerMood(active ? null : m.label)} style={{
                        ...btnBase, padding: '5px 10px', fontSize: '11px', fontWeight: 600,
                        background: active ? '#fde8ee' : 'rgba(255,255,255,0.6)',
                        border: `1.5px solid ${active ? '#e8a0b0' : 'rgba(212,96,122,0.15)'}`,
                        color: active ? m.c : '#b09aa4',
                      }}>
                        <i className={`ti ${m.icon}`} style={{ color: active ? m.c : '#b09aa4', marginRight: '3px' }} />
                        {m.label}
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: '12px', color: '#b09aa4', marginBottom: '6px', fontWeight: 600 }}>
                  <i className="ti ti-cookie" style={{ marginRight: '4px' }} />any cravings? (optional)
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {cravingOpts.map(c => {
                    const active = bannerCravings.includes(c.label)
                    return (
                      <button key={c.label} onClick={() => toggleBannerCraving(c.label)} style={{
                        ...btnBase, padding: '5px 10px', fontSize: '11px', fontWeight: 600,
                        background: active ? '#fef8e7' : 'rgba(255,255,255,0.6)',
                        border: `1.5px solid ${active ? '#f5ddb4' : 'rgba(212,96,122,0.15)'}`,
                        color: active ? c.c : '#b09aa4',
                      }}>
                        <i className={`ti ${c.icon}`} style={{ color: active ? c.c : '#b09aa4', marginRight: '3px' }} />
                        {c.label}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleConfirm} disabled={confirming} style={{
                    ...btnBase, flex: 1, padding: '9px',
                    background: 'linear-gradient(135deg, #d4607a, #9b7ec8)', color: '#fff',
                  }}>
                    {confirming ? 'logging...' : 'confirm & log 🌸'}
                  </button>
                  <button onClick={() => setStep('flow')} style={{
                    ...btnBase, padding: '9px 14px', fontWeight: 600,
                    background: 'transparent', color: '#b09aa4',
                    border: '1.5px solid rgba(212,96,122,0.18)',
                  }}>back</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Period Cravings Card ─────────────────────────────────────────────────────

const cravingFoods = [
  {
    img: 'https://images.unsplash.com/photo-1548907040-4d42bde4e6ab?w=300&q=80',
    label: 'chocolate',
    emoji: '🍫',
    vibe: 'serotonin boost bestie',
    c: '#7a3a1a',
    bg: 'rgba(122,58,26,0.08)',
    border: 'rgba(122,58,26,0.15)',
  },
  {
    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80',
    label: 'pizza',
    emoji: '🍕',
    vibe: 'cheesy comfort, always',
    c: '#c05828',
    bg: 'rgba(192,88,40,0.08)',
    border: 'rgba(192,88,40,0.15)',
  },
  {
    img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80',
    label: 'ice cream',
    emoji: '🍨',
    vibe: 'cold + sweet = therapy',
    c: '#9b5ec8',
    bg: 'rgba(155,94,200,0.08)',
    border: 'rgba(155,94,200,0.15)',
  },
  {
    img: 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=300&q=80',
    label: 'ramen',
    emoji: '🍜',
    vibe: 'warm hug in a bowl',
    c: '#c08020',
    bg: 'rgba(192,128,32,0.08)',
    border: 'rgba(192,128,32,0.15)',
  },
  {
    img: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=300&q=80',
    label: 'fries',
    emoji: '🍟',
    vibe: 'salty & satisfying',
    c: '#b8860b',
    bg: 'rgba(184,134,11,0.08)',
    border: 'rgba(184,134,11,0.15)',
  },
  {
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80',
    label: 'cake',
    emoji: '🎂',
    vibe: 'because you deserve it',
    c: '#d4607a',
    bg: 'rgba(212,96,122,0.08)',
    border: 'rgba(212,96,122,0.15)',
  },
]

function PeriodCravingsCard() {
  const supabase = createClient()

  const [clicked, setClicked] = useState<string[]>([])

  const fetchCravingClicks = async () => {
    const { data, error } = await supabase.from('craving_clicks').select('food_label')
    if (error) {
      logSupabaseError('fetchCravingClicks failed:', error)
      return
    }
    if (data) setClicked(data.map((d: { food_label: string }) => d.food_label))
  }

  useEffect(() => {
    fetchCravingClicks()
  }, [])

  const handleFoodClick = async (label: string) => {
    if (clicked.includes(label)) return
    setClicked(prev => [...prev, label])

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSupabaseError('handleFoodClick: no authenticated user', authError)
      return
    }

    const { error } = await (supabase.from('craving_clicks') as any).upsert(
      { user_id: user.id, food_label: label, clicked_at: new Date().toISOString() },
      { onConflict: 'user_id,food_label' }
    )
    if (error) logSupabaseError('handleFoodClick: upsert failed:', error)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        borderRadius: '20px',
        background: 'linear-gradient(145deg, #fff5f7 0%, #f8f3fc 100%)',
        border: '1.5px solid rgba(212,96,122,0.15)',
        padding: '18px 16px',
        marginTop: '6px',
        overflow: 'hidden',
      }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '24px' }}>🫶</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#d4607a', lineHeight: 1.2 }}>
            your body is craving…
          </div>
          <div style={{ fontSize: '11px', color: '#b09aa4', marginTop: '2px' }}>
            tap whichever you reach for 🌸
          </div>
        </div>
      </div>

      {/* food grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '14px',
      }}>
        {cravingFoods.map((food) => {
          const isClicked = clicked.includes(food.label)
          return (
            <button
              key={food.label}
              onClick={() => handleFoodClick(food.label)}
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1.5px solid ${isClicked ? food.c : food.border}`,
                background: food.bg,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                position: 'relative',
                opacity: isClicked ? 0.88 : 1,
                transform: isClicked ? 'scale(0.98)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}>
              {/* image */}
              <div style={{ position: 'relative', width: '100%', paddingTop: '85%', overflow: 'hidden' }}>
                <img
                  src={food.img}
                  alt={food.label}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                {/* emoji badge */}
                <div style={{
                  position: 'absolute',
                  top: 6, right: 6,
                  fontSize: '15px',
                  background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '50%',
                  width: 26, height: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  {food.emoji}
                </div>
                {/* clicked checkmark badge */}
                {isClicked && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      position: 'absolute',
                      top: 6, left: 6,
                      width: 24, height: 24,
                      background: food.c,
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    }}>
                    <i className="ti ti-check" style={{ color: '#fff', fontSize: '13px' }} />
                  </motion.div>
                )}
              </div>
              {/* label */}
              <div style={{ padding: '8px 10px 9px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: food.c, lineHeight: 1.2 }}>{food.label}</div>
                <div style={{ fontSize: '9.5px', color: '#b09aa4', marginTop: '2px', lineHeight: 1.4 }}>
                  {isClicked ? 'craved it ✓' : food.vibe}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* footer note */}
      <div style={{
        padding: '10px 12px', borderRadius: '12px',
        background: 'rgba(155,126,200,0.07)',
        border: '1px solid rgba(155,126,200,0.15)',
        fontSize: '11px', color: '#9b7ec8', lineHeight: 1.6,
        textAlign: 'center',
      }}>
        <i className="ti ti-sparkles" style={{ marginRight: '5px' }} />
        you&apos;re doing amazing — treat yourself 💜
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PeriodsPage() {
  const supabase = createClient()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [cycleProfile,   setCycleProfile]   = useState<CycleProfile | null>(null)

  const [entries,  setEntries]  = useState<Entry[]>([])
  const [sexLogs,  setSexLogs]  = useState<SexLog[]>([])
  const [painLogs, setPainLogs] = useState<PainLog[]>([])

  const [dailySymptoms,    setDailySymptoms]    = useState<DailySymptom[]>([])
  const [symptomDate,      setSymptomDate]      = useState(toYMD(new Date()))
  const [dailySelSymptoms, setDailySelSymptoms] = useState<string[]>([])
  const [dailyMood,        setDailyMood]        = useState<string | null>(null)
  const [dailyEnergy,      setDailyEnergy]      = useState<number>(3)
  const [dailyNotes,       setDailyNotes]       = useState('')
  const [savingSymptom,    setSavingSymptom]    = useState(false)
  const [successSymptom,   setSuccessSymptom]   = useState(false)

  const [editingSymptom,    setEditingSymptom]    = useState<DailySymptom | null>(null)
  const [editDSymptoms,     setEditDSymptoms]     = useState<string[]>([])
  const [editDMood,         setEditDMood]         = useState<string | null>(null)
  const [editDEnergy,       setEditDEnergy]       = useState<number>(3)
  const [editDNotes,        setEditDNotes]        = useState('')
  const [editDDate,         setEditDDate]         = useState('')
  const [savingEditSymptom, setSavingEditSymptom] = useState(false)
  const [confirmDeleteSym,  setConfirmDeleteSym]  = useState(false)

  const [activeTab, setActiveTab] = useState<'log' | 'pain' | 'symptoms' | 'sex' | 'calendar' | 'insights' | 'profile'>('log')

  const [arrivalSnoozed, setArrivalSnoozed] = useState(false)

  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
  const [selSymptoms,  setSelSymptoms]  = useState<string[]>([])
  const [selMood,      setSelMood]      = useState<string | null>(null)
  const [selCravings,  setSelCravings]  = useState<string[]>([])
  const [startDate,    setStartDate]    = useState(toYMD(new Date()))
  const [endDate,      setEndDate]      = useState('')
  const [notes,        setNotes]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [success,      setSuccess]      = useState(false)

  const [painDate,     setPainDate]     = useState(toYMD(new Date()))
  const [painType,     setPainType]     = useState<string | null>(null)
  const [painSeverity, setPainSeverity] = useState<number>(3)
  const [painDuration, setPainDuration] = useState('')
  const [painRelief,   setPainRelief]   = useState<string[]>([])
  const [painNotes,    setPainNotes]    = useState('')
  const [savingPain,   setSavingPain]   = useState(false)
  const [successPain,  setSuccessPain]  = useState(false)

  const [sexDate,      setSexDate]      = useState(toYMD(new Date()))
  const [sexProtected, setSexProtected] = useState(true)
  const [sexNotes,     setSexNotes]     = useState('')
  const [savingSex,    setSavingSex]    = useState(false)
  const [successSex,   setSuccessSex]   = useState(false)

  const [calMonth, setCalMonth] = useState(new Date())

  const [editingEntry,  setEditingEntry]  = useState<Entry | null>(null)
  const [editFlow,      setEditFlow]      = useState<Flow | null>(null)
  const [editSymptoms,  setEditSymptoms]  = useState<string[]>([])
  const [editMood,      setEditMood]      = useState<string | null>(null)
  const [editCravings,  setEditCravings]  = useState<string[]>([])
  const [editStart,     setEditStart]     = useState('')
  const [editEnd,       setEditEnd]       = useState('')
  const [editNotes,     setEditNotes]     = useState('')
  const [savingEdit,    setSavingEdit]    = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [editingPain,       setEditingPain]       = useState<PainLog | null>(null)
  const [editPainType,      setEditPainType]       = useState<string | null>(null)
  const [editPainSeverity,  setEditPainSeverity]  = useState<number>(3)
  const [editPainDuration,  setEditPainDuration]  = useState('')
  const [editPainRelief,    setEditPainRelief]    = useState<string[]>([])
  const [editPainNotes,     setEditPainNotes]     = useState('')
  const [editPainDate,      setEditPainDate]      = useState('')
  const [savingEditPain,    setSavingEditPain]    = useState(false)
  const [confirmDeletePain, setConfirmDeletePain] = useState(false)

  const [editingSex,       setEditingSex]       = useState<SexLog | null>(null)
  const [editSexDate,      setEditSexDate]      = useState('')
  const [editSexProtected, setEditSexProtected] = useState(true)
  const [editSexNotes,     setEditSexNotes]     = useState('')
  const [savingEditSex,    setSavingEditSex]    = useState(false)
  const [confirmDeleteSex, setConfirmDeleteSex] = useState(false)

  const [editingProfile,    setEditingProfile]    = useState(false)
  const [editProfile,       setEditProfile]       = useState<Partial<CycleProfile>>({})
  const [savingEditProfile, setSavingEditProfile] = useState(false)

  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    fetchEntries()
    fetchProfile()
    fetchSexLogs()
    fetchPainLogs()
    fetchDailySymptoms()
  }, [])

  // ─── Fetch functions ───────────────────────────────────────────────────────

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('cycle_profiles').select('*').single()
    if (error) {
      logSupabaseError('fetchProfile failed:', error)
      return
    }
    if (data) {
      setCycleProfile({
        ...data,
        cycle_length:       data.cycle_length ?? 28,
        period_length:      data.period_length ?? 5,
        cycle_regularity:   isValidRegularity(data.cycle_regularity) ? data.cycle_regularity : 'regular',
        has_pcos_pcod:      data.has_pcos_pcod ?? false,
        on_birth_control:   data.on_birth_control ?? false,
        trying_to_conceive: data.trying_to_conceive ?? false,
        pcos_type:          data.pcos_type as 'pcos' | 'pcod' | null,
      })
    }
  }

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('period_entries')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(12)

    if (error) {
      logSupabaseError('fetchEntries failed:', error)
      return
    }
    if (data) setEntries(data as Entry[])
  }

  const fetchSexLogs = async () => {
    const { data, error } = await supabase.from('sex_log').select('*').order('date', { ascending: false }).limit(30)
    if (error) {
      logSupabaseError('fetchSexLogs failed:', error)
      return
    }
    if (data) setSexLogs(data)
  }

  const fetchPainLogs = async () => {
    const { data, error } = await supabase.from('pain_logs').select('*').order('date', { ascending: false }).limit(30)
    if (error) {
      logSupabaseError('fetchPainLogs failed:', error)
      return
    }
    if (data) setPainLogs(data as PainLog[])
  }

  const fetchDailySymptoms = async () => {
    const { data, error } = await supabase.from('daily_symptoms').select('*').order('date', { ascending: false }).limit(30)
    if (error) {
      logSupabaseError('fetchDailySymptoms failed:', error)
      return
    }
    if (data) setDailySymptoms(data as DailySymptom[])
  }

  // ─── Daily symptom handlers ────────────────────────────────────────────────

  const handleLogDailySymptom = async () => {
    if (!dailySelSymptoms.length && !dailyMood) return
    setSavingSymptom(true)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSupabaseError('handleLogDailySymptom: no authenticated user', authError)
      setSavingSymptom(false); return
    }
    const { error } = await (supabase.from('daily_symptoms') as any).upsert(
      { user_id: user.id, date: symptomDate, symptoms: dailySelSymptoms, mood: dailyMood, energy: dailyEnergy, notes: dailyNotes.trim() || null },
      { onConflict: 'user_id,date' }
    )
    if (error) {
      logSupabaseError('handleLogDailySymptom: upsert failed:', error)
      setSavingSymptom(false)
      return
    }
    setDailySelSymptoms([]); setDailyMood(null); setDailyEnergy(3); setDailyNotes('')
    setSuccessSymptom(true)
    setTimeout(() => setSuccessSymptom(false), 3000)
    setSavingSymptom(false)
    fetchDailySymptoms()
  }

  const toggleDailySymptom = (s: string) =>
    setDailySelSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const openEditSymptom = (s: DailySymptom) => {
    setEditingSymptom(s)
    setEditDDate(s.date)
    setEditDSymptoms(s.symptoms ?? [])
    setEditDMood(s.mood ?? null)
    setEditDEnergy(s.energy ?? 3)
    setEditDNotes(s.notes ?? '')
    setConfirmDeleteSym(false)
  }
  const closeEditSymptom = () => { setEditingSymptom(null); setConfirmDeleteSym(false) }
  const toggleEditDSymptom = (s: string) =>
    setEditDSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleSaveEditSymptom = async () => {
    if (!editingSymptom) return
    setSavingEditSymptom(true)
    const { error } = await (supabase.from('daily_symptoms') as any).update({
      date: editDDate, symptoms: editDSymptoms, mood: editDMood,
      energy: editDEnergy, notes: editDNotes.trim() || null,
    }).eq('id', editingSymptom.id)
    if (error) logSupabaseError('handleSaveEditSymptom failed:', error)
    setSavingEditSymptom(false)
    closeEditSymptom()
    fetchDailySymptoms()
  }

  const handleDeleteSymptom = async () => {
    if (!editingSymptom) return
    const { error } = await (supabase.from('daily_symptoms') as any).delete().eq('id', editingSymptom.id)
    if (error) logSupabaseError('handleDeleteSymptom failed:', error)
    closeEditSymptom()
    fetchDailySymptoms()
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleOnboardingComplete = async (profile: CycleProfile) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSupabaseError('handleOnboardingComplete: no authenticated user', authError)
      return
    }
    const { error } = await (supabase as any).from('cycle_profiles').upsert({ ...profile, user_id: user.id })
    if (error) {
      logSupabaseError('handleOnboardingComplete: upsert failed:', error)
      return
    }
    setCycleProfile(profile)
    localStorage.setItem('cycle_onboarded', '1')
    setShowOnboarding(false)
  }

  const toggleSymptom = (s: string) =>
    setSelSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleCraving = (c: string) =>
    setSelCravings(prev => {
      if (c === 'none') return prev.includes('none') ? [] : ['none']
      const withoutNone = prev.filter(x => x !== 'none')
      return withoutNone.includes(c) ? withoutNone.filter(x => x !== c) : [...withoutNone, c]
    })

  const toggleRelief = (r: string) =>
    setPainRelief(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const handleLog = async () => {
    if (!selectedFlow || !startDate) return
    setSaving(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSupabaseError('handleLog: no authenticated user', authError)
      setSaving(false)
      return
    }

    const { data, error } = await supabase.from('period_entries').insert({
      user_id: user.id,
      start_date: startDate,
      end_date: endDate || null,
      flow: selectedFlow,
      symptoms: selSymptoms,
      mood: selMood,
      cravings: selCravings,
      notes: notes.trim() || null,
    }).select()

    if (error) {
      logSupabaseError('handleLog: insert failed:', error)
      setSaving(false)
      return
    }

    console.log('handleLog: inserted entry:', data)

    setSuccess(true)
    setSelectedFlow(null); setSelSymptoms([]); setSelMood(null); setSelCravings([]); setEndDate(''); setNotes('')
    setTimeout(() => setSuccess(false), 8000)
    setSaving(false)
    fetchEntries()
  }

  const handleArrivalConfirm = async (flow: Flow, date: string, symptoms: string[], mood: string | null, cravings: string[]) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSupabaseError('handleArrivalConfirm: no authenticated user', authError)
      return
    }
    const { error } = await supabase.from('period_entries').insert({
      user_id: user.id, start_date: date, end_date: null,
      flow, symptoms, mood, cravings, notes: null,
    })
    if (error) {
      logSupabaseError('handleArrivalConfirm: insert failed:', error)
      return
    }
    setArrivalSnoozed(true)
    fetchEntries()
  }

  const handleLogPain = async () => {
    if (!painType) return
    setSavingPain(true)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSupabaseError('handleLogPain: no authenticated user', authError)
      setSavingPain(false); return
    }
    const { error } = await supabase.from('pain_logs').insert({
      user_id: user.id, date: painDate, type: painType,
      severity: painSeverity,
      duration_hours: painDuration ? Number(painDuration) : null,
      relief_used: painRelief.join(', ') || null,
      notes: painNotes.trim() || null,
    })
    if (error) {
      logSupabaseError('handleLogPain: insert failed:', error)
      setSavingPain(false)
      return
    }
    setSuccessPain(true)
    setPainType(null); setPainSeverity(3); setPainDuration(''); setPainRelief([]); setPainNotes('')
    setTimeout(() => setSuccessPain(false), 3000)
    setSavingPain(false); fetchPainLogs()
  }

  const handleLogSex = async () => {
    if (savingSex) return
    setSavingSex(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { setSavingSex(false); return }
      const { error } = await supabase.from('sex_log').insert({
        user_id: user.id, date: sexDate, protected: sexProtected, notes: sexNotes.trim() || null,
      })
      if (error) { logSupabaseError('handleLogSex: insert failed:', error); setSavingSex(false); return }
      setSuccessSex(true)
      setSexNotes(''); setSexDate(toYMD(new Date()))
      setTimeout(() => setSuccessSex(false), 3000)
      fetchSexLogs()
    } catch (err) {
      logSupabaseError('Unexpected error:', err)
    } finally {
      setSavingSex(false)
    }
  }

  // ── Edit modal handlers ────────────────────────────────────────────────────

  const openEdit = (e: Entry) => {
    setEditingEntry(e)
    setEditFlow(e.flow)
    setEditSymptoms(e.symptoms ?? [])
    setEditMood(e.mood ?? null)
    setEditCravings(e.cravings ?? [])
    setEditStart(e.start_date)
    setEditEnd(e.end_date ?? '')
    setEditNotes(e.notes ?? '')
    setConfirmDelete(false)
  }

  const closeEdit = () => { setEditingEntry(null); setConfirmDelete(false) }

  const handleSaveEdit = async () => {
    if (!editingEntry || !editFlow) return
    setSavingEdit(true)
    const { error } = await supabase.from('period_entries').update({
      start_date: editStart, end_date: editEnd || null,
      flow: editFlow, symptoms: editSymptoms, mood: editMood, cravings: editCravings,
      notes: editNotes.trim() || null,
    }).eq('id', editingEntry.id)
    if (error) logSupabaseError('handleSaveEdit failed:', error)
    setSavingEdit(false)
    closeEdit()
    fetchEntries()
  }

  const handleDeleteEntry = async () => {
    if (!editingEntry) return
    const { error } = await supabase.from('period_entries').delete().eq('id', editingEntry.id)
    if (error) logSupabaseError('handleDeleteEntry failed:', error)
    closeEdit()
    fetchEntries()
  }

  const toggleEditSymptom = (s: string) =>
    setEditSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleEditCraving = (c: string) =>
    setEditCravings(prev => {
      if (c === 'none') return prev.includes('none') ? [] : ['none']
      const withoutNone = prev.filter(x => x !== 'none')
      return withoutNone.includes(c) ? withoutNone.filter(x => x !== c) : [...withoutNone, c]
    })

  const openEditPain = (p: PainLog) => {
    setEditingPain(p)
    setEditPainType(p.type)
    setEditPainSeverity(p.severity)
    setEditPainDuration(p.duration_hours ? String(p.duration_hours) : '')
    setEditPainRelief(p.relief_used ? p.relief_used.split(', ').filter(Boolean) : [])
    setEditPainNotes(p.notes ?? '')
    setEditPainDate(p.date)
    setConfirmDeletePain(false)
  }
  const closeEditPain = () => { setEditingPain(null); setConfirmDeletePain(false) }
  const toggleEditPainRelief = (r: string) =>
    setEditPainRelief(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const handleSaveEditPain = async () => {
    if (!editingPain || !editPainType) return
    setSavingEditPain(true)
    const { error } = await supabase.from('pain_logs').update({
      date: editPainDate, type: editPainType, severity: editPainSeverity,
      duration_hours: editPainDuration ? Number(editPainDuration) : null,
      relief_used: editPainRelief.join(', ') || null,
      notes: editPainNotes.trim() || null,
    }).eq('id', editingPain.id)
    if (error) logSupabaseError('handleSaveEditPain failed:', error)
    setSavingEditPain(false)
    closeEditPain()
    fetchPainLogs()
  }
  const handleDeletePain = async () => {
    if (!editingPain) return
    const { error } = await supabase.from('pain_logs').delete().eq('id', editingPain.id)
    if (error) logSupabaseError('handleDeletePain failed:', error)
    closeEditPain()
    fetchPainLogs()
  }

  const openEditSex = (s: SexLog) => {
    setEditingSex(s)
    setEditSexDate(s.date)
    setEditSexProtected(s.protected ?? true)
    setEditSexNotes(s.notes ?? '')
    setConfirmDeleteSex(false)
  }
  const closeEditSex = () => { setEditingSex(null); setConfirmDeleteSex(false) }

  const handleSaveEditSex = async () => {
    if (!editingSex) return
    setSavingEditSex(true)
    const { error } = await supabase.from('sex_log').update({
      date: editSexDate, protected: editSexProtected,
      notes: editSexNotes.trim() || null,
    }).eq('id', editingSex.id)
    if (error) logSupabaseError('handleSaveEditSex failed:', error)
    setSavingEditSex(false)
    closeEditSex()
    fetchSexLogs()
  }
  const handleDeleteSex = async () => {
    if (!editingSex) return
    const { error } = await supabase.from('sex_log').delete().eq('id', editingSex.id)
    if (error) logSupabaseError('handleDeleteSex failed:', error)
    closeEditSex()
    fetchSexLogs()
  }

  const openEditProfile = () => {
    setEditProfile({ ...cycleProfile })
    setEditingProfile(true)
  }
  const closeEditProfile = () => setEditingProfile(false)
  const updateEditProfile = (k: keyof CycleProfile, v: any) =>
    setEditProfile(p => ({ ...p, [k]: v }))

  const handleSaveEditProfile = async () => {
    if (!editProfile) return
    setSavingEditProfile(true)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSupabaseError('handleSaveEditProfile: no authenticated user', authError)
      setSavingEditProfile(false); return
    }
    const { error } = await (supabase as any).from('cycle_profiles').upsert({ ...editProfile, user_id: user.id })
    if (error) {
      logSupabaseError('handleSaveEditProfile: upsert failed:', error)
      setSavingEditProfile(false)
      return
    }
    setCycleProfile(editProfile as CycleProfile)
    setSavingEditProfile(false)
    closeEditProfile()
  }

  // ─── Derived stats ─────────────────────────────────────────────────────────

  const lastEntry = entries[0] ?? null
  const lastStart = lastEntry
    ? parseYMD(lastEntry.start_date)
    : cycleProfile?.last_period_date ? parseYMD(cycleProfile.last_period_date) : null

  const avgCycle = cycleProfile?.cycle_length ?? (() => {
    if (entries.length < 2) return 28
    const gaps: number[] = []
    for (let i = 0; i < entries.length - 1; i++)
      gaps.push(diffDays(parseYMD(entries[i + 1].start_date), parseYMD(entries[i].start_date)))
    return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
  })()

  const avgPeriod = cycleProfile?.period_length ?? (() => {
    const withEnd = entries.filter(e => e.end_date)
    if (!withEnd.length) return 5
    return Math.round(withEnd.reduce((a, e) => a + diffDays(parseYMD(e.start_date), parseYMD(e.end_date!)) + 1, 0) / withEnd.length)
  })()

  const nextPredicted = lastStart ? addDays(lastStart, avgCycle) : null
  const daysUntilNext = nextPredicted ? diffDays(new Date(), nextPredicted) : null
  const { phase, day: phaseDay, tip } = getPhase(lastStart, avgCycle, cycleProfile)
  const pc = phaseConfig[phase]

  // ─── Calendar helpers ──────────────────────────────────────────────────────

  const calYear   = calMonth.getFullYear()
  const calMon    = calMonth.getMonth()
  const firstDay  = new Date(calYear, calMon, 1).getDay()
  const daysInMon = new Date(calYear, calMon + 1, 0).getDate()
  const todayStr  = toYMD(new Date())

  const periodDates      = new Set<string>()
  const periodStartDates = new Set<string>()
  const periodEndDates   = new Set<string>()
  entries.forEach(e => {
    periodStartDates.add(e.start_date)
    const s = parseYMD(e.start_date)
    const end = e.end_date ? parseYMD(e.end_date) : addDays(s, avgPeriod - 1)
    for (let d = new Date(s); d <= end; d = addDays(d, 1)) periodDates.add(toYMD(d))
    if (e.end_date) periodEndDates.add(e.end_date)
  })

  const predictedDates = new Set<string>()
  if (nextPredicted && daysUntilNext !== null && daysUntilNext >= 0) {
    for (let i = 0; i < avgPeriod; i++) predictedDates.add(toYMD(addDays(nextPredicted, i)))
  }

  const ovulationDates = new Set<string>()
  if (lastStart) {
    const ov = addDays(lastStart, avgCycle - 14)
    for (let i = -1; i <= 1; i++) ovulationDates.add(toYMD(addDays(ov, i)))
  }

  const sexDateSet  = new Set(sexLogs.map(s => s.date))
  const painDateSet = new Set(painLogs.map(p => p.date))

  // ─── UI config ────────────────────────────────────────────────────────────

  const tabs = [
    { key: 'log'      as const, label: 'period',   icon: 'ti-droplet' },
    { key: 'pain'     as const, label: 'pain',      icon: 'ti-bolt' },
    { key: 'sex'      as const, label: 'intimacy',  icon: 'ti-heart' },
    { key: 'calendar' as const, label: 'calendar',  icon: 'ti-calendar-heart' },
    { key: 'insights' as const, label: 'insights',  icon: 'ti-chart-bar' },
    { key: 'profile'  as const, label: 'profile',   icon: 'ti-settings' },
    { key: 'symptoms' as const, label: 'symptoms',  icon: 'ti-stethoscope' },
  ]

  const tabColors: Record<string, { bg: string; border: string; color: string }> = {
    log:      { bg: '#fde8ee', border: '#e8a0b0', color: '#7a1a35' },
    pain:     { bg: '#fef8e7', border: '#f5ddb4', color: '#5a3a00' },
    sex:      { bg: '#edf6ee', border: '#a8c9ae', color: '#1a4a22' },
    calendar: { bg: '#f3edfb', border: '#c9b8e8', color: '#4a2a80' },
    insights: { bg: '#e8f4fd', border: '#b8d8f5', color: '#1a4a7a' },
    profile:  { bg: '#f5f0f2', border: '#d0bcc8', color: '#3d2a35' },
    symptoms: { bg: '#f3edfb', border: '#c9b8e8', color: '#4a2a80' },
  }

  const statCards = [
    { label: 'cycle length',  value: `${avgCycle}d`,  c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.18)', dotC: '#e8a0b0', icon: 'ti-rotate-clockwise' },
    { label: 'period length', value: `${avgPeriod}d`, c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(201,184,232,0.25)', dotC: '#c9b8e8', icon: 'ti-calendar' },
    { label: 'next period',   value: daysUntilNext !== null ? (daysUntilNext === 0 ? 'today' : daysUntilNext > 0 ? `in ${daysUntilNext}d` : `${Math.abs(daysUntilNext)}d late`) : '—', c: daysUntilNext !== null && daysUntilNext < 0 ? '#8b1a35' : '#b8860b', bg: daysUntilNext !== null && daysUntilNext < 0 ? '#fde0e7' : '#fef8e7', border: 'rgba(245,221,180,0.35)', dotC: '#f5ddb4', icon: 'ti-clock' },
    { label: 'logged cycles', value: String(entries.length), c: '#5a8c63', bg: '#edf6ee', border: 'rgba(168,201,174,0.3)', dotC: '#a8c9ae', icon: 'ti-history' },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <div className={styles.pt}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44 }}>
          <p className={styles['pt-eyebrow']}>
            <i className="ti ti-calendar-heart" style={{ color: '#e8a0b0' }} />
            cycle tracker
          </p>
          <h1 className={styles['pt-h1']}>
            your <span className={styles.accent}>cycle,</span><br />your rhythm
          </h1>
          <p className={styles['pt-sub']}>track, understand, and bloom with your body</p>

          {cycleProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {cycleProfile.has_pcos_pcod && (
                <span className={styles['pt-pcos-badge']}>
                  <i className="ti ti-ribbon" /> {cycleProfile.pcos_type?.toUpperCase() ?? 'PCOS/PCOD'}
                </span>
              )}
              {cycleProfile.cycle_regularity !== 'regular' && (
                <span className={styles['pt-pcos-badge']} style={{ background: '#fef8e7', color: '#b8860b', borderColor: 'rgba(184,134,11,0.25)' }}>
                  <i className="ti ti-activity" /> {cycleProfile.cycle_regularity?.replace('_', ' ')}
                </span>
              )}
              {cycleProfile.trying_to_conceive && (
                <span className={styles['pt-pcos-badge']} style={{ background: '#edf6ee', color: '#5a8c63', borderColor: 'rgba(90,140,99,0.25)' }}>
                  <i className="ti ti-heart" /> TTC mode
                </span>
              )}
              <button className={styles['pt-profile-pill']} onClick={() => setActiveTab('profile')}>
                <i className="ti ti-settings" style={{ color: '#d4607a' }} />
                edit profile
              </button>
              <button onClick={() => setShareOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #ff3d8b, #ff6bb5)',
                border: 'none', borderRadius: '50px',
                padding: '7px 16px', fontSize: '12px', fontWeight: 500,
                color: 'white', cursor: 'pointer', letterSpacing: '0.03em',
                boxShadow: '0 4px 16px rgba(255, 61, 139, 0.35)',
              }}>
                <span>🔗</span>share
              </button>
            </div>
          )}
        </motion.div>

        {/* Period Arrival Banner */}
        <AnimatePresence>
          {lastStart && (
            <PeriodArrivalBanner
              daysUntilNext={daysUntilNext}
              predictedDate={nextPredicted}
              onConfirm={handleArrivalConfirm}
              onSnooze={() => setArrivalSnoozed(true)}
              snoozed={arrivalSnoozed}
            />
          )}
        </AnimatePresence>

        {/* Phase banner */}
        <motion.div className={styles['pt-phase']}
          style={{ background: pc.bg, border: `1px solid ${pc.border}` }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className={styles['pt-phase-ico']} style={{ background: pc.icoBg }}>
            <i className={`ti ${pc.ico}`} style={{ color: pc.c }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles['pt-phase-name']} style={{ color: pc.c }}>{pc.label}</div>
            <div className={styles['pt-phase-sub']} style={{ color: pc.c }}>
              {phase !== 'unknown' ? `day ${phaseDay} of your cycle · ` : ''}{tip}
            </div>
          </div>
          {phase !== 'unknown' && (
            <div style={{ flexShrink: 0 }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke={pc.c} strokeOpacity="0.15" strokeWidth="4" />
                <circle cx="26" cy="26" r="22" fill="none" stroke={pc.c} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - phaseDay / avgCycle)}`}
                  transform="rotate(-90 26 26)" />
                <text x="26" y="30" textAnchor="middle" fontSize="13"
                  fontFamily="Fraunces,serif" fontWeight="300" fill={pc.c}>{phaseDay}</text>
              </svg>
            </div>
          )}
        </motion.div>

        {/* Phase timeline */}
        {phase !== 'unknown' && (() => {
          const periodLen = cycleProfile?.period_length ?? avgPeriod
          const phases = [
            { key: 'menstrual'  as Phase, label: 'menstrual',  startDay: 1,             endDay: periodLen,     icon: 'ti-droplet'  },
            { key: 'follicular' as Phase, label: 'follicular', startDay: periodLen + 1, endDay: avgCycle - 15, icon: 'ti-leaf'     },
            { key: 'ovulation'  as Phase, label: 'ovulation',  startDay: avgCycle - 14, endDay: avgCycle - 12, icon: 'ti-sparkles' },
            { key: 'luteal'     as Phase, label: 'luteal',     startDay: avgCycle - 11, endDay: avgCycle,      icon: 'ti-moon'     },
          ]
          return (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '4px' }}>
              {phases.map(ph => {
                const cfg2 = phaseConfig[ph.key]
                const isActive = phase === ph.key
                const daysUntilStart = ph.startDay - phaseDay
                const daysUntilEnd   = ph.endDay   - phaseDay
                const label = isActive
                  ? daysUntilEnd === 0 ? 'ends today' : `${daysUntilEnd}d left`
                  : daysUntilStart <= 0 ? 'passed'
                  : `in ${daysUntilStart}d`
                const isPast = !isActive && daysUntilStart <= 0
                return (
                  <div key={ph.key} style={{
                    padding: '10px 10px 8px', borderRadius: '14px',
                    background: isActive ? cfg2.bg : 'rgba(255,255,255,0.5)',
                    border: `1.5px solid ${isActive ? cfg2.border : 'rgba(212,96,122,0.08)'}`,
                    opacity: isPast ? 0.45 : 1,
                    display: 'flex', flexDirection: 'column', gap: '5px', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className={`ti ${ph.icon}`} style={{ fontSize: '12px', color: isActive ? cfg2.c : '#b09aa4' }} />
                      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: isActive ? cfg2.c : '#b09aa4' }}>{ph.label}</span>
                    </div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 300, color: isActive ? cfg2.c : isPast ? '#b09aa4' : '#7a5c68', lineHeight: 1 }}>
                      {isActive ? '● now' : label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#b09aa4' }}>day {ph.startDay}–{ph.endDay}</div>
                  </div>
                )
              })}
            </motion.div>
          )
        })()}

        {/* Stats */}
        <div className={styles['pt-stats']}>
          {statCards.map((s, i) => (
            <motion.div key={s.label} className={styles['pt-stat']}
              style={{ background: s.bg, border: `1px solid ${s.border}`, ['--dot-c' as string]: s.dotC }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}>
              <i className={`ti ${s.icon} ${styles['pt-stat-ico']}`} style={{ color: s.c }} />
              <div className={styles['pt-stat-val']} style={{ color: s.c }}>{s.value}</div>
              <div className={styles['pt-stat-lbl']} style={{ color: s.c }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className={styles['pt-divider']}>
          <div className={styles['pt-divider-line']} />
          <i className={`ti ti-circle ${styles['pt-divider-ico']}`} />
          <span className={styles['pt-divider-label']}>your cycle dashboard</span>
          <i className={`ti ti-circle ${styles['pt-divider-ico']}`} />
          <div className={styles['pt-divider-line']} />
        </div>

        {/* Tabs */}
        <div className={styles['pt-tabs']}>
          {tabs.map(t => {
            const active = activeTab === t.key
            const cfg = tabColors[t.key]
            return (
              <button key={t.key} className={styles['pt-tab']}
                onClick={() => setActiveTab(t.key)}
                style={{
                  background: active ? cfg.bg : 'var(--card)',
                  borderColor: active ? cfg.border : 'rgba(212,96,122,0.12)',
                  color: active ? cfg.color : '#b09aa4',
                }}>
                <i className={`ti ${t.icon}`} />
                {t.label}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ── LOG PERIOD ── */}
          {activeTab === 'log' && (
            <motion.div key="log" className={styles['pt-grid']}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-calendar" /> dates</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <p className={styles['pt-input-lbl']}><i className="ti ti-circle-dot" /> start</p>
                      <input type="date" className={styles['pt-input']} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <p className={styles['pt-input-lbl']}><i className="ti ti-circle-check" /> end (opt.)</p>
                      <input type="date" className={styles['pt-input']} value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-droplet" /> flow intensity</p>
                  <div className={styles['pt-flow-grid']}>
                    {flows.map(f => {
                      const active = selectedFlow === f.key
                      return (
                        <button key={f.key} className={styles['pt-flow-btn']}
                          onClick={() => setSelectedFlow(active ? null : f.key)}
                          style={{
                            background: active ? f.bg : 'transparent',
                            borderColor: active ? f.border : 'rgba(212,96,122,0.12)',
                            color: active ? f.c : '#b09aa4',
                          }}>
                          <i className="ti ti-droplet" style={{ color: active ? f.c : '#b09aa4' }} />
                          {f.label}
                          <div className={styles['pt-flow-dots']}>
                            {f.key === 'spotting'
                              ? <div className={styles['pt-flow-dot']} style={{ background: 'rgba(0,0,0,0.15)', width: '3px', height: '3px' }} />
                              : [...Array(4)].map((_, i) => (
                                <div key={i} className={styles['pt-flow-dot']}
                                  style={{ background: i < f.dots ? f.c : 'rgba(0,0,0,0.08)' }} />
                              ))
                            }
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-pencil" /> notes</p>
                  <textarea className={styles['pt-input']} value={notes} rows={3}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="anything on your mind..."
                    style={{ resize: 'none' }} />
                  <button className={styles['pt-submit']} onClick={handleLog}
                    disabled={!selectedFlow || !startDate || saving}
                    style={{
                      background: selectedFlow ? 'linear-gradient(135deg, #d4607a, #9b7ec8)' : 'rgba(212,96,122,0.08)',
                      color: selectedFlow ? '#fff' : '#b09aa4',
                    }}>
                    {saving ? 'saving...' : success ? 'logged, lovely 🌸' : selectedFlow ? 'log this cycle' : 'pick a flow first'}
                  </button>

                  {/* ── SUCCESS: toast + cravings card ── */}
                  <AnimatePresence>
                    {success && (
                      <>
                        <motion.div className={styles['pt-toast']}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ background: '#edf6ee', border: '1px solid #a8c9ae', color: '#2a5c33' }}>
                          your cycle has been logged 🌸
                        </motion.div>
                        <PeriodCravingsCard />
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-stethoscope" /> symptoms</p>
                  <div className={styles['pt-chips']}>
                    {symptomList.map(s => {
                      const active = selSymptoms.includes(s.label)
                      return (
                        <button key={s.label} className={styles['pt-chip']}
                          onClick={() => toggleSymptom(s.label)}
                          style={{
                            background: active ? '#fde8ee' : 'transparent',
                            borderColor: active ? '#e8a0b0' : 'rgba(212,96,122,0.15)',
                            color: active ? '#7a1a35' : '#b09aa4',
                          }}>
                          <i className={`ti ${s.icon}`} style={{ color: active ? '#d4607a' : '#b09aa4' }} />
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-cookie" /> any cravings?</p>
                  <div className={styles['pt-chips']}>
                    {cravingOpts.map(c => {
                      const active = selCravings.includes(c.label)
                      return (
                        <button key={c.label} className={styles['pt-chip']}
                          onClick={() => toggleCraving(c.label)}
                          style={{
                            background: active ? '#fef8e7' : 'transparent',
                            borderColor: active ? '#f5ddb4' : 'rgba(212,96,122,0.15)',
                            color: active ? c.c : '#b09aa4',
                          }}>
                          <i className={`ti ${c.icon}`} style={{ color: active ? c.c : '#b09aa4' }} />
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-mood-smile" /> how are you feeling?</p>
                  <div className={styles['pt-mood-row']}>
                    {moodOpts.map(m => {
                      const active = selMood === m.label
                      return (
                        <button key={m.label} className={styles['pt-mood-btn']}
                          onClick={() => setSelMood(active ? null : m.label)}
                          style={{
                            background: active ? '#fde8ee' : 'transparent',
                            borderColor: active ? '#e8a0b0' : 'rgba(212,96,122,0.15)',
                            color: active ? m.c : '#b09aa4',
                          }}>
                          <i className={`ti ${m.icon}`} style={{ color: active ? m.c : '#b09aa4' }} />
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className={styles['pt-card']} style={{ flex: 1 }}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-history" /> recent cycles</p>
                  {entries.length === 0 ? (
                    <div className={styles['pt-empty']}><i className="ti ti-calendar-heart" />no cycles logged yet, darling</div>
                  ) : (
                    <div className={styles['pt-history']}>
                      {entries.slice(0, 4).map((e, i) => {
                        const dur = e.end_date ? diffDays(parseYMD(e.start_date), parseYMD(e.end_date)) + 1 : null
                        const f = flows.find(x => x.key === e.flow)!
                        return (
                          <motion.div key={e.id} className={styles['pt-hitem']}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}>
                            <div className={styles['pt-hitem-ico']} style={{ background: f.bg }}>
                              <i className="ti ti-droplet" style={{ color: f.c }} />
                            </div>
                            <div>
                              <div className={styles['pt-hitem-name']}>
                                {parseYMD(e.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {e.end_date && ` → ${parseYMD(e.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                              </div>
                              <div className={styles['pt-hitem-sub']}>
                                {f.label} flow{e.symptoms?.length > 0 && ` · ${e.symptoms.slice(0, 2).join(', ')}`}
                              </div>
                            </div>
                            <div className={styles['pt-hitem-right']}>
                              {dur
                                ? <><div className={styles['pt-hitem-days']}>{dur}</div><div className={styles['pt-hitem-days-lbl']}>days</div></>
                                : <div style={{ fontSize: '11px', color: '#b09aa4', fontStyle: 'italic' }}>ongoing</div>
                              }
                            </div>
                            <button onClick={() => openEdit(e)}
                              style={{
                                width: 30, height: 30, borderRadius: '50%',
                                border: '1.5px solid rgba(212,96,122,0.18)',
                                background: '#fdf8fa', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, color: '#d4607a', flexShrink: 0, transition: 'all 0.18s ease',
                              }}
                              onMouseEnter={e2 => (e2.currentTarget.style.background = '#fde8ee')}
                              onMouseLeave={e2 => (e2.currentTarget.style.background = '#fdf8fa')}>
                              <i className="ti ti-pencil" />
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PAIN LOG ── */}
          {activeTab === 'pain' && (
            <motion.div key="pain" className={styles['pt-grid']}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-bolt" style={{ color: '#b8860b' }} /> log pain or discomfort</p>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-calendar" /> date</div>
                  <input type="date" className={styles['pt-input']} value={painDate} onChange={e => setPainDate(e.target.value)} />

                  <div className={styles['pt-input-lbl']} style={{ marginTop: '4px' }}><i className="ti ti-stethoscope" /> type of pain</div>
                  <div className={styles['pt-pain-type-grid']}>
                    {painTypes.map(pt => {
                      const active = painType === pt.key
                      return (
                        <button key={pt.key} className={styles['pt-pain-type-btn']}
                          onClick={() => setPainType(active ? null : pt.key)}
                          style={{
                            background: active ? pt.bg : 'transparent',
                            borderColor: active ? pt.c : 'rgba(212,96,122,0.12)',
                            color: active ? pt.c : '#b09aa4',
                          }}>
                          <i className={`ti ${pt.icon}`} style={{ color: active ? pt.c : '#b09aa4' }} />
                          {pt.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-chart-bar" /> severity (1 = mild, 5 = severe)</div>
                  <div className={styles['pt-severity']}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} className={`${styles['pt-sev-btn']} ${painSeverity >= n ? styles.active : ''}`}
                        onClick={() => setPainSeverity(n)}
                        style={{
                          background: painSeverity >= n ? `hsl(${340 - n * 18},${60 + n * 6}%,${60 - n * 4}%)` : 'transparent',
                          borderColor: painSeverity >= n ? 'transparent' : 'rgba(212,96,122,0.15)',
                        }}>
                        {n}
                      </button>
                    ))}
                    <span style={{ fontSize: '11px', color: '#b09aa4', marginLeft: '4px' }}>
                      {['', 'mild', 'moderate', 'notable', 'strong', 'severe'][painSeverity]}
                    </span>
                  </div>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-clock" /> duration (hours, optional)</div>
                  <input type="number" className={styles['pt-input']} placeholder="e.g. 2"
                    value={painDuration} onChange={e => setPainDuration(e.target.value)} />

                  <div className={styles['pt-input-lbl']}><i className="ti ti-first-aid-kit" /> relief used</div>
                  <div className={styles['pt-chips']} style={{ marginBottom: '12px' }}>
                    {reliefOptions.map(r => {
                      const active = painRelief.includes(r)
                      return (
                        <button key={r} className={styles['pt-chip']}
                          onClick={() => toggleRelief(r)}
                          style={{
                            background: active ? '#fef8e7' : 'transparent',
                            borderColor: active ? '#f5ddb4' : 'rgba(212,96,122,0.15)',
                            color: active ? '#5a3a00' : '#b09aa4',
                          }}>
                          {r}
                        </button>
                      )
                    })}
                  </div>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes</div>
                  <textarea className={styles['pt-input']} value={painNotes} rows={2}
                    onChange={e => setPainNotes(e.target.value)}
                    placeholder="describe how you feel..." style={{ resize: 'none' }} />

                  <button className={styles['pt-submit']} onClick={handleLogPain}
                    disabled={!painType || savingPain}
                    style={{
                      background: painType ? 'linear-gradient(135deg, #b8860b, #d4607a)' : 'rgba(212,96,122,0.08)',
                      color: painType ? '#fff' : '#b09aa4',
                    }}>
                    {savingPain ? 'saving...' : successPain ? 'logged 🌿' : painType ? 'log this pain' : 'pick a pain type first'}
                  </button>
                  <AnimatePresence>
                    {successPain && (
                      <motion.div className={styles['pt-toast']}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: '#fef8e7', border: '1px solid #f5ddb4', color: '#5a3a00' }}>
                        pain logged — rest up 🌿
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className={styles['pt-card']}>
                <p className={styles['pt-card-lbl']}><i className="ti ti-history" style={{ color: '#b8860b' }} /> pain history</p>
                {painLogs.length === 0 ? (
                  <div className={styles['pt-empty']}><i className="ti ti-heart" />no pain logged yet — great!</div>
                ) : (
                  <div className={styles['pt-history']}>
                    {painLogs.slice(0, 8).map((p, i) => {
                      const pt2 = painTypes.find(x => x.key === p.type)!
                      return (
                        <motion.div key={p.id} className={styles['pt-hitem']}
                          style={{ background: `${pt2?.bg}88`, borderColor: `${pt2?.c}22` }}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}>
                          <div className={styles['pt-hitem-ico']} style={{ background: pt2?.bg }}>
                            <i className={`ti ${pt2?.icon}`} style={{ color: pt2?.c }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className={styles['pt-hitem-name']}>{pt2?.label}</div>
                            <div className={styles['pt-hitem-sub']}>
                              {parseYMD(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              {p.relief_used && ` · ${p.relief_used}`}
                            </div>
                          </div>
                          <div className={styles['pt-hitem-right']}>
                            <div className={styles['pt-hitem-days']} style={{ color: pt2?.c }}>{p.severity}/5</div>
                            <div className={styles['pt-hitem-days-lbl']}>severity</div>
                          </div>
                          <button onClick={() => openEditPain(p)}
                            style={{
                              width: 30, height: 30, borderRadius: '50%',
                              border: '1.5px solid rgba(184,134,11,0.2)',
                              background: '#fefdf8', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, color: '#b8860b', flexShrink: 0, transition: 'all 0.18s ease',
                            }}
                            onMouseEnter={e2 => (e2.currentTarget.style.background = '#fef8e7')}
                            onMouseLeave={e2 => (e2.currentTarget.style.background = '#fefdf8')}>
                            <i className="ti ti-pencil" />
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── DAILY SYMPTOMS ── */}
          {activeTab === 'symptoms' && (
            <motion.div key="symptoms" className={styles['pt-grid']}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-stethoscope" style={{ color: '#9b7ec8' }} /> log today&apos;s symptoms</p>
                  <p style={{ fontSize: '12px', color: '#b09aa4', marginBottom: '16px', lineHeight: 1.5 }}>
                    Track how your body feels each day — unlinked from your period. Spot patterns over time.
                  </p>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-calendar" /> date</div>
                  <input type="date" className={styles['pt-input']} value={symptomDate}
                    onChange={e => setSymptomDate(e.target.value)} />

                  <div className={styles['pt-input-lbl']} style={{ marginTop: '4px' }}><i className="ti ti-bolt" /> symptoms</div>
                  <div className={styles['pt-chips']} style={{ marginBottom: '14px' }}>
                    {symptomList.map(s => {
                      const active = dailySelSymptoms.includes(s.label)
                      return (
                        <button key={s.label} className={styles['pt-chip']}
                          onClick={() => toggleDailySymptom(s.label)}
                          style={{
                            background: active ? '#f3edfb' : 'transparent',
                            borderColor: active ? '#c9b8e8' : 'rgba(155,126,200,0.2)',
                            color: active ? '#4a2a80' : '#b09aa4',
                          }}>
                          <i className={`ti ${s.icon}`} style={{ color: active ? '#9b7ec8' : '#b09aa4' }} />
                          {s.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-mood-smile" /> mood</div>
                  <div className={styles['pt-mood-row']} style={{ marginBottom: '14px' }}>
                    {moodOpts.map(m => {
                      const active = dailyMood === m.label
                      return (
                        <button key={m.label} className={styles['pt-mood-btn']}
                          onClick={() => setDailyMood(active ? null : m.label)}
                          style={{
                            background: active ? '#f3edfb' : 'transparent',
                            borderColor: active ? '#c9b8e8' : 'rgba(155,126,200,0.15)',
                            color: active ? m.c : '#b09aa4',
                          }}>
                          <i className={`ti ${m.icon}`} style={{ color: active ? m.c : '#b09aa4' }} />
                          {m.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-battery" /> energy level</div>
                  <div className={styles['pt-severity']} style={{ marginBottom: '14px' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setDailyEnergy(n)}
                        style={{
                          width: 36, height: 36, borderRadius: '10px', border: 'none',
                          cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                          background: dailyEnergy >= n ? `hsl(${140 + n * 15}, ${50 + n * 5}%, ${55 - n * 3}%)` : 'transparent',
                          color: dailyEnergy >= n ? '#fff' : '#b09aa4',
                          outline: dailyEnergy >= n ? 'none' : '1.5px solid rgba(155,126,200,0.2)',
                          transition: 'all 0.15s',
                        }}>
                        {n}
                      </button>
                    ))}
                    <span style={{ fontSize: '11px', color: '#b09aa4', marginLeft: '4px' }}>
                      {['','very low','low','okay','good','great'][dailyEnergy]}
                    </span>
                  </div>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes</div>
                  <textarea className={styles['pt-input']} value={dailyNotes} rows={2}
                    onChange={e => setDailyNotes(e.target.value)}
                    placeholder="anything on your mind..." style={{ resize: 'none' }} />

                  <button className={styles['pt-submit']} onClick={handleLogDailySymptom}
                    disabled={(!dailySelSymptoms.length && !dailyMood) || savingSymptom}
                    style={{
                      background: (dailySelSymptoms.length || dailyMood)
                        ? 'linear-gradient(135deg, #9b7ec8, #d4607a)'
                        : 'rgba(155,126,200,0.08)',
                      color: (dailySelSymptoms.length || dailyMood) ? '#fff' : '#b09aa4',
                    }}>
                    {savingSymptom ? 'saving...' : successSymptom ? 'logged 💜' : 'log symptoms'}
                  </button>
                  <AnimatePresence>
                    {successSymptom && (
                      <motion.div className={styles['pt-toast']}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: '#f3edfb', border: '1px solid #c9b8e8', color: '#4a2a80' }}>
                        symptoms logged — your body is being heard 💜
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className={styles['pt-card']}>
                <p className={styles['pt-card-lbl']}><i className="ti ti-history" style={{ color: '#9b7ec8' }} /> symptom history</p>
                {dailySymptoms.length === 0 ? (
                  <div className={styles['pt-empty']}><i className="ti ti-stethoscope" />no symptoms logged yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {dailySymptoms.map((s, i) => (
                      <motion.div key={s.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          padding: '10px 12px', borderRadius: '13px',
                          background: 'rgba(155,126,200,0.05)',
                          border: '1px solid rgba(155,126,200,0.12)',
                        }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
                          background: '#f3edfb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="ti ti-stethoscope" style={{ fontSize: '15px', color: '#9b7ec8' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#4a2a80', marginBottom: '3px' }}>
                            {parseYMD(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {s.mood && <span style={{ marginLeft: '8px', color: '#9b7ec8', fontWeight: 400, fontStyle: 'italic' }}>· {s.mood}</span>}
                            {s.energy && <span style={{ marginLeft: '8px', color: '#b09aa4', fontWeight: 400 }}>· energy {s.energy}/5</span>}
                          </div>
                          {s.symptoms?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: s.notes ? '4px' : 0 }}>
                              {s.symptoms.map(sym => (
                                <span key={sym} style={{
                                  padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600,
                                  background: 'rgba(155,126,200,0.1)', color: '#9b7ec8',
                                  border: '1px solid rgba(155,126,200,0.2)',
                                }}>{sym}</span>
                              ))}
                            </div>
                          )}
                          {s.notes && (
                            <div style={{ fontSize: '11px', color: '#b09aa4', fontStyle: 'italic', marginTop: '3px' }}>{s.notes}</div>
                          )}
                        </div>
                        <button onClick={() => openEditSymptom(s)}
                          style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                            border: '1.5px solid rgba(155,126,200,0.2)',
                            background: '#faf8fe', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: '#9b7ec8', transition: 'all 0.18s ease',
                          }}
                          onMouseEnter={e2 => (e2.currentTarget.style.background = '#f3edfb')}
                          onMouseLeave={e2 => (e2.currentTarget.style.background = '#faf8fe')}>
                          <i className="ti ti-pencil" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SEX LOG ── */}
          {activeTab === 'sex' && (
            <motion.div key="sex" className={styles['pt-grid']}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-heart" style={{ color: '#5a8c63' }} /> log intimacy</p>
                  <p style={{ fontSize: '12px', color: '#b09aa4', marginBottom: '16px', lineHeight: 1.5 }}>
                    Tracking intimacy helps correlate with cycle phases, pain patterns, and fertility windows. Completely private.
                  </p>

                  <div className={styles['pt-input-lbl']}><i className="ti ti-calendar" /> date</div>
                  <input type="date" className={styles['pt-input']} value={sexDate} onChange={e => setSexDate(e.target.value)} />

                  <div className={styles['pt-toggle-row']}>
                    <span className={styles['pt-toggle-lbl']}>
                      <i className="ti ti-shield-check" style={{ color: '#5a8c63' }} />protected?
                    </span>
                    <button className={`${styles['pt-toggle']} ${sexProtected ? styles.on : styles.off}`}
                      style={{ background: sexProtected ? '#5a8c63' : undefined }}
                      onClick={() => setSexProtected(p => !p)} />
                  </div>

                  {cycleProfile?.trying_to_conceive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{
                        padding: '12px 14px', borderRadius: '12px', marginBottom: '10px',
                        background: 'rgba(155,126,200,0.08)', border: '1px solid rgba(155,126,200,0.2)',
                        fontSize: '12px', color: '#9b7ec8', lineHeight: 1.5,
                      }}>
                      <i className="ti ti-sparkles" style={{ marginRight: '6px' }} />
                      TTC tip: {
                        phase === 'ovulation'  ? "You're in your fertile window — best timing!"
                        : phase === 'follicular' ? 'Approaching fertile window — good timing.'
                        : 'Ovulation window is in a few days.'
                      }
                    </motion.div>
                  )}

                  <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes (optional)</div>
                  <textarea className={styles['pt-input']} value={sexNotes} rows={2}
                    onChange={e => setSexNotes(e.target.value)}
                    placeholder="e.g. pain, discomfort, notes..." style={{ resize: 'none' }} />

                  <button className={styles['pt-submit']} onClick={handleLogSex} disabled={savingSex}
                    style={{ background: 'linear-gradient(135deg, #5a8c63, #9b7ec8)', color: '#fff' }}>
                    {savingSex ? 'saving...' : successSex ? 'logged 💚' : 'log intimacy'}
                  </button>
                  <AnimatePresence>
                    {successSex && (
                      <motion.div className={styles['pt-toast']}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: '#edf6ee', border: '1px solid #a8c9ae', color: '#1a4a22' }}>
                        logged 💚
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className={styles['pt-card']}>
                <p className={styles['pt-card-lbl']}><i className="ti ti-history" style={{ color: '#5a8c63' }} /> intimacy log</p>
                {sexLogs.length === 0 ? (
                  <div className={styles['pt-empty']}><i className="ti ti-heart" />no entries yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {sexLogs.slice(0, 10).map((s, i) => (
                      <motion.div key={s.id} className={styles['pt-sex-row']}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}>
                        <div className={styles['pt-sex-ico']}><i className="ti ti-heart" /></div>
                        <div>
                          <div className={styles['pt-sex-date']}>
                            {parseYMD(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {s.notes && <div className={styles['pt-sex-sub']}>{s.notes}</div>}
                        </div>
                        <span className={styles['pt-sex-badge']}
                          style={{
                            background: s.protected ? 'rgba(90,140,99,0.12)' : 'rgba(212,96,122,0.1)',
                            color: s.protected ? '#5a8c63' : '#d4607a',
                            border: `1px solid ${s.protected ? 'rgba(90,140,99,0.25)' : 'rgba(212,96,122,0.2)'}`,
                          }}>
                          {s.protected ? 'protected' : 'unprotected'}
                        </span>
                        <button onClick={() => openEditSex(s)}
                          style={{
                            width: 30, height: 30, borderRadius: '50%',
                            border: '1.5px solid rgba(90,140,99,0.2)',
                            background: '#f8fdf9', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: '#5a8c63', flexShrink: 0, transition: 'all 0.18s ease',
                          }}
                          onMouseEnter={e2 => (e2.currentTarget.style.background = '#edf6ee')}
                          onMouseLeave={e2 => (e2.currentTarget.style.background = '#f8fdf9')}>
                          <i className="ti ti-pencil" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── CALENDAR ── */}
          {activeTab === 'calendar' && (
            <motion.div key="calendar"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
              <div className={styles['pt-card']}>
                <div className={styles['pt-cal-nav']}>
                  <button className={styles['pt-cal-nav-btn']}
                    onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                    <i className="ti ti-chevron-left" />
                  </button>
                  <span className={styles['pt-cal-month']}>
                    {calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className={styles['pt-cal-nav-btn']}
                    onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>

                <div className={styles['pt-cal-grid']}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className={styles['pt-cal-dow']}>{d}</div>
                  ))}
                  {[...Array(firstDay)].map((_, i) => (
                    <div key={`e-${i}`} className={`${styles['pt-cal-day']} ${styles.empty}`} />
                  ))}
                  {[...Array(daysInMon)].map((_, i) => {
                    const day  = i + 1
                    const dStr = `${calYear}-${String(calMon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const iPS  = periodStartDates.has(dStr)
                    const iPE  = periodEndDates.has(dStr)
                    const iP   = periodDates.has(dStr)
                    const iPr  = predictedDates.has(dStr)
                    const iOv  = ovulationDates.has(dStr)
                    const isT  = dStr === todayStr
                    const iSex = sexDateSet.has(dStr)
                    const iPain = painDateSet.has(dStr)

                    const cls = [
                      styles['pt-cal-day'],
                      iPS                     ? styles['period-start'] : '',
                      !iPS && iPE             ? styles['period-end']   : '',
                      !iPS && !iPE && iP      ? styles.period          : '',
                      !iP  && iPr             ? styles.predicted       : '',
                      !iP  && !iPr && iOv     ? styles.ovulation       : '',
                      isT                     ? styles.today           : '',
                      iSex                    ? styles['sex-day']      : '',
                      iPain                   ? styles['pain-day']     : '',
                    ].filter(Boolean).join(' ')

                    return (
                      <div key={day} className={cls}
                        style={{ fontSize: '12px', color: isT && !iP && !iPr && !iOv ? '#d4607a' : undefined }}>
                        {day}
                      </div>
                    )
                  })}
                </div>

                <div className={styles['pt-legend']}>
                  {[
                    { color: '#d4607a',               label: 'period start' },
                    { color: 'rgba(212,96,122,0.3)',   label: 'period days' },
                    { color: 'rgba(212,96,122,0.1)',   label: 'predicted', border: '1px dashed rgba(212,96,122,0.4)' },
                    { color: 'rgba(155,126,200,0.2)',  label: 'ovulation', border: '1px solid rgba(155,126,200,0.5)' },
                    { color: '#5a8c63',                label: 'intimacy (dot)' },
                    { color: '#b8860b',                label: 'pain (dot)' },
                  ].map(l => (
                    <div key={l.label} className={styles['pt-legend-item']}>
                      <div className={styles['pt-legend-dot']} style={{ background: l.color, border: (l as any).border }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── INSIGHTS ── */}
          {activeTab === 'insights' && (
            <motion.div key="insights"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div className={styles['pt-insights']}>
                {[
                  { label: 'avg cycle',      value: `${avgCycle} days`,  c: '#d4607a', bg: '#fde8ee', border: '#f2b3c0', icon: 'ti-rotate-clockwise' },
                  { label: 'avg period',     value: `${avgPeriod} days`, c: '#9b7ec8', bg: '#f3edfb', border: '#c9b8e8', icon: 'ti-droplet' },
                  { label: 'next period',    value: nextPredicted ? nextPredicted.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', icon: 'ti-clock' },
                  { label: 'ovulation est.', value: lastStart ? addDays(lastStart, avgCycle - 14).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae', icon: 'ti-sparkles' },
                  { label: 'pain logs',      value: String(painLogs.length), c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', icon: 'ti-bolt' },
                  { label: 'intimacy logs',  value: String(sexLogs.length),  c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae', icon: 'ti-heart' },
                ].map((ins, i) => (
                  <motion.div key={ins.label} className={styles['pt-insight']}
                    style={{ background: ins.bg, border: `1px solid ${ins.border}` }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}>
                    <i className={`ti ${ins.icon} ${styles['pt-insight-ico']}`} style={{ color: ins.c }} />
                    <div>
                      <div className={styles['pt-insight-val']} style={{ color: ins.c }}>{ins.value}</div>
                      <div className={styles['pt-insight-lbl']} style={{ color: ins.c }}>{ins.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className={styles['pt-card']}>
                <p className={styles['pt-card-lbl']}><i className="ti ti-stethoscope" /> common symptoms</p>
                {entries.length === 0 ? (
                  <div className={styles['pt-empty']}><i className="ti ti-leaf" />log some cycles to see patterns</div>
                ) : (() => {
                  const freq: Record<string, number> = {}
                  entries.forEach(e => e.symptoms?.forEach(s => { freq[s] = (freq[s] || 0) + 1 }))
                  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6)
                  if (!sorted.length) return <div className={styles['pt-empty']}><i className="ti ti-leaf" />no symptoms logged yet</div>
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {sorted.map(([sym, count]) => {
                        const s = symptomList.find(x => x.label === sym)
                        const pct = Math.round((count / entries.length) * 100)
                        return (
                          <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className={`ti ${s?.icon || 'ti-circle'}`} style={{ fontSize: '15px', color: '#d4607a', flexShrink: 0, width: '18px' }} />
                            <span style={{ fontSize: '13px', color: 'var(--ink)', minWidth: '80px' }}>{sym}</span>
                            <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(212,96,122,0.1)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #d4607a, #9b7ec8)' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: '#b09aa4', minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {entries.length > 0 && (() => {
                const cfreq: Record<string, number> = {}
                entries.forEach(e => e.cravings?.forEach(c => { if (c !== 'none') cfreq[c] = (cfreq[c] || 0) + 1 }))
                const csorted = Object.entries(cfreq).sort((a, b) => b[1] - a[1]).slice(0, 6)
                if (!csorted.length) return null
                return (
                  <div className={styles['pt-card']}>
                    <p className={styles['pt-card-lbl']}><i className="ti ti-cookie" /> common cravings</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {csorted.map(([cr, count]) => {
                        const c = cravingOpts.find(x => x.label === cr)
                        const pct = Math.round((count / entries.length) * 100)
                        return (
                          <div key={cr} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className={`ti ${c?.icon || 'ti-cookie'}`} style={{ fontSize: '15px', color: c?.c ?? '#b8860b', flexShrink: 0, width: '18px' }} />
                            <span style={{ fontSize: '13px', color: 'var(--ink)', minWidth: '80px' }}>{cr}</span>
                            <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(184,134,11,0.1)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                style={{ height: '100%', borderRadius: '999px', background: `linear-gradient(90deg, ${c?.c ?? '#b8860b'}, #d4607a)` }} />
                            </div>
                            <span style={{ fontSize: '11px', color: '#b09aa4', minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {painLogs.length > 0 && (
                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-bolt" style={{ color: '#b8860b' }} /> pain patterns</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {painTypes.map(pt2 => {
                      const count = painLogs.filter(p => p.type === pt2.key).length
                      if (!count) return null
                      const avgSev = (painLogs.filter(p => p.type === pt2.key).reduce((a, p) => a + p.severity, 0) / count).toFixed(1)
                      return (
                        <div key={pt2.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className={`ti ${pt2.icon}`} style={{ fontSize: '15px', color: pt2.c, flexShrink: 0, width: '18px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--ink)', minWidth: '80px' }}>{pt2.label}</span>
                          <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(184,134,11,0.1)', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(Number(avgSev) / 5) * 100}%` }}
                              transition={{ delay: 0.2, duration: 0.6 }}
                              style={{ height: '100%', borderRadius: '999px', background: `linear-gradient(90deg, ${pt2.c}, #d4607a)` }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#b09aa4', minWidth: '40px', textAlign: 'right' }}>avg {avgSev}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles['pt-card']}>
                <p className={styles['pt-card-lbl']}><i className="ti ti-user" /> your cycle profile</p>
                {!cycleProfile ? (
                  <div className={styles['pt-empty']}>
                    <i className="ti ti-calendar-heart" />
                    no profile yet
                    <button className={styles['pt-submit']} onClick={() => setShowOnboarding(true)}
                      style={{ background: 'linear-gradient(135deg, #d4607a, #9b7ec8)', color: '#fff', marginTop: '12px' }}>
                      set up profile
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {[
                        { label: 'Cycle length',      value: `${cycleProfile.cycle_length} days`,                                                  icon: 'ti-rotate-clockwise', c: '#d4607a', bg: '#fde8ee' },
                        { label: 'Period length',      value: `${cycleProfile.period_length} days`,                                                 icon: 'ti-droplet',          c: '#9b7ec8', bg: '#f3edfb' },
                        { label: 'Regularity',         value: cycleProfile.cycle_regularity?.replace('_', ' ') ?? '—',                             icon: 'ti-activity',         c: '#5a8c63', bg: '#edf6ee' },
                        { label: 'PCOS/PCOD',          value: cycleProfile.has_pcos_pcod ? (cycleProfile.pcos_type?.toUpperCase() ?? 'yes') : 'no', icon: 'ti-ribbon',           c: '#b8860b', bg: '#fef8e7' },
                        { label: 'Birth control',      value: cycleProfile.on_birth_control ? (cycleProfile.birth_control_type ?? 'yes') : 'no',    icon: 'ti-pill',             c: '#c05878', bg: '#fde4ec' },
                        { label: 'Trying to conceive', value: cycleProfile.trying_to_conceive ? 'yes' : 'no',                                      icon: 'ti-heart',            c: '#9b7ec8', bg: '#f3edfb' },
                        ...(cycleProfile.age ? [{ label: 'Age', value: String(cycleProfile.age), icon: 'ti-user', c: '#7a8cb8', bg: '#edf0fb' }] : []),
                      ].map(row => (
                        <div key={row.label} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px', borderRadius: '14px', background: row.bg,
                        }}>
                          <i className={`ti ${row.icon}`} style={{ color: row.c, fontSize: '16px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--ink)', flex: 1 }}>{row.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: row.c, textTransform: 'capitalize' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    {cycleProfile.notes && (
                      <div style={{
                        padding: '12px', borderRadius: '12px',
                        background: 'rgba(212,96,122,0.04)', border: '1px solid rgba(212,96,122,0.1)',
                        fontSize: '13px', color: '#b09aa4', fontStyle: 'italic', marginBottom: '14px',
                      }}>
                        &ldquo;{cycleProfile.notes}&rdquo;
                      </div>
                    )}
                    <button className={styles['pt-submit']} onClick={openEditProfile}
                      style={{ background: 'linear-gradient(135deg, #d4607a, #9b7ec8)', color: '#fff' }}>
                      edit profile
                    </button>
                    <button onClick={() => setShareOpen(true)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, #ff3d8b, #ff6bb5)',
                      border: 'none', borderRadius: '50px', padding: '10px 20px',
                      fontSize: '13px', fontWeight: 500, color: 'white', cursor: 'pointer',
                      letterSpacing: '0.03em', boxShadow: '0 4px 16px rgba(255, 61, 139, 0.35)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(255, 61, 139, 0.45)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 61, 139, 0.35)' }}>
                      <span style={{ fontSize: '15px' }}>🔗</span>share with partner
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── EDIT PERIOD MODAL ── */}
        <AnimatePresence>
          {editingEntry && (
            <OnboardingPortal>
              <motion.div className={styles['pt-onboard-overlay']}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={e => { if (e.target === e.currentTarget) closeEdit() }}>
                <motion.div className={styles['pt-onboard-card']} style={{ maxWidth: 540 }}
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3 }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div className={styles['pt-onboard-step']}><i className="ti ti-edit" style={{ color: '#d4607a' }} /> edit entry</div>
                      <h2 className={styles['pt-onboard-title']} style={{ marginBottom: 0 }}>
                        edit <span className={styles.accent}>cycle entry</span>
                      </h2>
                    </div>
                    <button onClick={closeEdit} style={{
                      width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #eddde3',
                      background: '#fdf8fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, color: '#b09aa4', flexShrink: 0,
                    }}><i className="ti ti-x" /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px' }}>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-calendar" /> dates</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <div className={styles['pt-input-lbl']} style={{ marginBottom: '4px' }}><i className="ti ti-circle-dot" /> start</div>
                          <input type="date" className={styles['pt-input']} value={editStart} onChange={e => setEditStart(e.target.value)} style={{ marginBottom: 0 }} />
                        </div>
                        <div>
                          <div className={styles['pt-input-lbl']} style={{ marginBottom: '4px' }}><i className="ti ti-circle-check" /> end (opt.)</div>
                          <input type="date" className={styles['pt-input']} value={editEnd} onChange={e => setEditEnd(e.target.value)} style={{ marginBottom: 0 }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-droplet" /> flow intensity</div>
                      <div className={styles['pt-flow-grid']}>
                        {flows.map(f => {
                          const active = editFlow === f.key
                          return (
                            <button key={f.key} className={styles['pt-flow-btn']}
                              onClick={() => setEditFlow(active ? null : f.key)}
                              style={{
                                background: active ? f.bg : 'transparent',
                                borderColor: active ? f.border : 'rgba(212,96,122,0.12)',
                                color: active ? f.c : '#b09aa4',
                              }}>
                              <i className="ti ti-droplet" style={{ color: active ? f.c : '#b09aa4' }} />
                              {f.label}
                              <div className={styles['pt-flow-dots']}>
                                {f.key === 'spotting'
                                  ? <div className={styles['pt-flow-dot']} style={{ background: 'rgba(0,0,0,0.15)', width: '3px', height: '3px' }} />
                                  : [...Array(4)].map((_, i) => (
                                    <div key={i} className={styles['pt-flow-dot']}
                                      style={{ background: i < f.dots ? f.c : 'rgba(0,0,0,0.08)' }} />
                                  ))
                                }
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-stethoscope" /> symptoms</div>
                      <div className={styles['pt-chips']}>
                        {symptomList.map(s => {
                          const active = editSymptoms.includes(s.label)
                          return (
                            <button key={s.label} className={styles['pt-chip']}
                              onClick={() => toggleEditSymptom(s.label)}
                              style={{
                                background: active ? '#fde8ee' : 'transparent',
                                borderColor: active ? '#e8a0b0' : 'rgba(212,96,122,0.15)',
                                color: active ? '#7a1a35' : '#b09aa4',
                              }}>
                              <i className={`ti ${s.icon}`} style={{ color: active ? '#d4607a' : '#b09aa4' }} />
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-cookie" /> cravings</div>
                      <div className={styles['pt-chips']}>
                        {cravingOpts.map(c => {
                          const active = editCravings.includes(c.label)
                          return (
                            <button key={c.label} className={styles['pt-chip']}
                              onClick={() => toggleEditCraving(c.label)}
                              style={{
                                background: active ? '#fef8e7' : 'transparent',
                                borderColor: active ? '#f5ddb4' : 'rgba(212,96,122,0.15)',
                                color: active ? c.c : '#b09aa4',
                              }}>
                              <i className={`ti ${c.icon}`} style={{ color: active ? c.c : '#b09aa4' }} />
                              {c.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-mood-smile" /> mood</div>
                      <div className={styles['pt-mood-row']}>
                        {moodOpts.map(m => {
                          const active = editMood === m.label
                          return (
                            <button key={m.label} className={styles['pt-mood-btn']}
                              onClick={() => setEditMood(active ? null : m.label)}
                              style={{
                                background: active ? '#fde8ee' : 'transparent',
                                borderColor: active ? '#e8a0b0' : 'rgba(212,96,122,0.15)',
                                color: active ? m.c : '#b09aa4',
                              }}>
                              <i className={`ti ${m.icon}`} style={{ color: active ? m.c : '#b09aa4' }} />
                              {m.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes</div>
                      <textarea className={styles['pt-input']} value={editNotes} rows={2}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="anything on your mind..."
                        style={{ resize: 'none', marginBottom: 0 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <button className={styles['pt-submit']} onClick={handleSaveEdit}
                      disabled={!editFlow || savingEdit}
                      style={{
                        background: editFlow ? 'linear-gradient(135deg, #d4607a, #9b7ec8)' : 'rgba(212,96,122,0.08)',
                        color: editFlow ? '#fff' : '#b09aa4',
                      }}>
                      {savingEdit ? 'saving...' : 'save changes ✨'}
                    </button>
                    {!confirmDelete ? (
                      <button onClick={() => setConfirmDelete(true)} style={{
                        width: '100%', padding: '11px', borderRadius: '999px',
                        border: '1.5px solid rgba(212,96,122,0.2)', background: 'transparent',
                        color: '#b09aa4', fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      }}>
                        <i className="ti ti-trash" style={{ marginRight: '6px' }} />delete this entry
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '14px 18px', borderRadius: '18px', background: 'rgba(212,96,122,0.06)',
                          border: '1.5px solid rgba(212,96,122,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#8b1a35', margin: 0, fontWeight: 600, textAlign: 'center' }}>
                          are you sure? this can&apos;t be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setConfirmDelete(false)} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: '1.5px solid #eddde3',
                            background: '#fdf8fa', color: '#b09aa4', fontSize: '12px', cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                          }}>cancel</button>
                          <button onClick={handleDeleteEntry} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: 'none',
                            background: 'linear-gradient(135deg, #d4607a, #8b1a35)', color: 'white',
                            fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                          }}>
                            <i className="ti ti-trash" style={{ marginRight: '4px' }} /> yes, delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </OnboardingPortal>
          )}
        </AnimatePresence>

        {/* ── EDIT PAIN MODAL ── */}
        <AnimatePresence>
          {editingPain && (
            <OnboardingPortal>
              <motion.div className={styles['pt-onboard-overlay']}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={e => { if (e.target === e.currentTarget) closeEditPain() }}>
                <motion.div className={styles['pt-onboard-card']} style={{ maxWidth: 480 }}
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3 }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div className={styles['pt-onboard-step']}><i className="ti ti-edit" style={{ color: '#b8860b' }} /> edit pain entry</div>
                      <h2 className={styles['pt-onboard-title']} style={{ marginBottom: 0 }}>
                        edit <span style={{ color: '#b8860b' }}>pain log</span>
                      </h2>
                    </div>
                    <button onClick={closeEditPain} style={{
                      width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #eddde3',
                      background: '#fdf8fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, color: '#b09aa4', flexShrink: 0,
                    }}><i className="ti ti-x" /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px' }}>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-calendar" /> date</div>
                      <input type="date" className={styles['pt-input']} value={editPainDate} onChange={e => setEditPainDate(e.target.value)} />
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-stethoscope" /> type of pain</div>
                      <div className={styles['pt-pain-type-grid']}>
                        {painTypes.map(pt2 => {
                          const active = editPainType === pt2.key
                          return (
                            <button key={pt2.key} className={styles['pt-pain-type-btn']}
                              onClick={() => setEditPainType(active ? null : pt2.key)}
                              style={{
                                background: active ? pt2.bg : 'transparent',
                                borderColor: active ? pt2.c : 'rgba(212,96,122,0.12)',
                                color: active ? pt2.c : '#b09aa4',
                              }}>
                              <i className={`ti ${pt2.icon}`} style={{ color: active ? pt2.c : '#b09aa4' }} />
                              {pt2.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-chart-bar" /> severity</div>
                      <div className={styles['pt-severity']}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} className={`${styles['pt-sev-btn']} ${editPainSeverity >= n ? styles.active : ''}`}
                            onClick={() => setEditPainSeverity(n)}
                            style={{
                              background: editPainSeverity >= n ? `hsl(${340 - n * 18},${60 + n * 6}%,${60 - n * 4}%)` : 'transparent',
                              borderColor: editPainSeverity >= n ? 'transparent' : 'rgba(212,96,122,0.15)',
                            }}>
                            {n}
                          </button>
                        ))}
                        <span style={{ fontSize: '11px', color: '#b09aa4', marginLeft: '4px' }}>
                          {['','mild','moderate','notable','strong','severe'][editPainSeverity]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-clock" /> duration (hours)</div>
                      <input type="number" className={styles['pt-input']} placeholder="e.g. 2"
                        value={editPainDuration} onChange={e => setEditPainDuration(e.target.value)} />
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-first-aid-kit" /> relief used</div>
                      <div className={styles['pt-chips']} style={{ marginBottom: '4px' }}>
                        {reliefOptions.map(r => {
                          const active = editPainRelief.includes(r)
                          return (
                            <button key={r} className={styles['pt-chip']}
                              onClick={() => toggleEditPainRelief(r)}
                              style={{
                                background: active ? '#fef8e7' : 'transparent',
                                borderColor: active ? '#f5ddb4' : 'rgba(212,96,122,0.15)',
                                color: active ? '#5a3a00' : '#b09aa4',
                              }}>
                              {r}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes</div>
                      <textarea className={styles['pt-input']} value={editPainNotes} rows={2}
                        onChange={e => setEditPainNotes(e.target.value)}
                        placeholder="describe how you feel..." style={{ resize: 'none', marginBottom: 0 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <button className={styles['pt-submit']} onClick={handleSaveEditPain}
                      disabled={!editPainType || savingEditPain}
                      style={{
                        background: editPainType ? 'linear-gradient(135deg, #b8860b, #d4607a)' : 'rgba(212,96,122,0.08)',
                        color: editPainType ? '#fff' : '#b09aa4',
                      }}>
                      {savingEditPain ? 'saving...' : 'save changes ✨'}
                    </button>
                    {!confirmDeletePain ? (
                      <button onClick={() => setConfirmDeletePain(true)} style={{
                        width: '100%', padding: '11px', borderRadius: '999px',
                        border: '1.5px solid rgba(212,96,122,0.2)', background: 'transparent',
                        color: '#b09aa4', fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      }}>
                        <i className="ti ti-trash" style={{ marginRight: '6px' }} />delete this entry
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '14px 18px', borderRadius: '18px', background: 'rgba(212,96,122,0.06)',
                          border: '1.5px solid rgba(212,96,122,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#8b1a35', margin: 0, fontWeight: 600, textAlign: 'center' }}>
                          are you sure? this can&apos;t be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setConfirmDeletePain(false)} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: '1.5px solid #eddde3',
                            background: '#fdf8fa', color: '#b09aa4', fontSize: '12px', cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                          }}>cancel</button>
                          <button onClick={handleDeletePain} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: 'none',
                            background: 'linear-gradient(135deg, #d4607a, #8b1a35)', color: 'white',
                            fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                          }}>
                            <i className="ti ti-trash" style={{ marginRight: '4px' }} /> yes, delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </OnboardingPortal>
          )}
        </AnimatePresence>

        {/* ── EDIT SEX LOG MODAL ── */}
        <AnimatePresence>
          {editingSex && (
            <OnboardingPortal>
              <motion.div className={styles['pt-onboard-overlay']}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={e => { if (e.target === e.currentTarget) closeEditSex() }}>
                <motion.div className={styles['pt-onboard-card']} style={{ maxWidth: 420 }}
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3 }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div className={styles['pt-onboard-step']}><i className="ti ti-edit" style={{ color: '#5a8c63' }} /> edit intimacy entry</div>
                      <h2 className={styles['pt-onboard-title']} style={{ marginBottom: 0 }}>
                        edit <span style={{ color: '#5a8c63' }}>intimacy log</span>
                      </h2>
                    </div>
                    <button onClick={closeEditSex} style={{
                      width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #eddde3',
                      background: '#fdf8fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, color: '#b09aa4', flexShrink: 0,
                    }}><i className="ti ti-x" /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-calendar" /> date</div>
                      <input type="date" className={styles['pt-input']} value={editSexDate} onChange={e => setEditSexDate(e.target.value)} />
                    </div>
                    <div className={styles['pt-toggle-row']}>
                      <span className={styles['pt-toggle-lbl']}>
                        <i className="ti ti-shield-check" style={{ color: '#5a8c63' }} />protected?
                      </span>
                      <button className={`${styles['pt-toggle']} ${editSexProtected ? styles.on : styles.off}`}
                        style={{ background: editSexProtected ? '#5a8c63' : undefined }}
                        onClick={() => setEditSexProtected(p => !p)} />
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes</div>
                      <textarea className={styles['pt-input']} value={editSexNotes} rows={3}
                        onChange={e => setEditSexNotes(e.target.value)}
                        placeholder="e.g. pain, discomfort, notes..."
                        style={{ resize: 'none', marginBottom: 0 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <button className={styles['pt-submit']} onClick={handleSaveEditSex}
                      disabled={savingEditSex}
                      style={{ background: 'linear-gradient(135deg, #5a8c63, #9b7ec8)', color: '#fff' }}>
                      {savingEditSex ? 'saving...' : 'save changes ✨'}
                    </button>
                    {!confirmDeleteSex ? (
                      <button onClick={() => setConfirmDeleteSex(true)} style={{
                        width: '100%', padding: '11px', borderRadius: '999px',
                        border: '1.5px solid rgba(212,96,122,0.2)', background: 'transparent',
                        color: '#b09aa4', fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      }}>
                        <i className="ti ti-trash" style={{ marginRight: '6px' }} />delete this entry
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '14px 18px', borderRadius: '18px', background: 'rgba(212,96,122,0.06)',
                          border: '1.5px solid rgba(212,96,122,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#8b1a35', margin: 0, fontWeight: 600, textAlign: 'center' }}>
                          are you sure? this can&apos;t be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setConfirmDeleteSex(false)} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: '1.5px solid #eddde3',
                            background: '#fdf8fa', color: '#b09aa4', fontSize: '12px', cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                          }}>cancel</button>
                          <button onClick={handleDeleteSex} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: 'none',
                            background: 'linear-gradient(135deg, #5a8c63, #8b1a35)', color: 'white',
                            fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                          }}>
                            <i className="ti ti-trash" style={{ marginRight: '4px' }} /> yes, delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </OnboardingPortal>
          )}
        </AnimatePresence>

        {/* ── EDIT PROFILE MODAL ── */}
        <AnimatePresence>
          {editingProfile && (
            <OnboardingPortal>
              <motion.div className={styles['pt-onboard-overlay']}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={e => { if (e.target === e.currentTarget) closeEditProfile() }}>
                <motion.div className={styles['pt-onboard-card']} style={{ maxWidth: 520 }}
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3 }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div className={styles['pt-onboard-step']}><i className="ti ti-user" style={{ color: '#d4607a' }} /> edit profile</div>
                      <h2 className={styles['pt-onboard-title']} style={{ marginBottom: 0 }}>
                        your <span className={styles.accent}>cycle profile</span>
                      </h2>
                    </div>
                    <button onClick={closeEditProfile} style={{
                      width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #eddde3',
                      background: '#fdf8fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, color: '#b09aa4', flexShrink: 0,
                    }}><i className="ti ti-x" /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px' }}>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-rotate-clockwise" /> cycle length ({editProfile.cycle_length} days)</div>
                      <input type="range" className={styles['pt-range']} min={20} max={45}
                        value={editProfile.cycle_length ?? 28}
                        onChange={e => updateEditProfile('cycle_length', Number(e.target.value))} />
                      <div className={styles['pt-range-labels']}><span>20</span><span style={{ color: '#d4607a', fontWeight: 600 }}>{editProfile.cycle_length}d</span><span>45</span></div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-droplet" /> period length ({editProfile.period_length} days)</div>
                      <input type="range" className={styles['pt-range']} min={2} max={10}
                        value={editProfile.period_length ?? 5}
                        onChange={e => updateEditProfile('period_length', Number(e.target.value))} />
                      <div className={styles['pt-range-labels']}><span>2</span><span style={{ color: '#d4607a', fontWeight: 600 }}>{editProfile.period_length}d</span><span>10</span></div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-activity" /> regularity</div>
                      <div className={styles['pt-radio-group']}>
                        {[
                          { key: 'regular',        label: 'Pretty regular',     icon: 'ti-clock',     c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.25)' },
                          { key: 'irregular',      label: 'Somewhat irregular', icon: 'ti-clock-off', c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.25)' },
                          { key: 'very_irregular', label: 'Very irregular',     icon: 'ti-help',      c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.25)' },
                        ].map(opt => (
                          <button key={opt.key} className={styles['pt-radio-btn']}
                            onClick={() => updateEditProfile('cycle_regularity', opt.key as CycleProfile['cycle_regularity'])}
                            style={{
                              background: editProfile.cycle_regularity === opt.key ? opt.bg : 'transparent',
                              borderColor: editProfile.cycle_regularity === opt.key ? opt.border : 'rgba(212,96,122,0.12)',
                              color: editProfile.cycle_regularity === opt.key ? opt.c : 'var(--ink)',
                            }}>
                            <i className={`ti ${opt.icon}`} style={{ color: opt.c }} />
                            <div><div style={{ fontWeight: 600 }}>{opt.label}</div></div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-ribbon" /> PCOS / PCOD</div>
                      <div className={styles['pt-radio-group']}>
                        {[
                          { v: false, label: "No / not diagnosed", icon: 'ti-check',  c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.25)' },
                          { v: true,  label: 'Yes, diagnosed',     icon: 'ti-ribbon', c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.25)' },
                        ].map(opt => (
                          <button key={String(opt.v)} className={styles['pt-radio-btn']}
                            onClick={() => updateEditProfile('has_pcos_pcod', opt.v)}
                            style={{
                              background: editProfile.has_pcos_pcod === opt.v ? opt.bg : 'transparent',
                              borderColor: editProfile.has_pcos_pcod === opt.v ? opt.border : 'rgba(212,96,122,0.12)',
                              color: editProfile.has_pcos_pcod === opt.v ? opt.c : 'var(--ink)',
                            }}>
                            <i className={`ti ${opt.icon}`} style={{ color: opt.c }} />
                            <div><div style={{ fontWeight: 600 }}>{opt.label}</div></div>
                          </button>
                        ))}
                      </div>
                      {editProfile.has_pcos_pcod && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          {(['pcos', 'pcod'] as const).map(t => (
                            <button key={t} className={styles['pt-radio-btn']}
                              onClick={() => updateEditProfile('pcos_type', t)}
                              style={{
                                flex: 1,
                                background: editProfile.pcos_type === t ? '#f3edfb' : 'transparent',
                                borderColor: editProfile.pcos_type === t ? '#c9b8e8' : 'rgba(212,96,122,0.12)',
                                color: editProfile.pcos_type === t ? '#9b7ec8' : 'var(--ink)',
                              }}>
                              <i className="ti ti-ribbon" style={{ color: '#9b7ec8' }} />
                              <div><div style={{ fontWeight: 600 }}>{t.toUpperCase()}</div></div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={styles['pt-toggle-row']}>
                        <span className={styles['pt-toggle-lbl']}><i className="ti ti-pill" /> On birth control?</span>
                        <button className={`${styles['pt-toggle']} ${editProfile.on_birth_control ? styles.on : styles.off}`}
                          onClick={() => updateEditProfile('on_birth_control', !editProfile.on_birth_control)} />
                      </div>
                      {editProfile.on_birth_control && (
                        <div className={styles['pt-checkbox-group']} style={{ marginTop: '8px' }}>
                          {['pill','IUD (hormonal)','IUD (copper)','implant','injection','patch','ring','condoms only'].map(bc => (
                            <button key={bc} className={styles['pt-checkbox-btn']}
                              onClick={() => updateEditProfile('birth_control_type', bc)}
                              style={{
                                background: editProfile.birth_control_type === bc ? '#fde8ee' : 'transparent',
                                borderColor: editProfile.birth_control_type === bc ? '#e8a0b0' : 'rgba(212,96,122,0.12)',
                                color: editProfile.birth_control_type === bc ? '#7a1a35' : 'var(--ink)',
                              }}>
                              <i className={`ti ${editProfile.birth_control_type === bc ? 'ti-circle-check' : 'ti-circle'}`}
                                style={{ color: editProfile.birth_control_type === bc ? '#d4607a' : '#b09aa4' }} />
                              {bc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles['pt-toggle-row']}>
                      <span className={styles['pt-toggle-lbl']}><i className="ti ti-heart" /> Trying to conceive?</span>
                      <button className={`${styles['pt-toggle']} ${editProfile.trying_to_conceive ? styles.on : styles.off}`}
                        onClick={() => updateEditProfile('trying_to_conceive', !editProfile.trying_to_conceive)} />
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-user" /> age (optional)</div>
                      <input type="number" className={styles['pt-input']} placeholder="e.g. 26"
                        value={editProfile.age ?? ''}
                        onChange={e => updateEditProfile('age', Number(e.target.value) || null)} />
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes (optional)</div>
                      <textarea className={styles['pt-input']} rows={3}
                        placeholder="e.g. thyroid issues, endometriosis..."
                        value={editProfile.notes ?? ''}
                        onChange={e => updateEditProfile('notes', e.target.value)}
                        style={{ resize: 'none', marginBottom: 0 }} />
                    </div>
                  </div>

                  <button className={styles['pt-submit']} onClick={handleSaveEditProfile}
                    disabled={savingEditProfile}
                    style={{ background: 'linear-gradient(135deg, #d4607a, #9b7ec8)', color: '#fff', marginTop: '20px' }}>
                    {savingEditProfile ? 'saving...' : 'save profile ✨'}
                  </button>
                </motion.div>
              </motion.div>
            </OnboardingPortal>
          )}
        </AnimatePresence>

        {/* ── EDIT DAILY SYMPTOM MODAL ── */}
        <AnimatePresence>
          {editingSymptom && (
            <OnboardingPortal>
              <motion.div className={styles['pt-onboard-overlay']}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={e => { if (e.target === e.currentTarget) closeEditSymptom() }}>
                <motion.div className={styles['pt-onboard-card']} style={{ maxWidth: 500 }}
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3 }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div className={styles['pt-onboard-step']}><i className="ti ti-edit" style={{ color: '#9b7ec8' }} /> edit symptoms</div>
                      <h2 className={styles['pt-onboard-title']} style={{ marginBottom: 0 }}>
                        edit <span style={{ color: '#9b7ec8' }}>symptom log</span>
                      </h2>
                    </div>
                    <button onClick={closeEditSymptom} style={{
                      width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #eddde3',
                      background: '#fdf8fa', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, color: '#b09aa4', flexShrink: 0,
                    }}><i className="ti ti-x" /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px' }}>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-calendar" /> date</div>
                      <input type="date" className={styles['pt-input']} value={editDDate} onChange={e => setEditDDate(e.target.value)} />
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-bolt" /> symptoms</div>
                      <div className={styles['pt-chips']}>
                        {symptomList.map(s => {
                          const active = editDSymptoms.includes(s.label)
                          return (
                            <button key={s.label} className={styles['pt-chip']}
                              onClick={() => toggleEditDSymptom(s.label)}
                              style={{
                                background: active ? '#f3edfb' : 'transparent',
                                borderColor: active ? '#c9b8e8' : 'rgba(155,126,200,0.2)',
                                color: active ? '#4a2a80' : '#b09aa4',
                              }}>
                              <i className={`ti ${s.icon}`} style={{ color: active ? '#9b7ec8' : '#b09aa4' }} />
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-mood-smile" /> mood</div>
                      <div className={styles['pt-mood-row']}>
                        {moodOpts.map(m => {
                          const active = editDMood === m.label
                          return (
                            <button key={m.label} className={styles['pt-mood-btn']}
                              onClick={() => setEditDMood(active ? null : m.label)}
                              style={{
                                background: active ? '#f3edfb' : 'transparent',
                                borderColor: active ? '#c9b8e8' : 'rgba(155,126,200,0.15)',
                                color: active ? m.c : '#b09aa4',
                              }}>
                              <i className={`ti ${m.icon}`} style={{ color: active ? m.c : '#b09aa4' }} />
                              {m.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-battery" /> energy</div>
                      <div className={styles['pt-severity']}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setEditDEnergy(n)}
                            style={{
                              width: 36, height: 36, borderRadius: '10px', border: 'none',
                              cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                              background: editDEnergy >= n ? `hsl(${140 + n * 15}, ${50 + n * 5}%, ${55 - n * 3}%)` : 'transparent',
                              color: editDEnergy >= n ? '#fff' : '#b09aa4',
                              outline: editDEnergy >= n ? 'none' : '1.5px solid rgba(155,126,200,0.2)',
                            }}>
                            {n}
                          </button>
                        ))}
                        <span style={{ fontSize: '11px', color: '#b09aa4', marginLeft: '4px' }}>
                          {['','very low','low','okay','good','great'][editDEnergy]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className={styles['pt-input-lbl']}><i className="ti ti-pencil" /> notes</div>
                      <textarea className={styles['pt-input']} value={editDNotes} rows={2}
                        onChange={e => setEditDNotes(e.target.value)}
                        placeholder="anything on your mind..."
                        style={{ resize: 'none', marginBottom: 0 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <button className={styles['pt-submit']} onClick={handleSaveEditSymptom}
                      disabled={savingEditSymptom}
                      style={{ background: 'linear-gradient(135deg, #9b7ec8, #d4607a)', color: '#fff' }}>
                      {savingEditSymptom ? 'saving...' : 'save changes ✨'}
                    </button>
                    {!confirmDeleteSym ? (
                      <button onClick={() => setConfirmDeleteSym(true)} style={{
                        width: '100%', padding: '11px', borderRadius: '999px',
                        border: '1.5px solid rgba(155,126,200,0.2)', background: 'transparent',
                        color: '#b09aa4', fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      }}>
                        <i className="ti ti-trash" style={{ marginRight: '6px' }} />delete this entry
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '14px 18px', borderRadius: '18px', background: 'rgba(155,126,200,0.06)',
                          border: '1.5px solid rgba(155,126,200,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#4a2a80', margin: 0, fontWeight: 600, textAlign: 'center' }}>
                          are you sure? this can&apos;t be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setConfirmDeleteSym(false)} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: '1.5px solid #eddde3',
                            background: '#fdf8fa', color: '#b09aa4', fontSize: '12px', cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                          }}>cancel</button>
                          <button onClick={handleDeleteSymptom} style={{
                            flex: 1, padding: '10px', borderRadius: '999px', border: 'none',
                            background: 'linear-gradient(135deg, #9b7ec8, #4a2a80)', color: 'white',
                            fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                          }}>
                            <i className="ti ti-trash" style={{ marginRight: '4px' }} /> yes, delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </OnboardingPortal>
          )}
        </AnimatePresence>

      </div>

      <SharePartner open={shareOpen} onOpenChange={setShareOpen} />
    </>
  )
}
