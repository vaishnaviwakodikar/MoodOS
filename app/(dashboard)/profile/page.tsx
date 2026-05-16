'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  .pf * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

  .pf {
    min-height: 100vh; background: #fdf7f0;
    padding: clamp(20px, 4vw, 40px); color: #3d2a35;
  }

  .pf-header { margin-bottom: 28px; }
  .pf-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: rgba(61,42,53,0.35);
    display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
  }
  .pf-title {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: clamp(26px, 5vw, 38px); font-weight: 300;
    color: #3d2a35; letter-spacing: -1px; line-height: 1.1;
  }
  .pf-title span { color: #d4607a; }

  .pf-grid {
    display: grid; grid-template-columns: 300px 1fr;
    gap: 20px; align-items: start;
  }

  .pf-card {
    background: #fff9fb;
    border: 1px solid rgba(212,96,122,0.12);
    border-radius: 20px; overflow: hidden;
  }

  .pf-card-header {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(212,96,122,0.08);
    display: flex; align-items: center; gap: 8px;
  }
  .pf-card-header-icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .pf-card-header-title {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 15px; font-weight: 300; color: #3d2a35;
  }
  .pf-card-body { padding: 20px; }

  /* avatar section */
  .pf-avatar-section {
    display: flex; flex-direction: column; align-items: center;
    padding: 28px 20px 20px; text-align: center;
    background: linear-gradient(135deg, rgba(242,196,206,0.2), rgba(232,218,245,0.2));
    border-bottom: 1px solid rgba(212,96,122,0.08);
  }

  .pf-avatar-wrap {
    position: relative; margin-bottom: 14px; cursor: pointer;
  }

  .pf-avatar-img {
    width: 84px; height: 84px; border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(212,96,122,0.25);
    box-shadow: 0 8px 24px rgba(212,96,122,0.15);
  }

  .pf-avatar-placeholder {
    width: 84px; height: 84px; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce, #e8daf5);
    border: 3px solid rgba(212,96,122,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 800; color: #d4607a;
    box-shadow: 0 8px 24px rgba(212,96,122,0.15);
  }

  .pf-avatar-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(61,42,53,0.45);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    font-size: 18px; color: white;
  }
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity: 1; }

  .pf-avatar-uploading {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(212,96,122,0.7);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: white;
  }

  .pf-avatar-status {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #5a8c63; font-weight: 600; margin-bottom: 6px;
  }
  .pf-status-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #5a8c63;
    box-shadow: 0 0 6px rgba(90,140,99,0.5);
    animation: pf-pulse 2s ease-in-out infinite;
  }
  @keyframes pf-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  .pf-display-name {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 20px; font-weight: 300; color: #3d2a35; margin-bottom: 3px;
  }
  .pf-display-email { font-size: 12px; color: rgba(61,42,53,0.4); margin-bottom: 12px; }

  .pf-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(212,96,122,0.08);
    border: 1px solid rgba(212,96,122,0.18);
    border-radius: 999px; padding: 4px 12px;
    font-size: 11px; font-weight: 600; color: #d4607a;
  }

  .pf-stats {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: rgba(212,96,122,0.08);
    border-top: 1px solid rgba(212,96,122,0.08);
  }
  .pf-stat { background: #fff9fb; padding: 14px 8px; text-align: center; }
  .pf-stat-val {
    font-family: 'Fraunces', serif; font-weight: 300;
    font-size: 22px; color: #d4607a; line-height: 1; margin-bottom: 3px;
  }
  .pf-stat-lbl {
    font-size: 9px; font-weight: 600; letter-spacing: 1.5px;
    text-transform: uppercase; color: rgba(61,42,53,0.35);
  }

  .pf-quick { padding: 10px; display: flex; flex-direction: column; gap: 2px; }
  .pf-quick-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: transparent; border: none;
    color: rgba(61,42,53,0.55); font-size: 13px; font-weight: 500;
    cursor: pointer; text-align: left; width: 100%;
    transition: all 0.14s; font-family: 'DM Sans', sans-serif;
  }
  .pf-quick-btn:hover { background: rgba(212,96,122,0.06); color: #d4607a; }
  .pf-quick-btn i { font-size: 15px; color: rgba(61,42,53,0.3); transition: color 0.14s; }
  .pf-quick-btn:hover i { color: #d4607a; }
  .pf-quick-divider { height: 1px; background: rgba(212,96,122,0.08); margin: 4px 8px; }

  .pf-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
  .pf-tab {
    padding: 7px 16px; border-radius: 20px;
    background: transparent; border: 1px solid rgba(212,96,122,0.15);
    color: rgba(61,42,53,0.45); font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.14s;
  }
  .pf-tab.active {
    background: linear-gradient(135deg, #d4607a, #9b7ec8);
    border-color: transparent; color: white;
  }

  .pf-field { margin-bottom: 16px; }
  .pf-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: rgba(61,42,53,0.4);
    display: flex; align-items: center; gap: 5px; margin-bottom: 6px;
  }
  .pf-label i { font-size: 12px; color: #d4607a; }
  .pf-input {
    width: 100%; padding: 11px 14px;
    background: rgba(212,96,122,0.04);
    border: 1px solid rgba(212,96,122,0.15);
    border-radius: 12px; color: #3d2a35;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: all 0.15s;
  }
  .pf-input:focus {
    border-color: rgba(212,96,122,0.4);
    background: rgba(212,96,122,0.06);
    box-shadow: 0 0 0 3px rgba(212,96,122,0.08);
  }
  .pf-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .pf-input-note { font-size: 11px; color: rgba(61,42,53,0.35); margin-top: 4px; }

  .pf-save-btn {
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, #d4607a, #9b7ec8);
    border: none; border-radius: 12px;
    color: white; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: opacity 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pf-save-btn:hover { opacity: 0.9; }
  .pf-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .pf-danger-btn {
    width: 100%; padding: 11px;
    background: rgba(212,96,122,0.06);
    border: 1px solid rgba(212,96,122,0.2);
    border-radius: 12px; color: #d4607a;
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pf-danger-btn:hover { background: rgba(212,96,122,0.12); }

  .pf-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #3d2a35; color: white;
    padding: 12px 20px; border-radius: 12px;
    font-size: 13px; font-weight: 600;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 24px rgba(61,42,53,0.2);
    z-index: 9999; white-space: nowrap;
  }

  .pf-activity {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid rgba(212,96,122,0.06);
  }
  .pf-activity:last-child { border-bottom: none; }
  .pf-activity-icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .pf-activity-title { font-size: 13px; font-weight: 600; color: #3d2a35; }
  .pf-activity-sub { font-size: 11px; color: rgba(61,42,53,0.4); margin-top: 1px; }
  .pf-activity-val {
    font-family: 'Fraunces', serif; font-size: 16px;
    font-weight: 300; color: #d4607a; margin-left: auto;
  }

  @media (max-width: 900px) { .pf-grid { grid-template-columns: 1fr; } }
  @media (max-width: 600px) { .pf { padding: 16px; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
`

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [college, setCollege] = useState('')
  const [year, setYear] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences'>('info')
  const [moodCount, setMoodCount] = useState(0)
  const [joinDate, setJoinDate] = useState('')

  useEffect(() => {
    loadProfile()
    supabase.from('mood_entries').select('id', { count: 'exact' }).then(({ count }) => {
      setMoodCount(count || 0)
    })
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
    setJoinDate(new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))

    // fetch from profiles table
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (prof) {
      setProfile(prof)
      setFullName(prof.full_name || user.user_metadata?.full_name || '')
      setBio(prof.bio || '')
      setCollege(prof.college || '')
      setYear(prof.year || '')
      setAvatarUrl(prof.avatar_url || '')
    } else {
      setFullName(user.user_metadata?.full_name || '')
    }
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    // upsert into profiles table
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      bio,
      college,
      year,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })

    // also update auth metadata
    await supabase.auth.updateUser({
      data: { full_name: fullName }
    })

    setSaving(false)
    if (error) showToast('Failed to save. Try again.', 'error')
    else showToast('Profile saved! 🌸')
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // validate
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showToast('Only images allowed!', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error')
      return
    }

    setUploading(true)

    // delete old avatar if exists
    if (avatarUrl) {
      const oldPath = avatarUrl.split('/avatars/')[1]
      if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
    }

    // upload new avatar
    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      showToast('Upload failed. Try again.', 'error')
      setUploading(false)
      return
    }

    // get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    setAvatarUrl(publicUrl)

    // save to profile immediately
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      bio, college, year,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })

    setUploading(false)
    showToast('Profile picture updated! 📸')

    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  const displayName = fullName || 'Student'
  const email = user?.email || ''

  return (
    <>
      <style>{css}</style>
      <div className="pf">

        {/* Header */}
        <motion.div className="pf-header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="pf-eyebrow">
            <i className="ti ti-user-circle" style={{ color: '#d4607a' }} />
            your space
          </p>
          <h1 className="pf-title">
            hey, <span>{displayName.split(' ')[0]}</span> 🌸
          </h1>
        </motion.div>

        <div className="pf-grid">

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Avatar card */}
            <motion.div className="pf-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="pf-avatar-section">

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {/* Avatar */}
                <div className="pf-avatar-wrap" onClick={handleAvatarClick} title="Click to change photo">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="pf-avatar-img" />
                  ) : (
                    <div className="pf-avatar-placeholder">{initials}</div>
                  )}
                  {uploading ? (
                    <div className="pf-avatar-uploading">
                      <i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : (
                    <div className="pf-avatar-overlay">
                      <i className="ti ti-camera" />
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'rgba(61,42,53,0.35)', marginBottom: '10px' }}>
                  click to change photo
                </div>

                <div className="pf-avatar-status">
                  <div className="pf-status-dot" />
                  online
                </div>
                <div className="pf-display-name">{displayName}</div>
                <div className="pf-display-email">{email}</div>
                {college && (
                  <div style={{ fontSize: '12px', color: 'rgba(61,42,53,0.4)', marginBottom: '8px' }}>
                    📚 {college} {year && `· ${year}`}
                  </div>
                )}
                {bio && (
                  <div style={{ fontSize: '12px', color: 'rgba(61,42,53,0.5)', fontStyle: 'italic', marginBottom: '10px', maxWidth: '220px', lineHeight: 1.5 }}>
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
                  <div className="pf-stat-val">0</div>
                  <div className="pf-stat-lbl">habits</div>
                </div>
                <div className="pf-stat">
                  <div className="pf-stat-val">0</div>
                  <div className="pf-stat-lbl">streak</div>
                </div>
              </div>

              {/* Quick links */}
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
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="pf-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212,96,122,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#d4607a' }}>
                    <i className="ti ti-calendar-heart" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#3d2a35' }}>Joined {joinDate}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(61,42,53,0.4)' }}>blooming since day one 🌸</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Tabs */}
            <div className="pf-tabs">
              {(['info', 'security', 'preferences'] as const).map(tab => (
                <button key={tab} className={`pf-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}>
                  {tab === 'info' ? '🌸 profile info' : tab === 'security' ? '🔐 security' : '⚙️ preferences'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* INFO TAB */}
              {activeTab === 'info' && (
                <motion.div key="info" className="pf-card"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(212,96,122,0.08)' }}>
                      <i className="ti ti-user" style={{ color: '#d4607a' }} />
                    </div>
                    <span className="pf-card-header-title">personal info</span>
                  </div>
                  <div className="pf-card-body">

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-user" /> full name</label>
                      <input className="pf-input" value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Your full name" />
                    </div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-mail" /> email</label>
                      <input className="pf-input" value={email} disabled />
                      <p className="pf-input-note">Email cannot be changed here.</p>
                    </div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-writing" /> bio</label>
                      <input className="pf-input" value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Something about you..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    </div>

                    <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
                      {saving
                        ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> saving...</>
                        : <><i className="ti ti-device-floppy" /> save changes</>}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <motion.div key="security" className="pf-card"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(155,126,200,0.1)' }}>
                      <i className="ti ti-lock" style={{ color: '#9b7ec8' }} />
                    </div>
                    <span className="pf-card-header-title">security</span>
                  </div>
                  <div className="pf-card-body">
                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-lock" /> new password</label>
                      <input className="pf-input" type="password" placeholder="Enter new password" />
                    </div>
                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-lock-check" /> confirm password</label>
                      <input className="pf-input" type="password" placeholder="Confirm new password" />
                    </div>
                    <button className="pf-save-btn" style={{ marginBottom: '20px' }}>
                      <i className="ti ti-lock" /> update password
                    </button>
                    <div style={{ padding: '16px', background: 'rgba(212,96,122,0.04)', border: '1px solid rgba(212,96,122,0.1)', borderRadius: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#d4607a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ⚠️ Danger zone
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(61,42,53,0.45)', marginBottom: '12px' }}>
                        Deleting your account is permanent and cannot be undone.
                      </div>
                      <button className="pf-danger-btn">
                        <i className="ti ti-trash" /> delete account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PREFERENCES TAB */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" className="pf-card"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(90,140,99,0.1)' }}>
                      <i className="ti ti-settings" style={{ color: '#5a8c63' }} />
                    </div>
                    <span className="pf-card-header-title">preferences</span>
                  </div>
                  <div className="pf-card-body">
                    {[
                      { icon: 'ti-bell', label: 'Daily mood reminder', sub: 'Get reminded to log your mood', color: '#d4607a' },
                      { icon: 'ti-moon', label: 'Dark mode', sub: 'Switch to dark theme', color: '#9b7ec8' },
                      { icon: 'ti-chart-bar', label: 'Weekly AI report', sub: 'Receive AI weekly summary', color: '#5a8c63' },
                      { icon: 'ti-lock', label: 'Private mode', sub: 'Hide sensitive data on screen', color: '#b8860b' },
                    ].map((pref, i) => (
                      <div key={pref.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 0',
                        borderBottom: i < 3 ? '1px solid rgba(212,96,122,0.06)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${pref.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: pref.color }}>
                            <i className={`ti ${pref.icon}`} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#3d2a35' }}>{pref.label}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(61,42,53,0.4)', marginTop: '1px' }}>{pref.sub}</div>
                          </div>
                        </div>
                        <Toggle color={pref.color} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activity */}
            <motion.div className="pf-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="pf-card-header">
                <div className="pf-card-header-icon" style={{ background: 'rgba(184,134,11,0.08)' }}>
                  <i className="ti ti-activity" style={{ color: '#b8860b' }} />
                </div>
                <span className="pf-card-header-title">recent activity</span>
              </div>
              <div className="pf-card-body">
                {moodCount > 0 ? (
                  <div className="pf-activity">
                    <div className="pf-activity-icon" style={{ background: 'rgba(212,96,122,0.08)' }}>
                      <i className="ti ti-mood-smile" style={{ color: '#d4607a' }} />
                    </div>
                    <div>
                      <div className="pf-activity-title">Mood entries</div>
                      <div className="pf-activity-sub">Total logs so far</div>
                    </div>
                    <div className="pf-activity-val">{moodCount}</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(61,42,53,0.3)', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌱</div>
                    start logging to see your activity
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="pf-toast"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ background: toastType === 'error' ? '#c0392b' : '#3d2a35' }}>
            <i className={`ti ${toastType === 'error' ? 'ti-x' : 'ti-check'}`}
              style={{ color: toastType === 'error' ? '#ff8a8a' : '#5a8c63' }} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Toggle({ color }: { color: string }) {
  const [on, setOn] = useState(false)
  return (
    <div onClick={() => setOn(v => !v)} style={{
      width: '40px', height: '22px', borderRadius: '11px',
      background: on ? color : 'rgba(61,42,53,0.1)',
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}