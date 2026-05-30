// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { createClient } from '@/lib/supabase'

// const css = `
//   @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
//   @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

//   .pf * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

//   .pf {
//     min-height: 100vh;
//     background: #fdf8f5;
//     padding: clamp(20px, 4vw, 36px);
//     color: #2e1f28;
//   }

//   /* ── Header ── */
//   .pf-header { margin-bottom: 28px; }
//   .pf-eyebrow {
//     font-size: 10px; font-weight: 600; letter-spacing: 3.5px;
//     text-transform: uppercase; color: rgba(46,31,40,0.3);
//     display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
//   }
//   .pf-eyebrow::before {
//     content: ''; display: block; width: 20px; height: 1px; background: #c85c78;
//   }
//   .pf-title {
//     font-family: 'Playfair Display', serif;
//     font-size: clamp(26px, 5vw, 38px); font-weight: 400; font-style: italic;
//     color: #2e1f28; letter-spacing: -0.5px; line-height: 1.1;
//   }
//   .pf-title span { color: #c85c78; }

//   /* ── Grid ── */
//   .pf-grid {
//     display: grid;
//     grid-template-columns: 260px 1fr;
//     gap: 18px; align-items: start;
//   }

//   /* ── Card ── */
//   .pf-card {
//     background: #fff;
//     border: 1px solid rgba(200,92,120,0.12);
//     border-radius: 18px; overflow: hidden;
//   }

//   .pf-card-header {
//     padding: 13px 18px;
//     border-bottom: 1px solid rgba(200,92,120,0.08);
//     display: flex; align-items: center; gap: 9px;
//   }
//   .pf-card-header-icon {
//     width: 30px; height: 30px; border-radius: 8px;
//     display: flex; align-items: center; justify-content: center; font-size: 14px;
//   }
//   .pf-card-header-title {
//     font-family: 'Playfair Display', serif; font-style: italic;
//     font-size: 14px; font-weight: 400; color: #2e1f28;
//   }
//   .pf-card-body { padding: 20px; }

//   /* ── Avatar section ── */
//   .pf-avatar-section {
//     display: flex; flex-direction: column; align-items: center;
//     padding: 28px 20px 22px; text-align: center;
//     border-bottom: 1px solid rgba(200,92,120,0.08);
//   }

//   .pf-avatar-wrap {
//     position: relative; margin-bottom: 14px; cursor: pointer;
//     width: 86px; height: 86px;
//   }

//   .pf-avatar-ring {
//     width: 86px; height: 86px; border-radius: 50%;
//     border: 2px solid rgba(200,92,120,0.2);
//     padding: 3px; position: relative;
//   }

//   .pf-avatar-img {
//     width: 100%; height: 100%; border-radius: 50%;
//     object-fit: cover; display: block;
//   }

//   .pf-avatar-placeholder {
//     width: 100%; height: 100%; border-radius: 50%;
//     background: linear-gradient(135deg, #f2c4ce, #e0d5f4);
//     display: flex; align-items: center; justify-content: center;
//     font-size: 28px; font-weight: 700; color: #c85c78;
//   }

//   .pf-avatar-overlay {
//     position: absolute; inset: 0; border-radius: 50%;
//     background: rgba(46,31,40,0.48);
//     display: flex; align-items: center; justify-content: center;
//     opacity: 0; transition: opacity 0.2s;
//     font-size: 18px; color: white;
//   }
//   .pf-avatar-wrap:hover .pf-avatar-overlay { opacity: 1; }

//   .pf-avatar-uploading {
//     position: absolute; inset: 0; border-radius: 50%;
//     background: rgba(200,92,120,0.65);
//     display: flex; align-items: center; justify-content: center;
//     font-size: 18px; color: white;
//   }

//   .pf-avatar-hint {
//     font-size: 10.5px; color: rgba(46,31,40,0.3); margin-bottom: 10px;
//     letter-spacing: 0.2px;
//   }

//   .pf-avatar-status {
//     display: flex; align-items: center; gap: 5px;
//     font-size: 11px; color: #4d9058; font-weight: 600; margin-bottom: 6px;
//   }
//   .pf-status-dot {
//     width: 6px; height: 6px; border-radius: 50%; background: #4d9058;
//     animation: pf-pulse 2s ease-in-out infinite;
//   }
//   @keyframes pf-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

