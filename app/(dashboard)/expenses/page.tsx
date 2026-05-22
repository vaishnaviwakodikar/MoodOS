
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── Constants ────────────────────────────────────────────────────────────────

const CATS = [
  { id: 'food',          label: 'Food',       icon: 'ti-salad',       c: '#2D6A4F', bg: '#ECF5F0', bc: '#B7DEC9', dot: '#52B788' },
  { id: 'transport',     label: 'Transport',  icon: 'ti-car',          c: '#4A3F8F', bg: '#EFECFA', bc: '#C5BBF0', dot: '#7C6FD6' },
  { id: 'shopping',      label: 'Shopping',   icon: 'ti-shopping-bag', c: '#8B3A62', bg: '#F9EBF3', bc: '#EDBED7', dot: '#C96E9D' },
  { id: 'health',        label: 'Health',     icon: 'ti-heart-pulse',  c: '#8B2A2A', bg: '#FAEAEA', bc: '#EDBDBD', dot: '#C96060' },
  { id: 'bills',         label: 'Bills',      icon: 'ti-receipt',      c: '#7A5C00', bg: '#FBF6E6', bc: '#E8D48A', dot: '#C49A00' },
  { id: 'education',     label: 'Study',      icon: 'ti-book',         c: '#004F7C', bg: '#E6F3FB', bc: '#A0CDE8', dot: '#1B7FBB' },
  { id: 'entertainment', label: 'Fun',        icon: 'ti-confetti',     c: '#5E2F8F', bg: '#F3EBFB', bc: '#CCAEF0', dot: '#9B5FD4' },
  { id: 'savings',       label: 'Savings',    icon: 'ti-piggy-bank',   c: '#1A5E3A', bg: '#E6F5ED', bc: '#9DD5B5', dot: '#37A866' },
  { id: 'other',         label: 'Other',      icon: 'ti-sparkles',     c: '#5A4A56', bg: '#F5F1F4', bc: '#D0C2CC', dot: '#9E8898' },
  { id: 'savings-pot', icon: 'ti-piggy-bank', label: 'Savings Pot' },
  { id: 'ledger', icon: 'ti-arrows-exchange', label: 'Lend & Borrow' },
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
type LedgerEntry = {
  id: string; user_id: string; name: string; amount: number
  type: 'lent' | 'borrowed'; date: string; notes: string | null
  settled: boolean; settled_date: string | null; created_at: string
}

type Tab = 'log' | 'overview' | 'budget' | 'history' | 'savings-pot' | 'ledger'

// ── CSS ──────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.xp {
  --ink:   #1A1018;
  --ink2:  #4A3848;
  --ink3:  #8A7A86;
  --ink4:  #C4B8C0;
  --paper: #FAF8F6;
  --paper2:#F3EFF0;
  --card:  #FFFFFF;
  --rose:  #C95070;
  --rose2: #E8A0B8;
  --rose3: #FAF0F4;
  --line:  rgba(26,16,24,0.08);
  --line2: rgba(26,16,24,0.05);
  font-family: 'DM Sans', sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ─ Layout ─ */
.xp-wrap { max-width: 100%; margin: 0; padding: 0 clamp(16px,3vw,40px) 64px; }

/* ─ Top strip ─ */
.xp-topstrip {
  border-bottom: 1px solid var(--line);
  padding: 14px 0;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 48px;
}
.xp-topstrip-left { display: flex; align-items: center; gap: 20px; }
.xp-logotype {
  font-family: 'Playfair Display', serif;
  font-size: 17px; font-weight: 500; letter-spacing: -.3px;
  color: var(--ink);
}
.xp-logotype em { color: var(--rose); font-style: italic; }
.xp-topdate { font-size: 11px; letter-spacing: .5px; color: var(--ink3); }

/* ─ Hero ─ */
.xp-hero { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 32px; margin-bottom: 56px; }
.xp-hero-eyebrow {
  font-size: 10px; letter-spacing: 3.5px; text-transform: uppercase;
  color: var(--rose); font-weight: 600; margin-bottom: 16px;
  display: flex; align-items: center; gap: 8px;
}
.xp-hero-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--rose); display: block; }
.xp-h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(38px, 6vw, 64px);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -1.5px;
  color: var(--ink);
}
.xp-h1 em { color: var(--rose); font-style: italic; }
.xp-hero-sub {
  font-size: 13px; color: var(--ink3); margin-top: 16px;
  display: flex; align-items: center; gap: 10px;
}
.xp-hero-sub::before { content: ''; width: 1px; height: 28px; background: var(--rose2); display: block; }

/* Month widget */
.xp-month-widget { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.xp-month-inner { display: flex; align-items: center; gap: 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--card); }
.xp-marrow { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: var(--ink3); font-size: 15px; transition: .15s; }
.xp-marrow:hover { color: var(--rose); background: var(--rose3); }
.xp-marrow:disabled { opacity: .25; cursor: not-allowed; }
.xp-mlabel { padding: 0 14px; font-family: 'Playfair Display', serif; font-size: 15px; font-style: italic; color: var(--ink); white-space: nowrap; border-left: 1px solid var(--line); border-right: 1px solid var(--line); }
.xp-budget-badge {
  font-size: 10.5px; font-weight: 600; padding: 5px 14px; border-radius: 999px;
  display: flex; align-items: center; gap: 6px;
}

/* ─ Rule ─ */
.xp-rule { display: flex; align-items: center; gap: 14px; margin: 40px 0 32px; }
.xp-rule-line { flex: 1; height: 1px; background: var(--line); }
.xp-rule-label { font-size: 9px; letter-spacing: 3.5px; text-transform: uppercase; color: var(--ink4); white-space: nowrap; }

/* ─ Stats band ─ */
.xp-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; margin-bottom: 48px; }
.xp-stat { background: var(--card); padding: 22px 20px; position: relative; overflow: hidden; }
.xp-stat::after { content: attr(data-glyph); position: absolute; bottom: -8px; right: 8px; font-size: 52px; opacity: .04; line-height: 1; color: var(--ink); font-family: 'Playfair Display', serif; pointer-events: none; }
.xp-stat-lbl { font-size: 9.5px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 10px; }
.xp-stat-val { font-family: 'Playfair Display', serif; font-size: clamp(20px,2.5vw,30px); font-weight: 400; color: var(--ink); letter-spacing: -1px; line-height: 1; }
.xp-stat-sub { font-size: 10px; color: var(--ink4); margin-top: 5px; }

