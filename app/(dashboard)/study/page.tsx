'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

// ── constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { id: 'math',     label: 'Maths',     icon: 'ti-math-function', c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.18)',  dotC: '#e8a0b0' },
  { id: 'science',  label: 'Science',   icon: 'ti-flask',         c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.35)', dotC: '#a8c9ae' },
  { id: 'language', label: 'Language',  icon: 'ti-language',      c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)',  dotC: '#c9b8e8' },
  { id: 'history',  label: 'History',   icon: 'ti-timeline',      c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)',  dotC: '#f5ddb4' },
  { id: 'coding',   label: 'Coding',    icon: 'ti-code',          c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.35)', dotC: '#a8c9ae' },
  { id: 'arts',     label: 'Arts',      icon: 'ti-palette',       c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.18)',  dotC: '#e8a0b0' },
  { id: 'music',    label: 'Music',     icon: 'ti-music',         c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)',  dotC: '#c9b8e8' },
  { id: 'other',    label: 'Other',     icon: 'ti-book',          c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)',  dotC: '#f5ddb4' },
]

const STATUS_OPTS = [
  { key: 'pending',     label: 'To Do',       icon: 'ti-circle',       c: '#b09aa4', bg: 'rgba(176,154,164,0.08)'  },
  { key: 'in_progress', label: 'In Progress', icon: 'ti-loader-2',     c: '#b8860b', bg: 'rgba(184,134,11,0.08)'   },
  { key: 'done',        label: 'Done',        icon: 'ti-circle-check', c: '#5a8c63', bg: 'rgba(90,140,99,0.08)'    },
  { key: 'review',      label: 'Review',      icon: 'ti-refresh',      c: '#9b7ec8', bg: 'rgba(155,126,200,0.08)'  },
]

const PRIORITY = [
  { key: 'low',    label: 'Low',    c: '#5a8c63', bg: 'rgba(90,140,99,0.1)'   },
  { key: 'medium', label: 'Medium', c: '#b8860b', bg: 'rgba(184,134,11,0.1)'  },
  { key: 'high',   label: 'High',   c: '#d4607a', bg: 'rgba(212,96,122,0.1)'  },
]

const TIMER_PRESETS = [25, 45, 60, 90] // minutes

const todayIso = new Date().toISOString().slice(0, 10)