//   .pf-display-name {
//     font-family: 'Playfair Display', serif; font-weight: 400;
//     font-size: 19px; color: #2e1f28; margin-bottom: 3px;
//   }
//   .pf-display-email { font-size: 11.5px; color: rgba(46,31,40,0.38); margin-bottom: 11px; }

//   .pf-badge {
//     display: inline-flex; align-items: center; gap: 5px;
//     background: rgba(200,92,120,0.08);
//     border: 1px solid rgba(200,92,120,0.18);
//     border-radius: 999px; padding: 4px 13px;
//     font-size: 10.5px; font-weight: 600; color: #c85c78; letter-spacing: 0.3px;
//   }

//   /* ── Stats ── */
//   .pf-stats {
//     display: grid; grid-template-columns: repeat(3, 1fr);
//     border-top: 1px solid rgba(200,92,120,0.08);
//   }
//   .pf-stat {
//     padding: 14px 8px; text-align: center;
//     border-right: 1px solid rgba(200,92,120,0.08);
//   }
//   .pf-stat:last-child { border-right: none; }
//   .pf-stat-val {
//     font-family: 'Playfair Display', serif; font-weight: 400;
//     font-size: 22px; color: #c85c78; line-height: 1; margin-bottom: 3px;
//   }
//   .pf-stat-lbl {
//     font-size: 9px; font-weight: 600; letter-spacing: 2px;
//     text-transform: uppercase; color: rgba(46,31,40,0.3);
//   }

//   /* ── Quick nav ── */
//   .pf-quick { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
//   .pf-quick-btn {
//     display: flex; align-items: center; gap: 10px;
//     padding: 9px 12px; border-radius: 10px;
//     background: transparent; border: none;
//     color: rgba(46,31,40,0.5); font-size: 13px; font-weight: 500;
//     cursor: pointer; text-align: left; width: 100%;
//     transition: all 0.13s; font-family: 'DM Sans', sans-serif;
//   }
//   .pf-quick-btn:hover { background: rgba(200,92,120,0.07); color: #c85c78; }
//   .pf-quick-btn i { font-size: 15px; color: rgba(46,31,40,0.28); transition: color 0.13s; }
//   .pf-quick-btn:hover i { color: #c85c78; }

//   /* ── Tabs ── */
//   .pf-tabs {
//     display: flex; gap: 3px; padding: 5px;
//     background: rgba(200,92,120,0.08); border-radius: 13px;
//     margin-bottom: 4px;
//   }
//   .pf-tab {
//     flex: 1; padding: 8px 10px; border-radius: 10px;
//     background: transparent; border: none;
//     color: rgba(46,31,40,0.45); font-size: 12px; font-weight: 600;
//     font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.14s;
//     display: flex; align-items: center; justify-content: center; gap: 5px;
//   }
//   .pf-tab i { font-size: 13px; }
//   .pf-tab.active {
//     background: #fff; color: #2e1f28;
//     box-shadow: 0 1px 4px rgba(46,31,40,0.08);
//   }

//   /* ── Form fields ── */
//   .pf-field { margin-bottom: 15px; }
//   .pf-label {
//     font-size: 10px; font-weight: 700; letter-spacing: 1.8px;
//     text-transform: uppercase; color: rgba(46,31,40,0.38);
//     display: flex; align-items: center; gap: 5px; margin-bottom: 6px;
//   }
//   .pf-label i { font-size: 12px; color: #c85c78; }
//   .pf-input {
//     width: 100%; padding: 10px 13px;
//     background: rgba(200,92,120,0.05);
//     border: 1px solid transparent;
//     border-radius: 11px; color: #2e1f28;
//     font-size: 13.5px; font-family: 'DM Sans', sans-serif;
//     outline: none; transition: all 0.14s;
//   }
//   .pf-input:focus {
//     border-color: rgba(200,92,120,0.35);
//     background: rgba(200,92,120,0.06);
//     box-shadow: 0 0 0 3px rgba(200,92,120,0.07);
//   }
//   .pf-input:disabled { opacity: 0.45; cursor: not-allowed; }
//   .pf-input-note { font-size: 11px; color: rgba(46,31,40,0.35); margin-top: 4px; }

