// lib/cycleMath.ts

export type Flow = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy'
export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown'

export type CycleProfileLike = {
  cycle_length?: number | null
  period_length?: number | null
  has_pcos_pcod?: boolean | null
}

export function toYMD(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function parseYMD(s: string): Date {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Whole-day difference between two calendar dates, ignoring time-of-day.
// Both inputs are zeroed to midnight before diffing so the result is
// always a clean integer day count, regardless of when "now" is called.
export function diffDays(a: Date, b: Date): number {
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((bMid.getTime() - aMid.getTime()) / 86_400_000)
}

export function daysUntil(target: Date, from: Date = new Date()): number {
  return diffDays(from, target)
}

export function getPhase(
  lastStart: Date | null,
  cycleLen: number,
  profile: CycleProfileLike | null
): { phase: Phase; day: number; tip: string } {
  if (!lastStart) return { phase: 'unknown', day: 0, tip: 'Log your first period to see your cycle phase.' }

  const today = new Date()
  const day = diffDays(lastStart, today) + 1
  const d = ((day - 1) % cycleLen) + 1
  const periodLen = profile?.period_length ?? 5
  const hasPcos = profile?.has_pcos_pcod ?? false

  if (d <= periodLen)
    return {
      phase: 'menstrual', day: d,
      tip: hasPcos ? 'Rest, hydrate & heat pad — PCOS cramps can be stronger.' : 'Rest well, hydrate, and be gentle with yourself.',
    }
  if (d <= cycleLen - 15)
    return { phase: 'follicular', day: d, tip: 'Energy rising — great time to start new things.' }
  if (d >= cycleLen - 14 && d <= cycleLen - 12)
    return { phase: 'ovulation', day: d, tip: "Peak energy & confidence — you're glowing." }
  return {
    phase: 'luteal', day: d,
    tip: hasPcos ? 'Luteal phase with PCOS can bring stronger symptoms — be extra gentle.' : 'Wind down, nourish yourself, and rest more.',
  }
}

// Single source of truth: given a last period start, cycle/period length,
// returns the next predicted date and the (signed) days until it.
// Negative daysUntilNext means the period is overdue.
export function getNextPrediction(
  lastStart: Date | null,
  cycleLen: number
): { nextPredicted: Date | null; daysUntilNext: number | null } {
  if (!lastStart) return { nextPredicted: null, daysUntilNext: null }
  const nextPredicted = addDays(lastStart, cycleLen)
  return { nextPredicted, daysUntilNext: daysUntil(nextPredicted) }
}