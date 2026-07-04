'use client'

import { usePeriod } from './PeriodContext'
import styles from './period.module.css'

export default function PeriodLayout({ children }: { children: React.ReactNode }) {
  const isPeriod = usePeriod()
  return (
    <div className={isPeriod ? styles.periodWrap : styles.normalWrap}>
      <div className={isPeriod ? styles.periodFilter : ''}>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            background: isPeriod ? '#160c10' : '#fdf7f0',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}