//   .pf-divider { height: 1px; background: rgba(200,92,120,0.08); margin: 16px 0; }

//   /* ── Buttons ── */
//   .pf-save-btn {
//     width: 100%; padding: 11px;
//     background: #c85c78;
//     border: none; border-radius: 11px;
//     color: white; font-size: 13.5px; font-weight: 600;
//     font-family: 'DM Sans', sans-serif;
//     cursor: pointer; transition: opacity 0.14s;
//     display: flex; align-items: center; justify-content: center; gap: 8px;
//   }
//   .pf-save-btn:hover { opacity: 0.88; }
//   .pf-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

//   .pf-danger-btn {
//     width: 100%; padding: 10px;
//     background: transparent;
//     border: 1px solid rgba(200,92,120,0.22);
//     border-radius: 11px; color: #c85c78;
//     font-size: 13px; font-weight: 600;
//     font-family: 'DM Sans', sans-serif;
//     cursor: pointer; transition: all 0.14s;
//     display: flex; align-items: center; justify-content: center; gap: 8px;
//   }
//   .pf-danger-btn:hover { background: rgba(200,92,120,0.07); }

//   /* ── Toast ── */
//   .pf-toast {
//     position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
//     padding: 11px 20px; border-radius: 11px;
//     font-size: 13px; font-weight: 600;
//     display: flex; align-items: center; gap: 8px;
//     box-shadow: 0 6px 20px rgba(46,31,40,0.15);
//     z-index: 9999; white-space: nowrap;
//   }

//   /* ── Activity ── */
//   .pf-activity {
//     display: flex; align-items: center; gap: 12px;
//     padding: 12px 0; border-bottom: 1px solid rgba(200,92,120,0.06);
//   }
//   .pf-activity:last-child { border-bottom: none; }
//   .pf-activity-icon {
//     width: 34px; height: 34px; border-radius: 9px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 15px; flex-shrink: 0;
//   }
//   .pf-activity-title { font-size: 13px; font-weight: 600; color: #2e1f28; }
//   .pf-activity-sub { font-size: 11px; color: rgba(46,31,40,0.4); margin-top: 1px; }
//   .pf-activity-val {
//     font-family: 'Playfair Display', serif; font-size: 18px;
//     font-weight: 400; color: #c85c78; margin-left: auto;
//   }

//   /* ── Preference row ── */
//   .pf-pref-row {
//     display: flex; align-items: center; gap: 12px;
//     padding: 13px 0; border-bottom: 1px solid rgba(200,92,120,0.06);
//   }
//   .pf-pref-row:last-child { border-bottom: none; }
//   .pf-pref-icon {
//     width: 34px; height: 34px; border-radius: 9px;
//     display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
//   }
//   .pf-pref-name { font-size: 13px; font-weight: 600; color: #2e1f28; }
//   .pf-pref-sub { font-size: 11px; color: rgba(46,31,40,0.4); margin-top: 1px; }

//   /* ── Joined card ── */
//   .pf-joined {
//     display: flex; align-items: center; gap: 12px; padding: 16px 18px;
//   }
//   .pf-joined-icon {
//     width: 36px; height: 36px; border-radius: 10px;
//     background: rgba(200,92,120,0.08); display: flex; align-items: center;
//     justify-content: center; font-size: 16px; color: #c85c78; flex-shrink: 0;
//   }
//   .pf-joined-name { font-size: 12.5px; font-weight: 600; color: #2e1f28; }
//   .pf-joined-sub { font-size: 11px; color: rgba(46,31,40,0.35); margin-top: 1px; }

//   @media (max-width: 860px) { .pf-grid { grid-template-columns: 1fr; } }
//   @media (max-width: 560px) { .pf { padding: 16px; } .pf-row { grid-template-columns: 1fr !important; } }
//   @keyframes spin { to { transform: rotate(360deg); } }
// `

