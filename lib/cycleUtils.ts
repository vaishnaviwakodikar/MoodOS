export type Flow = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy'
export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown'

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function toYMD(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function parseYMD(s: string): Date {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}

export function getPhase(
  lastStart: Date | null,
  cycleLen: number,
  opts?: { periodLength?: number; hasPcos?: boolean }
): { phase: Phase; day: number; tip: string } {
  if (!lastStart) {
    return { phase: 'unknown', day: 0, tip: 'Not enough data yet to estimate a phase.' }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = diffDays(lastStart, today) + 1
  const d = ((day - 1) % cycleLen) + 1
  const periodLen = opts?.periodLength ?? 5
  const hasPcos = opts?.hasPcos ?? false
  if (d <= periodLen)
    return {
      phase: 'menstrual',
      day: d,
      tip: hasPcos ? 'PCOS cramps can be stronger during this phase.' : 'On their period - a good time to check in gently.',
    }
  if (d <= cycleLen - 15)
    return { phase: 'follicular', day: d, tip: 'Energy is typically rising during this phase.' }
  if (d >= cycleLen - 14 && d <= cycleLen - 12)
    return { phase: 'ovulation', day: d, tip: 'Peak energy window - ovulation phase.' }
  return {
    phase: 'luteal',
    day: d,
    tip: hasPcos ? 'Luteal phase with PCOS can bring stronger symptoms.' : 'Winding down before the next cycle.',
  }
}

export const phaseConfig = {
  menstrual:  { label: 'menstrual phase',  c: '#d4607a', bg: '#fde8ee', border: 'rgba(212,96,122,0.2)',  icoBg: 'rgba(212,96,122,0.12)', emoji: 'period', ico: 'ti-droplet' },
  follicular: { label: 'follicular phase', c: '#5a8c63', bg: '#edf6ee', border: 'rgba(90,140,99,0.2)',   icoBg: 'rgba(90,140,99,0.12)',  emoji: 'sprout', ico: 'ti-leaf' },
  ovulation:  { label: 'ovulation phase',  c: '#9b7ec8', bg: '#f3edfb', border: 'rgba(155,126,200,0.2)', icoBg: 'rgba(155,126,200,0.12)', emoji: 'spark',  ico: 'ti-sparkles' },
  luteal:     { label: 'luteal phase',     c: '#b8860b', bg: '#fef8e7', border: 'rgba(184,134,11,0.2)',  icoBg: 'rgba(184,134,11,0.12)', emoji: 'moon',   ico: 'ti-moon' },
  unknown:    { label: 'phase unknown',    c: '#b09aa4', bg: '#f5f0f2', border: 'rgba(176,154,164,0.2)', icoBg: 'rgba(176,154,164,0.12)', emoji: 'quest',  ico: 'ti-calendar-heart' },
} as const

export const flowMeta = {
  spotting:   { label: 'spotting',    c: '#e8a0b0', bg: '#fff5f7' },
  light:      { label: 'light',       c: '#d4607a', bg: '#fde8ee' },
  medium:     { label: 'medium',      c: '#9b7ec8', bg: '#f3edfb' },
  heavy:      { label: 'heavy',       c: '#b8860b', bg: '#fef8e7' },
  very_heavy: { label: 'very heavy',  c: '#8b1a35', bg: '#fde0e7' },
} as const