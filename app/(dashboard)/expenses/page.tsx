'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'food',        label: 'Food',        icon: 'ti-salad',        c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.35)', dotC: '#a8c9ae' },
  { id: 'transport',   label: 'Transport',   icon: 'ti-car',          c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)',  dotC: '#c9b8e8' },
  { id: 'shopping',    label: 'Shopping',    icon: 'ti-shopping-bag', c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.18)',  dotC: '#e8a0b0' },
  { id: 'health',      label: 'Health',      icon: 'ti-heart-pulse',  c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.18)',  dotC: '#e8a0b0' },
  { id: 'bills',       label: 'Bills',       icon: 'ti-receipt',      c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)',  dotC: '#f5ddb4' },
  { id: 'education',   label: 'Education',   icon: 'ti-book',         c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)',  dotC: '#f5ddb4' },
  { id: 'entertainment',label:'Fun',         icon: 'ti-confetti',     c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)',  dotC: '#c9b8e8' },
  { id: 'savings',     label: 'Savings',     icon: 'ti-piggy-bank',   c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.35)', dotC: '#a8c9ae' },
  { id: 'other',       label: 'Other',       icon: 'ti-sparkles',     c: '#b09aa4', bg: '#f5f0f2', border: 'rgba(176,154,164,0.2)',  dotC: '#d0bcc8' },
]

const PAYMENT_METHODS = ['cash', 'UPI', 'card', 'net banking', 'wallet']

const todayIso = new Date().toISOString().slice(0, 10)