// export default function ProfilePage() {
//   const supabase = createClient()
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const [user, setUser] = useState<any>(null)
//   const [profile, setProfile] = useState<any>(null)
//   const [fullName, setFullName] = useState('')
//   const [bio, setBio] = useState('')
//   const [college, setCollege] = useState('')
//   const [year, setYear] = useState('')
//   const [avatarUrl, setAvatarUrl] = useState('')
//   const [saving, setSaving] = useState(false)
//   const [uploading, setUploading] = useState(false)
//   const [toast, setToast] = useState('')
//   const [toastType, setToastType] = useState<'success' | 'error'>('success')
//   const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences'>('info')
//   const [moodCount, setMoodCount] = useState(0)
//   const [joinDate, setJoinDate] = useState('')

//   useEffect(() => {
//     loadProfile()
//     supabase.from('mood_entries').select('id', { count: 'exact' }).then(({ count }) => {
//       setMoodCount(count || 0)
//     })
//   }, [])

//   const loadProfile = async () => {
//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user) return
//     setUser(user)
//     setJoinDate(new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))

//     const { data: prof } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', user.id)
//       .single()

//     if (prof) {
//       setProfile(prof)
//       setFullName(prof.full_name || user.user_metadata?.full_name || '')
//       setBio(prof.bio || '')
//       setCollege(prof.college || '')
//       setYear(prof.year || '')
//       setAvatarUrl(prof.avatar_url || '')
//     } else {
//       setFullName(user.user_metadata?.full_name || '')
//     }
//   }

//   const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
//     setToast(msg)
//     setToastType(type)
//     setTimeout(() => setToast(''), 3000)
//   }

//   const handleSave = async () => {
//     if (!user) return
//     setSaving(true)

//     const { error } = await supabase.from('profiles').upsert({
//       id: user.id,
//       full_name: fullName,
//       bio,
//       college,
//       year,
//       avatar_url: avatarUrl,
//       updated_at: new Date().toISOString(),
//     })

//     await supabase.auth.updateUser({ data: { full_name: fullName } })

//     setSaving(false)
//     if (error) showToast('Failed to save. Try again.', 'error')
//     else showToast('Profile saved! 🌸')
//   }

//   const handleAvatarClick = () => {
//     fileInputRef.current?.click()
//   }

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file || !user) return

//     if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
//       showToast('Only images allowed!', 'error')
//       return
//     }
//     if (file.size > 2 * 1024 * 1024) {
//       showToast('Image must be under 2MB', 'error')
//       return
//     }

//     setUploading(true)

//     if (avatarUrl) {
//       const oldPath = avatarUrl.split('/avatars/')[1]
//       if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
//     }

//     const ext = file.name.split('.').pop()
//     const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

//     const { error: uploadError } = await supabase.storage
//       .from('avatars')
//       .upload(filePath, file, { upsert: true })

//     if (uploadError) {
//       showToast('Upload failed. Try again.', 'error')
//       setUploading(false)
//       return
//     }

//     const { data: { publicUrl } } = supabase.storage
//       .from('avatars')
//       .getPublicUrl(filePath)

//     setAvatarUrl(publicUrl)

//     await supabase.from('profiles').upsert({
//       id: user.id,
//       full_name: fullName,
//       bio, college, year,
//       avatar_url: publicUrl,
//       updated_at: new Date().toISOString(),
//     })

//     setUploading(false)
//     showToast('Profile picture updated! 📸')

//     if (fileInputRef.current) fileInputRef.current.value = ''
//   }

//   const initials = fullName
//     ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
//     : user?.email?.[0]?.toUpperCase() || '?'

//   const displayName = fullName || 'Student'
//   const email = user?.email || ''

//   return (
//     <>
//       <style>{css}</style>
//       <div className="pf">

//         {/* Header */}
//         <motion.div className="pf-header" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
//           <p className="pf-eyebrow">
//             <i className="ti ti-user-circle" style={{ color: '#c85c78' }} />
//             your space
//           </p>
//           <h1 className="pf-title">
//             hey, <span>{displayName.split(' ')[0]}</span> 🌸
//           </h1>
//         </motion.div>

//         <div className="pf-grid">

