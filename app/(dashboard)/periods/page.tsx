'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import styles from './periods.module.css'

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
  notes: string | null
  created_at: string
}

type SexLog = {
  id: string
  user_id: string
  date: string
  protected: boolean
  notes: string | null
  created_at: string
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

const symptomList = [
  { label: 'cramps',       icon: 'ti-bolt' },
  { label: 'bloating',     icon: 'ti-circle' },
  { label: 'headache',     icon: 'ti-brain' },
  { label: 'fatigue',      icon: 'ti-zzz' },
  { label: 'backache',     icon: 'ti-accessible' },
  { label: 'nausea',       icon: 'ti-mood-sick' },
  { label: 'mood swings',  icon: 'ti-mood-crazy-happy' },
  { label: 'cravings',     icon: 'ti-cookie' },
  { label: 'spotting',     icon: 'ti-droplet' },
  { label: 'breast pain',  icon: 'ti-heart' },
  { label: 'acne',         icon: 'ti-circle-dot' },
  { label: 'insomnia',     icon: 'ti-moon' },
  { label: 'hot flashes',  icon: 'ti-flame' },
  { label: 'discharge',    icon: 'ti-droplets' },
]

const flows: { key: Flow; label: string; c: string; bg: string; border: string; dots: number }[] = [
  { key: 'spotting',   label: 'spotting',   c: '#e8a0b0', bg: '#fff5f7', border: '#f2d0d9', dots: 0 },
  { key: 'light',      label: 'light',      c: '#d4607a', bg: '#fde8ee', border: '#f2b3c0', dots: 1 },
  { key: 'medium',     label: 'medium',     c: '#9b7ec8', bg: '#f3edfb', border: '#c9b8e8', dots: 2 },
  { key: 'heavy',      label: 'heavy',      c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', dots: 3 },
  { key: 'very_heavy', label: 'very heavy', c: '#8b1a35', bg: '#fde0e7', border: '#e89aaa', dots: 4 },
]

const moodOpts = [
  { label: 'great',     icon: 'ti-star',           c: '#d4607a' },
  { label: 'okay',      icon: 'ti-minus',           c: '#b8860b' },
  { label: 'low',       icon: 'ti-mood-sad',        c: '#7a8cb8' },
  { label: 'anxious',   icon: 'ti-alert-triangle',  c: '#c07840' },
  { label: 'irritable', icon: 'ti-flame',           c: '#c05878' },
  { label: 'emotional', icon: 'ti-heart',           c: '#9b7ec8' },
  { label: 'foggy',     icon: 'ti-cloud',           c: '#8899aa' },
]

const painTypes = [
  { key: 'cramps',      label: 'Cramps',      icon: 'ti-bolt',       c: '#d4607a', bg: '#fde8ee' },
  { key: 'headache',    label: 'Headache',    icon: 'ti-brain',      c: '#9b7ec8', bg: '#f3edfb' },
  { key: 'migraine',    label: 'Migraine',    icon: 'ti-brain',      c: '#8b1a8b', bg: '#f5e8fb' },
  { key: 'backache',    label: 'Back Pain',   icon: 'ti-accessible', c: '#b8860b', bg: '#fef8e7' },
  { key: 'breast_pain', label: 'Breast Pain', icon: 'ti-heart',      c: '#c05878', bg: '#fde4ec' },
]

const reliefOptions = ['ibuprofen', 'paracetamol', 'heat pad', 'rest', 'yoga', 'massage', 'ice pack', 'nothing']

// helpers
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
  const today = new Date(); today.setHours(0,0,0,0)
  const day = diffDays(lastStart, today) + 1
  const d = ((day - 1) % cycleLen) + 1
  const periodLen = profile?.period_length ?? 5
  const hasPcos = profile?.has_pcos_pcod ?? false
  if (d <= periodLen)
    return { phase: 'menstrual' as Phase,  day: d, tip: hasPcos ? 'Rest, hydrate & heat pad — PCOS cramps can be stronger.' : 'Rest well, hydrate, and be gentle with yourself.' }
  if (d <= cycleLen - 15)
    return { phase: 'follicular' as Phase, day: d, tip: 'Energy rising — great time to start new things.' }
  if (d >= cycleLen - 14 && d <= cycleLen - 12)
    return { phase: 'ovulation' as Phase,  day: d, tip: "Peak energy & confidence — you're glowing." }
  return { phase: 'luteal' as Phase, day: d, tip: hasPcos ? 'Luteal phase with PCOS can bring stronger symptoms — be extra gentle.' : 'Wind down, nourish yourself, and rest more.' }
}

const phaseConfig = {
  menstrual:  { label: 'menstrual phase',  c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.2)',  ico: 'ti-droplet',        icoBg: 'rgba(212,96,122,0.12)' },
  follicular: { label: 'follicular phase', c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.2)',   ico: 'ti-leaf',           icoBg: 'rgba(90,140,99,0.12)'  },
  ovulation:  { label: 'ovulation phase',  c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.2)', ico: 'ti-sparkles',       icoBg: 'rgba(155,126,200,0.12)'},
  luteal:     { label: 'luteal phase',     c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.2)',  ico: 'ti-moon',           icoBg: 'rgba(184,134,11,0.12)' },
  unknown:    { label: 'phase unknown',    c: '#b09aa4', bg: '#f5f0f2', border: 'rgba(176,154,164,0.2)', ico: 'ti-calendar-heart', icoBg: 'rgba(176,154,164,0.12)'},
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

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
              { key: false,    label: "No, I don't",           sub: 'No known diagnosis',    icon: 'ti-check',  c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.25)' },
              { key: true,     label: 'Yes, I have PCOS/PCOD', sub: 'Diagnosed by a doctor', icon: 'ti-ribbon', c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.25)' },
              { key: 'unsure', label: 'Not sure / undiagnosed', sub: 'I suspect I might',    icon: 'ti-help',   c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.25)' },
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
            { label: 'cycle length',  value: `${profile.cycle_length} days`,                                            icon: 'ti-rotate-clockwise', c: '#d4607a', bg: '#fde8ee' },
            { label: 'period length', value: `${profile.period_length} days`,                                           icon: 'ti-droplet',          c: '#9b7ec8', bg: '#f3edfb' },
            { label: 'regularity',    value: profile.cycle_regularity ?? '—',                                           icon: 'ti-activity',         c: '#5a8c63', bg: '#edf6ee' },
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PeriodsPage() {
  const supabase = createClient()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [cycleProfile,   setCycleProfile]   = useState<CycleProfile | null>(null)
  const [entries,        setEntries]        = useState<Entry[]>([])
  const [sexLogs,        setSexLogs]        = useState<SexLog[]>([])
  const [painLogs,       setPainLogs]       = useState<PainLog[]>([])
  const [activeTab,      setActiveTab]      = useState<'log' | 'pain' | 'sex' | 'calendar' | 'insights' | 'profile'>('log')

  // period log state
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
  const [selSymptoms,  setSelSymptoms]  = useState<string[]>([])
  const [selMood,      setSelMood]      = useState<string | null>(null)
  const [startDate,    setStartDate]    = useState(toYMD(new Date()))
  const [endDate,      setEndDate]      = useState('')
  const [notes,        setNotes]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [success,      setSuccess]      = useState(false)

  // pain log state
  const [painDate,     setPainDate]     = useState(toYMD(new Date()))
  const [painType,     setPainType]     = useState<string | null>(null)
  const [painSeverity, setPainSeverity] = useState<number>(3)
  const [painDuration, setPainDuration] = useState('')
  const [painRelief,   setPainRelief]   = useState<string[]>([])
  const [painNotes,    setPainNotes]    = useState('')
  const [savingPain,   setSavingPain]   = useState(false)
  const [successPain,  setSuccessPain]  = useState(false)

  // sex log state
  const [sexDate,      setSexDate]      = useState(toYMD(new Date()))
  const [sexProtected, setSexProtected] = useState(true)
  const [sexNotes,     setSexNotes]     = useState('')
  const [savingSex,    setSavingSex]    = useState(false)
  const [successSex,   setSuccessSex]   = useState(false)

  const [calMonth, setCalMonth] = useState(new Date())

  useEffect(() => {
    fetchEntries()
    fetchProfile()
    fetchSexLogs()
    fetchPainLogs()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('cycle_profiles').select('*').single()
    if (data) {
      setCycleProfile(data)
      localStorage.setItem('cycle_onboarded', '1')
    } else {
      const alreadyOnboarded = localStorage.getItem('cycle_onboarded')
      if (!alreadyOnboarded) {
        setShowOnboarding(true)
      }
    }
  }

  const fetchEntries = async () => {
    const { data } = await supabase.from('period_entries').select('*').order('start_date', { ascending: false }).limit(12)
    if (data) setEntries(data)
  }

  const fetchSexLogs = async () => {
    const { data } = await supabase.from('sex_log').select('*').order('date', { ascending: false }).limit(30)
    if (data) setSexLogs(data)
  }

  const fetchPainLogs = async () => {
    const { data } = await supabase.from('pain_logs').select('*').order('date', { ascending: false }).limit(30)
    if (data) setPainLogs(data)
  }

  const handleOnboardingComplete = async (profile: CycleProfile) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase as any).from('cycle_profiles').upsert({ ...profile, user_id: user.id })
    setCycleProfile(profile)
    localStorage.setItem('cycle_onboarded', '1')
    setShowOnboarding(false)
  }

  const toggleSymptom = (s: string) =>
    setSelSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleRelief = (r: string) =>
    setPainRelief(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const handleLog = async () => {
    if (!selectedFlow || !startDate) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('period_entries').insert({
      user_id: user.id, start_date: startDate,
      end_date: endDate || null, flow: selectedFlow,
      symptoms: selSymptoms, mood: selMood, notes: notes.trim() || null,
    })
    setSuccess(true)
    setSelectedFlow(null); setSelSymptoms([]); setSelMood(null); setEndDate(''); setNotes('')
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false); fetchEntries()
  }

  const handleLogPain = async () => {
    if (!painType) return
    setSavingPain(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingPain(false); return }
    await supabase.from('pain_logs').insert({
      user_id: user.id, date: painDate, type: painType,
      severity: painSeverity,
      duration_hours: painDuration ? Number(painDuration) : null,
      relief_used: painRelief.join(', ') || null,
      notes: painNotes.trim() || null,
    })
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
      if (authError || !user) {
        console.error('Auth error:', authError)
        setSavingSex(false)
        return
      }
      const { error } = await supabase.from('sex_log').insert({
        user_id: user.id,
        date: sexDate,
        protected: sexProtected,
        notes: sexNotes.trim() || null,
      })
      if (error) {
        console.error('Sex log insert error:', error.message, error.details, error.hint)
        setSavingSex(false)
        return
      }
      setSuccessSex(true)
      setSexNotes('')
      setSexDate(toYMD(new Date()))
      setTimeout(() => setSuccessSex(false), 3000)
      fetchSexLogs()
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setSavingSex(false)
    }
  }

  // derived stats
  const lastEntry  = entries[0] ?? null
  const lastStart  = lastEntry
    ? parseYMD(lastEntry.start_date)
    : cycleProfile?.last_period_date ? parseYMD(cycleProfile.last_period_date) : null

  const avgCycle = cycleProfile?.cycle_length ?? (() => {
    if (entries.length < 2) return 28
    const gaps: number[] = []
    for (let i = 0; i < entries.length - 1; i++)
      gaps.push(diffDays(parseYMD(entries[i+1].start_date), parseYMD(entries[i].start_date)))
    return Math.round(gaps.reduce((a,b) => a+b, 0) / gaps.length)
  })()

  const avgPeriod = cycleProfile?.period_length ?? (() => {
    const withEnd = entries.filter(e => e.end_date)
    if (!withEnd.length) return 5
    return Math.round(withEnd.reduce((a,e) => a + diffDays(parseYMD(e.start_date), parseYMD(e.end_date!)) + 1, 0) / withEnd.length)
  })()

  const nextPredicted  = lastStart ? addDays(lastStart, avgCycle) : null
  const daysUntilNext  = nextPredicted ? diffDays(new Date(), nextPredicted) : null
  const { phase, day: phaseDay, tip } = getPhase(lastStart, avgCycle, cycleProfile)
  const pc = phaseConfig[phase]

  // calendar helpers
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

  const tabs = [
    { key: 'log'      as const, label: 'period',   icon: 'ti-droplet' },
    { key: 'pain'     as const, label: 'pain',      icon: 'ti-bolt' },
    { key: 'sex'      as const, label: 'intimacy',  icon: 'ti-heart' },
    { key: 'calendar' as const, label: 'calendar',  icon: 'ti-calendar-heart' },
    { key: 'insights' as const, label: 'insights',  icon: 'ti-chart-bar' },
    { key: 'profile'  as const, label: 'profile',   icon: 'ti-settings' },
  ]

  const tabColors: Record<string, { bg: string; border: string; color: string }> = {
    log:      { bg: '#fde8ee', border: '#e8a0b0', color: '#7a1a35' },
    pain:     { bg: '#fef8e7', border: '#f5ddb4', color: '#5a3a00' },
    sex:      { bg: '#edf6ee', border: '#a8c9ae', color: '#1a4a22' },
    calendar: { bg: '#f3edfb', border: '#c9b8e8', color: '#4a2a80' },
    insights: { bg: '#e8f4fd', border: '#b8d8f5', color: '#1a4a7a' },
    profile:  { bg: '#f5f0f2', border: '#d0bcc8', color: '#3d2a35' },
  }

  const statCards = [
    { label: 'cycle length',  value: `${avgCycle}d`,  c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.18)', dotC: '#e8a0b0', icon: 'ti-rotate-clockwise' },
    { label: 'period length', value: `${avgPeriod}d`, c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(201,184,232,0.25)', dotC: '#c9b8e8', icon: 'ti-calendar' },
    { label: 'next period',   value: daysUntilNext !== null ? (daysUntilNext === 0 ? 'today' : `${daysUntilNext}d`) : '—', c: '#b8860b', bg: '#fef8e7', border: 'rgba(245,221,180,0.35)', dotC: '#f5ddb4', icon: 'ti-clock' },
    { label: 'logged cycles', value: String(entries.length), c: '#5a8c63', bg: '#edf6ee', border: 'rgba(168,201,174,0.3)', dotC: '#a8c9ae', icon: 'ti-history' },
  ]

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
            </div>
          )}
        </motion.div>

        {/* Phase banner */}
        <motion.div
          className={styles['pt-phase']}
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
                              : [...Array(4)].map((_,i) => (
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
                  <AnimatePresence>
                    {success && (
                      <motion.div className={styles['pt-toast']}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: '#edf6ee', border: '1px solid #a8c9ae', color: '#2a5c33' }}>
                        your cycle has been logged 🌸
                      </motion.div>
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
                                {f.label} flow{e.symptoms?.length > 0 && ` · ${e.symptoms.slice(0,2).join(', ')}`}
                              </div>
                            </div>
                            <div className={styles['pt-hitem-right']}>
                              {dur
                                ? <><div className={styles['pt-hitem-days']}>{dur}</div><div className={styles['pt-hitem-days-lbl']}>days</div></>
                                : <div style={{ fontSize: '11px', color: '#b09aa4', fontStyle: 'italic' }}>ongoing</div>
                              }
                            </div>
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
                    {[1,2,3,4,5].map(n => (
                      <button key={n} className={`${styles['pt-sev-btn']} ${painSeverity >= n ? styles.active : ''}`}
                        onClick={() => setPainSeverity(n)}
                        style={{
                          background: painSeverity >= n
                            ? `hsl(${340 - n * 18},${60 + n * 6}%,${60 - n * 4}%)`
                            : 'transparent',
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
                    placeholder="describe how you feel..."
                    style={{ resize: 'none' }} />

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
                        </motion.div>
                      )
                    })}
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
                      <i className="ti ti-shield-check" style={{ color: '#5a8c63' }} />
                      protected?
                    </span>
                    <button
                      className={`${styles['pt-toggle']} ${sexProtected ? styles.on : styles.off}`}
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
                    placeholder="e.g. pain, discomfort, notes..."
                    style={{ resize: 'none' }} />

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
                    onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}>
                    <i className="ti ti-chevron-left" />
                  </button>
                  <span className={styles['pt-cal-month']}>
                    {calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className={styles['pt-cal-nav-btn']}
                    onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}>
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>

                <div className={styles['pt-cal-grid']}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className={styles['pt-cal-dow']}>{d}</div>
                  ))}
                  {[...Array(firstDay)].map((_,i) => (
                    <div key={`e-${i}`} className={`${styles['pt-cal-day']} ${styles.empty}`} />
                  ))}
                  {[...Array(daysInMon)].map((_,i) => {
                    const day  = i + 1
                    const dStr = `${calYear}-${String(calMon+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    const iPS  = periodStartDates.has(dStr)
                    const iPE  = periodEndDates.has(dStr)
                    const iP   = periodDates.has(dStr)
                    const iPr  = predictedDates.has(dStr)
                    const iOv  = ovulationDates.has(dStr)
                    const isT  = dStr === todayStr
                    const iSex = sexDateSet.has(dStr)
                    const iPain= painDateSet.has(dStr)

                    const cls = [
                      styles['pt-cal-day'],
                      iPS  ? styles['period-start'] : '',
                      !iPS && iPE ? styles['period-end'] : '',
                      !iPS && !iPE && iP  ? styles.period : '',
                      !iP  && iPr ? styles.predicted : '',
                      !iP  && !iPr && iOv ? styles.ovulation : '',
                      isT  ? styles.today    : '',
                      iSex ? styles['sex-day']  : '',
                      iPain? styles['pain-day'] : '',
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
                    { color: 'rgba(155,126,200,0.2)',  label: 'ovulation',  border: '1px solid rgba(155,126,200,0.5)' },
                    { color: '#5a8c63',               label: 'intimacy (dot)' },
                    { color: '#b8860b',               label: 'pain (dot)' },
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
                  { label: 'avg cycle',    value: `${avgCycle} days`, c: '#d4607a', bg: '#fde8ee', border: '#f2b3c0', icon: 'ti-rotate-clockwise' },
                  { label: 'avg period',   value: `${avgPeriod} days`, c: '#9b7ec8', bg: '#f3edfb', border: '#c9b8e8', icon: 'ti-droplet' },
                  { label: 'next period',  value: nextPredicted ? nextPredicted.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', icon: 'ti-clock' },
                  { label: 'ovulation est.', value: lastStart ? addDays(lastStart, avgCycle - 14).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae', icon: 'ti-sparkles' },
                  { label: 'pain logs',    value: String(painLogs.length), c: '#b8860b', bg: '#fef8e7', border: '#f5ddb4', icon: 'ti-bolt' },
                  { label: 'intimacy logs', value: String(sexLogs.length), c: '#5a8c63', bg: '#edf6ee', border: '#a8c9ae', icon: 'ti-heart' },
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
                  const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 6)
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
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
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

              {painLogs.length > 0 && (
                <div className={styles['pt-card']}>
                  <p className={styles['pt-card-lbl']}><i className="ti ti-bolt" style={{ color: '#b8860b' }} /> pain patterns</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {painTypes.map(pt2 => {
                      const count = painLogs.filter(p => p.type === pt2.key).length
                      if (!count) return null
                      const avgSev = (painLogs.filter(p => p.type === pt2.key).reduce((a,p) => a + p.severity, 0) / count).toFixed(1)
                      return (
                        <div key={pt2.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className={`ti ${pt2.icon}`} style={{ fontSize: '15px', color: pt2.c, flexShrink: 0, width: '18px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--ink)', minWidth: '80px' }}>{pt2.label}</span>
                          <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(184,134,11,0.1)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${(Number(avgSev)/5)*100}%` }}
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
                        { label: 'Cycle length',       value: `${cycleProfile.cycle_length} days`,                                             icon: 'ti-rotate-clockwise', c: '#d4607a', bg: '#fde8ee' },
                        { label: 'Period length',       value: `${cycleProfile.period_length} days`,                                            icon: 'ti-droplet',          c: '#9b7ec8', bg: '#f3edfb' },
                        { label: 'Regularity',          value: cycleProfile.cycle_regularity?.replace('_',' ') ?? '—',                         icon: 'ti-activity',         c: '#5a8c63', bg: '#edf6ee' },
                        { label: 'PCOS/PCOD',           value: cycleProfile.has_pcos_pcod ? (cycleProfile.pcos_type?.toUpperCase() ?? 'yes') : 'no', icon: 'ti-ribbon',      c: '#b8860b', bg: '#fef8e7' },
                        { label: 'Birth control',       value: cycleProfile.on_birth_control ? (cycleProfile.birth_control_type ?? 'yes') : 'no', icon: 'ti-pill',          c: '#c05878', bg: '#fde4ec' },
                        { label: 'Trying to conceive',  value: cycleProfile.trying_to_conceive ? 'yes' : 'no',                                  icon: 'ti-heart',           c: '#9b7ec8', bg: '#f3edfb' },
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
                    <button className={styles['pt-submit']} onClick={() => setShowOnboarding(true)}
                      style={{ background: 'linear-gradient(135deg, #d4607a, #9b7ec8)', color: '#fff' }}>
                      update profile
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  )
}