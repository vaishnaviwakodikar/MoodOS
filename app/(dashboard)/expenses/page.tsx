'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── Constants ────────────────────────────────────────────────────────────────

const CATS = [
  { id: 'food',          label: 'Food',      icon: 'ti-salad',        c: '#5a8c63', bg: '#f0f7f1', bc: 'rgba(90,140,99,.2)'   },
  { id: 'transport',     label: 'Transport', icon: 'ti-car',           c: '#7a5ec8', bg: '#f3f0fb', bc: 'rgba(122,94,200,.2)'  },
  { id: 'shopping',      label: 'Shopping',  icon: 'ti-shopping-bag',  c: '#c85070', bg: '#fde8f0', bc: 'rgba(200,80,112,.2)'  },
  { id: 'health',        label: 'Health',    icon: 'ti-heart-pulse',   c: '#c05060', bg: '#fde8ee', bc: 'rgba(192,80,96,.2)'   },
  { id: 'bills',         label: 'Bills',     icon: 'ti-receipt',       c: '#b8860b', bg: '#fffdf0', bc: 'rgba(184,134,11,.2)'  },
  { id: 'education',     label: 'Study',     icon: 'ti-book',          c: '#1a6b9a', bg: '#ebf5fb', bc: 'rgba(26,107,154,.2)'  },
  { id: 'entertainment', label: 'Fun',       icon: 'ti-confetti',      c: '#9b4ec8', bg: '#f5eafb', bc: 'rgba(155,78,200,.2)'  },
  { id: 'savings',       label: 'Savings',   icon: 'ti-piggy-bank',    c: '#3a8c6a', bg: '#eaf7f0', bc: 'rgba(58,140,106,.2)'  },
  { id: 'other',         label: 'Other',     icon: 'ti-sparkles',      c: '#a08898', bg: '#f7f0f4', bc: 'rgba(160,136,152,.2)' },
] as const

type CatId = typeof CATS[number]['id']

const PAYMENT_METHODS = ['cash', 'UPI', 'card', 'net banking', 'wallet'] as const

