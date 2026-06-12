'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  .pf * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

  .pf {
    min-height: 100vh;
    background: #fdf8f5;
    padding: clamp(20px, 4vw, 36px);
    color: #2e1f28;
  }

  /* ── Header ── */
  .pf-header { margin-bottom: 28px; }
  .pf-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: 3.5px;
    text-transform: uppercase; color: rgba(46,31,40,0.3);
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  }
  .pf-eyebrow::before {
    content: ''; display: block; width: 20px; height: 1px; background: #c85c78;
  }
  .pf-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(26px, 5vw, 38px); font-weight: 400; font-style: italic;
    color: #2e1f28; letter-spacing: -0.5px; line-height: 1.1;
  }
  .pf-title span { color: #c85c78; }

  /* ── Grid ── */
  .pf-grid {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 18px; align-items: start;
  }

  /* ── Card ── */
  .pf-card {
    background: #fff;
    border: 1px solid rgba(200,92,120,0.12);
    border-radius: 18px; overflow: hidden;
  }

  .pf-card-header {
    padding: 13px 18px;
    border-bottom: 1px solid rgba(200,92,120,0.08);
    display: flex; align-items: center; gap: 9px;
  }
  .pf-card-header-icon {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
  }
  .pf-card-header-title {
    font-family: 'Playfair Display', serif; font-style: italic;
    font-size: 14px; font-weight: 400; color: #2e1f28; flex: 1;
  }
  .pf-card-body { padding: 20px 22px 22px; }

  /* ── Avatar section ── */
  .pf-avatar-section {
    display: flex; flex-direction: column; align-items: center;
    padding: 28px 20px 22px; text-align: center;
    border-bottom: 1px solid rgba(200,92,120,0.08);
  }
  .pf-avatar-wrap {
    position: relative; margin-bottom: 14px; cursor: pointer;
    width: 86px; height: 86px;
  }
  .pf-avatar-ring {
    width: 86px; height: 86px; border-radius: 50%;
    border: 2px solid rgba(200,92,120,0.2);
    padding: 3px; position: relative;
  }
  .pf-avatar-img {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; display: block;
  }
  .pf-avatar-placeholder {
    width: 100%; height: 100%; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce, #e0d5f4);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 700; color: #c85c78;
  }
  .pf-avatar-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(46,31,40,0.48);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    font-size: 18px; color: white;
  }
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity: 1; }
  .pf-avatar-uploading {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(200,92,120,0.65);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: white;
  }
  .pf-avatar-hint {
    font-size: 10.5px; color: rgba(46,31,40,0.3); margin-bottom: 10px;
    letter-spacing: 0.2px;
  }
  .pf-avatar-status {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #4d9058; font-weight: 600; margin-bottom: 6px;
  }
  .pf-status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #4d9058;
    animation: pf-pulse 2s ease-in-out infinite;
  }
  @keyframes pf-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .pf-display-name {
    font-family: 'Playfair Display', serif; font-weight: 400;
    font-size: 19px; color: #2e1f28; margin-bottom: 3px;
  }
  .pf-display-email { font-size: 11.5px; color: rgba(46,31,40,0.38); margin-bottom: 11px; }
  .pf-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(200,92,120,0.08);
    border: 1px solid rgba(200,92,120,0.18);
    border-radius: 999px; padding: 4px 13px;
    font-size: 10.5px; font-weight: 600; color: #c85c78; letter-spacing: 0.3px;
  }

  /* ── Stats ── */
  .pf-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid rgba(200,92,120,0.08);
  }
  .pf-stat {
    padding: 14px 8px; text-align: center;
    border-right: 1px solid rgba(200,92,120,0.08);
  }
  .pf-stat:last-child { border-right: none; }
  .pf-stat-val {
    font-family: 'Playfair Display', serif; font-weight: 400;
    font-size: 22px; color: #c85c78; line-height: 1; margin-bottom: 3px;
  }
  .pf-stat-lbl {
    font-size: 9px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(46,31,40,0.3);
  }

  /* ── Quick nav ── */
  .pf-quick { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
  .pf-quick-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    background: transparent; border: none;
    color: rgba(46,31,40,0.5); font-size: 13px; font-weight: 500;
    cursor: pointer; text-align: left; width: 100%;
    transition: all 0.13s; font-family: 'DM Sans', sans-serif;
  }
  .pf-quick-btn:hover { background: rgba(200,92,120,0.07); color: #c85c78; }
  .pf-quick-btn i { font-size: 15px; color: rgba(46,31,40,0.28); transition: color 0.13s; }
  .pf-quick-btn:hover i { color: #c85c78; }

  /* ── Tabs ── */
  .pf-tabs {
    display: flex; gap: 3px; padding: 5px;
    background: rgba(200,92,120,0.08); border-radius: 13px;
    margin-bottom: 4px;
  }
  .pf-tab {
    flex: 1; padding: 8px 10px; border-radius: 10px;
    background: transparent; border: none;
    color: rgba(46,31,40,0.45); font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.14s;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .pf-tab i { font-size: 13px; }
  .pf-tab.active {
    background: #fff; color: #2e1f28;
    box-shadow: 0 1px 4px rgba(46,31,40,0.08);
  }

  /* ── Form fields ── */
  .pf-field { margin-bottom: 15px; }
  .pf-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1.8px;
    text-transform: uppercase; color: rgba(46,31,40,0.38);
    display: flex; align-items: center; gap: 5px; margin-bottom: 6px;
  }
  .pf-label i { font-size: 12px; color: #c85c78; }
  .pf-label-row {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;
  }
  .pf-label-row .pf-label { margin-bottom: 0; }
  .pf-char-count { font-size: 10px; color: rgba(46,31,40,0.28); }
  .pf-input {
    width: 100%; padding: 10px 13px;
    background: rgba(200,92,120,0.05);
    border: 1px solid transparent;
    border-radius: 11px; color: #2e1f28;
    font-size: 13.5px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: all 0.14s;
  }
  .pf-input:focus {
    border-color: rgba(200,92,120,0.35);
    background: rgba(200,92,120,0.06);
    box-shadow: 0 0 0 3px rgba(200,92,120,0.07);
  }
  .pf-input:disabled { opacity: 0.45; cursor: not-allowed; }
  .pf-input.error { border-color: rgba(200,92,120,0.6) !important; background: rgba(200,92,120,0.08) !important; }
  .pf-input-note { font-size: 11px; color: rgba(46,31,40,0.35); margin-top: 4px; }
  .pf-field-error { font-size: 11px; color: #c85c78; margin-top: 4px; font-weight: 500; }

  .pf-divider { height: 1px; background: rgba(200,92,120,0.08); margin: 16px 0; }

  /* ── Buttons ── */
  .pf-save-btn {
    width: 100%; padding: 11px 20px;
    background: #c85c78;
    border: none; border-radius: 11px;
    color: white; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: opacity 0.14s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pf-save-btn:hover { opacity: 0.88; }
  .pf-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .pf-danger-btn {
    width: 100%; padding: 10px;
    background: transparent;
    border: 1px solid rgba(200,92,120,0.22);
    border-radius: 11px; color: #c85c78;
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.14s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pf-danger-btn:hover { background: rgba(200,92,120,0.07); }
  .pf-danger-btn.confirm {
    background: #c85c78; color: white; border-color: #c85c78;
  }
  .pf-outline-btn {
    padding: 9px 16px;
    background: transparent;
    border: 1px solid rgba(200,92,120,0.22);
    border-radius: 11px; color: rgba(46,31,40,0.55);
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.14s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pf-outline-btn:hover { border-color: rgba(200,92,120,0.4); color: #2e1f28; }

  /* ── Toast ── */
  .pf-toast {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    padding: 11px 20px; border-radius: 11px;
    font-size: 13px; font-weight: 600;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(46,31,40,0.15);
    z-index: 9999; white-space: nowrap;
  }

  /* ── Activity ── */
  .pf-activity {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid rgba(200,92,120,0.06);
  }
  .pf-activity:last-child { border-bottom: none; }
  .pf-activity-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .pf-activity-title { font-size: 13px; font-weight: 600; color: #2e1f28; }
  .pf-activity-sub { font-size: 11px; color: rgba(46,31,40,0.4); margin-top: 1px; }
  .pf-activity-val {
    font-family: 'Playfair Display', serif; font-size: 18px;
    font-weight: 400; color: #c85c78; margin-left: auto;
  }

  /* ── Preference row ── */
  .pf-pref-row {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 0; border-bottom: 1px solid rgba(200,92,120,0.06);
  }
  .pf-pref-row:last-child { border-bottom: none; }
  .pf-pref-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
  }
  .pf-pref-name { font-size: 13px; font-weight: 600; color: #2e1f28; }
  .pf-pref-sub { font-size: 11px; color: rgba(46,31,40,0.4); margin-top: 1px; }

  /* ── Joined card ── */
  .pf-joined {
    display: flex; align-items: center; gap: 12px; padding: 16px 18px;
  }
  .pf-joined-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(200,92,120,0.08); display: flex; align-items: center;
    justify-content: center; font-size: 16px; color: #c85c78; flex-shrink: 0;
  }
  .pf-joined-name { font-size: 12.5px; font-weight: 600; color: #2e1f28; }
  .pf-joined-sub { font-size: 11px; color: rgba(46,31,40,0.35); margin-top: 1px; }

  /* ── AI Insight ── */
  .pf-insight {
    padding: 18px;
    background: linear-gradient(135deg, rgba(200,92,120,0.05), rgba(139,122,192,0.07));
    border-radius: 13px; position: relative; overflow: hidden;
  }
  .pf-insight::before {
    content: ''; position: absolute; top: -20px; right: -20px;
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(200,92,120,0.06);
  }
  .pf-insight-label {
    font-size: 9px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: #c85c78; margin-bottom: 8px;
    display: flex; align-items: center; gap: 5px;
  }
  .pf-insight-text {
    font-size: 13px; color: rgba(46,31,40,0.7); line-height: 1.6;
    font-style: italic;
  }
  .pf-insight-loading {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: rgba(46,31,40,0.35);
  }

  /* ── Mood history items ── */
  .pf-mood-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 0; border-bottom: 1px solid rgba(200,92,120,0.06);
  }
  .pf-mood-item:last-child { border-bottom: none; }
  .pf-mood-emoji { font-size: 20px; flex-shrink: 0; }
  .pf-mood-label { font-size: 13px; font-weight: 600; color: #2e1f28; text-transform: capitalize; }
  .pf-mood-note { font-size: 11px; color: rgba(46,31,40,0.4); margin-top: 1px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pf-mood-date { margin-left: auto; font-size: 11px; color: rgba(46,31,40,0.3); }

  /* ── Modal ── */
  .pf-modal-overlay {
    position: fixed; inset: 0; background: rgba(46,31,40,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 9998; padding: 20px;
  }
  .pf-modal {
    background: #fff; border-radius: 20px;
    padding: 28px; max-width: 360px; width: 100%;
    box-shadow: 0 20px 60px rgba(46,31,40,0.2);
  }
  .pf-modal-title {
    font-family: 'Playfair Display', serif; font-size: 20px;
    color: #2e1f28; margin-bottom: 10px;
  }
  .pf-modal-body { font-size: 13px; color: rgba(46,31,40,0.55); line-height: 1.6; margin-bottom: 20px; }
  .pf-modal-actions { display: flex; gap: 10px; }

  /* ── Password strength ── */
  .pf-pw-strength { margin-top: 6px; display: flex; gap: 4px; }
  .pf-pw-bar {
    flex: 1; height: 3px; border-radius: 3px;
    background: rgba(200,92,120,0.12); transition: background 0.2s;
  }
  .pf-pw-bar.filled { background: #c85c78; }
  .pf-pw-bar.medium { background: #b07a10; }
  .pf-pw-bar.strong { background: #4d9058; }
  .pf-pw-label { font-size: 10px; color: rgba(46,31,40,0.4); margin-top: 4px; }

  /* ── Section divider inside card ── */
  .pf-section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(46,31,40,0.28);
    margin: 18px 0 10px;
  }

  /* ── Streak row ── */
  .pf-streak-row {
    display: flex; gap: 6px; margin-top: 4px;
  }
  .pf-streak-dot {
    width: 22px; height: 22px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    background: rgba(200,92,120,0.08); color: rgba(46,31,40,0.3);
    transition: all 0.2s;
  }
  .pf-streak-dot.active { background: #c85c78; color: white; }

  @media (max-width: 860px) { .pf-grid { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .pf { padding: 16px; } .pf-row { grid-template-columns: 1fr !important; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .pf-skeleton {
    background: linear-gradient(90deg, rgba(200,92,120,0.06) 25%, rgba(200,92,120,0.1) 50%, rgba(200,92,120,0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px; height: 14px;
  }
`

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊', sad: '😢', anxious: '😰', calm: '😌',
  excited: '🤩', tired: '😴', angry: '😤', grateful: '🙏',
  neutral: '😐', content: '🥲', overwhelmed: '😵', hopeful: '🌱',
}

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth state
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  // Profile info fields
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [college, setCollege] = useState('')
  const [year, setYear] = useState('')
  const [handle, setHandle] = useState('')
  const [birthday, setBirthday] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Security fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwErrors, setPwErrors] = useState<string[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences'>('info')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Stats
  const [moodCount, setMoodCount] = useState(0)
  const [habitCount, setHabitCount] = useState(0)
  const [streakCount, setStreakCount] = useState(0)
  const [joinDate, setJoinDate] = useState('')
  const [recentMoods, setRecentMoods] = useState<any[]>([])
  const [weekDots, setWeekDots] = useState<boolean[]>([false, false, false, false, false, false, false])

  // Preferences
  const [prefs, setPrefs] = useState({
    daily_reminder: false,
    dark_mode: false,
    weekly_report: false,
    private_mode: false,
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  // AI Insight
  const [insight, setInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [insightLoaded, setInsightLoaded] = useState(false)

  // Field errors
  const [nameError, setNameError] = useState('')
  const [handleError, setHandleError] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
    setJoinDate(new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))

    // Profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (prof) {
      const p = prof as any
      setProfile(p)
      setFullName(p.full_name || user.user_metadata?.full_name || '')
      setBio(p.bio || '')
      setCollege(p.college || '')
      setYear(p.year || '')
      setHandle(p.handle || '')
      setBirthday(p.birthday || '')
      setAvatarUrl(p.avatar_url || '')
      if (p.preferences) {
        setPrefs(prev => ({ ...prev, ...p.preferences }))
      }
    } else {
      setFullName(user.user_metadata?.full_name || '')
    }

    // Mood count + recent
    const { count: mc, data: moodData } = await supabase
      .from('mood_entries')
      .select('id, mood, note, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
    setMoodCount(mc || 0)
    setRecentMoods(moodData || [])

    // Streak: count distinct days with mood in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const { data: streakData } = await supabase
      .from('mood_entries')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())

    const loggedDays = new Set(
      (streakData || []).map(e => new Date(e.created_at!).toDateString())
    )
    const dots: boolean[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dots.push(loggedDays.has(d.toDateString()))
    }
    setWeekDots(dots)
    const streak = dots.filter(Boolean).length
    setStreakCount(streak)

    // Habits
    const { count: hc } = await supabase
      .from('habit_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
    setHabitCount(hc || 0)
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3200)
  }

  // ── Validation ──
  const validateInfo = () => {
    let valid = true
    if (!fullName.trim()) { setNameError('Name is required'); valid = false }
    else setNameError('')
    if (handle && !/^[a-z0-9_]{3,20}$/.test(handle)) {
      setHandleError('3–20 chars, lowercase letters, numbers, underscores only')
      valid = false
    } else setHandleError('')
    return valid
  }

  const validatePassword = () => {
    const errors: string[] = []
    if (newPassword.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(newPassword)) errors.push('One uppercase letter')
    if (!/[0-9]/.test(newPassword)) errors.push('One number')
    if (newPassword !== confirmPassword) errors.push('Passwords do not match')
    setPwErrors(errors)
    return errors.length === 0
  }

  // ── Password strength ──
  const pwStrength = (pw: string) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    return score
  }
  const strength = pwStrength(newPassword)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthClass = strength <= 1 ? 'filled' : strength === 2 ? 'medium' : 'strong'

  // ── Save profile ──
  const handleSave = async () => {
    if (!user || !validateInfo()) return
    setSaving(true)

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      bio,
      college,
      year,
      handle: handle.toLowerCase(),
      birthday,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })

    await supabase.auth.updateUser({ data: { full_name: fullName } })
    setSaving(false)
    if (error) showToast('Failed to save. Try again.', 'error')
    else showToast('Profile saved! 🌸')
  }

  // ── Save password ──
  const handleSavePassword = async () => {
    if (!validatePassword()) return
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPw(false)
    if (error) showToast(error.message || 'Failed to update password.', 'error')
    else {
      setNewPassword('')
      setConfirmPassword('')
      setPwErrors([])
      showToast('Password updated! 🔒')
    }
  }

  // ── Save preferences ──
  const handleTogglePref = async (key: keyof typeof prefs) => {
    if (!user) return
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setSavingPrefs(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      preferences: updated,
      updated_at: new Date().toISOString(),
    })
    setSavingPrefs(false)
  }

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (!user) return
    setDeletingAccount(true)
    // Delete profile data
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.from('mood_entries').delete().eq('user_id', user.id)
    // Sign out (account deletion via admin API would need server-side)
    await supabase.auth.signOut()
    setDeletingAccount(false)
    setDeleteModal(false)
    window.location.href = '/goodbye'
  }

  // ── Avatar upload ──
  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showToast('Only images allowed!', 'error'); return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error'); return
    }
    setUploading(true)
    if (avatarUrl) {
      const oldPath = avatarUrl.split('/avatars/')[1]
      if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
    }
    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) {
      showToast('Upload failed. Try again.', 'error'); setUploading(false); return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    setAvatarUrl(publicUrl)
    await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, bio, college, year,
      avatar_url: publicUrl, updated_at: new Date().toISOString(),
    })
    setUploading(false)
    showToast('Photo updated! 📸')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── AI Insight ──
  const loadInsight = async () => {
    if (insightLoaded || loadingInsight) return
    setLoadingInsight(true)
    try {
      const { data: moods } = await supabase
        .from('mood_entries')
        .select('mood, note, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const moodSummary = (moods || [])
        .map((m: any) => `${m.mood}${m.note ? ` (note: "${m.note}")` : ''} on ${new Date(m.created_at).toLocaleDateString()}`)
        .join('; ')

      const prompt = moodSummary.length
        ? `You are a warm, supportive wellness companion. Based on these recent mood logs: ${moodSummary}. Write a brief 1–2 sentence personal insight that's encouraging and specific. Be gentle, personal and uplifting. No generic advice.`
        : `You are a warm wellness companion. Write a single encouraging sentence for someone just starting to track their moods. Make it feel like a warm welcome, not a tutorial.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.content?.map((b: any) => b.text || '').join('') || ''
      setInsight(text.trim())
    } catch {
      setInsight('Every day you show up is a small act of self-love. Keep going. 🌸')
    }
    setLoadingInsight(false)
    setInsightLoaded(true)
  }

  // Auto-load insight when activity tab area is visible
  useEffect(() => {
    if (user && moodCount >= 0 && !insightLoaded) {
      loadInsight()
    }
  }, [user, moodCount])

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  const displayName = fullName || 'Student'
  const email = user?.email || ''

  const age = birthday
    ? Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().getDay() // 0=Sun
  const reorderedDays = Array.from({ length: 7 }, (_, i) => WEEK_DAYS[(today - 6 + i + 7) % 7])

  return (
    <>
      <style>{css}</style>
      <div className="pf">

        {/* Header */}
        <motion.div className="pf-header" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
          <p className="pf-eyebrow">
            <i className="ti ti-user-circle" style={{ color: '#c85c78' }} />
            your space
          </p>
          <h1 className="pf-title">
            hey, <span>{displayName.split(' ')[0]}</span> 🌸
          </h1>
        </motion.div>

        <div className="pf-grid">

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Avatar card */}
            <motion.div className="pf-card"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

              <div className="pf-avatar-section">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div className="pf-avatar-wrap" onClick={handleAvatarClick} title="Click to change photo">
                  <div className="pf-avatar-ring">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" className="pf-avatar-img" />
                      : <div className="pf-avatar-placeholder">{initials}</div>}
                  </div>
                  {uploading
                    ? <div className="pf-avatar-uploading"><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /></div>
                    : <div className="pf-avatar-overlay"><i className="ti ti-camera" /></div>}
                </div>
                <div className="pf-avatar-hint">click to change photo</div>
                <div className="pf-avatar-status">
                  <div className="pf-status-dot" />
                  online
                </div>
                <div className="pf-display-name">{displayName}</div>
                {handle && <div style={{ fontSize: '11px', color: 'rgba(46,31,40,0.32)', marginBottom: '3px' }}>@{handle}</div>}
                <div className="pf-display-email">{email}</div>

                {(college || age) && (
                  <div style={{ fontSize: '11.5px', color: 'rgba(46,31,40,0.45)', marginBottom: '7px' }}>
                    {college && `📚 ${college}`}{year && ` · ${year}`}
                    {age && ` · ${age} yrs`}
                  </div>
                )}
                {bio && (
                  <div style={{ fontSize: '11.5px', color: 'rgba(46,31,40,0.5)', fontStyle: 'italic', marginBottom: '12px', maxWidth: '210px', lineHeight: 1.5 }}>
                    "{bio}"
                  </div>
                )}
                <div className="pf-badge">
                  <i className="ti ti-sparkles" style={{ fontSize: '10px' }} />
                  MoodOS Student
                </div>
              </div>

              {/* Stats */}
              <div className="pf-stats">
                <div className="pf-stat">
                  <div className="pf-stat-val">{moodCount}</div>
                  <div className="pf-stat-lbl">moods</div>
                </div>
                <div className="pf-stat">
                  <div className="pf-stat-val">{habitCount}</div>
                  <div className="pf-stat-lbl">habits</div>
                </div>
                <div className="pf-stat">
                  <div className="pf-stat-val">{streakCount}</div>
                  <div className="pf-stat-lbl">streak</div>
                </div>
              </div>

              {/* 7-day streak dots */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(200,92,120,0.07)' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(46,31,40,0.28)', marginBottom: '7px' }}>
                  this week
                </div>
                <div className="pf-streak-row">
                  {weekDots.map((active, i) => (
                    <div key={i} className={`pf-streak-dot${active ? ' active' : ''}`} title={reorderedDays[i]}>
                      {reorderedDays[i]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick nav */}
              <div className="pf-quick">
                {[
                  { icon: 'ti-mood-smile', label: 'Mood history', href: '/mood' },
                  { icon: 'ti-checks', label: 'My habits', href: '/habits' },
                  { icon: 'ti-chart-bar', label: 'Weekly insights', href: '/insights' },
                ].map(item => (
                  <a key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                    <button className="pf-quick-btn">
                      <i className={`ti ${item.icon}`} />
                      {item.label}
                    </button>
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Joined card */}
            <motion.div className="pf-card"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="pf-joined">
                <div className="pf-joined-icon"><i className="ti ti-calendar-heart" /></div>
                <div>
                  <div className="pf-joined-name">Joined {joinDate}</div>
                  <div className="pf-joined-sub">blooming since day one 🌸</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Tabs */}
            <div className="pf-tabs">
              {(['info', 'security', 'preferences'] as const).map(tab => (
                <button
                  key={tab}
                  className={`pf-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}>
                  <i className={`ti ${tab === 'info' ? 'ti-user' : tab === 'security' ? 'ti-lock' : 'ti-settings'}`} />
                  {tab === 'info' ? 'profile' : tab === 'security' ? 'security' : 'preferences'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── INFO TAB ── */}
              {activeTab === 'info' && (
                <motion.div key="info" className="pf-card"
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(200,92,120,0.08)' }}>
                      <i className="ti ti-user" style={{ color: '#c85c78' }} />
                    </div>
                    <span className="pf-card-header-title">personal info</span>
                  </div>
                  <div className="pf-card-body">

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="pf-row">
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-user" /> full name *</label>
                        <input
                          className={`pf-input${nameError ? ' error' : ''}`}
                          value={fullName}
                          onChange={e => { setFullName(e.target.value); setNameError('') }}
                          placeholder="Your full name"
                        />
                        {nameError && <p className="pf-field-error">{nameError}</p>}
                      </div>
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-at" /> username</label>
                        <input
                          className={`pf-input${handleError ? ' error' : ''}`}
                          value={handle}
                          onChange={e => { setHandle(e.target.value.toLowerCase()); setHandleError('') }}
                          placeholder="your_handle"
                        />
                        {handleError && <p className="pf-field-error">{handleError}</p>}
                      </div>
                    </div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-mail" /> email</label>
                      <input className="pf-input" value={email} disabled />
                      <p className="pf-input-note">Email cannot be changed here.</p>
                    </div>

                    <div className="pf-field">
                      <div className="pf-label-row">
                        <label className="pf-label"><i className="ti ti-writing" /> bio</label>
                        <span className="pf-char-count">{bio.length}/120</span>
                      </div>
                      <input
                        className="pf-input"
                        value={bio}
                        maxLength={120}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Something about you..."
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }} className="pf-row">
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-school" /> college</label>
                        <input className="pf-input" value={college}
                          onChange={e => setCollege(e.target.value)}
                          placeholder="Your college" />
                      </div>
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-calendar" /> year</label>
                        <input className="pf-input" value={year}
                          onChange={e => setYear(e.target.value)}
                          placeholder="e.g. Final year" />
                      </div>
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-cake" /> birthday</label>
                        <input className="pf-input" type="date" value={birthday}
                          onChange={e => setBirthday(e.target.value)} />
                      </div>
                    </div>

                    <div className="pf-divider" />

                    <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
                      {saving
                        ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> saving...</>
                        : <><i className="ti ti-device-floppy" /> save changes</>}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── SECURITY TAB ── */}
              {activeTab === 'security' && (
                <motion.div key="security" className="pf-card"
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(139,122,192,0.1)' }}>
                      <i className="ti ti-lock" style={{ color: '#8b7ac0' }} />
                    </div>
                    <span className="pf-card-header-title">security</span>
                  </div>
                  <div className="pf-card-body">

                    <div className="pf-section-title">change password</div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-lock" /> new password</label>
                      <input
                        className="pf-input"
                        type="password"
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setPwErrors([]) }}
                        placeholder="At least 8 characters"
                      />
                      {newPassword && (
                        <>
                          <div className="pf-pw-strength">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`pf-pw-bar${i <= strength ? ` ${strengthClass}` : ''}`} />
                            ))}
                          </div>
                          <div className="pf-pw-label">{strengthLabel}</div>
                        </>
                      )}
                    </div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-lock-check" /> confirm password</label>
                      <input
                        className={`pf-input${confirmPassword && confirmPassword !== newPassword ? ' error' : ''}`}
                        type="password"
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setPwErrors([]) }}
                        placeholder="Confirm new password"
                      />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="pf-field-error">Passwords do not match</p>
                      )}
                    </div>

                    {pwErrors.length > 0 && (
                      <div style={{ padding: '10px 14px', background: 'rgba(200,92,120,0.07)', borderRadius: '10px', marginBottom: '12px' }}>
                        {pwErrors.map((e, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#c85c78', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: i < pwErrors.length - 1 ? '4px' : 0 }}>
                            <i className="ti ti-x" style={{ fontSize: '11px' }} /> {e}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      className="pf-save-btn"
                      style={{ marginBottom: '24px' }}
                      onClick={handleSavePassword}
                      disabled={savingPw || !newPassword}
                    >
                      {savingPw
                        ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> updating...</>
                        : <><i className="ti ti-lock" /> update password</>}
                    </button>

                    <div className="pf-section-title">session</div>

                    <button
                      className="pf-outline-btn"
                      style={{ width: '100%', marginBottom: '20px' }}
                      onClick={async () => {
                        await supabase.auth.signOut()
                        window.location.href = '/login'
                      }}
                    >
                      <i className="ti ti-logout" /> sign out of all devices
                    </button>

                    <div style={{
                      padding: '16px',
                      background: 'rgba(200,92,120,0.04)',
                      border: '1px solid rgba(200,92,120,0.14)',
                      borderRadius: '13px'
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#c85c78', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        ⚠ Danger zone
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(46,31,40,0.42)', marginBottom: '12px', lineHeight: 1.5 }}>
                        Deleting your account is permanent and cannot be undone. All your mood logs, habits, and profile data will be erased.
                      </div>
                      <button className="pf-danger-btn" onClick={() => setDeleteModal(true)}>
                        <i className="ti ti-trash" /> delete my account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── PREFERENCES TAB ── */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" className="pf-card"
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(77,144,88,0.1)' }}>
                      <i className="ti ti-settings" style={{ color: '#4d9058' }} />
                    </div>
                    <span className="pf-card-header-title">preferences</span>
                    {savingPrefs && (
                      <i className="ti ti-loader-2" style={{ fontSize: '13px', color: '#c85c78', animation: 'spin 0.8s linear infinite', marginLeft: 'auto' }} />
                    )}
                  </div>
                  <div className="pf-card-body">
                    {[
                      { key: 'daily_reminder', icon: 'ti-bell', label: 'Daily mood reminder', sub: 'Nudge to log your mood each evening', color: '#c85c78' },
                      { key: 'dark_mode', icon: 'ti-moon', label: 'Dark mode', sub: 'Switch to a darker theme', color: '#8b7ac0' },
                      { key: 'weekly_report', icon: 'ti-chart-bar', label: 'Weekly AI report', sub: 'Get an AI-powered weekly mood summary', color: '#4d9058' },
                      { key: 'private_mode', icon: 'ti-eye-off', label: 'Private mode', sub: 'Blur sensitive data on-screen', color: '#b07a10' },
                    ].map(pref => (
                      <div key={pref.key} className="pf-pref-row">
                        <div className="pf-pref-icon" style={{ background: `${pref.color}14`, color: pref.color }}>
                          <i className={`ti ${pref.icon}`} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="pf-pref-name">{pref.label}</div>
                          <div className="pf-pref-sub">{pref.sub}</div>
                        </div>
                        <Toggle
                          color={pref.color}
                          value={prefs[pref.key as keyof typeof prefs]}
                          onChange={() => handleTogglePref(pref.key as keyof typeof prefs)}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── AI Insight card ── */}
            <motion.div className="pf-card"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="pf-card-header">
                <div className="pf-card-header-icon" style={{ background: 'rgba(139,122,192,0.1)' }}>
                  <i className="ti ti-sparkles" style={{ color: '#8b7ac0' }} />
                </div>
                <span className="pf-card-header-title">your insight</span>
                <button
                  onClick={() => { setInsightLoaded(false); setInsight(''); loadInsight() }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(46,31,40,0.3)' }}
                  title="Refresh insight"
                >
                  <i className="ti ti-refresh" />
                </button>
              </div>
              <div className="pf-card-body">
                <div className="pf-insight">
                  <div className="pf-insight-label">
                    <i className="ti ti-sparkles" style={{ fontSize: '11px' }} />
                    ai reflection
                  </div>
                  {loadingInsight ? (
                    <div className="pf-insight-loading">
                      <i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} />
                      reflecting on your journey...
                    </div>
                  ) : insight ? (
                    <div className="pf-insight-text">{insight}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="pf-skeleton" style={{ width: '100%' }} />
                      <div className="pf-skeleton" style={{ width: '80%' }} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Recent activity ── */}
            <motion.div className="pf-card"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="pf-card-header">
                <div className="pf-card-header-icon" style={{ background: 'rgba(176,122,16,0.08)' }}>
                  <i className="ti ti-activity" style={{ color: '#b07a10' }} />
                </div>
                <span className="pf-card-header-title">recent mood logs</span>
                {moodCount > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(46,31,40,0.3)', fontWeight: 600 }}>
                    {moodCount} total
                  </span>
                )}
              </div>
              <div className="pf-card-body">
                {recentMoods.length > 0 ? (
                  recentMoods.map((m: any) => (
                    <div key={m.id} className="pf-mood-item">
                      <div className="pf-mood-emoji">
                        {MOOD_EMOJIS[m.mood?.toLowerCase()] || '🌸'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="pf-mood-label">{m.mood}</div>
                        {m.note && <div className="pf-mood-note">{m.note}</div>}
                      </div>
                      <div className="pf-mood-date">
                        {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '26px 16px', color: 'rgba(46,31,40,0.28)', fontSize: '12.5px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌱</div>
                    start logging moods to see your activity
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* ── Delete account modal ── */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div className="pf-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setDeleteModal(false) }}>
            <motion.div className="pf-modal"
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>💔</div>
              <div className="pf-modal-title">Delete your account?</div>
              <div className="pf-modal-body">
                This will permanently delete all your mood logs, habits, and profile data. This action <strong>cannot be undone</strong>.<br /><br />
                Type <strong>DELETE</strong> to confirm.
              </div>
              <input
                className="pf-input"
                style={{ marginBottom: '16px' }}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
              />
              <div className="pf-modal-actions">
                <button className="pf-outline-btn" style={{ flex: 1 }} onClick={() => { setDeleteModal(false); setDeleteConfirmText('') }}>
                  cancel
                </button>
                <button
                  className={`pf-danger-btn${deleteConfirmText === 'DELETE' ? ' confirm' : ''}`}
                  style={{ flex: 1 }}
                  disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                  onClick={handleDeleteAccount}
                >
                  {deletingAccount
                    ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> deleting...</>
                    : <><i className="ti ti-trash" /> delete</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="pf-toast"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{ background: toastType === 'error' ? '#3d1e1e' : '#2e1f28' }}>
            <i
              className={`ti ${toastType === 'error' ? 'ti-x' : 'ti-check'}`}
              style={{ color: toastType === 'error' ? '#f09595' : '#8fc49a' }}
            />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Toggle with controlled value ──
function Toggle({ color, value, onChange }: { color: string; value: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: '38px', height: '21px', borderRadius: '11px',
        background: value ? color : 'rgba(46,31,40,0.12)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}>
      <div style={{
        position: 'absolute', top: '2.5px',
        left: value ? '19.5px' : '2.5px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}