//           {/* ── LEFT ── */}
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

//             {/* Avatar card */}
//             <motion.div className="pf-card"
//               initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

//               <div className="pf-avatar-section">
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/jpeg,image/png,image/webp,image/gif"
//                   style={{ display: 'none' }}
//                   onChange={handleFileChange}
//                 />

//                 <div className="pf-avatar-wrap" onClick={handleAvatarClick} title="Click to change photo">
//                   <div className="pf-avatar-ring">
//                     {avatarUrl ? (
//                       <img src={avatarUrl} alt="avatar" className="pf-avatar-img" />
//                     ) : (
//                       <div className="pf-avatar-placeholder">{initials}</div>
//                     )}
//                   </div>
//                   {uploading ? (
//                     <div className="pf-avatar-uploading">
//                       <i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} />
//                     </div>
//                   ) : (
//                     <div className="pf-avatar-overlay">
//                       <i className="ti ti-camera" />
//                     </div>
//                   )}
//                 </div>

//                 <div className="pf-avatar-hint">click to change photo</div>

//                 <div className="pf-avatar-status">
//                   <div className="pf-status-dot" />
//                   online
//                 </div>
//                 <div className="pf-display-name">{displayName}</div>
//                 <div className="pf-display-email">{email}</div>

//                 {college && (
//                   <div style={{ fontSize: '11.5px', color: 'rgba(46,31,40,0.45)', marginBottom: '7px' }}>
//                     📚 {college}{year && ` · ${year}`}
//                   </div>
//                 )}
//                 {bio && (
//                   <div style={{ fontSize: '11.5px', color: 'rgba(46,31,40,0.5)', fontStyle: 'italic', marginBottom: '12px', maxWidth: '210px', lineHeight: 1.5 }}>
//                     "{bio}"
//                   </div>
//                 )}

//                 <div className="pf-badge">
//                   <i className="ti ti-sparkles" style={{ fontSize: '10px' }} />
//                   MoodOS Student
//                 </div>
//               </div>

//               {/* Stats */}
//               <div className="pf-stats">
//                 <div className="pf-stat">
//                   <div className="pf-stat-val">{moodCount}</div>
//                   <div className="pf-stat-lbl">moods</div>
//                 </div>
//                 <div className="pf-stat">
//                   <div className="pf-stat-val">0</div>
//                   <div className="pf-stat-lbl">habits</div>
//                 </div>
//                 <div className="pf-stat">
//                   <div className="pf-stat-val">0</div>
//                   <div className="pf-stat-lbl">streak</div>
//                 </div>
//               </div>

//               {/* Quick nav */}
//               <div className="pf-quick">
//                 {[
//                   { icon: 'ti-mood-smile', label: 'Mood history', href: '/mood' },
//                   { icon: 'ti-checks', label: 'My habits', href: '/habits' },
//                   { icon: 'ti-chart-bar', label: 'Weekly insights', href: '/insights' },
//                 ].map(item => (
//                   <a key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
//                     <button className="pf-quick-btn">
//                       <i className={`ti ${item.icon}`} />
//                       {item.label}
//                     </button>
//                   </a>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Joined card */}
//             <motion.div className="pf-card"
//               initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
//               <div className="pf-joined">
//                 <div className="pf-joined-icon">
//                   <i className="ti ti-calendar-heart" />
//                 </div>
//                 <div>
//                   <div className="pf-joined-name">Joined {joinDate}</div>
//                   <div className="pf-joined-sub">blooming since day one 🌸</div>
//                 </div>
//               </div>
//             </motion.div>
//           </div>

//           {/* ── RIGHT ── */}
//           <motion.div
//             initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
//             style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

//             {/* Segmented tabs */}
//             <div className="pf-tabs">
//               {(['info', 'security', 'preferences'] as const).map(tab => (
//                 <button
//                   key={tab}
//                   className={`pf-tab${activeTab === tab ? ' active' : ''}`}
//                   onClick={() => setActiveTab(tab)}>
//                   <i className={`ti ${tab === 'info' ? 'ti-user' : tab === 'security' ? 'ti-lock' : 'ti-settings'}`} />
//                   {tab === 'info' ? 'profile' : tab === 'security' ? 'security' : 'preferences'}
//                 </button>
//               ))}
//             </div>