/* ─ Tabs ─ */
.xp-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--line); margin-bottom: 32px; overflow-x: auto; }
.xp-tab {
  padding: 12px 22px 13px; font-size: 12px; font-weight: 600; letter-spacing: .3px;
  color: var(--ink3); cursor: pointer; background: none; border: none;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  display: flex; align-items: center; gap: 8px; transition: .15s;
  white-space: nowrap; font-family: 'DM Sans', sans-serif;
}
.xp-tab i { font-size: 14px; }
.xp-tab:hover { color: var(--ink); }
.xp-tab.active { color: var(--rose); border-bottom-color: var(--rose); }

/* ─ Two-col ─ */
.xp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.xp-col { display: flex; flex-direction: column; gap: 20px; }

/* ─ Card ─ */
.xp-card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 24px 22px; }
.xp-card-title { font-size: 9.5px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
.xp-card-title i { font-size: 13px; color: var(--rose); }

/* ─ Form fields ─ */
.xp-field-label { font-size: 9.5px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
.xp-field-label i { font-size: 11px; color: var(--rose); }
.xp-input {
  width: 100%; padding: 10px 13px; border-radius: 10px;
  background: var(--paper); border: 1px solid var(--line);
  color: var(--ink); font-size: 13px; font-family: 'DM Sans', sans-serif;
  outline: none; transition: .15s; margin-bottom: 14px;
}
.xp-input:focus { border-color: rgba(201,80,112,.4); background: #fff; box-shadow: 0 0 0 3px rgba(201,80,112,.06); }
.xp-amount-wrap { position: relative; margin-bottom: 16px; }
.xp-amount-sym { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-family: 'Playfair Display', serif; font-size: 22px; color: var(--rose2); pointer-events: none; }
.xp-amount-in {
  width: 100%; padding: 14px 14px 14px 36px;
  border-radius: 14px; background: var(--rose3);
  border: 1.5px solid rgba(201,80,112,.12);
  color: var(--ink); font-family: 'Playfair Display', serif;
  font-size: 30px; font-weight: 400; letter-spacing: -1px;
  outline: none; transition: .15s;
}
.xp-amount-in:focus { border-color: rgba(201,80,112,.4); background: #fff; box-shadow: 0 0 0 4px rgba(201,80,112,.06); }
.xp-amount-in::placeholder { color: rgba(201,80,112,.2); }

/* ─ Categories ─ */
.xp-cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin-bottom: 16px; }
.xp-cat-btn {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 11px 6px; border-radius: 12px; cursor: pointer;
  border: 1px solid var(--line); background: var(--paper);
  font-family: 'DM Sans', sans-serif; transition: all .15s;
}
.xp-cat-btn:hover { border-color: rgba(201,80,112,.25); }
.xp-cat-btn i { font-size: 17px; }
.xp-cat-btn span { font-size: 9.5px; font-weight: 600; letter-spacing: .3px; }

/* ─ Chips ─ */
.xp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.xp-chip {
  padding: 5px 13px; border-radius: 999px;
  border: 1px solid var(--line); background: var(--paper);
  font-size: 11px; font-weight: 500; color: var(--ink2);
  cursor: pointer; transition: all .15s; font-family: 'DM Sans', sans-serif;
}
.xp-chip:hover { border-color: rgba(201,80,112,.3); color: var(--rose); }
.xp-chip.active { background: var(--rose3); border-color: rgba(201,80,112,.4); color: var(--rose); }

/* ─ CTA button ─ */
.xp-cta {
  width: 100%; padding: 13px; border-radius: 12px; border: none;
  font-family: 'Playfair Display', serif; font-size: 15px; font-style: italic;
  font-weight: 400; cursor: pointer; transition: .18s;
  background: var(--ink); color: #fff; letter-spacing: .2px;
  margin-top: 6px;
}
.xp-cta:hover:not(:disabled) { background: var(--rose); transform: translateY(-1px); }
.xp-cta:disabled { opacity: .3; cursor: not-allowed; }
.xp-cta.filled { background: var(--rose); }
.xp-cta.filled:hover:not(:disabled) { background: #a83d5c; }

/* ─ Toast ─ */
.xp-toast {
  padding: 10px 14px; border-radius: 10px; font-size: 12px; font-style: italic;
  font-family: 'Playfair Display', serif; background: #EAF5EE;
  border: 1px solid #B7DEC9; color: #2D6A4F; text-align: center; margin-top: 10px;
}

/* ─ Expense item ─ */
.xp-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 13px; border-radius: 13px;
  border: 1px solid var(--line2); background: var(--paper);
  transition: .15s;
}
.xp-item:hover { border-color: var(--line); background: #fff; }
.xp-item-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
}
.xp-item-del { background: none; border: none; cursor: pointer; color: var(--ink4); font-size: 13px; padding: 4px; transition: .15s; flex-shrink: 0; border-radius: 6px; }
.xp-item-del:hover { color: var(--rose); background: var(--rose3); }

/* ─ Bar track ─ */
.xp-bar { height: 4px; border-radius: 999px; background: rgba(26,16,24,.07); overflow: hidden; margin-top: 6px; }
.xp-bar-fill { height: 100%; border-radius: 999px; transition: width .7s cubic-bezier(.16,1,.3,1); }

/* ─ Donut ─ */
.xp-donut-wrap { display: flex; justify-content: center; padding: 8px 0 20px; }

/* ─ Budget inline ─ */
.xp-budget-row { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 18px; }
.xp-bsave { padding: 11px 20px; border-radius: 10px; border: 1px solid var(--line); font-size: 11px; font-weight: 600; cursor: pointer; background: var(--paper); color: var(--ink2); transition: .15s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
.xp-bsave:hover { background: var(--ink); color: #fff; border-color: var(--ink); }

/* ─ Pacing row ─ */
.xp-pace-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 13px; border-radius: 10px; background: var(--paper); border: 1px solid var(--line2); margin-bottom: 7px; }

/* ─ Empty ─ */
.xp-empty { text-align: center; padding: 36px 20px; color: var(--ink4); font-size: 13px; font-style: italic; font-family: 'Playfair Display', serif; }
.xp-empty i { font-size: 26px; display: block; margin-bottom: 10px; opacity: .3; }

/* ─ Total strip ─ */
.xp-total-strip { margin-top: 14px; padding: 11px 15px; border-radius: 12px; background: var(--rose3); border: 1px solid rgba(201,80,112,.1); display: flex; justify-content: space-between; align-items: center; }

/* ─ Spinning ─ */
@keyframes spin { to { transform: rotate(360deg) } }
.spin { animation: spin .9s linear infinite; display: inline-block; }

/* ─ Budget progress ─ */
.xp-progress-wrap { border-radius: 14px; padding: 14px 16px; margin-top: 14px; }

/* ─ Quick amounts ─ */
.xp-quick { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }

/* ─ Footer ─ */
.xp-footer { margin-top: 40px; padding: 24px 28px; border-radius: 20px; background: var(--card); border: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.xp-footer-eyebrow { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--ink4); margin-bottom: 5px; }
.xp-footer-msg { font-family: 'Playfair Display', serif; font-style: italic; font-size: 15px; font-weight: 400; color: var(--ink2); }
.xp-footer-icons { display: flex; gap: 8px; font-size: 18px; color: var(--rose2); flex-shrink: 0; }

/* ─ Date group header ─ */
.xp-date-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 0 2px; }
.xp-date-label { font-size: 10.5px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink3); }
.xp-date-label.today { color: var(--rose); }
.xp-date-total { font-family: 'Playfair Display', serif; font-size: 15px; color: var(--rose); }

/* ─ Section header ─ */
.xp-section-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.xp-section-total { font-family: 'Playfair Display', serif; font-size: 19px; color: var(--rose); }

/* ─ Color accent bar ─ */
.xp-accent { width: 3px; border-radius: 2px; flex-shrink: 0; align-self: stretch; }

/* ─ Pot type toggle ─ */
.xp-pot-toggle { display: flex; gap: 0; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
.xp-pot-toggle-btn { flex: 1; padding: 9px; font-size: 11px; font-weight: 600; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: .15s; background: var(--paper); color: var(--ink3); display: flex; align-items: center; justify-content: center; gap: 6px; }
.xp-pot-toggle-btn.active-add { background: #E6F5ED; color: #1A5E3A; }
.xp-pot-toggle-btn.active-withdraw { background: #FAEAEA; color: #8B2A2A; }

/* ─ Pot entry ─ */
.xp-pot-entry { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line2); background: var(--paper); }
.xp-pot-entry:hover { background: #fff; border-color: var(--line); }

/* ─ Pot total ring ─ */
.xp-pot-ring { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 140px; height: 140px; border-radius: 50%; border: 3px solid #9DD5B5; background: #E6F5ED; flex-shrink: 0; }

@media (max-width: 640px) {
  .xp-stats { grid-template-columns: repeat(2,1fr); }
  .xp-two   { grid-template-columns: 1fr; }
  .xp-hero  { grid-template-columns: 1fr; }
  .xp-month-widget { align-items: flex-start; }
}
`

// ── Sub-components ────────────────────────────────────────────────────────────

function Rule({ label }: { label: string }) {
  return (
    <div className="xp-rule">
      <div className="xp-rule-line" />
      <span className="xp-rule-label">{label}</span>
      <div className="xp-rule-line" />
    </div>
  )
}

function Bar({ pct, color, h = 4 }: { pct: number; color: string; h?: number }) {
  return (
    <div className="xp-bar" style={{ height: h }}>
      <motion.div
        className="xp-bar-fill"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: .7, ease: [.16, 1, .3, 1] }}
        style={{ background: color }}
      />
    </div>
  )
}

function ExpenseItem({ exp, onDelete, showDelete = true }: { exp: Expense; onDelete?: (id: string) => void; showDelete?: boolean }) {
  const cat = getCat(exp.category)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="xp-item"
    >
      <div className="xp-item-icon" style={{ background: cat.bg }}>
        <i className={`ti ${cat.icon}`} style={{ color: cat.c }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.title}</div>
        <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cat.dot, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: cat.c, fontWeight: 600 }}>{cat.label}</span>
          </span>
          <span style={{ color: 'var(--ink4)' }}>·</span>
          <span>{exp.payment_method}</span>
          {exp.notes && <><span style={{ color: 'var(--ink4)' }}>·</span><span style={{ fontStyle: 'italic', color: 'var(--ink4)' }}>{exp.notes}</span></>}
        </div>
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 400, color: cat.c, flexShrink: 0, letterSpacing: '-.5px' }}>
        {fmtINR(exp.amount)}
      </div>
      {showDelete && onDelete && (
        <button className="xp-item-del" onClick={() => onDelete(exp.id)} aria-label="Delete expense">
          <i className="ti ti-trash" />
        </button>
      )}
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

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

  const [title,     setTitle]     = useState('')
  const [amount,    setAmount]    = useState('')
  const [category,  setCategory]  = useState<CatId>('food')
  const [payMethod, setPayMethod] = useState('UPI')
  const [expDate,   setExpDate]   = useState(todayIso)
  const [expNotes,  setExpNotes]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  const [budgetInput,  setBudgetInput]  = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  const [savedBudget,  setSavedBudget]  = useState(false)

  const [potEntries,  setPotEntries]  = useState<{ id: string; label: string; amount: number; type: 'add' | 'withdraw'; date: string }[]>([])
  const [potAmount,   setPotAmount]   = useState('')
  const [potLabel,    setPotLabel]    = useState('')
  const [potType,     setPotType]     = useState<'add' | 'withdraw'>('add')
  const [savingPot,   setSavingPot]   = useState(false)
  const [savedPot,    setSavedPot]    = useState(false)

  const [ledger,        setLedger]        = useState<LedgerEntry[]>([])
const [ledgerName,    setLedgerName]     = useState('')
const [ledgerAmount,  setLedgerAmount]   = useState('')
const [ledgerType,    setLedgerType]     = useState<'lent'|'borrowed'>('lent')
const [ledgerDate,    setLedgerDate]     = useState(todayIso)
const [ledgerNotes,   setLedgerNotes]    = useState('')
const [ledgerFilter,  setLedgerFilter]   = useState<'all'|'lent'|'borrowed'|'settled'>('all')
const [savingLedger,  setSavingLedger]   = useState(false)
const [savedLedger,   setSavedLedger]    = useState(false)

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
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
        .gte('date', `${viewMonth}-01`)
        .lte('date', `${viewMonth}-31`)
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

    // ── Pot fetch ──
const { data: pot } = await supabase
  .from('savings_pot')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false })

setPotEntries(pot || [])

// ── Ledger fetch ──
const { data: ledgerData } = await supabase
  .from('ledger_entries')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false })

setLedger(ledgerData || [])

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
    setTimeout(() => setSaved(false), 2800)
    fetchAll()
  }

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id)
    fetchAll()
  }

  // ── Pot ──
  const addPotEntry = async () => {
    const amt = parseFloat(potAmount)
    if (!potLabel.trim() || !amt || amt <= 0) return
    setSavingPot(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingPot(false); return }
    await supabase.from('savings_pot').insert({
      user_id: user.id, label: potLabel.trim(),
      amount: amt, type: potType, date: todayIso,
    })
    setPotLabel(''); setPotAmount('')
    setSavingPot(false); setSavedPot(true)
    setTimeout(() => setSavedPot(false), 2500)
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
    setTimeout(() => setSavedBudget(false), 2200)
    fetchAll()
  }

  /* ── Ledger ── */
const addLedgerEntry = async () => {
  const amt = parseFloat(ledgerAmount)

  if (!ledgerName.trim() || !amt || amt <= 0) return

  setSavingLedger(true)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    setSavingLedger(false)
    return
  }

  await supabase.from('ledger_entries').insert({
    user_id: user.id,
    name: ledgerName.trim(),
    amount: amt,
    type: ledgerType,
    date: ledgerDate,
    notes: ledgerNotes.trim() || null,
  })

  setLedgerName('')
  setLedgerAmount('')
  setLedgerNotes('')
  setLedgerDate(todayIso)

  setSavingLedger(false)
  setSavedLedger(true)

  setTimeout(() => setSavedLedger(false), 2500)

  fetchAll()
}

const toggleSettled = async (entry: LedgerEntry) => {
  await supabase
    .from('ledger_entries')
    .update({
      settled: !entry.settled,
      settled_date: !entry.settled ? todayIso : null,
    })
    .eq('id', entry.id)

  fetchAll()
}

const deleteLedgerEntry = async (id: string) => {
  await supabase
    .from('ledger_entries')
    .delete()
    .eq('id', id)

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

  const totalSpent = expenses.reduce((a, e) => a + e.amount, 0)
  const todaySpent = expenses.filter(e => e.date === todayIso).reduce((a, e) => a + e.amount, 0)
  const uniqueDays = new Set(expenses.map(e => e.date)).size
  const avgPerDay  = uniqueDays > 0 ? totalSpent / uniqueDays : 0
  const budgetPct  = budgetAmt > 0 ? Math.min(100, Math.round((totalSpent / budgetAmt) * 100)) : 0
  const budgetLeft = budgetAmt - totalSpent

  const activeLedger    = ledger.filter(e => !e.settled)
const lentTotal       = activeLedger.filter(e => e.type === 'lent').reduce((a, e) => a + e.amount, 0)
const borrowedTotal   = activeLedger.filter(e => e.type === 'borrowed').reduce((a, e) => a + e.amount, 0)
const netPosition     = lentTotal - borrowedTotal
const filteredLedger  = ledgerFilter === 'all' ? ledger
  : ledgerFilter === 'settled' ? ledger.filter(e => e.settled)
  : ledger.filter(e => e.type === ledgerFilter && !e.settled)
  const catBreakdown = CATS.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((a, e) => a + e.amount, 0),
    count: expenses.filter(e => e.category === cat.id).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const CIRC = 2 * Math.PI * 50
  let offset = 0
  const donutSegs = totalSpent > 0 ? catBreakdown.map(cat => {
    const dash = CIRC * (cat.total / totalSpent)
    const seg = { ...cat, dash, offset }
    offset += dash
    return seg
  }) : []

  const tabMeta: { id: Tab; icon: string; label: string }[] = [
    { id: 'log',          icon: 'ti-plus-circle',  label: 'Log expense'  },
    { id: 'overview',     icon: 'ti-chart-donut',  label: 'Overview'     },
    { id: 'budget',       icon: 'ti-target',       label: 'Budget'       },
    { id: 'history',      icon: 'ti-clock',        label: 'History'      },
    { id: 'savings-pot',  icon: 'ti-piggy-bank',   label: 'Savings Pot'  },
    { id: 'ledger',       icon: 'ti-arrows-exchange', label: 'Ledger'     },
  ]

  const statusColor = budgetPct >= 100 ? '#8B2A2A' : budgetPct >= 80 ? '#7A5C00' : '#1A5E3A'
  const statusBg    = budgetPct >= 100 ? '#FAEAEA' : budgetPct >= 80 ? '#FBF6E6' : '#E6F5ED'
  const statusBorder= budgetPct >= 100 ? '#EDBDBD' : budgetPct >= 80 ? '#E8D48A' : '#9DD5B5'
  const barColor    = budgetPct >= 100 ? '#C96060' : budgetPct >= 80 ? '#C49A00' : '#37A866'
  const potTotal    = potEntries.reduce((a, e) => e.type === 'add' ? a + e.amount : a - e.amount, 0)
  const potAdded    = potEntries.filter(e => e.type === 'add').reduce((a, e) => a + e.amount, 0)
  const potWithdraw = potEntries.filter(e => e.type === 'withdraw').reduce((a, e) => a + e.amount, 0)

  const footerMsg =
    budgetPct >= 100 ? `Over budget by ${fmtINR(Math.abs(budgetLeft))} — reflect, reset, continue.`
    : budgetPct >= 80  ? `${100 - budgetPct}% of your budget remains — stay the course.`
    : totalSpent > 0   ? `${fmtINR(totalSpent)} spent with intention this month.`
    : 'Every rupee tracked is a step toward clarity.'

  return (
    <>
      <style>{css}</style>
      <div className="xp">
        {/* Top strip */}
        <div className="xp-wrap">
          <motion.div
            className="xp-topstrip"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .35 }}
          >
            <div className="xp-topstrip-left">
              <span className="xp-logotype">Paisa <em>Journal</em></span>
              <span className="xp-topdate">{dateStr}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 18, color: 'var(--rose2)' }}>
              <i className="ti ti-leaf" />
              <i className="ti ti-coin" />
            </div>
          </motion.div>

          {/* Hero */}
          <motion.div
            className="xp-hero"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .45, delay: .05 }}
          >
            <div>
              <p className="xp-hero-eyebrow">personal finance tracker</p>
              <h1 className="xp-h1">your<br /><em>money,</em><br />your story</h1>
              <p className="xp-hero-sub">spend with intention, grow with clarity</p>
            </div>

            <div className="xp-month-widget">
              <div className="xp-month-inner">
                <button className="xp-marrow" onClick={() => navMonth(-1)}>
                  <i className="ti ti-chevron-left" />
                </button>
                <span className="xp-mlabel">{monthLabel}</span>
                <button className="xp-marrow" onClick={() => navMonth(1)} disabled={isCurrentMonth}>
                  <i className="ti ti-chevron-right" />
                </button>
              </div>
              {budgetAmt > 0 && (
                <span className="xp-budget-badge" style={{ background: statusBg, border: `1px solid ${statusBorder}`, color: statusColor }}>
                  <i className={`ti ${budgetPct >= 100 ? 'ti-alert-triangle' : 'ti-check'}`} style={{ fontSize: 11 }} />
                  {budgetPct}% of budget used
                </span>
              )}
            </div>
          </motion.div>

          <Rule label="this month at a glance" />

          {/* Stats band */}
          <div className="xp-stats">
            {[
              { label: 'spent this month', value: fmtShort(totalSpent),  glyph: '₹',  sub: `${expenses.length} transactions` },
              { label: 'spent today',      value: fmtShort(todaySpent),  glyph: '◦',  sub: expenses.filter(e => e.date === todayIso).length + ' items today' },
              { label: 'budget left',      value: budgetAmt > 0 ? fmtShort(Math.abs(budgetLeft)) : '—',  glyph: '%',  sub: budgetAmt > 0 ? (budgetLeft < 0 ? 'over budget' : 'remaining') : 'no budget set' },
              { label: 'avg per day',      value: fmtShort(avgPerDay),   glyph: '∑',  sub: `across ${uniqueDays} days` },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="xp-stat"
                data-glyph={s.glyph}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .08 * i + .1 }}
                whileHover={{ background: 'var(--rose3)' }}
              >
                <div className="xp-stat-lbl">{s.label}</div>
                <div className="xp-stat-val" style={i === 2 && budgetLeft < 0 && budgetAmt > 0 ? { color: '#8B2A2A' } : {}}>{s.value}</div>
                <div className="xp-stat-sub">{s.sub}</div>
              </motion.div>
            ))}
          </div>

          <Rule label="manage expenses" />

          {/* Tabs */}
          <div className="xp-tabs">
            {tabMeta.map(t => (
              <button
                key={t.id}
                className={`xp-tab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <i className={`ti ${t.icon}`} />
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── LOG ── */}
            {activeTab === 'log' && (
              <motion.div key="log" className="xp-two"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: .22 }}>

                {/* Form */}
                <div className="xp-card">
                  <p className="xp-card-title"><i className="ti ti-plus-circle" /> Add expense</p>

                  <div className="xp-field-label"><i className="ti ti-currency-rupee" /> Amount</div>
                  <div className="xp-amount-wrap">
                    <span className="xp-amount-sym">₹</span>
                    <input
                      className="xp-amount-in"
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addExpense()}
                    />
                  </div>

                  <div className="xp-field-label"><i className="ti ti-pencil" /> Description</div>
                  <input
                    className="xp-input"
                    type="text"
                    placeholder="what did you spend on?"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addExpense()}
                  />

                  <div className="xp-field-label"><i className="ti ti-tag" /> Category</div>
                  <div className="xp-cat-grid">
                    {CATS.map(c => (
                      <button
                        key={c.id}
                        className="xp-cat-btn"
                        onClick={() => setCategory(c.id)}
                        style={category === c.id ? { background: c.bg, borderColor: c.bc } : {}}
                      >
                        <i className={`ti ${c.icon}`} style={{ color: category === c.id ? c.c : 'var(--ink3)' }} />
                        <span style={{ color: category === c.id ? c.c : 'var(--ink3)' }}>{c.label}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="xp-field-label"><i className="ti ti-calendar" /> Date</div>
                      <input type="date" className="xp-input" style={{ marginBottom: 0 }} value={expDate} onChange={e => setExpDate(e.target.value)} />
                    </div>
                    <div>
                      <div className="xp-field-label"><i className="ti ti-wallet" /> Paid via</div>
                      <div className="xp-chips" style={{ marginBottom: 0 }}>
                        {PAYMENT_METHODS.map(pm => (
                          <button
                            key={pm}
                            className={`xp-chip${payMethod === pm ? ' active' : ''}`}
                            onClick={() => setPayMethod(pm)}
                          >
                            {pm}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="xp-field-label" style={{ marginTop: 12 }}><i className="ti ti-notes" /> Notes <span style={{ fontWeight: 400, fontSize: 9, color: 'var(--ink4)' }}>(optional)</span></div>
                  <input
                    className="xp-input"
                    type="text"
                    placeholder="any notes?"
                    value={expNotes}
                    onChange={e => setExpNotes(e.target.value)}
                  />

                  <button
                    className={`xp-cta${title.trim() && amount ? ' filled' : ''}`}
                    onClick={addExpense}
                    disabled={!title.trim() || !amount || saving}
                  >
                    {saving ? 'Saving…' : saved ? 'Expense logged ✓' : 'Log this expense'}
                  </button>

                  <AnimatePresence>
                    {saved && (
                      <motion.div
                        className="xp-toast"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        Expense logged — every rupee accounted for 🌿
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Today */}
                <div className="xp-card">
                  <p className="xp-card-title"><i className="ti ti-calendar-check" /> Today's expenses</p>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: 32 }}>
                      <i className="ti ti-loader-2 spin" style={{ fontSize: 22, color: 'var(--rose)' }} />
                    </div>
                  ) : expenses.filter(e => e.date === todayIso).length === 0 ? (
                    <div className="xp-empty"><i className="ti ti-coin" />Nothing logged today yet</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <AnimatePresence>
                          {expenses.filter(e => e.date === todayIso).map(exp => (
                            <ExpenseItem key={exp.id} exp={exp} onDelete={deleteExpense} />
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="xp-total-strip">
                        <span style={{ fontSize: 10.5, color: 'var(--rose)', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase' }}>Today's total</span>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--rose)' }}>{fmtINR(todaySpent)}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <motion.div key="overview" className="xp-two"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: .22 }}>

                <div className="xp-card">
                  <p className="xp-card-title"><i className="ti ti-chart-donut" /> Spending by category</p>
                  {catBreakdown.length === 0 ? (
                    <div className="xp-empty"><i className="ti ti-chart-pie" />No expenses this month</div>
                  ) : (
                    <>
                      <div className="xp-donut-wrap">
                        <svg width="124" height="124" viewBox="0 0 124 124" role="img" aria-label="Spending breakdown donut chart">
                          {donutSegs.map((seg, i) => (
                            <motion.circle
                              key={seg.id}
                              cx="62" cy="62" r="50"
                              fill="none"
                              stroke={seg.c}
                              strokeWidth="16"
                              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                              strokeDashoffset={-seg.offset}
                              transform="rotate(-90 62 62)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * .06 }}
                            />
                          ))}
                          <text x="62" y="58" textAnchor="middle" fontFamily="'Playfair Display', serif" fontSize="14" fontWeight="400" fill="var(--ink)" letterSpacing="-0.5">{fmtShort(totalSpent)}</text>
                          <text x="62" y="71" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="8" fontWeight="600" fill="var(--ink3)" letterSpacing="2">TOTAL</text>
                        </svg>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        {catBreakdown.map((cat, i) => (
                          <motion.div key={cat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat.dot, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{cat.label}</span>
                              <span style={{ fontSize: 9.5, color: 'var(--ink3)' }}>{cat.count} item{cat.count !== 1 ? 's' : ''}</span>
                              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: cat.c, letterSpacing: '-.3px' }}>{fmtINR(cat.total)}</span>
                            </div>
                            <Bar pct={Math.round(cat.total / totalSpent * 100)} color={cat.c} />
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="xp-col">
                  {budgetAmt > 0 && (
                    <div className="xp-card">
                      <p className="xp-card-title"><i className="ti ti-target" /> Budget tracker</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: budgetPct >= 100 ? '#8B2A2A' : 'var(--ink)', letterSpacing: '-1px' }}>{fmtINR(totalSpent)}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink3)' }}>of {fmtINR(budgetAmt)}</span>
                      </div>
                      <Bar pct={budgetPct} color={barColor} h={7} />
                      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: budgetLeft < 0 ? '#8B2A2A' : '#1A5E3A' }}>
                        {budgetLeft < 0 ? `₹${Math.abs(Math.round(budgetLeft))} over budget` : `₹${Math.round(budgetLeft)} remaining`}
                      </div>
                    </div>
                  )}
                  <div className="xp-card" style={{ flex: 1 }}>
                    <div className="xp-section-meta">
                      <p className="xp-card-title" style={{ marginBottom: 0 }}><i className="ti ti-trending-up" /> Top expenses</p>
                    </div>
                    {expenses.length === 0 ? (
                      <div className="xp-empty" style={{ padding: 16 }}><i className="ti ti-receipt" />No expenses yet</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
              <motion.div key="budget" className="xp-two"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: .22 }}>

                <div className="xp-card">
                  <p className="xp-card-title"><i className="ti ti-target" /> Monthly budget</p>
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20, lineHeight: 1.65 }}>
                    Set a spending limit for {monthLabel}. Track your progress in real time.
                  </p>

                  <div className="xp-field-label"><i className="ti ti-currency-rupee" /> Budget amount</div>
                  <div className="xp-budget-row">
                    <div className="xp-amount-wrap" style={{ flex: 1, marginBottom: 0 }}>
                      <span className="xp-amount-sym">₹</span>
                      <input
                        className="xp-amount-in"
                        type="number"
                        placeholder="0"
                        style={{ fontSize: 24 }}
                        value={budgetInput}
                        onChange={e => setBudgetInput(e.target.value)}
                      />
                    </div>
                    <button className="xp-bsave" onClick={saveBudget} disabled={savingBudget}>
                      {savingBudget ? <i className="ti ti-loader-2 spin" /> : savedBudget ? 'Saved ✓' : 'Save'}
                    </button>
                  </div>

                  {budgetAmt > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="xp-progress-wrap"
                      style={{ background: statusBg, border: `1px solid ${statusBorder}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: statusColor }}>
                          {budgetPct >= 100 ? '⚠ Over budget' : `${100 - budgetPct}% remaining`}
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{fmtINR(totalSpent)} / {fmtINR(budgetAmt)}</span>
                      </div>
                      <Bar pct={Math.min(100, budgetPct)} color={barColor} h={7} />
                    </motion.div>
                  )}

                  <div className="xp-field-label" style={{ marginTop: 20 }}><i className="ti ti-zap" /> Quick presets</div>
                  <div className="xp-quick">
                    {[5000, 10000, 15000, 20000, 30000, 50000].map(amt => (
                      <button
                        key={amt}
                        className={`xp-chip${budgetInput === String(amt) ? ' active' : ''}`}
                        onClick={() => setBudgetInput(String(amt))}
                        style={budgetInput === String(amt) ? { background: '#E6F5ED', borderColor: '#9DD5B5', color: '#1A5E3A' } : {}}
                      >
                        {fmtShort(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="xp-col">
                  <div className="xp-card">
                    <p className="xp-card-title"><i className="ti ti-calendar-stats" /> Monthly pacing</p>
                    {(() => {
                      const [y, m] = viewMonth.split('-').map(Number)
                      const daysInMonth = new Date(y, m, 0).getDate()
                      const dayOfMonth  = isCurrentMonth ? new Date().getDate() : daysInMonth
                      const projected   = dayOfMonth > 0 ? (totalSpent / dayOfMonth) * daysInMonth : 0
                      return [
                        { label: 'Days tracked',    value: `${uniqueDays} / ${daysInMonth}`,   c: '#4A3F8F' },
                        { label: 'Avg per day',     value: fmtINR(avgPerDay),                  c: '#7A5C00' },
                        { label: 'Projected total', value: fmtINR(projected),                  c: projected > budgetAmt && budgetAmt > 0 ? '#8B2A2A' : '#1A5E3A' },
                        { label: 'Transactions',    value: String(expenses.length),             c: '#8B3A62' },
                      ].map(row => (
                        <div key={row.label} className="xp-pace-row">
                          <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 500 }}>{row.label}</span>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: row.c }}>{row.value}</span>
                        </div>
                      ))
                    })()}
                  </div>

                  <div className="xp-card" style={{ flex: 1 }}>
                    <p className="xp-card-title"><i className="ti ti-wallet" /> By payment method</p>
                    {PAYMENT_METHODS.map(pm => {
                      const pmTotal = expenses.filter(e => e.payment_method === pm).reduce((a, e) => a + e.amount, 0)
                      if (!pmTotal) return null
                      return (
                        <div key={pm} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{pm}</span>
                            <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: "'DM Mono', monospace" }}>{fmtINR(pmTotal)}</span>
                          </div>
                          <Bar pct={totalSpent ? Math.round(pmTotal / totalSpent * 100) : 0} color="var(--rose)" />
                        </div>
                      )
                    })}
                    {expenses.length === 0 && <div className="xp-empty" style={{ padding: 14 }}><i className="ti ti-wallet" />No data yet</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── HISTORY ── */}
            {activeTab === 'history' && (
              <motion.div key="history"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: .22 }}>
                <div className="xp-card">
                  <div className="xp-section-meta">
                    <p className="xp-card-title" style={{ marginBottom: 0 }}>
                      <i className="ti ti-clock" />
                      {expenses.length} expense{expenses.length !== 1 ? 's' : ''} in {monthLabel}
                    </p>
                    <span className="xp-section-total">{fmtINR(totalSpent)}</span>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: 32 }}>
                      <i className="ti ti-loader-2 spin" style={{ fontSize: 22, color: 'var(--rose)' }} />
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="xp-empty"><i className="ti ti-receipt" />No expenses logged for {monthLabel}</div>
                  ) : (() => {
                    const grouped: Record<string, Expense[]> = {}
                    expenses.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })
                    return Object.entries(grouped).map(([date, exps], gi) => (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: gi * .04 }}
                        style={{ marginBottom: 24 }}
                      >
                        <div className="xp-date-header">
                          <span className={`xp-date-label${date === todayIso ? ' today' : ''}`}>
                            {date === todayIso ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="xp-date-total">{fmtINR(exps.reduce((a, e) => a + e.amount, 0))}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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

            {/* ── SAVINGS POT ── */}
            {activeTab === 'savings-pot' && (
              <motion.div key="savings-pot" className="xp-two"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: .22 }}>

                {/* Left: Add form */}
                <div className="xp-card">
                  <p className="xp-card-title"><i className="ti ti-piggy-bank" /> Savings Pot</p>

                  <div className="xp-pot-toggle">
                    <button
                      className={`xp-pot-toggle-btn${potType === 'add' ? ' active-add' : ''}`}
                      onClick={() => setPotType('add')}
                    >
                      <i className="ti ti-arrow-down-circle" /> Deposit
                    </button>
                    <button
                      className={`xp-pot-toggle-btn${potType === 'withdraw' ? ' active-withdraw' : ''}`}
                      onClick={() => setPotType('withdraw')}
                    >
                      <i className="ti ti-arrow-up-circle" /> Withdraw
                    </button>
                  </div>

                  <div className="xp-field-label"><i className="ti ti-currency-rupee" /> Amount</div>
                  <div className="xp-amount-wrap">
                    <span className="xp-amount-sym">₹</span>
                    <input
                      className="xp-amount-in"
                      type="number" placeholder="0"
                      value={potAmount}
                      onChange={e => setPotAmount(e.target.value)}
                    />
                  </div>

                  <div className="xp-field-label"><i className="ti ti-pencil" /> Label</div>
                  <input
                    className="xp-input"
                    type="text" placeholder="e.g. monthly savings, emergency fund…"
                    value={potLabel}
                    onChange={e => setPotLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPotEntry()}
                  />

                  <div className="xp-field-label"><i className="ti ti-zap" /> Quick amounts</div>
                  <div className="xp-quick">
                    {[500, 1000, 2000, 5000, 10000].map(amt => (
                      <button
                        key={amt}
                        className={`xp-chip${potAmount === String(amt) ? ' active' : ''}`}
                        onClick={() => setPotAmount(String(amt))}
                      >
                        {fmtShort(amt)}
                      </button>
                    ))}
                  </div>

                  <button
                    className={`xp-cta${potLabel.trim() && potAmount ? ' filled' : ''}`}
                    style={potType === 'withdraw' ? { background: potLabel.trim() && potAmount ? '#8B2A2A' : undefined } : {}}
                    onClick={addPotEntry}
                    disabled={!potLabel.trim() || !potAmount || savingPot}
                  >
                    {savingPot ? 'Saving…' : savedPot ? 'Entry saved ✓' : potType === 'add' ? 'Deposit to pot' : 'Withdraw from pot'}
                  </button>

                  <AnimatePresence>
                    {savedPot && (
                      <motion.div className="xp-toast"
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={potType === 'withdraw' ? { background: '#FAEAEA', borderColor: '#EDBDBD', color: '#8B2A2A' } : {}}
                      >
                        {potType === 'add' ? 'Deposited — your pot grows 🌱' : 'Withdrawn from pot'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right: Pot summary + history */}
                <div className="xp-col">
                  {/* Total ring */}
                  <div className="xp-card" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div className="xp-pot-ring">
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1A5E3A', letterSpacing: '-1px', lineHeight: 1 }}>{fmtShort(Math.max(0, potTotal))}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#37A866', textTransform: 'uppercase', marginTop: 4 }}>saved</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[
                        { label: 'Total deposited', value: fmtINR(potAdded),    c: '#1A5E3A', bg: '#E6F5ED', bc: '#9DD5B5' },
                        { label: 'Total withdrawn', value: fmtINR(potWithdraw), c: '#8B2A2A', bg: '#FAEAEA', bc: '#EDBDBD' },
                        { label: 'Net savings',     value: fmtINR(Math.max(0, potTotal)), c: '#004F7C', bg: '#E6F3FB', bc: '#A0CDE8' },
                      ].map(row => (
                        <div key={row.label} style={{ marginBottom: 8, padding: '7px 12px', borderRadius: 9, background: row.bg, border: `1px solid ${row.bc}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: row.c, letterSpacing: '.3px' }}>{row.label}</span>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: row.c }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entry history */}
                  <div className="xp-card" style={{ flex: 1 }}>
                    <p className="xp-card-title"><i className="ti ti-clock" /> Pot history</p>
                    {potEntries.length === 0 ? (
                      <div className="xp-empty"><i className="ti ti-piggy-bank" />No entries yet — start saving!</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <AnimatePresence>
                          {potEntries.map((entry, i) => (
                            <motion.div key={entry.id} className="xp-pot-entry"
                              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }}
                              transition={{ delay: i * .03 }}
                            >
                              <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: entry.type === 'add' ? '#E6F5ED' : '#FAEAEA', flexShrink: 0 }}>
                                <i className={`ti ${entry.type === 'add' ? 'ti-arrow-down-circle' : 'ti-arrow-up-circle'}`} style={{ fontSize: 15, color: entry.type === 'add' ? '#1A5E3A' : '#8B2A2A' }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</div>
                                <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              </div>
                              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: entry.type === 'add' ? '#1A5E3A' : '#8B2A2A', fontWeight: 400, flexShrink: 0 }}>
                                {entry.type === 'add' ? '+' : '−'}{fmtINR(entry.amount)}
                              </span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'ledger' && (
  <motion.div key="ledger" className="xp-two"
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
    transition={{ duration: .22 }}>

    {/* Left: Add form */}
    <div className="xp-card">
      <p className="xp-card-title"><i className="ti ti-arrows-exchange" /> Lend & Borrow</p>

      {/* Summary pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'You lent', value: fmtINR(lentTotal), c: '#004F7C', bg: '#E6F3FB', bc: '#A0CDE8' },
          { label: 'You borrowed', value: fmtINR(borrowedTotal), c: '#7A5C00', bg: '#FBF6E6', bc: '#E8D48A' },
          { label: 'Net', value: fmtINR(Math.abs(netPosition)), c: netPosition > 0 ? '#1A5E3A' : netPosition < 0 ? '#8B2A2A' : 'var(--ink3)', bg: netPosition > 0 ? '#E6F5ED' : netPosition < 0 ? '#FAEAEA' : 'var(--paper)', bc: netPosition > 0 ? '#9DD5B5' : netPosition < 0 ? '#EDBDBD' : 'var(--line)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '9px 12px', borderRadius: 10, background: s.bg, border: `1px solid ${s.bc}` }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: s.c, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: s.c, letterSpacing: '-.5px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Type toggle */}
      <div className="xp-pot-toggle">
        <button className={`xp-pot-toggle-btn${ledgerType === 'lent' ? ' active-add' : ''}`}
          onClick={() => setLedgerType('lent')}
          style={ledgerType === 'lent' ? { background: '#E6F3FB', color: '#004F7C' } : {}}>
          <i className="ti ti-arrow-up-right" /> I lent money
        </button>
        <button className={`xp-pot-toggle-btn${ledgerType === 'borrowed' ? ' active-withdraw' : ''}`}
          onClick={() => setLedgerType('borrowed')}
          style={ledgerType === 'borrowed' ? { background: '#FBF6E6', color: '#7A5C00' } : {}}>
          <i className="ti ti-arrow-down-left" /> I borrowed
        </button>
      </div>

      <div className="xp-field-label"><i className="ti ti-user" /> Person / name</div>
      <input className="xp-input" type="text" placeholder="who did you lend to / borrow from?"
        value={ledgerName} onChange={e => setLedgerName(e.target.value)} />

      <div className="xp-field-label"><i className="ti ti-currency-rupee" /> Amount</div>
      <div className="xp-amount-wrap">
        <span className="xp-amount-sym">₹</span>
        <input className="xp-amount-in" type="number" placeholder="0"
          value={ledgerAmount} onChange={e => setLedgerAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addLedgerEntry()} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="xp-field-label"><i className="ti ti-calendar" /> Date</div>
          <input type="date" className="xp-input" style={{ marginBottom: 0 }}
            value={ledgerDate} onChange={e => setLedgerDate(e.target.value)} />
        </div>
        <div>
          <div className="xp-field-label"><i className="ti ti-notes" /> Notes</div>
          <input className="xp-input" style={{ marginBottom: 0 }} type="text" placeholder="reason or context"
            value={ledgerNotes} onChange={e => setLedgerNotes(e.target.value)} />
        </div>
      </div>

      <button
        className={`xp-cta${ledgerName.trim() && ledgerAmount ? ' filled' : ''}`}
        style={{ marginTop: 14, ...(ledgerType === 'borrowed' && ledgerName.trim() && ledgerAmount ? { background: '#7A5C00' } : {}) }}
        onClick={addLedgerEntry}
        disabled={!ledgerName.trim() || !ledgerAmount || savingLedger}
      >
        {savingLedger ? 'Saving…' : savedLedger ? 'Entry saved ✓' : ledgerType === 'lent' ? 'Add lending entry' : 'Add borrowing entry'}
      </button>

      <AnimatePresence>
        {savedLedger && (
          <motion.div className="xp-toast" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            Logged — clarity is peace of mind 📋
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Right: entries list */}
    <div className="xp-card">
      <div className="xp-section-meta">
        <p className="xp-card-title" style={{ marginBottom: 0 }}><i className="ti ti-list" /> All entries</p>
      </div>

      <div className="xp-chips" style={{ marginBottom: 16 }}>
        {(['all', 'lent', 'borrowed', 'settled'] as const).map(f => (
          <button key={f} className={`xp-chip${ledgerFilter === f ? ' active' : ''}`}
            onClick={() => setLedgerFilter(f)}
            style={ledgerFilter === f && f === 'settled' ? { background: '#E6F5ED', borderColor: '#9DD5B5', color: '#1A5E3A' } : {}}>
            {f === 'settled' ? '✓ Settled' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredLedger.length === 0 ? (
        <div className="xp-empty"><i className="ti ti-arrows-exchange" />No entries here</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <AnimatePresence>
            {filteredLedger.map((entry, i) => {
              const isLent = entry.type === 'lent'
              const iconBg = entry.settled ? '#F5F1F4' : isLent ? '#E6F3FB' : '#FBF6E6'
              const iconColor = entry.settled ? 'var(--ink4)' : isLent ? '#004F7C' : '#7A5C00'
              const amtColor = entry.settled ? 'var(--ink4)' : isLent ? '#004F7C' : '#7A5C00'
              return (
                <motion.div key={entry.id} className="xp-pot-entry"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: i * .03 }}
                  style={{ opacity: entry.settled ? .65 : 1 }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg, flexShrink: 0 }}>
                    <i className={`ti ${entry.settled ? 'ti-check' : isLent ? 'ti-arrow-up-right' : 'ti-arrow-down-left'}`} style={{ fontSize: 15, color: iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {entry.name}
                      <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: iconBg, color: iconColor, border: `1px solid ${isLent ? '#A0CDE8' : '#E8D48A'}` }}>
                        {entry.settled ? 'settled' : entry.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2, display: 'flex', gap: 5 }}>
                      <span>{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {entry.notes && <><span style={{ color: 'var(--ink4)' }}>·</span><span style={{ fontStyle: 'italic', color: 'var(--ink4)' }}>{entry.notes}</span></>}
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: amtColor, fontWeight: 400, flexShrink: 0, textDecoration: entry.settled ? 'line-through' : 'none' }}>
                    {fmtINR(entry.amount)}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <button onClick={() => toggleSettled(entry)} title={entry.settled ? 'Mark unsettled' : 'Mark as returned/paid'}
                      style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: entry.settled ? '#37A866' : 'var(--ink4)', fontSize: 12 }}>
                      <i className={`ti ${entry.settled ? 'ti-refresh' : 'ti-check'}`} />
                    </button>
                    <button onClick={() => deleteLedgerEntry(entry.id)} title="Delete"
                      style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink4)', fontSize: 12 }}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  </motion.div>
)}

          </AnimatePresence>

          {/* Footer */}
          <motion.div
            className="xp-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: .5 }}
          >
            <div>
              <p className="xp-footer-eyebrow">money intention</p>
              <p className="xp-footer-msg">{footerMsg}</p>
            </div>
            <div className="xp-footer-icons">
              <i className="ti ti-leaf" />
              <i className="ti ti-coin" />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