function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[8]
}
function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
function fmtINRShort(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`
  return `₹${Math.round(n)}`
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  .ex {
    --rose:   #d4607a;
    --petal:  #fde8ee;
    --blush:  #f2c4ce;
    --blush2: #e8a0b0;
    --lav:    #e8daf5;
    --lav2:   #c9b8e8;
    --purple: #9b7ec8;
    --cream:  #fdf7f0;
    --ink:    #3d2a35;
    --ink2:   #7a5c68;
    --ink3:   #b09aa4;
    --card:   #fff9fb;
    --sage:   #d4e8d8;
    --sage2:  #a8c9ae;
    --butter: #fef3e2;
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    padding: clamp(16px,3vw,32px) clamp(16px,3vw,32px) 40px;
    overflow-x: hidden;
    width: 100%;
  }

  /* header */
  .ex-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .ex-header-left { flex: 1; min-width: 0; }
  .ex-eyebrow { font-size: 10px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; }
  .ex-h1 { font-family: 'Fraunces', serif; font-size: clamp(28px,5.5vw,44px); font-weight: 300; font-style: italic; letter-spacing: -1px; line-height: 1.05; color: var(--ink); margin-bottom: 12px; }
  .ex-h1 .accent { color: var(--rose); }
  .ex-vibe { display: inline-flex; align-items: center; gap: 8px; background: var(--petal); border: 1px solid rgba(212,96,122,0.18); border-radius: 999px; padding: 6px 16px; font-size: 12px; color: var(--rose); font-family: 'Fraunces', serif; font-style: italic; }

  /* month nav */
  .ex-month-nav { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .ex-month-btn { width: 32px; height: 32px; border-radius: 50%; background: rgba(212,96,122,0.08); border: 1px solid rgba(212,96,122,0.18); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; color: var(--rose); transition: background 0.15s; }
  .ex-month-btn:hover { background: rgba(212,96,122,0.16); }
  .ex-month-label { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; font-style: italic; color: var(--ink); white-space: nowrap; }

  /* divider */
  .ex-divider { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
  .ex-divider-line { flex: 1; height: 1px; background: rgba(212,96,122,0.12); }
  .ex-divider-label { font-size: 9px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); white-space: nowrap; }
  .ex-divider-ico { font-size: 11px; color: var(--blush2); }

  /* stat cards */
  .ex-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
  .ex-stat { border-radius: 20px; padding: 16px; position: relative; overflow: hidden; transition: transform 0.2s ease; }
  .ex-stat:hover { transform: translateY(-3px); }
  .ex-stat::after { content: ''; position: absolute; bottom: -18px; right: -18px; width: 56px; height: 56px; border-radius: 50%; opacity: 0.22; pointer-events: none; background: var(--dot-c, #f2c4ce); }
  .ex-stat-ico { font-size: 16px; opacity: 0.45; margin-bottom: 8px; }
  .ex-stat-val { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px; }
  .ex-stat-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; opacity: 0.5; }

  /* tabs */
  .ex-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .ex-tab { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 999px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; border: 1px solid; background: none; }
  .ex-tab:hover { transform: scale(1.03); }
  .ex-tab i { font-size: 13px; }

  /* card */
  .ex-card { background: var(--card); border: 1px solid rgba(212,96,122,0.12); border-radius: 22px; padding: clamp(16px,2vw,24px); }
  .ex-card-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
  .ex-card-lbl i { font-size: 12px; color: var(--rose); }

  /* inputs */
  .ex-input { width: 100%; padding: 10px 14px; border-radius: 12px; background: rgba(212,96,122,0.04); border: 1px solid rgba(212,96,122,0.15); color: var(--ink); font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.15s; margin-bottom: 10px; }
  .ex-input:focus { border-color: rgba(212,96,122,0.4); background: rgba(212,96,122,0.06); box-shadow: 0 0 0 3px rgba(212,96,122,0.08); }
  .ex-input-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
  .ex-input-lbl i { font-size: 11px; color: var(--rose); }

  /* amount input — special */
  .ex-amount-wrap { position: relative; margin-bottom: 10px; }
  .ex-amount-prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; color: var(--rose); pointer-events: none; }
  .ex-amount-input { width: 100%; padding: 12px 14px 12px 30px; border-radius: 12px; background: rgba(212,96,122,0.04); border: 1px solid rgba(212,96,122,0.2); color: var(--ink); font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; letter-spacing: -0.5px; outline: none; transition: all 0.15s; }
  .ex-amount-input:focus { border-color: rgba(212,96,122,0.45); background: rgba(212,96,122,0.06); box-shadow: 0 0 0 3px rgba(212,96,122,0.1); }
  .ex-amount-input::placeholder { color: rgba(212,96,122,0.3); }

  /* category grid */
  .ex-cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin-bottom: 10px; }
  .ex-cat-btn { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; background: rgba(253,247,240,0.8); border: 1px solid rgba(212,96,122,0.1); transition: all 0.15s; }
  .ex-cat-btn:hover { transform: translateX(2px); }
  .ex-cat-btn i { font-size: 14px; flex-shrink: 0; }
  .ex-cat-lbl { font-size: 11px; font-weight: 500; }

  /* chips */
  .ex-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .ex-chip { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 999px; border: 1px solid; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; background: none; font-family: 'DM Sans', sans-serif; }
  .ex-chip:hover { transform: scale(1.04); }

  /* submit */
  .ex-submit { width: 100%; padding: 12px; border-radius: 999px; border: none; font-family: 'Fraunces', serif; font-size: 15px; font-weight: 300; font-style: italic; cursor: pointer; transition: transform 0.15s, opacity 0.15s; }
  .ex-submit:hover { transform: scale(1.02); }
  .ex-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* expense list */
  .ex-list { display: flex; flex-direction: column; gap: 8px; }
  .ex-item { display: flex; align-items: center; gap: 11px; padding: 13px 14px; border-radius: 16px; border: 1px solid rgba(212,96,122,0.08); background: rgba(253,247,240,0.6); transition: transform 0.15s; }
  .ex-item:hover { transform: translateX(2px); }
  .ex-item-ico { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .ex-item-name { font-size: 13px; font-weight: 600; color: var(--ink); }
  .ex-item-meta { font-size: 10px; color: var(--ink3); margin-top: 2px; display: flex; align-items: center; gap: 5px; }
  .ex-item-amount { margin-left: auto; font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; flex-shrink: 0; }
  .ex-del-btn { background: none; border: none; cursor: pointer; color: var(--ink3); font-size: 13px; padding: 4px; transition: color 0.15s; flex-shrink: 0; }
  .ex-del-btn:hover { color: var(--rose); }

  /* budget bar */
  .ex-budget-track { height: 6px; border-radius: 999px; background: rgba(212,96,122,0.08); overflow: hidden; margin-top: 6px; }
  .ex-budget-fill  { height: 100%; border-radius: 999px; transition: width 0.6s ease; }

  /* donut chart area */
  .ex-donut-wrap { display: flex; flex-direction: column; align-items: center; padding: 8px 0; }

  /* toast */
  .ex-toast { padding: 9px 14px; border-radius: 12px; font-size: 11px; font-family: 'Fraunces', serif; font-style: italic; background: var(--sage); border: 1px solid rgba(168,201,174,0.5); color: #5a8c63; text-align: center; margin-top: 8px; }

  /* empty */
  .ex-empty { text-align: center; padding: 32px 20px; color: var(--ink3); font-size: 13px; font-style: italic; }
  .ex-empty i { font-size: 30px; display: block; margin-bottom: 10px; opacity: 0.35; }

  /* footer */
  .ex-footer { background: linear-gradient(135deg, var(--petal) 0%, var(--lav) 100%); border: 1px solid rgba(212,96,122,0.14); border-radius: 20px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
  .ex-footer-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 4px; }
  .ex-footer-msg { font-family: 'Fraunces', serif; font-style: italic; font-size: 15px; font-weight: 300; color: var(--ink2); }
  .ex-footer-ico { font-size: 20px; color: var(--blush2); }

  /* budget set form */
  .ex-budget-form { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 16px; }
  .ex-budget-form .ex-input { margin-bottom: 0; flex: 1; }
  .ex-budget-save { padding: 10px 18px; border-radius: 999px; border: none; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer; background: var(--petal); color: var(--rose); border: 1px solid rgba(212,96,122,0.25); transition: all 0.15s; white-space: nowrap; }
  .ex-budget-save:hover { transform: scale(1.03); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinning { animation: spin 0.9s linear infinite; display: inline-block; }

  @media (max-width: 768px) {
    .ex-stats  { grid-template-columns: repeat(2,1fr); }
    .ex-two-col { grid-template-columns: 1fr !important; }
    .ex-cat-grid { grid-template-columns: repeat(3,1fr); }
  }
  @media (max-width: 380px) {
    .ex { padding-left: 14px; padding-right: 14px; }
  }
`

// ── Types ────────────────────────────────────────────────────────────────────

type Expense = {
  id: string
  user_id: string
  title: string
  amount: number
  category: string
  payment_method: string
  date: string
  notes: string | null
  created_at: string
}

type Budget = {
  id: string
  user_id: string
  month: string   // YYYY-MM
  amount: number
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const supabase = createClient()

  const [expenses,   setExpenses]   = useState<Expense[]>([])
  const [budget,     setBudget]     = useState<Budget | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState<'log' | 'overview' | 'budget' | 'history'>('log')
  const [dateStr,    setDateStr]    = useState('')

  // month navigation
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })

  // add form
  const [title,         setTitle]         = useState('')
  const [amount,        setAmount]        = useState('')
  const [category,      setCategory]      = useState('food')
  const [payMethod,     setPayMethod]     = useState('UPI')
  const [expDate,       setExpDate]       = useState(todayIso)
  const [expNotes,      setExpNotes]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)

  // budget form
  const [budgetInput,   setBudgetInput]   = useState('')
  const [savingBudget,  setSavingBudget]  = useState(false)
  const [savedBudget,   setSavedBudget]   = useState(false)

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))
    fetchAll()
  }, [viewMonth])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: e }, { data: b }] = await Promise.all([
      supabase.from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .like('date', `${viewMonth}-%`)
        .order('date', { ascending: false }),
      supabase.from('expense_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', viewMonth)
        .single(),
    ])
    setExpenses(e || [])
    setBudget(b || null)
    if (b) setBudgetInput(String(b.amount))
    setLoading(false)
  }

  const addExpense = async () => {
    const amt = parseFloat(amount)
    if (!title.trim() || !amt || amt <= 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('expenses').insert({
      user_id: user.id,
      title: title.trim(),
      amount: amt,
      category,
      payment_method: payMethod,
      date: expDate,
      notes: expNotes.trim() || null,
    })
    setTitle(''); setAmount(''); setExpNotes('')
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    setSaving(false); fetchAll()
  }

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id)
    fetchAll()
  }

  const saveBudget = async () => {
    const amt = parseFloat(budgetInput)
    if (!amt || amt <= 0) return
    setSavingBudget(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingBudget(false); return }
    await supabase.from('expense_budgets').upsert({
      user_id: user.id, month: viewMonth, amount: amt,
    }, { onConflict: 'user_id,month' })
    setSavedBudget(true); setTimeout(() => setSavedBudget(false), 2000)
    setSavingBudget(false); fetchAll()
  }

  const prevMonth = () => {
    const [y, m] = viewMonth.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }
  const nextMonth = () => {
    const [y, m] = viewMonth.split('-').map(Number)
    const d = new Date(y, m, 1)
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }
  const monthLabel = new Date(viewMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const isCurrentMonth = viewMonth === todayIso.slice(0, 7)

  // derived
  const totalSpent    = expenses.reduce((a, e) => a + e.amount, 0)
  const budgetAmt     = budget?.amount ?? 0
  const budgetPct     = budgetAmt > 0 ? Math.min(100, Math.round((totalSpent / budgetAmt) * 100)) : 0
  const budgetLeft    = budgetAmt - totalSpent
  const todaySpent    = expenses.filter(e => e.date === todayIso).reduce((a, e) => a + e.amount, 0)
  const avgPerDay     = (() => {
    const days = new Set(expenses.map(e => e.date)).size
    return days > 0 ? totalSpent / days : 0
  })()

  // category breakdown
  const catBreakdown = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((a, e) => a + e.amount, 0),
    count: expenses.filter(e => e.category === cat.id).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  // donut segments
  const donutSegments = (() => {
    if (!totalSpent) return []
    let offset = 0
    const R = 52, CIRC = 2 * Math.PI * R
    return catBreakdown.map(cat => {
      const pct = cat.total / totalSpent
      const dash = CIRC * pct
      const seg = { ...cat, dash, offset, pct: Math.round(pct * 100) }
      offset += dash
      return seg
    })
  })()

  const statCards = [
    { label: 'spent this month', value: fmtINRShort(totalSpent),   c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.12)', dotC: '#e8a0b0', icon: 'ti-receipt' },
    { label: 'today',            value: fmtINRShort(todaySpent),   c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)', dotC: '#c9b8e8', icon: 'ti-calendar' },
    { label: 'budget left',      value: budgetAmt > 0 ? fmtINRShort(Math.abs(budgetLeft)) : '—', c: budgetLeft < 0 ? '#d4607a' : '#5a8c63', bg: budgetLeft < 0 ? '#fff9fb' : '#f8fcf8', border: budgetLeft < 0 ? 'rgba(212,96,122,0.12)' : 'rgba(168,201,174,0.3)', dotC: budgetLeft < 0 ? '#e8a0b0' : '#a8c9ae', icon: budgetLeft < 0 ? 'ti-alert-triangle' : 'ti-piggy-bank' },
    { label: 'avg / day',        value: fmtINRShort(avgPerDay),    c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)', dotC: '#f5ddb4', icon: 'ti-trending-up' },
  ]

  const tabColors: Record<string, { bg: string; border: string; color: string }> = {
    log:      { bg: '#fde8ee', border: '#e8a0b0', color: '#7a1a35' },
    overview: { bg: '#f3edfb', border: '#c9b8e8', color: '#4a2a80' },
    budget:   { bg: '#f8fcf8', border: '#a8c9ae', color: '#1a4a22' },
    history:  { bg: '#fffdf5', border: '#f5ddb4', color: '#5a3a00' },
  }

  return (
    <>
      <style>{css}</style>
      <div className="ex">

        {/* Header */}
        <motion.div className="ex-header"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44 }}>
          <div className="ex-header-left">
            <p className="ex-eyebrow">
              <i className="ti ti-coin" style={{ color: '#e8a0b0', fontSize: 13 }} />
              {dateStr}
            </p>
            <h1 className="ex-h1">your <span className="accent">money,</span><br />your story</h1>
            <span className="ex-vibe">
              <i className="ti ti-leaf" style={{ fontSize: 12, color: '#e8a0b0' }} />
              spend with intention
            </span>
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
            <div className="ex-month-nav">
              <button className="ex-month-btn" onClick={prevMonth}><i className="ti ti-chevron-left" /></button>
              <span className="ex-month-label">{monthLabel}</span>
              <button className="ex-month-btn" onClick={nextMonth} disabled={isCurrentMonth}
                style={{ opacity: isCurrentMonth ? 0.3 : 1, cursor: isCurrentMonth ? 'not-allowed' : 'pointer' }}>
                <i className="ti ti-chevron-right" />
              </button>
            </div>
            {budgetAmt > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: budgetPct >= 90 ? '#fde8ee' : '#f8fcf8', border: `1px solid ${budgetPct >= 90 ? 'rgba(212,96,122,0.25)' : 'rgba(168,201,174,0.3)'}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: budgetPct >= 90 ? '#d4607a' : '#5a8c63' }}>{budgetPct}% of budget used</span>
                {budgetPct >= 90 && <i className="ti ti-alert-triangle" style={{ color: '#d4607a', fontSize: 12 }} />}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <ExDivider label="this month at a glance" />
        <div className="ex-stats">
          {statCards.map((s, i) => (
            <motion.div key={s.label} className="ex-stat"
              style={{ background: s.bg, border: `1px solid ${s.border}`, ['--dot-c' as string]: s.dotC }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}>
              <i className={`ti ${s.icon} ex-stat-ico`} style={{ color: s.c }} />
              <div className="ex-stat-val" style={{ color: s.c }}>{s.value}</div>
              <div className="ex-stat-lbl" style={{ color: s.c }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <ExDivider label="manage expenses" />

        {/* Tabs */}
        <div className="ex-tabs">
          {(['log', 'overview', 'budget', 'history'] as const).map(t => {
            const active = activeTab === t
            const cfg = tabColors[t]
            const icons = { log: 'ti-plus', overview: 'ti-chart-pie', budget: 'ti-piggy-bank', history: 'ti-history' }
            const labels = { log: 'log expense', overview: 'overview', budget: 'budget', history: 'history' }
            return (
              <button key={t} className="ex-tab"
                onClick={() => setActiveTab(t)}
                style={{
                  background: active ? cfg.bg : 'var(--card)',
                  borderColor: active ? cfg.border : 'rgba(212,96,122,0.12)',
                  color: active ? cfg.color : '#b09aa4',
                }}>
                <i className={`ti ${icons[t]}`} />
                {labels[t]}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ── LOG ── */}
          {activeTab === 'log' && (
            <motion.div key="log"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}
              className="ex-two-col"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              {/* Form */}
              <div className="ex-card">
                <p className="ex-card-lbl"><i className="ti ti-plus" /> add expense</p>

                <div className="ex-input-lbl"><i className="ti ti-currency-rupee" /> amount</div>
                <div className="ex-amount-wrap">
                  <span className="ex-amount-prefix">₹</span>
                  <input className="ex-amount-input" type="number" placeholder="0"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addExpense()} />
                </div>

                <div className="ex-input-lbl"><i className="ti ti-pencil" /> description</div>
                <input className="ex-input" placeholder="what did you spend on?"
                  value={title} onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addExpense()} />

                <div className="ex-input-lbl"><i className="ti ti-tag" /> category</div>
                <div className="ex-cat-grid">
                  {CATEGORIES.map(c => (
                    <button key={c.id} className="ex-cat-btn"
                      onClick={() => setCategory(c.id)}
                      style={{
                        background: category === c.id ? c.bg : undefined,
                        borderColor: category === c.id ? c.c : undefined,
                      }}>
                      <i className={`ti ${c.icon}`} style={{ color: category === c.id ? c.c : '#b09aa4' }} />
                      <span className="ex-cat-lbl" style={{ color: category === c.id ? c.c : '#b09aa4' }}>{c.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div className="ex-input-lbl"><i className="ti ti-calendar" /> date</div>
                    <input type="date" className="ex-input" value={expDate} onChange={e => setExpDate(e.target.value)} />
                  </div>
                  <div>
                    <div className="ex-input-lbl"><i className="ti ti-wallet" /> paid via</div>
                    <div className="ex-chips">
                      {PAYMENT_METHODS.map(pm => (
                        <button key={pm} className="ex-chip"
                          onClick={() => setPayMethod(pm)}
                          style={{
                            background: payMethod === pm ? 'var(--petal)' : 'transparent',
                            borderColor: payMethod === pm ? 'rgba(212,96,122,0.35)' : 'rgba(212,96,122,0.15)',
                            color: payMethod === pm ? '#7a1a35' : '#b09aa4',
                          }}>
                          {pm}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="ex-submit" onClick={addExpense}
                  disabled={!title.trim() || !amount || saving}
                  style={{
                    background: title.trim() && amount ? 'linear-gradient(135deg,#d4607a,#9b7ec8)' : 'rgba(212,96,122,0.08)',
                    color: title.trim() && amount ? '#fff' : '#b09aa4',
                    marginTop: 4,
                  }}>
                  {saving ? 'saving...' : saved ? 'expense logged ✨' : title.trim() && amount ? 'log expense' : 'fill in details first'}
                </button>
                <AnimatePresence>
                  {saved && (
                    <motion.div className="ex-toast"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      expense logged — every rupee accounted for 🌿
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Today's expenses */}
              <div className="ex-card">
                <p className="ex-card-lbl"><i className="ti ti-calendar-check" /> today's expenses</p>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '28px' }}>
                    <i className="ti ti-loader-2 spinning" style={{ fontSize: 22, color: 'var(--rose)' }} />
                  </div>
                ) : expenses.filter(e => e.date === todayIso).length === 0 ? (
                  <div className="ex-empty"><i className="ti ti-coin" />nothing logged today yet</div>
                ) : (
                  <>
                    <div className="ex-list">
                      {expenses.filter(e => e.date === todayIso).map((exp, i) => {
                        const cat = getCat(exp.category)
                        return (
                          <motion.div key={exp.id} className="ex-item"
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}>
                            <div className="ex-item-ico" style={{ background: cat.bg }}>
                              <i className={`ti ${cat.icon}`} style={{ color: cat.c }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="ex-item-name">{exp.title}</div>
                              <div className="ex-item-meta">
                                <span style={{ color: cat.c, fontWeight: 600 }}>{cat.label}</span>
                                <span>·</span>
                                <span>{exp.payment_method}</span>
                              </div>
                            </div>
                            <div className="ex-item-amount" style={{ color: cat.c }}>{fmtINR(exp.amount)}</div>
                            <button className="ex-del-btn" onClick={() => deleteExpense(exp.id)}>
                              <i className="ti ti-trash" />
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(212,96,122,0.04)', border: '1px solid rgba(212,96,122,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#b09aa4', fontWeight: 500 }}>today's total</span>
                      <span style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 300, color: '#d4607a' }}>{fmtINR(todaySpent)}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}
              className="ex-two-col"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              {/* Donut + breakdown */}
              <div className="ex-card">
                <p className="ex-card-lbl"><i className="ti ti-chart-pie" /> spending by category</p>
                {catBreakdown.length === 0 ? (
                  <div className="ex-empty"><i className="ti ti-chart-pie" />no expenses this month</div>
                ) : (
                  <>
                    {/* Donut */}
                    <div className="ex-donut-wrap">
                      <svg width="128" height="128" viewBox="0 0 128 128">
                        {donutSegments.map((seg, i) => {
                          const CIRC = 2 * Math.PI * 52
                          return (
                            <motion.circle key={seg.id}
                              cx="64" cy="64" r="52"
                              fill="none"
                              stroke={seg.c}
                              strokeWidth="18"
                              strokeLinecap="butt"
                              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                              strokeDashoffset={-seg.offset}
                              transform="rotate(-90 64 64)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.08 }}
                            />
                          )
                        })}
                        <text x="64" y="60" textAnchor="middle" fontSize="13" fontFamily="Fraunces,serif" fontWeight="300" fill="#3d2a35">{fmtINRShort(totalSpent)}</text>
                        <text x="64" y="74" textAnchor="middle" fontSize="8" fontWeight="500" fontFamily="DM Sans" letterSpacing="1.5" fill="#b09aa4">TOTAL</text>
                      </svg>
                    </div>

                    {/* Legend / bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {catBreakdown.map((cat, i) => (
                        <motion.div key={cat.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                            <i className={`ti ${cat.icon}`} style={{ fontSize: 12, color: cat.c }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{cat.label}</span>
                            <span style={{ fontSize: 11, color: '#b09aa4' }}>{cat.count} items</span>
                            <span style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 300, color: cat.c }}>{fmtINR(cat.total)}</span>
                          </div>
                          <div className="ex-budget-track">
                            <motion.div className="ex-budget-fill"
                              initial={{ width: 0 }} animate={{ width: `${Math.round((cat.total / totalSpent) * 100)}%` }}
                              transition={{ duration: 0.65, delay: i * 0.04 }}
                              style={{ background: `linear-gradient(90deg,${cat.c},${cat.dotC})` }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Budget progress + top expenses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {budgetAmt > 0 && (
                  <div className="ex-card">
                    <p className="ex-card-lbl"><i className="ti ti-piggy-bank" /> budget tracker</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'Fraunces,serif', fontSize: 28, fontWeight: 300, color: budgetPct >= 100 ? '#d4607a' : '#3d2a35' }}>{fmtINR(totalSpent)}</span>
                      <span style={{ fontSize: 12, color: '#b09aa4' }}>of {fmtINR(budgetAmt)}</span>
                    </div>
                    <div className="ex-budget-track" style={{ height: 10 }}>
                      <motion.div className="ex-budget-fill"
                        initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ background: budgetPct >= 100 ? '#d4607a' : budgetPct >= 80 ? '#b8860b' : '#5a8c63' }} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: budgetLeft < 0 ? '#d4607a' : '#5a8c63', fontWeight: 600 }}>
                      {budgetLeft < 0
                        ? `₹${Math.abs(Math.round(budgetLeft))} over budget`
                        : `₹${Math.round(budgetLeft)} remaining`}
                    </div>
                  </div>
                )}

                <div className="ex-card" style={{ flex: 1 }}>
                  <p className="ex-card-lbl"><i className="ti ti-trending-up" /> top expenses this month</p>
                  {expenses.length === 0 ? (
                    <div className="ex-empty" style={{ padding: '16px' }}><i className="ti ti-receipt" />no expenses yet</div>
                  ) : (
                    <div className="ex-list">
                      {[...expenses].sort((a,b) => b.amount - a.amount).slice(0, 5).map((exp, i) => {
                        const cat = getCat(exp.category)
                        return (
                          <div key={exp.id} className="ex-item">
                            <div className="ex-item-ico" style={{ background: cat.bg }}>
                              <i className={`ti ${cat.icon}`} style={{ color: cat.c }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="ex-item-name">{exp.title}</div>
                              <div className="ex-item-meta">
                                <span style={{ color: cat.c, fontWeight: 600 }}>{cat.label}</span>
                                <span>·</span>
                                <span>{new Date(exp.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            </div>
                            <div className="ex-item-amount" style={{ color: cat.c }}>{fmtINR(exp.amount)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── BUDGET ── */}
          {activeTab === 'budget' && (
            <motion.div key="budget"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}
              className="ex-two-col"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>

              <div className="ex-card">
                <p className="ex-card-lbl"><i className="ti ti-piggy-bank" /> set monthly budget</p>
                <p style={{ fontSize: 12, color: '#b09aa4', marginBottom: 16, lineHeight: 1.5 }}>
                  Set a spending limit for {monthLabel}. We'll track how you're doing throughout the month.
                </p>

                <div className="ex-input-lbl"><i className="ti ti-currency-rupee" /> monthly budget (₹)</div>
                <div className="ex-budget-form">
                  <div className="ex-amount-wrap" style={{ flex: 1, marginBottom: 0 }}>
                    <span className="ex-amount-prefix">₹</span>
                    <input className="ex-amount-input" type="number" placeholder="0"
                      value={budgetInput} onChange={e => setBudgetInput(e.target.value)} />
                  </div>
                  <button className="ex-budget-save" onClick={saveBudget} disabled={savingBudget}>
                    {savingBudget ? <i className="ti ti-loader-2 spinning" /> : savedBudget ? 'saved ✓' : 'save budget'}
                  </button>
                </div>

                {budgetAmt > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '14px', borderRadius: 14, background: budgetPct >= 100 ? '#fde8ee' : '#f8fcf8', border: `1px solid ${budgetPct >= 100 ? 'rgba(212,96,122,0.2)' : 'rgba(168,201,174,0.3)'}`, marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: budgetPct >= 100 ? '#d4607a' : '#5a8c63' }}>
                        {budgetPct >= 100 ? '⚠ over budget' : `${100 - budgetPct}% remaining`}
                      </span>
                      <span style={{ fontSize: 11, color: '#b09aa4' }}>{fmtINR(totalSpent)} / {fmtINR(budgetAmt)}</span>
                    </div>
                    <div className="ex-budget-track" style={{ height: 8 }}>
                      <motion.div className="ex-budget-fill"
                        initial={{ width: 0 }} animate={{ width: `${Math.min(100, budgetPct)}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ background: budgetPct >= 100 ? '#d4607a' : budgetPct >= 80 ? '#b8860b' : '#5a8c63' }} />
                    </div>
                  </motion.div>
                )}

                {/* Quick preset budgets */}
                <div className="ex-input-lbl" style={{ marginTop: 16 }}><i className="ti ti-zap" /> quick set</div>
                <div className="ex-chips">
                  {[5000, 10000, 15000, 20000, 30000, 50000].map(amt => (
                    <button key={amt} className="ex-chip"
                      onClick={() => setBudgetInput(String(amt))}
                      style={{
                        background: budgetInput === String(amt) ? 'rgba(90,140,99,0.1)' : 'transparent',
                        borderColor: budgetInput === String(amt) ? '#5a8c63' : 'rgba(212,96,122,0.15)',
                        color: budgetInput === String(amt) ? '#5a8c63' : '#b09aa4',
                      }}>
                      {fmtINRShort(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily average & pacing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="ex-card">
                  <p className="ex-card-lbl"><i className="ti ti-calendar-stats" /> monthly pacing</p>
                  {(() => {
                    const [y, m] = viewMonth.split('-').map(Number)
                    const daysInMonth = new Date(y, m, 0).getDate()
                    const dayOfMonth  = isCurrentMonth ? new Date().getDate() : daysInMonth
                    const projectedTotal = dayOfMonth > 0 ? (totalSpent / dayOfMonth) * daysInMonth : 0
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { label: 'days tracked',      value: `${new Set(expenses.map(e=>e.date)).size} / ${daysInMonth}`, c: '#9b7ec8' },
                          { label: 'avg per day',        value: fmtINR(avgPerDay),                    c: '#b8860b' },
                          { label: 'projected total',    value: fmtINR(projectedTotal),               c: projectedTotal > budgetAmt && budgetAmt > 0 ? '#d4607a' : '#5a8c63' },
                          { label: 'transactions',       value: String(expenses.length),              c: '#d4607a' },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: 'rgba(212,96,122,0.04)', border: '1px solid rgba(212,96,122,0.08)' }}>
                            <span style={{ fontSize: 12, color: '#b09aa4', fontWeight: 500 }}>{row.label}</span>
                            <span style={{ fontFamily: 'Fraunces,serif', fontSize: 16, fontWeight: 300, color: row.c }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                <div className="ex-card">
                  <p className="ex-card-lbl"><i className="ti ti-wallet" /> by payment method</p>
                  {PAYMENT_METHODS.map(pm => {
                    const pmTotal = expenses.filter(e => e.payment_method === pm).reduce((a, e) => a + e.amount, 0)
                    if (!pmTotal) return null
                    const pct = totalSpent ? Math.round((pmTotal / totalSpent) * 100) : 0
                    return (
                      <div key={pm} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{pm}</span>
                          <span style={{ fontSize: 11, color: '#b09aa4' }}>{fmtINR(pmTotal)}</span>
                        </div>
                        <div className="ex-budget-track">
                          <motion.div className="ex-budget-fill"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                            style={{ background: 'linear-gradient(90deg,#d4607a,#9b7ec8)' }} />
                        </div>
                      </div>
                    )
                  })}
                  {expenses.length === 0 && <div className="ex-empty" style={{ padding: '12px' }}><i className="ti ti-wallet" />no data</div>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── HISTORY ── */}
          {activeTab === 'history' && (
            <motion.div key="history"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
              <div className="ex-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p className="ex-card-lbl" style={{ marginBottom: 0 }}>
                    <i className="ti ti-history" />
                    {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · {fmtINR(totalSpent)}
                  </p>
                </div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '28px' }}>
                    <i className="ti ti-loader-2 spinning" style={{ fontSize: 22, color: 'var(--rose)' }} />
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="ex-empty"><i className="ti ti-receipt" />no expenses logged for {monthLabel}</div>
                ) : (
                  (() => {
                    // group by date
                    const grouped: Record<string, Expense[]> = {}
                    expenses.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })
                    return Object.entries(grouped).map(([date, exps], gi) => (
                      <motion.div key={date}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: gi * 0.05 }}
                        style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: date === todayIso ? '#d4607a' : '#b09aa4', letterSpacing: '0.5px' }}>
                            {date === todayIso ? 'today' : new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 300, color: '#d4607a' }}>
                            {fmtINR(exps.reduce((a, e) => a + e.amount, 0))}
                          </span>
                        </div>
                        <div className="ex-list">
                          {exps.map((exp, i) => {
                            const cat = getCat(exp.category)
                            return (
                              <div key={exp.id} className="ex-item">
                                <div className="ex-item-ico" style={{ background: cat.bg }}>
                                  <i className={`ti ${cat.icon}`} style={{ color: cat.c }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className="ex-item-name">{exp.title}</div>
                                  <div className="ex-item-meta">
                                    <span style={{ color: cat.c, fontWeight: 600 }}>{cat.label}</span>
                                    <span>·</span>
                                    <span>{exp.payment_method}</span>
                                    {exp.notes && <><span>·</span><span style={{ fontStyle: 'italic' }}>{exp.notes}</span></>}
                                  </div>
                                </div>
                                <div className="ex-item-amount" style={{ color: cat.c }}>{fmtINR(exp.amount)}</div>
                                <button className="ex-del-btn" onClick={() => deleteExpense(exp.id)}>
                                  <i className="ti ti-trash" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    ))
                  })()
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div className="ex-footer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div>
            <p className="ex-footer-lbl">money intention</p>
            <p className="ex-footer-msg">
              {budgetPct >= 100
                ? `over budget by ${fmtINR(Math.abs(budgetLeft))} — be gentle with yourself.`
                : budgetPct >= 80
                  ? `${100 - budgetPct}% of budget left — spend mindfully.`
                  : totalSpent > 0
                    ? `${fmtINR(totalSpent)} spent with intention this month.`
                    : 'track every rupee, grow your peace of mind.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-coin ex-footer-ico" />
            <i className="ti ti-leaf ex-footer-ico" />
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function ExDivider({ label }: { label: string }) {
  return (
    <div className="ex-divider">
      <div className="ex-divider-line" />
      <i className="ti ti-circle ex-divider-ico" />
      <span className="ex-divider-label">{label}</span>
      <i className="ti ti-circle ex-divider-ico" />
      <div className="ex-divider-line" />
    </div>
  )
}