function getSubject(id: string) {
  return SUBJECTS.find(s => s.id === id) || SUBJECTS[7]
}
function getStatus(key: string) {
  return STATUS_OPTS.find(s => s.key === key) || STATUS_OPTS[0]
}
function getPriority(key: string) {
  return PRIORITY.find(p => p.key === key) || PRIORITY[0]
}
function fmtMins(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  .st {
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
    box-sizing: border-box;
  }
  .st *, .st *::before, .st *::after { box-sizing: border-box; }

  /* header */
  .st-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .st-header-left { flex: 1; min-width: 0; }
  .st-eyebrow { font-size: 10px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; }
  .st-h1 { font-family: 'Fraunces', serif; font-size: clamp(26px,5.5vw,44px); font-weight: 300; font-style: italic; letter-spacing: -1px; line-height: 1.25; padding-bottom: 4px; color: var(--ink); margin-bottom: 12px; word-break: break-word; }
  .st-h1 .accent { color: var(--rose); }
  .st-vibe { display: inline-flex; align-items: center; gap: 8px; background: var(--petal); border: 1px solid rgba(212,96,122,0.18); border-radius: 999px; padding: 6px 16px; font-size: 12px; color: var(--rose); font-family: 'Fraunces', serif; font-style: italic; }

  /* clock */
  .st-clock { background: var(--lav); border: 1px solid rgba(201,184,232,0.5); border-radius: 18px; padding: 14px 18px; text-align: right; flex-shrink: 0; }
  .st-clock-val { font-family: 'Fraunces', serif; font-size: clamp(18px,3vw,26px); font-weight: 300; color: var(--ink); letter-spacing: -0.5px; line-height: 1; }
  .st-clock-sub { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-top: 4px; }

  /* divider */
  .st-divider { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
  .st-divider-line { flex: 1; height: 1px; background: rgba(212,96,122,0.12); }
  .st-divider-label { font-size: 9px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: var(--ink3); white-space: nowrap; }
  .st-divider-ico { font-size: 11px; color: var(--blush2); }

  /* stat cards */
  .st-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
  .st-stat { border-radius: 20px; padding: 16px; position: relative; overflow: hidden; transition: transform 0.2s ease; min-width: 0; }
  .st-stat:hover { transform: translateY(-3px); }
  .st-stat::after { content: ''; position: absolute; bottom: -18px; right: -18px; width: 56px; height: 56px; border-radius: 50%; opacity: 0.22; pointer-events: none; background: var(--dot-c, #f2c4ce); }
  .st-stat-ico { font-size: 16px; opacity: 0.45; margin-bottom: 8px; }
  .st-stat-val { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .st-stat-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; opacity: 0.5; }

  /* tabs */
  .st-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .st-tab { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 999px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; border: 1px solid; background: none; white-space: nowrap; }
  .st-tab:hover { transform: scale(1.03); }
  .st-tab i { font-size: 13px; }

  /* card */
  .st-card { background: var(--card); border: 1px solid rgba(212,96,122,0.12); border-radius: 22px; padding: clamp(14px,2vw,24px); min-width: 0; }
  .st-card-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .st-card-lbl i { font-size: 12px; color: var(--rose); }

  /* inputs */
  .st-input { width: 100%; padding: 10px 14px; border-radius: 12px; background: rgba(212,96,122,0.04); border: 1px solid rgba(212,96,122,0.15); color: var(--ink); font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.15s; margin-bottom: 10px; }
  .st-input:focus { border-color: rgba(212,96,122,0.4); background: rgba(212,96,122,0.06); box-shadow: 0 0 0 3px rgba(212,96,122,0.08); }
  .st-input-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
  .st-input-lbl i { font-size: 11px; color: var(--rose); }

  /* subject grid */
  .st-subj-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; margin-bottom: 10px; }
  .st-subj-btn { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 11px 6px; border-radius: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; background: rgba(253,247,240,0.8); border: 1px solid rgba(212,96,122,0.1); transition: all 0.17s ease; min-width: 0; }
  .st-subj-btn:hover { transform: translateY(-2px); }
  .st-subj-btn i { font-size: 16px; }
  .st-subj-lbl { font-size: 9px; font-weight: 500; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }

  /* chips / pill buttons */
  .st-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 10px; }
  .st-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 13px; border-radius: 999px; border: 1px solid; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; background: none; font-family: 'DM Sans', sans-serif; }
  .st-chip:hover { transform: scale(1.04); }

  /* submit */
  .st-submit { width: 100%; padding: 12px; border-radius: 999px; border: none; font-family: 'Fraunces', serif; font-size: 15px; font-weight: 300; font-style: italic; cursor: pointer; transition: transform 0.15s ease, opacity 0.15s; }
  .st-submit:hover { transform: scale(1.02); }
  .st-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* task list */
  .st-tasks { display: flex; flex-direction: column; gap: 9px; }
  .st-task { display: flex; align-items: center; gap: 10px; padding: 13px 14px; border-radius: 16px; border: 1px solid rgba(212,96,122,0.1); background: rgba(253,247,240,0.6); transition: transform 0.15s ease; flex-wrap: wrap; }
  .st-task:hover { transform: translateX(2px); }
  .st-task.done { background: var(--petal); border-color: rgba(212,96,122,0.2); }

  .st-task-check { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; border: none; transition: transform 0.15s ease; }
  .st-task-check:hover { transform: scale(1.15); }

  .st-task-name { font-size: 13px; font-weight: 500; color: var(--ink); word-break: break-word; }
  .st-task-meta { font-size: 10px; color: var(--ink3); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

  .st-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }

  .st-due-soon { color: #d4607a; font-weight: 600; }
  .st-overdue  { color: #8b1a35; font-weight: 700; }

  /* ── Pomodoro timer ── */
  .st-timer-wrap { display: flex; flex-direction: column; align-items: center; padding: 8px 0 4px; width: 100%; }
  .st-timer-ring { position: relative; width: 100%; max-width: 200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
  .st-timer-ring svg { display: block; width: 100%; height: auto; }
  .st-timer-display-overlay {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; width: 100%; pointer-events: none;
  }
  .st-timer-display { font-family: 'Fraunces', serif; font-size: clamp(28px,7vw,44px); font-weight: 300; letter-spacing: -1px; line-height: 1; color: var(--ink); }
  .st-timer-label { font-size: 9px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--ink3); margin: 16px 0 14px; text-align: center; padding: 0 8px; }
  .st-timer-btns { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; justify-content: center; }
  .st-timer-btn { display: flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 999px; border: 1px solid; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; background: none; white-space: nowrap; }
  .st-timer-btn:hover { transform: scale(1.04); }
  .st-timer-presets { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
  .st-timer-preset { padding: 5px 12px; border-radius: 999px; border: 1px solid rgba(212,96,122,0.15); background: none; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; color: var(--ink3); cursor: pointer; transition: all 0.15s; }
  .st-timer-preset:hover { background: var(--petal); color: var(--rose); border-color: rgba(212,96,122,0.3); }
  .st-timer-preset.active { background: var(--petal); color: var(--rose); border-color: rgba(212,96,122,0.3); }

  /* session log */
  .st-session { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; background: rgba(212,96,122,0.04); border: 1px solid rgba(212,96,122,0.08); }
  .st-session-ico { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .st-session-name { font-size: 12px; font-weight: 600; color: var(--ink); }
  .st-session-sub  { font-size: 10px; color: var(--ink3); margin-top: 1px; }
  .st-session-dur  { margin-left: auto; font-family: 'Fraunces', serif; font-size: 16px; font-weight: 300; color: var(--rose); flex-shrink: 0; }

  /* notes */
  .st-note { padding: 13px 15px; border-radius: 14px; border: 1px solid rgba(212,96,122,0.1); background: rgba(253,247,240,0.6); transition: transform 0.15s; }
  .st-note:hover { transform: translateX(2px); }
  .st-note-title { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 4px; word-break: break-word; }
  .st-note-body  { font-size: 12px; color: var(--ink2); line-height: 1.5; word-break: break-word; }
  .st-note-meta  { font-size: 10px; color: var(--ink3); margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

  /* delete btn */
  .st-del-btn { background: none; border: none; cursor: pointer; color: var(--ink3); font-size: 13px; padding: 4px; transition: color 0.15s; margin-left: auto; flex-shrink: 0; }
  .st-del-btn:hover { color: var(--rose); }

  /* toast */
  .st-toast { padding: 9px 14px; border-radius: 12px; font-size: 11px; font-family: 'Fraunces', serif; font-style: italic; background: var(--sage); border: 1px solid rgba(168,201,174,0.5); color: #5a8c63; text-align: center; margin-top: 8px; }

  /* empty */
  .st-empty { text-align: center; padding: 36px 20px; color: var(--ink3); font-size: 13px; font-style: italic; }
  .st-empty i { font-size: 32px; display: block; margin-bottom: 10px; opacity: 0.4; }

  /* footer */
  .st-footer { background: linear-gradient(135deg, var(--petal) 0%, var(--lav) 100%); border: 1px solid rgba(212,96,122,0.14); border-radius: 20px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
  .st-footer-lbl { font-size: 9px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 4px; }
  .st-footer-msg { font-family: 'Fraunces', serif; font-style: italic; font-size: 15px; font-weight: 300; color: var(--ink2); }
  .st-footer-ico { font-size: 20px; color: var(--blush2); }

  /* grid layouts */
  .st-two-col { display: grid; grid-template-columns: 1fr 280px; gap: 14px; align-items: start; }
  .st-timer-col { display: grid; grid-template-columns: 1fr 280px; gap: 14px; align-items: start; }
  .st-notes-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
  .st-insight-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinning { animation: spin 0.9s linear infinite; display: inline-block; }

  @keyframes pulse-ring { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .timer-running { animation: pulse-ring 2s ease-in-out infinite; }

  /* ── Responsive breakpoints ── */
  @media (max-width: 900px) {
    .st-two-col, .st-timer-col { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    .st { padding: 16px 14px 90px; }
    .st-header { flex-direction: column; gap: 12px; }
    .st-clock { align-self: flex-start; text-align: left; }
    .st-stats { grid-template-columns: repeat(2,1fr); }
    .st-two-col, .st-timer-col { grid-template-columns: 1fr; }
    .st-notes-col { grid-template-columns: 1fr; }
    .st-insight-row { grid-template-columns: 1fr; }
    .st-subj-grid { grid-template-columns: repeat(3,1fr); }
    .st-tabs { gap: 6px; }
    .st-tab { padding: 7px 12px; font-size: 10.5px; }
    .st-footer { flex-direction: column; align-items: flex-start; gap: 10px; }
    .st-timer-btn { padding: 9px 16px; font-size: 11px; }
  }

  @media (max-width: 480px) {
    .st-subj-grid { grid-template-columns: repeat(2,1fr); }
    .st-stats { grid-template-columns: repeat(2,1fr); gap: 8px; }
    .st-stat { padding: 12px; }
    .st-stat-val { font-size: 20px; }
    .st-h1 { font-size: 24px; }
    .st-card { padding: 14px; }
    .st-chips { gap: 5px; }
    .st-chip { padding: 5px 10px; font-size: 10px; }
    .st-timer-ring { max-width: 160px; }
    .st-task { padding: 11px 12px; }
  }

  @media (max-width: 380px) {
    .st { padding-left: 12px; padding-right: 12px; }
    .st-subj-grid { grid-template-columns: repeat(2,1fr); gap: 6px; }
    .st-timer-btns { gap: 6px; }
    .st-timer-btn { padding: 8px 14px; font-size: 10.5px; }
  }
`

// ── Types ────────────────────────────────────────────────────────────────────

type Task = {
  id: string
  user_id: string
  title: string
  subject: string
  priority: string
  status: string
  due_date: string | null
  notes: string | null
  created_at: string | null
}

type StudySession = {
  id: string
  user_id: string
  subject: string
  duration_mins: number
  date: string
  notes: string | null
  created_at: string | null
}

type Note = {
  id: string
  user_id: string
  title: string
  body: string
  subject: string
  created_at: string | null
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const supabase = createClient()

  const [tasks,    setTasks]    = useState<Task[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [notes,    setNotes]    = useState<Note[]>([])
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState<'tasks' | 'timer' | 'notes' | 'insights'>('tasks')
  const [dateStr,  setDateStr]  = useState('')

  // add task form
  const [taskTitle,   setTaskTitle]   = useState('')
  const [taskSubject, setTaskSubject] = useState('math')
  const [taskPriority,setTaskPriority]= useState('medium')
  const [taskDue,     setTaskDue]     = useState('')
  const [taskNotes,   setTaskNotes]   = useState('')
  const [savingTask,  setSavingTask]  = useState(false)
  const [savedTask,   setSavedTask]   = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  // timer
  const [timerMins,    setTimerMins]    = useState(25)
  const [timerSecs,    setTimerSecs]    = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSubject, setTimerSubject] = useState('math')
  const [sessions_today, setSessionsToday] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startSecs = useRef(25 * 60)

  // add note form
  const [noteTitle,   setNoteTitle]   = useState('')
  const [noteBody,    setNoteBody]    = useState('')
  const [noteSubject, setNoteSubject] = useState('math')
  const [savingNote,  setSavingNote]  = useState(false)
  const [savedNote,   setSavedNote]   = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }))
    fetchAll()
  }, [])

  // timer tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSecs(s => {
          if (s <= 1) {
            clearInterval(timerRef.current!)
            setTimerRunning(false)
            logSession()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: t }, { data: s }, { data: n }] = await Promise.all([
      supabase.from('study_tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
      supabase.from('study_notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ])
    setTasks(t || [])
    setSessions(s || [])
    setNotes(n || [])
    setSessionsToday((s || []).filter(x => x.date === todayIso).length)
    setLoading(false)
  }

  const addTask = async () => {
    if (!taskTitle.trim()) return
    setSavingTask(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingTask(false); return }
    await supabase.from('study_tasks').insert({
      user_id: user.id,
      title: taskTitle.trim(),
      subject: taskSubject,
      priority: taskPriority,
      status: 'pending',
      due_date: taskDue || null,
      notes: taskNotes.trim() || null,
    })
    setTaskTitle(''); setTaskDue(''); setTaskNotes('')
    setSavedTask(true); setTimeout(() => setSavedTask(false), 2500)
    setSavingTask(false); setShowAddTask(false); fetchAll()
  }

  const updateTaskStatus = async (id: string, status: string) => {
    await supabase.from('study_tasks').update({ status }).eq('id', id)
    fetchAll()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('study_tasks').delete().eq('id', id)
    fetchAll()
  }

  const logSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const elapsed = Math.round((startSecs.current - timerSecs) / 60)
    if (elapsed < 1) return
    await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject: timerSubject,
      duration_mins: elapsed,
      date: todayIso,
    })
    fetchAll()
  }

  const startTimer = () => {
    startSecs.current = timerSecs
    setTimerRunning(true)
  }
  const pauseTimer  = () => setTimerRunning(false)
  const resetTimer  = () => {
    setTimerRunning(false)
    setTimerSecs(timerMins * 60)
    startSecs.current = timerMins * 60
  }
  const setPreset = (mins: number) => {
    if (timerRunning) return
    setTimerMins(mins)
    setTimerSecs(mins * 60)
    startSecs.current = mins * 60
  }

  const addNote = async () => {
    if (!noteTitle.trim() || !noteBody.trim()) return
    setSavingNote(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingNote(false); return }
    await supabase.from('study_notes').insert({
      user_id: user.id,
      title: noteTitle.trim(),
      body: noteBody.trim(),
      subject: noteSubject,
    })
    setNoteTitle(''); setNoteBody('')
    setSavedNote(true); setTimeout(() => setSavedNote(false), 2500)
    setSavingNote(false); setShowAddNote(false); fetchAll()
  }

  const deleteNote = async (id: string) => {
    await supabase.from('study_notes').delete().eq('id', id)
    fetchAll()
  }

  // derived
  const doneTasks     = tasks.filter(t => t.status === 'done').length
  const pendingTasks  = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  const totalMinsToday = sessions.filter(s => s.date === todayIso).reduce((a, s) => a + s.duration_mins, 0)
  const totalMinsAll   = sessions.reduce((a, s) => a + s.duration_mins, 0)

  const timerPct = timerSecs / (timerMins * 60)
  const R = 54, CX = 64, CY = 64, CIRC = 2 * Math.PI * R

  // overdue check
  function getDueStatus(due: string | null) {
    if (!due) return null
    const d = new Date(due), today = new Date(todayIso)
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, cls: 'st-overdue' }
    if (diff === 0) return { label: 'due today', cls: 'st-due-soon' }
    if (diff <= 2)  return { label: `due in ${diff}d`, cls: 'st-due-soon' }
    return null
  }

  const statCards = [
    { label: 'tasks done',   value: `${doneTasks}/${tasks.length}`,   c: '#d4607a', bg: '#fff9fb', border: 'rgba(212,96,122,0.12)', dotC: '#e8a0b0', icon: 'ti-checks' },
    { label: 'study today',  value: fmtMins(totalMinsToday),          c: '#5a8c63', bg: '#f8fcf8', border: 'rgba(168,201,174,0.3)', dotC: '#a8c9ae', icon: 'ti-clock' },
    { label: 'total time',   value: fmtMins(totalMinsAll),            c: '#9b7ec8', bg: '#fdf8ff', border: 'rgba(201,184,232,0.3)', dotC: '#c9b8e8', icon: 'ti-hourglass' },
    { label: 'sessions today', value: String(sessions_today),         c: '#b8860b', bg: '#fffdf5', border: 'rgba(245,221,180,0.4)', dotC: '#f5ddb4', icon: 'ti-flame' },
  ]

  const tabColors: Record<string, { bg: string; border: string; color: string }> = {
    tasks:    { bg: '#fde8ee', border: '#e8a0b0', color: '#7a1a35' },
    timer:    { bg: '#f3edfb', border: '#c9b8e8', color: '#4a2a80' },
    notes:    { bg: '#fffdf5', border: '#f5ddb4', color: '#5a3a00' },
    insights: { bg: '#f8fcf8', border: '#a8c9ae', color: '#1a4a22' },
  }

  return (
    <>
      <style>{css}</style>
      <div className="st">

        {/* Header */}
        <motion.div className="st-header"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44 }}>
          <div className="st-header-left">
            <p className="st-eyebrow">
              <i className="ti ti-book" style={{ color: '#e8a0b0', fontSize: 13 }} />
              {dateStr}
            </p>
            <h1 className="st-h1">your <span className="accent">study</span><br />space</h1>
            <span className="st-vibe">
              <i className="ti ti-sparkles" style={{ fontSize: 12, color: '#e8a0b0' }} />
              learn, grow, bloom
            </span>
          </div>
          <StudyClock />
        </motion.div>

        {/* Stats */}
        <StDivider label="today at a glance" />
        <div className="st-stats">
          {statCards.map((s, i) => (
            <motion.div key={s.label} className="st-stat"
              style={{ background: s.bg, border: `1px solid ${s.border}`, ['--dot-c' as string]: s.dotC }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}>
              <i className={`ti ${s.icon} st-stat-ico`} style={{ color: s.c }} />
              <div className="st-stat-val" style={{ color: s.c }}>{s.value}</div>
              <div className="st-stat-lbl" style={{ color: s.c }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <StDivider label="study dashboard" />

        {/* Tabs */}
        <div className="st-tabs">
          {(['tasks', 'timer', 'notes', 'insights'] as const).map(t => {
            const active = activeTab === t
            const cfg = tabColors[t]
            const icons = { tasks: 'ti-list-check', timer: 'ti-timer', notes: 'ti-notebook', insights: 'ti-chart-bar' }
            const labels = { tasks: 'tasks', timer: 'focus timer', notes: 'notes', insights: 'insights' }
            return (
              <button key={t} className="st-tab"
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

          {/* ── TASKS ── */}
          {activeTab === 'tasks' && (
            <motion.div key="tasks" className="st-two-col"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              {/* Task list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="st-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <p className="st-card-lbl" style={{ marginBottom: 0 }}>
                      <i className="ti ti-list-check" />
                      {pendingTasks === 0 && tasks.length > 0 ? 'all tasks complete!' : `${pendingTasks} pending`}
                    </p>
                    <button onClick={() => setShowAddTask(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 14px', borderRadius: '999px',
                        background: showAddTask ? 'var(--petal)' : 'rgba(212,96,122,0.06)',
                        border: '1px solid rgba(212,96,122,0.2)',
                        color: 'var(--rose)', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'DM Sans',
                      }}>
                      <i className={`ti ${showAddTask ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 12 }} />
                      {showAddTask ? 'cancel' : 'add task'}
                    </button>
                  </div>

                  {/* Add task form */}
                  <AnimatePresence>
                    {showAddTask && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '14px' }}>
                        <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(212,96,122,0.04)', border: '1px solid rgba(212,96,122,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className="st-input-lbl"><i className="ti ti-pencil" /> task name</div>
                          <input className="st-input" style={{ marginBottom: 0 }}
                            placeholder="what do you need to study?"
                            value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()} />

                          <div className="st-input-lbl" style={{ marginTop: 6 }}><i className="ti ti-book" /> subject</div>
                          <div className="st-subj-grid">
                            {SUBJECTS.map(s => (
                              <button key={s.id} className="st-subj-btn"
                                onClick={() => setTaskSubject(s.id)}
                                style={{
                                  background: taskSubject === s.id ? s.bg : undefined,
                                  borderColor: taskSubject === s.id ? s.c : undefined,
                                }}>
                                <i className={`ti ${s.icon}`} style={{ color: taskSubject === s.id ? s.c : '#b09aa4' }} />
                                <span className="st-subj-lbl" style={{ color: taskSubject === s.id ? s.c : '#b09aa4' }}>{s.label}</span>
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <div className="st-input-lbl"><i className="ti ti-flag" /> priority</div>
                              <div className="st-chips">
                                {PRIORITY.map(p => (
                                  <button key={p.key} className="st-chip"
                                    onClick={() => setTaskPriority(p.key)}
                                    style={{
                                      background: taskPriority === p.key ? p.bg : 'transparent',
                                      borderColor: taskPriority === p.key ? p.c : 'rgba(212,96,122,0.15)',
                                      color: taskPriority === p.key ? p.c : '#b09aa4',
                                    }}>
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="st-input-lbl"><i className="ti ti-calendar" /> due date (opt.)</div>
                              <input type="date" className="st-input" style={{ marginBottom: 0 }}
                                value={taskDue} onChange={e => setTaskDue(e.target.value)} />
                            </div>
                          </div>

                          <button className="st-submit" onClick={addTask}
                            disabled={!taskTitle.trim() || savingTask}
                            style={{
                              background: taskTitle.trim() ? 'linear-gradient(135deg,#d4607a,#9b7ec8)' : 'rgba(212,96,122,0.08)',
                              color: taskTitle.trim() ? '#fff' : '#b09aa4',
                              marginTop: '4px',
                            }}>
                            {savingTask ? 'adding...' : 'add task'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {loading ? (
                    <div style={{ padding: '28px', textAlign: 'center' }}>
                      <i className="ti ti-loader-2 spinning" style={{ fontSize: 22, color: 'var(--rose)' }} />
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="st-empty"><i className="ti ti-books" />no tasks yet — add one above</div>
                  ) : (
                    <div className="st-tasks">
                      <AnimatePresence>
                        {tasks.map((task, i) => {
                          const subj = getSubject(task.subject)
                          const stat = getStatus(task.status)
                          const pri  = getPriority(task.priority)
                          const due  = getDueStatus(task.due_date)
                          const done = task.status === 'done'
                          return (
                            <motion.div key={task.id}
                              className={`st-task ${done ? 'done' : ''}`}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -16 }} transition={{ delay: i * 0.03 }}>

                              {/* check */}
                              <button className="st-task-check"
                                onClick={() => updateTaskStatus(task.id, done ? 'pending' : 'done')}
                                style={{
                                  background: done ? subj.c : 'rgba(212,96,122,0.08)',
                                  border: `1.5px solid ${done ? subj.c : 'rgba(212,96,122,0.2)'}`,
                                }}>
                                {done && <i className="ti ti-check" style={{ color: '#fff', fontSize: 11 }} />}
                              </button>

                              <i className={`ti ${subj.icon}`} style={{ color: done ? subj.c : '#b09aa4', fontSize: 15, flexShrink: 0 }} />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="st-task-name" style={{
                                  textDecoration: done ? 'line-through' : 'none',
                                  opacity: done ? 0.55 : 1,
                                  color: done ? subj.c : 'var(--ink)',
                                }}>{task.title}</div>
                                <div className="st-task-meta">
                                  <span>{subj.label}</span>
                                  <span style={{ color: pri.c, fontWeight: 600 }}>{pri.label}</span>
                                  {due && <span className={due.cls}>{due.label}</span>}
                                </div>
                              </div>

                              {/* status selector */}
                              <select
                                value={task.status}
                                onChange={e => updateTaskStatus(task.id, e.target.value)}
                                style={{
                                  padding: '4px 8px', borderRadius: '8px', fontSize: '10px',
                                  fontWeight: 600, border: `1px solid ${stat.c}22`,
                                  background: stat.bg, color: stat.c,
                                  cursor: 'pointer', outline: 'none',
                                  fontFamily: 'DM Sans', flexShrink: 0,
                                }}>
                                {STATUS_OPTS.map(s => (
                                  <option key={s.key} value={s.key}>{s.label}</option>
                                ))}
                              </select>

                              <button className="st-del-btn" onClick={() => deleteTask(task.id)}>
                                <i className="ti ti-trash" />
                              </button>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: recent sessions */}
              <div className="st-card">
                <p className="st-card-lbl"><i className="ti ti-history" /> recent sessions</p>
                {sessions.length === 0 ? (
                  <div className="st-empty" style={{ padding: '20px 10px' }}>
                    <i className="ti ti-timer" />start a focus session to log time
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessions.slice(0, 8).map((s, i) => {
                      const subj = getSubject(s.subject)
                      return (
                        <motion.div key={s.id} className="st-session"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}>
                          <div className="st-session-ico" style={{ background: subj.bg }}>
                            <i className={`ti ${subj.icon}`} style={{ color: subj.c }} />
                          </div>
                          <div>
                            <div className="st-session-name">{subj.label}</div>
                            <div className="st-session-sub">
                              {new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                          <div className="st-session-dur">{fmtMins(s.duration_mins)}</div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TIMER ── */}
          {activeTab === 'timer' && (
            <motion.div key="timer" className="st-timer-col"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              <div className="st-card">
                <p className="st-card-lbl"><i className="ti ti-timer" /> focus session</p>

                {/* Subject */}
                <div className="st-input-lbl" style={{ marginBottom: 8 }}><i className="ti ti-book" /> studying</div>
                <div className="st-subj-grid" style={{ marginBottom: 16 }}>
                  {SUBJECTS.map(s => (
                    <button key={s.id} className="st-subj-btn"
                      onClick={() => !timerRunning && setTimerSubject(s.id)}
                      style={{
                        background: timerSubject === s.id ? s.bg : undefined,
                        borderColor: timerSubject === s.id ? s.c : undefined,
                        opacity: timerRunning ? 0.6 : 1,
                        cursor: timerRunning ? 'not-allowed' : 'pointer',
                      }}>
                      <i className={`ti ${s.icon}`} style={{ color: timerSubject === s.id ? s.c : '#b09aa4' }} />
                      <span className="st-subj-lbl" style={{ color: timerSubject === s.id ? s.c : '#b09aa4' }}>{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Timer display */}
                <div className="st-timer-wrap">
                  <div className="st-timer-ring">
                    <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(212,96,122,0.1)" strokeWidth="5" />
                      <motion.circle cx={CX} cy={CY} r={R} fill="none"
                        stroke="url(#timer-grad)" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={CIRC}
                        animate={{ strokeDashoffset: CIRC * (1 - timerPct) }}
                        transition={{ duration: 0.5 }}
                        transform={`rotate(-90 ${CX} ${CY})`} />
                      <defs>
                        <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%"   stopColor="#d4607a" />
                          <stop offset="100%" stopColor="#9b7ec8" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="st-timer-display-overlay">
                      <div className={`st-timer-display${timerRunning ? ' timer-running' : ''}`}
                        style={{ color: timerSecs === 0 ? '#5a8c63' : 'var(--ink)' }}>
                        {fmtTime(timerSecs)}
                      </div>
                    </div>
                  </div>

                  <div className="st-timer-label">
                    {timerRunning ? `focusing on ${getSubject(timerSubject).label}` : timerSecs === 0 ? 'session complete ✨' : 'ready to focus'}
                  </div>

                  <div className="st-timer-btns">
                    {!timerRunning ? (
                      <button className="st-timer-btn" onClick={startTimer}
                        style={{ background: 'linear-gradient(135deg,#d4607a,#9b7ec8)', border: 'none', color: '#fff' }}>
                        <i className="ti ti-player-play" />
                        {timerSecs === timerMins * 60 ? 'start focus' : 'resume'}
                      </button>
                    ) : (
                      <button className="st-timer-btn" onClick={pauseTimer}
                        style={{ background: '#fef8e7', borderColor: '#f5ddb4', color: '#b8860b' }}>
                        <i className="ti ti-player-pause" />
                        pause
                      </button>
                    )}
                    <button className="st-timer-btn" onClick={resetTimer}
                      style={{ background: 'rgba(212,96,122,0.06)', borderColor: 'rgba(212,96,122,0.2)', color: 'var(--rose)' }}>
                      <i className="ti ti-refresh" />
                      reset
                    </button>
                    {timerRunning && (
                      <button className="st-timer-btn" onClick={async () => { pauseTimer(); await logSession(); resetTimer() }}
                        style={{ background: '#edf6ee', borderColor: '#a8c9ae', color: '#5a8c63' }}>
                        <i className="ti ti-check" />
                        done
                      </button>
                    )}
                  </div>

                  <div className="st-input-lbl" style={{ marginBottom: 8 }}><i className="ti ti-clock" /> preset durations</div>
                  <div className="st-timer-presets">
                    {TIMER_PRESETS.map(m => (
                      <button key={m} className={`st-timer-preset ${timerMins === m && !timerRunning ? 'active' : ''}`}
                        onClick={() => setPreset(m)}>
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Today's sessions */}
              <div className="st-card">
                <p className="st-card-lbl"><i className="ti ti-calendar-check" /> today's sessions</p>
                {sessions.filter(s => s.date === todayIso).length === 0 ? (
                  <div className="st-empty" style={{ padding: '20px 10px' }}>
                    <i className="ti ti-coffee" />
                    <span>no sessions yet today</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessions.filter(s => s.date === todayIso).map((s, i) => {
                      const subj = getSubject(s.subject)
                      return (
                        <motion.div key={s.id} className="st-session"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}>
                          <div className="st-session-ico" style={{ background: subj.bg }}>
                            <i className={`ti ${subj.icon}`} style={{ color: subj.c }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="st-session-name">{subj.label}</div>
                          </div>
                          <div className="st-session-dur">{fmtMins(s.duration_mins)}</div>
                        </motion.div>
                      )
                    })}
                    <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: '10px', background: 'rgba(212,96,122,0.04)', border: '1px solid rgba(212,96,122,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#b09aa4', fontWeight: 500 }}>total today</span>
                      <span style={{ fontFamily: 'Fraunces,serif', fontSize: '18px', fontWeight: 300, color: '#d4607a' }}>{fmtMins(totalMinsToday)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── NOTES ── */}
          {activeTab === 'notes' && (
            <motion.div key="notes" className="st-notes-col"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>

              {/* Add note */}
              <div className="st-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <p className="st-card-lbl" style={{ marginBottom: 0 }}><i className="ti ti-notebook" /> quick note</p>
                  <button onClick={() => setShowAddNote(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 14px', borderRadius: '999px',
                      background: showAddNote ? 'var(--petal)' : 'rgba(212,96,122,0.06)',
                      border: '1px solid rgba(212,96,122,0.2)',
                      color: 'var(--rose)', fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'DM Sans',
                    }}>
                    <i className={`ti ${showAddNote ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 12 }} />
                    {showAddNote ? 'cancel' : 'new note'}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddNote && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <div className="st-input-lbl"><i className="ti ti-book" /> subject</div>
                      <div className="st-subj-grid" style={{ marginBottom: 10 }}>
                        {SUBJECTS.map(s => (
                          <button key={s.id} className="st-subj-btn"
                            onClick={() => setNoteSubject(s.id)}
                            style={{
                              background: noteSubject === s.id ? s.bg : undefined,
                              borderColor: noteSubject === s.id ? s.c : undefined,
                            }}>
                            <i className={`ti ${s.icon}`} style={{ color: noteSubject === s.id ? s.c : '#b09aa4' }} />
                            <span className="st-subj-lbl" style={{ color: noteSubject === s.id ? s.c : '#b09aa4' }}>{s.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="st-input-lbl"><i className="ti ti-heading" /> title</div>
                      <input className="st-input" placeholder="note title"
                        value={noteTitle} onChange={e => setNoteTitle(e.target.value)} />

                      <div className="st-input-lbl"><i className="ti ti-pencil" /> content</div>
                      <textarea className="st-input" rows={4} placeholder="write your notes here..."
                        value={noteBody} onChange={e => setNoteBody(e.target.value)}
                        style={{ resize: 'none' }} />

                      <button className="st-submit" onClick={addNote}
                        disabled={!noteTitle.trim() || !noteBody.trim() || savingNote}
                        style={{
                          background: noteTitle.trim() && noteBody.trim() ? 'linear-gradient(135deg,#b8860b,#d4607a)' : 'rgba(212,96,122,0.08)',
                          color: noteTitle.trim() && noteBody.trim() ? '#fff' : '#b09aa4',
                        }}>
                        {savingNote ? 'saving...' : savedNote ? 'note saved ✨' : 'save note'}
                      </button>
                      {savedNote && (
                        <motion.div className="st-toast"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          note saved to your study space ✨
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notes list */}
                {notes.length === 0 ? (
                  <div className="st-empty"><i className="ti ti-notebook" />no notes yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: showAddNote ? 14 : 0 }}>
                    {notes.map((note, i) => {
                      const subj = getSubject(note.subject)
                      return (
                        <motion.div key={note.id} className="st-note"
                          initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <i className={`ti ${subj.icon}`} style={{ color: subj.c, fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="st-note-title">{note.title}</div>
                              <div className="st-note-body">{note.body}</div>
                              <div className="st-note-meta">
                                <span style={{ color: subj.c, fontWeight: 600 }}>{subj.label}</span>
                                <span>{new Date(note.created_at ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            </div>
                            <button className="st-del-btn" onClick={() => deleteNote(note.id)}>
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notes by subject */}
              <div className="st-card">
                <p className="st-card-lbl"><i className="ti ti-tags" /> by subject</p>
                {SUBJECTS.filter(s => notes.some(n => n.subject === s.id)).length === 0 ? (
                  <div className="st-empty" style={{ padding: '20px 10px' }}>
                    <i className="ti ti-book" />no notes yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {SUBJECTS.filter(s => notes.some(n => n.subject === s.id)).map(subj => {
                      const count = notes.filter(n => n.subject === subj.id).length
                      return (
                        <div key={subj.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: subj.bg, border: `1px solid ${subj.border}` }}>
                          <i className={`ti ${subj.icon}`} style={{ color: subj.c, fontSize: 15 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: subj.c, flex: 1 }}>{subj.label}</span>
                          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 300, color: subj.c }}>{count}</span>
                          <span style={{ fontSize: 10, color: subj.c, opacity: 0.6 }}>notes</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── INSIGHTS ── */}
          {activeTab === 'insights' && (
            <motion.div key="insights"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>

              {/* Time by subject */}
              <div className="st-card">
                <p className="st-card-lbl"><i className="ti ti-chart-bar" /> time by subject</p>
                {sessions.length === 0 ? (
                  <div className="st-empty"><i className="ti ti-hourglass" />complete a session to see insights</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {SUBJECTS.map(subj => {
                      const mins = sessions.filter(s => s.subject === subj.id).reduce((a, s) => a + s.duration_mins, 0)
                      if (!mins) return null
                      const maxMins = Math.max(...SUBJECTS.map(s2 => sessions.filter(x => x.subject === s2.id).reduce((a, x) => a + x.duration_mins, 0)))
                      const pct = maxMins ? Math.round((mins / maxMins) * 100) : 0
                      return (
                        <div key={subj.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <i className={`ti ${subj.icon}`} style={{ fontSize: 13, color: subj.c }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{subj.label}</span>
                            <span style={{ fontSize: 11, color: '#b09aa4' }}>{fmtMins(mins)}</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 999, background: 'rgba(212,96,122,0.08)', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${subj.c},${subj.dotC})` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Task status breakdown */}
              <div className="st-insight-row">
                <div className="st-card">
                  <p className="st-card-lbl"><i className="ti ti-circle-check" /> task status</p>
                  {tasks.length === 0 ? (
                    <div className="st-empty" style={{ padding: '16px' }}><i className="ti ti-list" />no tasks yet</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {STATUS_OPTS.map(s => {
                        const count = tasks.filter(t => t.status === s.key).length
                        const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0
                        return (
                          <div key={s.key}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: 4 }}>
                              <i className={`ti ${s.icon}`} style={{ fontSize: 11, color: s.c }} />
                              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{s.label}</span>
                              <span style={{ fontSize: 11, color: '#b09aa4' }}>{count}</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 999, background: 'rgba(212,96,122,0.08)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.65 }}
                                style={{ height: '100%', borderRadius: 999, background: s.c }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="st-card">
                  <p className="st-card-lbl"><i className="ti ti-flame" /> study streak</p>
                  {(() => {
                    let streak = 0
                    const d = new Date()
                    while (sessions.some(s => s.date === d.toISOString().slice(0, 10))) {
                      streak++; d.setDate(d.getDate() - 1)
                    }
                    return (
                      <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontFamily: 'Fraunces,serif', fontSize: 52, fontWeight: 300, color: '#b8860b', lineHeight: 1 }}>{streak}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', color: '#b09aa4', marginTop: 6 }}>day streak</div>
                        {streak > 0 && (
                          <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'Fraunces,serif', fontStyle: 'italic', color: '#5a8c63' }}>
                            keep it up! 🌿
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer */}
        <motion.div className="st-footer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div>
            <p className="st-footer-lbl">your study intention</p>
            <p className="st-footer-msg">
              {doneTasks === tasks.length && tasks.length > 0
                ? 'all tasks complete — you bloomed today.'
                : totalMinsToday > 0
                  ? `${fmtMins(totalMinsToday)} studied today — keep going.`
                  : 'ready to learn something beautiful?'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-book st-footer-ico" />
            <i className="ti ti-sparkles st-footer-ico" />
          </div>
        </motion.div>

      </div>
    </>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function StDivider({ label }: { label: string }) {
  return (
    <div className="st-divider">
      <div className="st-divider-line" />
      <i className="ti ti-circle st-divider-ico" />
      <span className="st-divider-label">{label}</span>
      <i className="ti ti-circle st-divider-ico" />
      <div className="st-divider-line" />
    </div>
  )
}

function StudyClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <motion.div className="st-clock"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
      <p className="st-clock-val">{time}</p>
      <p className="st-clock-sub">IST</p>
    </motion.div>
  )
}