const todayIso = new Date().toISOString().slice(0, 10)

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCat(id: string) {
  return CATS.find(c => c.id === id) ?? CATS[8]
}

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function fmtShort(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`
  return `₹${Math.round(n)}`
}

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
  month: string
  amount: number
}

type Tab = 'log' | 'overview' | 'budget' | 'history'

// ── Sub-components ───────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(200,80,112,.1)' }} />
      <span style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: '#a08898' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(200,80,112,.1)' }} />
    </div>
  )
}

function StatCard({
  label, value, icon, c, bg, bc, glyph,
}: { label: string; value: string; icon: string; c: string; bg: string; bc: string; glyph: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: bg, border: `1px solid ${bc}`, borderRadius: 20,
        padding: '18px 16px', position: 'relative', overflow: 'hidden', cursor: 'default',
      }}
    >
      <div style={{ position: 'absolute', bottom: -10, right: -6, fontSize: 48, opacity: .07, lineHeight: 1, color: c }}>{glyph}</div>
      <i className={`ti ${icon}`} style={{ fontSize: 15, color: c, display: 'block', marginBottom: 10 }} />
      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 300, letterSpacing: '-.5px', color: c, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: c, opacity: .55 }}>{label}</div>
    </motion.div>
  )
}

function ExpenseItem({
  exp, onDelete, showDelete = true,
}: { exp: Expense; onDelete?: (id: string) => void; showDelete?: boolean }) {
  const cat = getCat(exp.category)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ x: 3 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        borderRadius: 16, border: '1px solid rgba(200,80,112,.08)',
        background: 'rgba(253,247,242,.7)',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
        <i className={`ti ${cat.icon}`} style={{ color: cat.c }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2e1f28' }}>{exp.title}</div>
        <div style={{ fontSize: 10, color: '#a08898', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ color: cat.c, fontWeight: 600 }}>{cat.label}</span>
          <span>·</span>
          <span>{exp.payment_method}</span>
          {exp.notes && <><span>·</span><span style={{ fontStyle: 'italic' }}>{exp.notes}</span></>}
        </div>
      </div>
      <div style={{ marginLeft: 'auto', fontFamily: 'Fraunces, Georgia, serif', fontSize: 19, fontWeight: 300, color: cat.c, flexShrink: 0 }}>
        {fmtINR(exp.amount)}
      </div>
      {showDelete && onDelete && (
        <button onClick={() => onDelete(exp.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a08898', fontSize: 14, padding: 4, transition: 'color .15s', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#c85070')}
          onMouseLeave={e => (e.currentTarget.style.color = '#a08898')}
        >
          <i className="ti ti-trash" />
        </button>
      )}
    </motion.div>
  )
}

function BarTrack({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: 999, background: 'rgba(200,80,112,.08)', overflow: 'hidden', marginTop: 6 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: .7, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 999, background: color }}
      />
    </div>
  )
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&display=swap');
.ex-root{
  --rose:#c85070;--petal:#fde8f0;--blush:#f5d0de;--rose2:#e8a0b8;
  --lav:#e8daf5;--purple:#9b7ec8;
  --sage:#d4e8d8;--sage2:#5a8c63;--sage3:#a8c9ae;
  --amber:#b8860b;--butter:#fef3e2;
  --cream:#fdf7f2;--ink:#2e1f28;--ink2:#6b4d5c;--ink3:#a08898;
  --card:#fffbfd;--border:rgba(200,80,112,0.1);
  font-family:'DM Sans',sans-serif;
  background:var(--cream);color:var(--ink);
  min-height:100vh;padding:clamp(16px,3vw,32px) clamp(16px,3vw,32px) 48px;
  overflow-x:hidden;position:relative;
}
.ex-root::before{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.025;
  background-image:radial-gradient(circle,#c85070 1px,transparent 1px);
  background-size:32px 32px;
}
.ex-inner{position:relative;z-index:1;max-width:900px;margin:0 auto;}

/* header */
.ex-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:32px;flex-wrap:wrap;}
.ex-eyebrow{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink3);margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.ex-h1{font-family:'Fraunces',serif;font-size:clamp(32px,5vw,50px);font-weight:300;font-style:italic;line-height:1;color:var(--ink);letter-spacing:-1px;margin-bottom:14px;}
.ex-h1 em{color:var(--rose);font-style:normal;}
.ex-tag{display:inline-flex;align-items:center;gap:7px;background:var(--petal);border:1px solid var(--blush);border-radius:999px;padding:7px 18px;font-size:12px;color:var(--rose);font-family:'Fraunces',serif;font-style:italic;}

/* month nav */
.ex-month-nav{display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
.ex-month-row{display:flex;align-items:center;gap:10px;}
.ex-mbtn{width:34px;height:34px;border-radius:50%;background:var(--petal);border:1px solid var(--blush);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--rose);font-size:14px;transition:.15s;}
.ex-mbtn:hover{background:var(--blush);}
.ex-mbtn:disabled{opacity:.28;cursor:not-allowed;}
.ex-month-label{font-family:'Fraunces',serif;font-size:20px;font-weight:300;font-style:italic;color:var(--ink);}

/* stats */
.ex-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}

/* tabs */
.ex-tabs{display:flex;gap:8px;margin-bottom:22px;flex-wrap:wrap;}
.ex-tab{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:999px;font-size:11.5px;font-weight:600;cursor:pointer;transition:all .18s;border:1.5px solid;font-family:'DM Sans',sans-serif;}
.ex-tab i{font-size:14px;}
.ex-tab:hover{transform:scale(1.03);}

/* two-col grid */
.ex-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.ex-col{display:flex;flex-direction:column;gap:16px;}

/* card */
.ex-card{background:var(--card);border:1px solid var(--border);border-radius:22px;padding:22px 20px;}
.ex-card-lbl{font-size:9.5px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink3);margin-bottom:16px;display:flex;align-items:center;gap:7px;}
.ex-card-lbl i{font-size:13px;color:var(--rose);}

/* inputs */
.ex-field-lbl{font-size:9.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:6px;display:flex;align-items:center;gap:5px;}
.ex-field-lbl i{font-size:11px;color:var(--rose);}
.ex-input{width:100%;padding:11px 14px;border-radius:12px;background:rgba(200,80,112,.04);border:1px solid rgba(200,80,112,.14);color:var(--ink);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:.15s;margin-bottom:12px;}
.ex-input:focus{border-color:rgba(200,80,112,.4);background:rgba(200,80,112,.06);box-shadow:0 0 0 3px rgba(200,80,112,.07);}
.ex-amount-wrap{position:relative;margin-bottom:12px;}
.ex-amount-pre{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-family:'Fraunces',serif;font-size:20px;font-weight:300;color:var(--rose);pointer-events:none;}
.ex-amount-in{width:100%;padding:13px 14px 13px 32px;border-radius:14px;background:rgba(200,80,112,.04);border:1.5px solid rgba(200,80,112,.18);color:var(--ink);font-family:'Fraunces',serif;font-size:28px;font-weight:300;letter-spacing:-.5px;outline:none;transition:.15s;}
.ex-amount-in:focus{border-color:rgba(200,80,112,.45);background:rgba(200,80,112,.06);box-shadow:0 0 0 4px rgba(200,80,112,.08);}
.ex-amount-in::placeholder{color:rgba(200,80,112,.25);}

/* category */
.ex-cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:14px;}
.ex-cat-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 6px;border-radius:14px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1.5px solid rgba(200,80,112,.1);background:rgba(253,247,242,.7);transition:all .15s;}
.ex-cat-btn:hover{transform:translateY(-2px);}
.ex-cat-btn i{font-size:18px;}
.ex-cat-lbl{font-size:10px;font-weight:600;}

/* chips */
.ex-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.ex-chip{display:inline-flex;align-items:center;padding:5px 13px;border-radius:999px;border:1.5px solid;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
.ex-chip:hover{transform:scale(1.05);}

/* submit */
.ex-submit{width:100%;padding:13px;border-radius:999px;border:none;font-family:'Fraunces',serif;font-size:16px;font-weight:300;font-style:italic;cursor:pointer;transition:transform .15s,opacity .15s;margin-top:4px;}
.ex-submit:hover:not(:disabled){transform:scale(1.015);}
.ex-submit:disabled{opacity:.35;cursor:not-allowed;}

/* toast */
.ex-toast{padding:10px 14px;border-radius:14px;font-size:12px;font-family:'Fraunces',serif;font-style:italic;background:var(--sage);border:1px solid var(--sage3);color:var(--sage2);text-align:center;margin-top:10px;}

/* empty */
.ex-empty{text-align:center;padding:32px 20px;color:var(--ink3);font-size:13px;font-style:italic;}
.ex-empty i{font-size:28px;display:block;margin-bottom:10px;opacity:.3;}

/* pacing rows */
.ex-pace-row{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:13px;background:rgba(200,80,112,.04);border:1px solid rgba(200,80,112,.07);margin-bottom:8px;}

/* budget form */
.ex-budget-row{display:flex;gap:8px;align-items:flex-end;margin-bottom:16px;}
.ex-bsave{padding:11px 18px;border-radius:999px;border:1.5px solid rgba(200,80,112,.25);font-size:11px;font-weight:600;cursor:pointer;background:var(--petal);color:var(--rose);transition:all .15s;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.ex-bsave:hover{transform:scale(1.03);}

/* footer */
.ex-footer{background:linear-gradient(135deg,var(--petal) 0%,var(--lav) 100%);border:1px solid var(--blush);border-radius:22px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:20px;}
.ex-footer-lbl{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--ink3);margin-bottom:4px;}
.ex-footer-msg{font-family:'Fraunces',serif;font-style:italic;font-size:16px;font-weight:300;color:var(--ink2);}

@keyframes spin{to{transform:rotate(360deg)}}
.spinning{animation:spin .9s linear infinite;display:inline-block;}

@media(max-width:640px){
  .ex-stats{grid-template-columns:repeat(2,1fr);}
  .ex-two{grid-template-columns:1fr;}
}
`

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const supabase = createClient()

  const [expenses,     setExpenses]     = useState<Expense[]>([])
  const [budget,       setBudget]       = useState<Budget | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState<Tab>('log')
  const [dateStr,      setDateStr]      = useState('')

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Form state
  const [title,     setTitle]     = useState('')
  const [amount,    setAmount]    = useState('')
  const [category,  setCategory]  = useState<CatId>('food')
  const [payMethod, setPayMethod] = useState('UPI')
  const [expDate,   setExpDate]   = useState(todayIso)
  const [expNotes,  setExpNotes]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  // Budget form
  const [budgetInput,  setBudgetInput]  = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  const [savedBudget,  setSavedBudget]  = useState(false)

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))
    fetchAll()
  }, [viewMonth])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
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
  }, [viewMonth])

  const addExpense = async () => {
    const amt = parseFloat(amount)
    if (!title.trim() || !amt || amt <= 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('expenses').insert({
      user_id: user.id, title: title.trim(), amount: amt,
      category, payment_method: payMethod, date: expDate,
      notes: expNotes.trim() || null,
    })
    setTitle(''); setAmount(''); setExpNotes('')
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    fetchAll()
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
    await supabase.from('expense_budgets').upsert(
      { user_id: user.id, month: viewMonth, amount: amt },
      { onConflict: 'user_id,month' }
    )
    setSavingBudget(false); setSavedBudget(true)
    setTimeout(() => setSavedBudget(false), 2000)
    fetchAll()
  }

  const navMonth = (dir: -1 | 1) => {
    const [y, m] = viewMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthLabel = new Date(viewMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const isCurrentMonth = viewMonth === todayIso.slice(0, 7)
  const budgetAmt = budget?.amount ?? 0

  // Derived
  const totalSpent  = expenses.reduce((a, e) => a + e.amount, 0)
  const todaySpent  = expenses.filter(e => e.date === todayIso).reduce((a, e) => a + e.amount, 0)
  const uniqueDays  = new Set(expenses.map(e => e.date)).size
  const avgPerDay   = uniqueDays > 0 ? totalSpent / uniqueDays : 0
  const budgetPct   = budgetAmt > 0 ? Math.min(100, Math.round((totalSpent / budgetAmt) * 100)) : 0
  const budgetLeft  = budgetAmt - totalSpent

  const catBreakdown = CATS.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((a, e) => a + e.amount, 0),
    count: expenses.filter(e => e.category === cat.id).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  // Donut segments
  const CIRC = 2 * Math.PI * 52
  let offset = 0
  const donutSegs = totalSpent > 0 ? catBreakdown.map(cat => {
    const dash = CIRC * (cat.total / totalSpent)
    const seg = { ...cat, dash, offset }
    offset += dash
    return seg
  }) : []

  const statCards = [
    { label: 'spent this month', value: fmtShort(totalSpent),  icon: 'ti-receipt',       c: '#c85070', bg: '#fde8f0', bc: 'rgba(200,80,112,.12)', glyph: '₹' },
    { label: 'spent today',      value: fmtShort(todaySpent),  icon: 'ti-calendar',      c: '#7a5ec8', bg: '#f3f0fb', bc: 'rgba(122,94,200,.12)', glyph: '₹' },
    {
      label: 'budget left',
      value: budgetAmt > 0 ? fmtShort(Math.abs(budgetLeft)) : '—',
      icon: budgetLeft < 0 ? 'ti-alert-triangle' : 'ti-piggy-bank',
      c: budgetLeft < 0 ? '#c85070' : '#3a8c6a',
      bg: budgetLeft < 0 ? '#fde8f0' : '#eaf7f0',
      bc: budgetLeft < 0 ? 'rgba(200,80,112,.12)' : 'rgba(58,140,106,.12)',
      glyph: budgetLeft < 0 ? '⚠' : '✓',
    },
    { label: 'avg per day',      value: fmtShort(avgPerDay),   icon: 'ti-trending-up',   c: '#b8860b', bg: '#fffdf0', bc: 'rgba(184,134,11,.12)', glyph: '₹' },
  ]

  const tabCfg = {
    log:      { bg: '#fde8f0', bc: '#e8a0b8', c: '#7a1a35' },
    overview: { bg: '#f3edfb', bc: '#c9b8e8', c: '#4a2a80' },
    budget:   { bg: '#eaf7f0', bc: '#a8c9ae', c: '#1a4a22' },
    history:  { bg: '#fffdf0', bc: '#f5ddb4', c: '#5a3a00' },
  } satisfies Record<Tab, { bg: string; bc: string; c: string }>

  const tabMeta: { id: Tab; icon: string; label: string }[] = [
    { id: 'log',      icon: 'ti-plus',       label: 'log expense' },
    { id: 'overview', icon: 'ti-chart-pie',  label: 'overview'    },
    { id: 'budget',   icon: 'ti-piggy-bank', label: 'budget'      },
    { id: 'history',  icon: 'ti-history',    label: 'history'     },
  ]

  const footerMsg =
    budgetPct >= 100 ? `over budget by ${fmtINR(Math.abs(budgetLeft))} — be gentle with yourself.`
    : budgetPct >= 80  ? `${100 - budgetPct}% of budget left — spend mindfully.`
    : totalSpent > 0   ? `${fmtINR(totalSpent)} spent with intention this month.`
    : 'track every rupee, grow your peace of mind.'

  return (
    <>
      <style>{css}</style>
      <div className="ex-root">
        <div className="ex-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
            <p className="ex-eyebrow">
              <i className="ti ti-sparkles" style={{ color: '#e8a0b8', fontSize: 12 }} />
              {dateStr}
            </p>

            <div className="ex-header">
              <div>
                <h1 className="ex-h1">your <em>money,</em><br />your story</h1>
                <span className="ex-tag">
                  <i className="ti ti-leaf" style={{ fontSize: 12, color: '#e8a0b8' }} />
                  spend with intention
                </span>
              </div>

              <div className="ex-month-nav">
                <div className="ex-month-row">
                  <button className="ex-mbtn" onClick={() => navMonth(-1)}>
                    <i className="ti ti-chevron-left" />
                  </button>
                  <span className="ex-month-label">{monthLabel}</span>
                  <button className="ex-mbtn" onClick={() => navMonth(1)} disabled={isCurrentMonth}
                    style={{ opacity: isCurrentMonth ? .28 : 1, cursor: isCurrentMonth ? 'not-allowed' : 'pointer' }}>
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>
                {budgetAmt > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '6px 15px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    background: budgetPct >= 100 ? '#fde8f0' : '#eaf7f0',
                    border: `1px solid ${budgetPct >= 100 ? 'rgba(200,80,112,.25)' : 'rgba(58,140,106,.3)'}`,
                    color: budgetPct >= 100 ? '#c85070' : '#3a8c6a',
                  }}>
                    <i className={`ti ${budgetPct >= 100 ? 'ti-alert-triangle' : 'ti-check'}`} style={{ fontSize: 12 }} />
                    {budgetPct}% of budget used
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <Divider label="this month at a glance" />

          {/* Stats */}
          <div className="ex-stats">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .06 * i }}>
                <StatCard {...s} />
              </motion.div>
            ))}
          </div>

          <Divider label="manage expenses" />

          {/* Tabs */}
          <div className="ex-tabs">
            {tabMeta.map(t => {
              const active = activeTab === t.id
              const cfg = tabCfg[t.id]
              return (
                <button key={t.id} className="ex-tab" onClick={() => setActiveTab(t.id)}
                  style={{
                    background: active ? cfg.bg : 'transparent',
                    borderColor: active ? cfg.bc : 'rgba(200,80,112,.14)',
                    color: active ? cfg.c : '#a08898',
                  }}>
                  <i className={`ti ${t.icon}`} />
                  {t.label}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ── LOG ── */}
            {activeTab === 'log' && (
              <motion.div key="log" className="ex-two"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

                {/* Form */}
                <div className="ex-card">
                  <p className="ex-card-lbl"><i className="ti ti-plus" /> add expense</p>

                  <div className="ex-field-lbl"><i className="ti ti-currency-rupee" /> amount</div>
                  <div className="ex-amount-wrap">
                    <span className="ex-amount-pre">₹</span>
                    <input className="ex-amount-in" type="number" placeholder="0"
                      value={amount} onChange={e => setAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addExpense()} />
                  </div>

                  <div className="ex-field-lbl"><i className="ti ti-pencil" /> description</div>
                  <input className="ex-input" type="text" placeholder="what did you spend on?"
                    value={title} onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addExpense()} />

                  <div className="ex-field-lbl"><i className="ti ti-tag" /> category</div>
                  <div className="ex-cat-grid">
                    {CATS.map(c => (
                      <button key={c.id} className="ex-cat-btn" onClick={() => setCategory(c.id)}
                        style={category === c.id ? { background: c.bg, borderColor: c.c } : {}}>
                        <i className={`ti ${c.icon}`} style={{ color: category === c.id ? c.c : '#a08898' }} />
                        <span className="ex-cat-lbl" style={{ color: category === c.id ? c.c : '#a08898' }}>{c.label}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div className="ex-field-lbl"><i className="ti ti-calendar" /> date</div>
                      <input type="date" className="ex-input" style={{ marginBottom: 0 }} value={expDate} onChange={e => setExpDate(e.target.value)} />
                    </div>
                    <div>
                      <div className="ex-field-lbl"><i className="ti ti-wallet" /> paid via</div>
                      <div className="ex-chips">
                        {PAYMENT_METHODS.map(pm => (
                          <button key={pm} className="ex-chip" onClick={() => setPayMethod(pm)}
                            style={{
                              background: payMethod === pm ? '#fde8f0' : 'transparent',
                              borderColor: payMethod === pm ? 'rgba(200,80,112,.35)' : 'rgba(200,80,112,.15)',
                              color: payMethod === pm ? '#7a1a35' : '#a08898',
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
                      background: title.trim() && amount ? 'linear-gradient(135deg,#c85070,#9b7ec8)' : 'rgba(200,80,112,.07)',
                      color: title.trim() && amount ? '#fff' : '#b09aa4',
                    }}>
                    {saving ? 'saving…' : saved ? 'expense logged ✨' : 'log this expense'}
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

                {/* Today's list */}
                <div className="ex-card">
                  <p className="ex-card-lbl"><i className="ti ti-calendar-check" /> today's expenses</p>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: 28 }}>
                      <i className="ti ti-loader-2 spinning" style={{ fontSize: 22, color: '#c85070' }} />
                    </div>
                  ) : expenses.filter(e => e.date === todayIso).length === 0 ? (
                    <div className="ex-empty"><i className="ti ti-coin" />nothing logged today yet</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <AnimatePresence>
                          {expenses.filter(e => e.date === todayIso).map(exp => (
                            <ExpenseItem key={exp.id} exp={exp} onDelete={deleteExpense} />
                          ))}
                        </AnimatePresence>
                      </div>
                      <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 14, background: 'rgba(200,80,112,.05)', border: '1px solid rgba(200,80,112,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#a08898', fontWeight: 600 }}>today's total</span>
                        <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 300, color: '#c85070' }}>{fmtINR(todaySpent)}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <motion.div key="overview" className="ex-two"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

                {/* Donut + breakdown */}
                <div className="ex-card">
                  <p className="ex-card-lbl"><i className="ti ti-chart-pie" /> spending by category</p>
                  {catBreakdown.length === 0 ? (
                    <div className="ex-empty"><i className="ti ti-chart-pie" />no expenses this month</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
                        <svg width="130" height="130" viewBox="0 0 130 130">
                          {donutSegs.map((seg, i) => (
                            <motion.circle key={seg.id}
                              cx="65" cy="65" r="52"
                              fill="none"
                              stroke={seg.c}
                              strokeWidth="19"
                              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                              strokeDashoffset={-seg.offset}
                              transform="rotate(-90 65 65)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * .08 }}
                            />
                          ))}
                          <text x="65" y="62" textAnchor="middle" fontFamily="Fraunces,serif" fontSize="13" fontWeight="300" fill="#2e1f28">{fmtShort(totalSpent)}</text>
                          <text x="65" y="75" textAnchor="middle" fontFamily="DM Sans,sans-serif" fontSize="8" fontWeight="600" fill="#a08898" letterSpacing="1.5">TOTAL</text>
                        </svg>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {catBreakdown.map((cat, i) => (
                          <motion.div key={cat.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .05 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <i className={`ti ${cat.icon}`} style={{ fontSize: 12, color: cat.c }} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#2e1f28', flex: 1 }}>{cat.label}</span>
                              <span style={{ fontSize: 10, color: '#a08898' }}>{cat.count} items</span>
                              <span style={{ fontFamily: 'Fraunces,serif', fontSize: 15, fontWeight: 300, color: cat.c }}>{fmtINR(cat.total)}</span>
                            </div>
                            <BarTrack pct={Math.round(cat.total / totalSpent * 100)} color={`linear-gradient(90deg,${cat.c},${cat.bg})`} />
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Budget + top expenses */}
                <div className="ex-col">
                  {budgetAmt > 0 && (
                    <div className="ex-card">
                      <p className="ex-card-lbl"><i className="ti ti-piggy-bank" /> budget tracker</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                        <span style={{ fontFamily: 'Fraunces,serif', fontSize: 30, fontWeight: 300, color: budgetPct >= 100 ? '#c85070' : '#2e1f28' }}>{fmtINR(totalSpent)}</span>
                        <span style={{ fontSize: 12, color: '#a08898' }}>of {fmtINR(budgetAmt)}</span>
                      </div>
                      <BarTrack pct={budgetPct} color={budgetPct >= 100 ? '#c85070' : budgetPct >= 80 ? '#b8860b' : '#3a8c6a'} height={10} />
                      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: budgetLeft < 0 ? '#c85070' : '#3a8c6a' }}>
                        {budgetLeft < 0 ? `₹${Math.abs(Math.round(budgetLeft))} over budget` : `₹${Math.round(budgetLeft)} remaining`}
                      </div>
                    </div>
                  )}
                  <div className="ex-card" style={{ flex: 1 }}>
                    <p className="ex-card-lbl"><i className="ti ti-trending-up" /> top expenses</p>
                    {expenses.length === 0 ? (
                      <div className="ex-empty" style={{ padding: 16 }}><i className="ti ti-receipt" />no expenses yet</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map(exp => (
                          <ExpenseItem key={exp.id} exp={exp} showDelete={false} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── BUDGET ── */}
            {activeTab === 'budget' && (
              <motion.div key="budget" className="ex-two"
                initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>

                <div className="ex-card">
                  <p className="ex-card-lbl"><i className="ti ti-piggy-bank" /> set monthly budget</p>
                  <p style={{ fontSize: 12, color: '#a08898', marginBottom: 18, lineHeight: 1.6 }}>
                    Set a spending limit for {monthLabel}. We'll track how you're doing throughout the month.
                  </p>

                  <div className="ex-field-lbl"><i className="ti ti-currency-rupee" /> monthly budget</div>
                  <div className="ex-budget-row">
                    <div className="ex-amount-wrap" style={{ flex: 1, marginBottom: 0 }}>
                      <span className="ex-amount-pre">₹</span>
                      <input className="ex-amount-in" type="number" placeholder="0" style={{ fontSize: 22 }}
                        value={budgetInput} onChange={e => setBudgetInput(e.target.value)} />
                    </div>
                    <button className="ex-bsave" onClick={saveBudget} disabled={savingBudget}>
                      {savingBudget ? <i className="ti ti-loader-2 spinning" /> : savedBudget ? 'saved ✓' : 'save budget'}
                    </button>
                  </div>

                  {budgetAmt > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: 14, borderRadius: 16, background: budgetPct >= 100 ? '#fde8f0' : '#eaf7f0', border: `1px solid ${budgetPct >= 100 ? 'rgba(200,80,112,.2)' : 'rgba(58,140,106,.3)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: budgetPct >= 100 ? '#c85070' : '#3a8c6a' }}>
                          {budgetPct >= 100 ? '⚠ over budget' : `${100 - budgetPct}% remaining`}
                        </span>
                        <span style={{ fontSize: 11, color: '#a08898' }}>{fmtINR(totalSpent)} / {fmtINR(budgetAmt)}</span>
                      </div>
                      <BarTrack pct={Math.min(100, budgetPct)} color={budgetPct >= 100 ? '#c85070' : budgetPct >= 80 ? '#b8860b' : '#3a8c6a'} height={8} />
                    </motion.div>
                  )}

                  <div className="ex-field-lbl" style={{ marginTop: 18 }}><i className="ti ti-zap" /> quick set</div>
                  <div className="ex-chips">
                    {[5000, 10000, 15000, 20000, 30000, 50000].map(amt => (
                      <button key={amt} className="ex-chip" onClick={() => setBudgetInput(String(amt))}
                        style={{
                          background: budgetInput === String(amt) ? 'rgba(58,140,106,.1)' : 'transparent',
                          borderColor: budgetInput === String(amt) ? '#3a8c6a' : 'rgba(200,80,112,.15)',
                          color: budgetInput === String(amt) ? '#3a8c6a' : '#a08898',
                        }}>
                        {fmtShort(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ex-col">
                  {/* Pacing */}
                  <div className="ex-card">
                    <p className="ex-card-lbl"><i className="ti ti-calendar-stats" /> monthly pacing</p>
                    {(() => {
                      const [y, m] = viewMonth.split('-').map(Number)
                      const daysInMonth = new Date(y, m, 0).getDate()
                      const dayOfMonth  = isCurrentMonth ? new Date().getDate() : daysInMonth
                      const projected   = dayOfMonth > 0 ? (totalSpent / dayOfMonth) * daysInMonth : 0
                      return [
                        { label: 'days tracked',   value: `${uniqueDays} / ${daysInMonth}`, c: '#7a5ec8' },
                        { label: 'avg per day',    value: fmtINR(avgPerDay),                 c: '#b8860b' },
                        { label: 'projected total',value: fmtINR(projected),                 c: projected > budgetAmt && budgetAmt > 0 ? '#c85070' : '#3a8c6a' },
                        { label: 'transactions',   value: String(expenses.length),            c: '#c85070' },
                      ].map(row => (
                        <div key={row.label} className="ex-pace-row">
                          <span style={{ fontSize: 12, color: '#a08898', fontWeight: 500 }}>{row.label}</span>
                          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 17, fontWeight: 300, color: row.c }}>{row.value}</span>
                        </div>
                      ))
                    })()}
                  </div>

                  {/* By payment method */}
                  <div className="ex-card" style={{ flex: 1 }}>
                    <p className="ex-card-lbl"><i className="ti ti-wallet" /> by payment method</p>
                    {PAYMENT_METHODS.map(pm => {
                      const pmTotal = expenses.filter(e => e.payment_method === pm).reduce((a, e) => a + e.amount, 0)
                      if (!pmTotal) return null
                      return (
                        <div key={pm} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#2e1f28' }}>{pm}</span>
                            <span style={{ fontSize: 11, color: '#a08898' }}>{fmtINR(pmTotal)}</span>
                          </div>
                          <BarTrack pct={totalSpent ? Math.round(pmTotal / totalSpent * 100) : 0} color="linear-gradient(90deg,#c85070,#9b7ec8)" />
                        </div>
                      )
                    })}
                    {expenses.length === 0 && <div className="ex-empty" style={{ padding: 12 }}><i className="ti ti-wallet" />no data yet</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── HISTORY ── */}
            {activeTab === 'history' && (
              <motion.div key="history"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div className="ex-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <p className="ex-card-lbl" style={{ marginBottom: 0 }}>
                      <i className="ti ti-history" />
                      {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                    </p>
                    <span style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 300, color: '#c85070' }}>{fmtINR(totalSpent)}</span>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: 28 }}>
                      <i className="ti ti-loader-2 spinning" style={{ fontSize: 22, color: '#c85070' }} />
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="ex-empty"><i className="ti ti-receipt" />no expenses logged for {monthLabel}</div>
                  ) : (() => {
                    const grouped: Record<string, Expense[]> = {}
                    expenses.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })
                    return Object.entries(grouped).map(([date, exps], gi) => (
                      <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * .05 }}
                        style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.5px', color: date === todayIso ? '#c85070' : '#a08898' }}>
                            {date === todayIso ? 'today' : new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 15, fontWeight: 300, color: '#c85070' }}>
                            {fmtINR(exps.reduce((a, e) => a + e.amount, 0))}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <AnimatePresence>
                            {exps.map(exp => <ExpenseItem key={exp.id} exp={exp} onDelete={deleteExpense} />)}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.div className="ex-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 }}>
            <div>
              <p className="ex-footer-lbl">money intention</p>
              <p className="ex-footer-msg">{footerMsg}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: 20, color: '#e8a0b8', flexShrink: 0 }}>
              <i className="ti ti-coin" />
              <i className="ti ti-leaf" />
            </div>
          </motion.div>

        </div>
      </div>
    </>
  )
}