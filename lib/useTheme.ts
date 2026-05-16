'use client'

import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('moodos-theme') as 'dark' | 'light'
    if (saved) setTheme(saved)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('moodos-theme', next)
  }

  return { theme, toggle }
}