//             <AnimatePresence mode="wait">

//               {/* INFO TAB */}
//               {activeTab === 'info' && (
//                 <motion.div key="info" className="pf-card"
//                   initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}>
//                   <div className="pf-card-header">
//                     <div className="pf-card-header-icon" style={{ background: 'rgba(200,92,120,0.08)' }}>
//                       <i className="ti ti-user" style={{ color: '#c85c78' }} />
//                     </div>
//                     <span className="pf-card-header-title">personal info</span>
//                   </div>
//                   <div className="pf-card-body">

//                     <div className="pf-field">
//                       <label className="pf-label"><i className="ti ti-user" /> full name</label>
//                       <input className="pf-input" value={fullName}
//                         onChange={e => setFullName(e.target.value)}
//                         placeholder="Your full name" />
//                     </div>

//                     <div className="pf-field">
//                       <label className="pf-label"><i className="ti ti-mail" /> email</label>
//                       <input className="pf-input" value={email} disabled />
//                       <p className="pf-input-note">Email cannot be changed here.</p>
//                     </div>

//                     <div className="pf-field">
//                       <label className="pf-label"><i className="ti ti-writing" /> bio</label>
//                       <input className="pf-input" value={bio}
//                         onChange={e => setBio(e.target.value)}
//                         placeholder="Something about you..." />
//                     </div>

//                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="pf-row">
//                       <div className="pf-field">
//                         <label className="pf-label"><i className="ti ti-school" /> college</label>
//                         <input className="pf-input" value={college}
//                           onChange={e => setCollege(e.target.value)}
//                           placeholder="Your college" />
//                       </div>
//                       <div className="pf-field">
//                         <label className="pf-label"><i className="ti ti-calendar" /> year</label>
//                         <input className="pf-input" value={year}
//                           onChange={e => setYear(e.target.value)}
//                           placeholder="e.g. Final year" />
//                       </div>
//                     </div>

//                     <div className="pf-divider" />

//                     <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
//                       {saving
//                         ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> saving...</>
//                         : <><i className="ti ti-device-floppy" /> save changes</>}
//                     </button>
//                   </div>
//                 </motion.div>
//               )}

//               {/* SECURITY TAB */}
//               {activeTab === 'security' && (
//                 <motion.div key="security" className="pf-card"
//                   initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}>
//                   <div className="pf-card-header">
//                     <div className="pf-card-header-icon" style={{ background: 'rgba(139,122,192,0.1)' }}>
//                       <i className="ti ti-lock" style={{ color: '#8b7ac0' }} />
//                     </div>
//                     <span className="pf-card-header-title">security</span>
//                   </div>
//                   <div className="pf-card-body">
//                     <div className="pf-field">
//                       <label className="pf-label"><i className="ti ti-lock" /> new password</label>
//                       <input className="pf-input" type="password" placeholder="Enter new password" />
//                     </div>
//                     <div className="pf-field">
//                       <label className="pf-label"><i className="ti ti-lock-check" /> confirm password</label>
//                       <input className="pf-input" type="password" placeholder="Confirm new password" />
//                     </div>
//                     <button className="pf-save-btn" style={{ marginBottom: '20px' }}>
//                       <i className="ti ti-lock" /> update password
//                     </button>
//                     <div style={{
//                       padding: '16px',
//                       background: 'rgba(200,92,120,0.04)',
//                       border: '1px solid rgba(200,92,120,0.14)',
//                       borderRadius: '13px'
//                     }}>
//                       <div style={{ fontSize: '10px', fontWeight: 700, color: '#c85c78', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
//                         ⚠ Danger zone
//                       </div>
//                       <div style={{ fontSize: '12px', color: 'rgba(46,31,40,0.42)', marginBottom: '12px', lineHeight: 1.5 }}>
//                         Deleting your account is permanent and cannot be undone.
//                       </div>
//                       <button className="pf-danger-btn">
//                         <i className="ti ti-trash" /> delete account
//                       </button>
//                     </div>
//                   </div>
//                 </motion.div>
//               )}

