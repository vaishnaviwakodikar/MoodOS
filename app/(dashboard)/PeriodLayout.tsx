'use client'

import { usePeriod } from './PeriodContext'
import styles from './period.module.css'

export default function PeriodLayout({ children }: { children: React.ReactNode }) {
  const isPeriod = usePeriod()
  return (
    <div
      className={isPeriod ? styles.periodMode : ''}
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: isPeriod ? '#160c10' : '#fdf7f0',
        transition: 'background 0.6s ease',
      }}
    >
      {children}
    </div>
  )
}