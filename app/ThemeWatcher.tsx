'use client'

import { useEffect } from 'react'

export default function ThemeWatcher() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) =>
      document.documentElement.classList.toggle('dark', e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return null
}