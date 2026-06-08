'use client'

import { useState, useEffect } from 'react'

export function useTheme() {
  // ✅ Default is 'light' — no dark flash on first paint
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('moodos-theme') as 'dark' | 'light' | null
    // ✅ Only apply saved value if it's actually valid
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('moodos-theme', next)
  }

  return { theme, toggle }
}