//               {/* PREFERENCES TAB */}
//               {activeTab === 'preferences' && (
//                 <motion.div key="preferences" className="pf-card"
//                   initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}>
//                   <div className="pf-card-header">
//                     <div className="pf-card-header-icon" style={{ background: 'rgba(77,144,88,0.1)' }}>
//                       <i className="ti ti-settings" style={{ color: '#4d9058' }} />
//                     </div>
//                     <span className="pf-card-header-title">preferences</span>
//                   </div>
//                   <div className="pf-card-body">
//                     {[
//                       { icon: 'ti-bell', label: 'Daily mood reminder', sub: 'Get reminded to log your mood', color: '#c85c78' },
//                       { icon: 'ti-moon', label: 'Dark mode', sub: 'Switch to dark theme', color: '#8b7ac0' },
//                       { icon: 'ti-chart-bar', label: 'Weekly AI report', sub: 'Receive AI weekly summary', color: '#4d9058' },
//                       { icon: 'ti-eye-off', label: 'Private mode', sub: 'Hide sensitive data on screen', color: '#b07a10' },
//                     ].map((pref, i) => (
//                       <div key={pref.label} className="pf-pref-row">
//                         <div className="pf-pref-icon" style={{ background: `${pref.color}14`, color: pref.color }}>
//                           <i className={`ti ${pref.icon}`} />
//                         </div>
//                         <div style={{ flex: 1 }}>
//                           <div className="pf-pref-name">{pref.label}</div>
//                           <div className="pf-pref-sub">{pref.sub}</div>
//                         </div>
//                         <Toggle color={pref.color} />
//                       </div>
//                     ))}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Activity */}
//             <motion.div className="pf-card"
//               initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
//               <div className="pf-card-header">
//                 <div className="pf-card-header-icon" style={{ background: 'rgba(176,122,16,0.08)' }}>
//                   <i className="ti ti-activity" style={{ color: '#b07a10' }} />
//                 </div>
//                 <span className="pf-card-header-title">recent activity</span>
//               </div>
//               <div className="pf-card-body">
//                 {moodCount > 0 ? (
//                   <div className="pf-activity">
//                     <div className="pf-activity-icon" style={{ background: 'rgba(200,92,120,0.08)' }}>
//                       <i className="ti ti-mood-smile" style={{ color: '#c85c78' }} />
//                     </div>
//                     <div>
//                       <div className="pf-activity-title">Mood entries</div>
//                       <div className="pf-activity-sub">Total logs so far</div>
//                     </div>
//                     <div className="pf-activity-val">{moodCount}</div>
//                   </div>
//                 ) : (
//                   <div style={{ textAlign: 'center', padding: '26px 16px', color: 'rgba(46,31,40,0.28)', fontSize: '12.5px' }}>
//                     <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌱</div>
//                     start logging to see your activity
//                   </div>
//                 )}
//               </div>
//             </motion.div>

//           </motion.div>
//         </div>
//       </div>

//       {/* Toast */}
//       <AnimatePresence>
//         {toast && (
//           <motion.div className="pf-toast"
//             initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
//             style={{ background: toastType === 'error' ? '#3d1e1e' : '#2e1f28' }}>
//             <i
//               className={`ti ${toastType === 'error' ? 'ti-x' : 'ti-check'}`}
//               style={{ color: toastType === 'error' ? '#f09595' : '#8fc49a' }}
//             />
//             {toast}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   )
// }

// function Toggle({ color }: { color: string }) {
//   const [on, setOn] = useState(false)
//   return (
//     <div
//       onClick={() => setOn(v => !v)}
//       style={{
//         width: '38px', height: '21px', borderRadius: '11px',
//         background: on ? color : 'rgba(46,31,40,0.12)',
//         position: 'relative', cursor: 'pointer',
//         transition: 'background 0.2s', flexShrink: 0,
//       }}>
//       <div style={{
//         position: 'absolute', top: '2.5px',
//         left: on ? '19.5px' : '2.5px',
//         width: '16px', height: '16px', borderRadius: '50%',
//         background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
//         transition: 'left 0.2s',
//       }} />
//     </div>
//   )
// }