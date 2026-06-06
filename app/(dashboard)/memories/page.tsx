"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

// ── Types ──────────────────────────────────────────────────────────────────
const MOODS = {
  joyful:    { emoji: "✦", color: "#d4834a", bg: "rgba(212,131,74,.12)",   label: "Joyful",    leaf: "🍊" },
  calm:      { emoji: "◎", color: "#6aab9c", bg: "rgba(106,171,156,.12)",  label: "Calm",      leaf: "🌿" },
  nostalgic: { emoji: "◈", color: "#9b7bc8", bg: "rgba(155,123,200,.12)",  label: "Nostalgic", leaf: "🪻" },
  sad:       { emoji: "◦", color: "#7fa8d4", bg: "rgba(127,168,212,.12)",  label: "Sad",       leaf: "🫧" },
  anxious:   { emoji: "◌", color: "#d47a7a", bg: "rgba(212,122,122,.12)",  label: "Anxious",   leaf: "🌸" },
  grateful:  { emoji: "❋", color: "#c0485a", bg: "rgba(192,72,90,.12)",    label: "Grateful",  leaf: "🌺" },
  tired:     { emoji: "◷", color: "#b0a0c0", bg: "rgba(176,160,192,.12)",  label: "Tired",     leaf: "🌙" },
};

const UNSPLASH = {
  joyful:    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70",
  calm:      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=70",
  nostalgic: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=70",
  sad:       "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=70",
  anxious:   "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=70",
  grateful:  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=70",
  tired:     "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=70",
};

const MOCK_MEMORIES = [
  { id: "1", date: "2025-06-03T09:15:00", mood: "joyful",    title: "First morning run of June",            note: "Finally got out at 6am. The air was different. Felt unreasonably proud.",    tags: ["fitness", "morning"], photo: null },
  { id: "2", date: "2025-06-01T21:00:00", mood: "nostalgic", title: "Old playlist on shuffle",              note: "Stumbled on songs from 2020. Strange how music makes time collapse.",         tags: ["music", "evening"],   photo: null },
  { id: "3", date: "2025-05-28T14:30:00", mood: "calm",      title: "Quiet afternoon with chai",            note: "Nothing happened. It was perfect.",                                          tags: ["rest"],               photo: null },
  { id: "4", date: "2025-05-22T11:00:00", mood: "anxious",   title: "Deployment day jitters",               note: "Pushed to prod and stared at the logs for 20 mins. Everything was fine.",   tags: ["work", "coding"],     photo: null },
  { id: "5", date: "2025-05-18T19:45:00", mood: "grateful",  title: "Surprise call from amma",              note: "She called just to say she was proud. I didn't expect that.",                tags: ["family"],             photo: null },
  { id: "6", date: "2025-05-10T08:00:00", mood: "tired",     title: "Three days of no sleep",               note: "Finished the feature. Worth it? Maybe. Ask me next week.",                   tags: ["work", "coding"],     photo: null },
  { id: "7", date: "2025-04-30T16:20:00", mood: "joyful",    title: "Birthday chai at the old place",       note: "Exactly how I remembered it. Some things hold.",                             tags: ["food", "birthday"],   photo: null },
  { id: "8", date: "2025-04-14T22:10:00", mood: "sad",       title: "Missing someone I don't talk to anymore", note: "Saw a meme they would've sent me. Just sat with it.",                   tags: ["feelings"],           photo: null },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function groupByMonth(arr: typeof MOCK_MEMORIES) {
  const g: Record<string, typeof MOCK_MEMORIES> = {};
  for (const m of arr) {
    const k = fmtMonth(m.date);
    if (!g[k]) g[k] = [];
    g[k].push(m);
  }
  return g;
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const navItems = [
    { icon: "layout-dashboard", label: "Dashboard" },
    { icon: "mood-happy",       label: "Mood"       },
    { icon: "check",            label: "Habits"     },
    { icon: "book",             label: "Study"      },
    { icon: "wallet",           label: "Expenses"   },
    { icon: "calendar",         label: "Attendance" },
    { icon: "chart-bar",        label: "Insights"   },
    { icon: "heart",            label: "Periods Tracker" },
    { icon: "camera",           label: "Memories",  active: true },
    { icon: "user",             label: "Profile"    },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoName}>
          <span style={styles.logoDot} /> MoodOS
        </div>
        <div style={styles.logoSub}>Girls life, sorted.</div>
      </div>
      <div style={styles.navLabel}>Navigation</div>
      {navItems.map(({ icon, label, active }) => (
        <div key={label} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 16, opacity: 0.7 }} aria-hidden="true" />
          {label}
        </div>
      ))}
      <div style={styles.sidebarFooter}>
        <div style={styles.userRow}>
          <div style={styles.avatar}>VW</div>
          <div>
            <div style={styles.userName}>Vaishnavi Wakodikar</div>
            <div style={styles.userEmail}>vaishnaviwakodikar09@gma...</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Memory Card ──────────────────────────────────────────────────────────────
function MemoryCard({ memory }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cfg = MOODS[memory.mood];
  const imgSrc = memory.photo || UNSPLASH[memory.mood];

  return (
    <div
      style={{ ...styles.card, ...(hovered ? styles.cardHover : {}) }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo */}
      <div style={styles.photoWrap}>
        <img
          src={imgSrc}
          alt={memory.title}
          style={{ ...styles.photo, ...(hovered ? styles.photoHover : {}) }}
          loading="lazy"
        />
        <div style={styles.photoOverlay} />
        <span style={{ ...styles.photoMood, color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </span>
        <span style={styles.photoDate}>{fmtDate(memory.date)}</span>
        <div style={styles.leafWatermark}>{cfg.leaf}</div>
      </div>
      {/* Body */}
      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>{memory.title}</div>
        {expanded && memory.note && (
          <p style={styles.cardNote}>{memory.note}</p>
        )}
        {memory.tags.length > 0 && (
          <div style={styles.tagRow}>
            {memory.tags.map((t) => (
              <span key={t} style={styles.tag}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Memory Modal ─────────────────────────────────────────────────────────
function AddMemoryModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("calm");
  const [tagInput, setTagInput] = useState("");
  const [photo, setPhoto] = useState(null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onAdd({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      title: title.trim(),
      note: note.trim(),
      tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean),
      photo,
    });
    onClose();
  };

  return (
    <div style={styles.modalBg} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>New memory ♡</span>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Photo upload */}
        <span style={styles.fieldLabel}>Photo</span>
        <label style={styles.uploadArea}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          {photo ? (
            <img src={photo} alt="preview" style={styles.uploadPreview} />
          ) : (
            <>
              <i className="ti ti-camera" style={{ fontSize: 22, color: "#e8c4c4" }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: "#c9a8a8" }}>Tap to add a photo</span>
            </>
          )}
        </label>

        {/* Title */}
        <span style={styles.fieldLabel}>Title</span>
        <input
          style={styles.fieldInput}
          placeholder="What happened?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Mood */}
        <span style={styles.fieldLabel}>Mood</span>
        <div style={styles.moodGrid}>
          {Object.entries(MOODS).map(([k, v]) => (
            <button
              key={k}
              style={{
                ...styles.moodPill,
                ...(mood === k ? { background: v.bg, borderColor: v.color, color: v.color } : {}),
              }}
              onClick={() => setMood(k)}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>

        {/* Note */}
        <span style={styles.fieldLabel}>Note</span>
        <textarea
          style={{ ...styles.fieldInput, minHeight: 70, resize: "none" }}
          placeholder="A little more detail..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Tags */}
        <span style={styles.fieldLabel}>
          Tags <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(comma separated)</span>
        </span>
        <input
          style={styles.fieldInput}
          placeholder="e.g. morning, family, joy"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />

        <button style={styles.saveBtn} onClick={handleSave}>
          Save memory ✦
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Memories() {
  const [memories, setMemories] = useState(MOCK_MEMORIES);
  const [filterMood, setFilterMood] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = filterMood === "all" ? memories : memories.filter((m) => m.mood === filterMood);
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  const grouped = groupByMonth(sorted);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fdf6f0; }
      `}</style>

      <div style={styles.shell}>
  <main style={styles.main}>
          {/* Header */}
          <div style={styles.eyebrow}>○ Memories ○</div>
          <h1 style={styles.pageTitle}>
            Your <em style={{ fontStyle: "italic", color: "#c0485a" }}>photo memories</em>
          </h1>
          <p style={styles.pageSub}>Moments, moods, and the little things worth keeping. ♡</p>

          {/* Filter row */}
          <div style={styles.filterRow}>
            <button
              style={{ ...styles.filterPill, ...(filterMood === "all" ? styles.filterPillActive : {}) }}
              onClick={() => setFilterMood("all")}
            >
              All
            </button>
            {Object.entries(MOODS).map(([k, v]) => (
              <button
                key={k}
                style={{
                  ...styles.filterPill,
                  ...(filterMood === k
                    ? { borderColor: v.color, color: v.color, background: v.bg }
                    : {}),
                }}
                onClick={() => setFilterMood(k)}
              >
                {v.emoji} {v.label}
              </button>
            ))}
            <button style={styles.addBtn} onClick={() => setShowModal(true)}>
              + Add memory
            </button>
          </div>

          {/* Timeline */}
          {Object.keys(grouped).length === 0 ? (
            <div style={styles.empty}>No memories here yet… ♡</div>
          ) : (
            Object.entries(grouped).map(([month, mems]) => (
              <div key={month} style={styles.monthGroup}>
                <div style={styles.monthLabel}>
                  {month}
                  <span style={styles.countPill}>{mems.length}</span>
                  <div style={styles.monthLine} />
                </div>
                <div style={styles.grid}>
                  {mems.map((mem) => (
                    <MemoryCard key={mem.id} memory={mem} />
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {showModal && (
        <AddMemoryModal
          onClose={() => setShowModal(false)}
          onAdd={(m) => {
            setMemories((prev) => [m, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  shell:        { display: "flex", minHeight: "100vh", background: "#fdf6f0", fontFamily: "'DM Sans', sans-serif", color: "#3a2a2a" },
  // Sidebar
  sidebar:      { width: 210, flexShrink: 0, background: "#fdf6f0", borderRight: "1px solid #f0e0d8", padding: "28px 0", display: "flex", flexDirection: "column" },
  logo:         { padding: "0 22px 24px", borderBottom: "1px solid #f0e0d8", marginBottom: 20 },
  logoName:     { fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "#c0485a", display: "flex", alignItems: "center", gap: 6 },
  logoDot:      { width: 8, height: 8, borderRadius: "50%", background: "#c0485a", display: "inline-block", flexShrink: 0 },
  logoSub:      { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c9a8a8", marginTop: 3, paddingLeft: 14 },
  navLabel:     { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c9a8a8", padding: "0 22px", marginBottom: 10 },
  navItem:      { display: "flex", alignItems: "center", gap: 10, padding: "9px 22px", fontSize: 13, color: "#8a6868", cursor: "pointer", borderLeft: "2px solid transparent" },
  navItemActive:{ color: "#c0485a", background: "#fdf0ed", borderLeftColor: "#c0485a", fontWeight: 500 },
  sidebarFooter:{ marginTop: "auto", padding: "20px 22px 0", borderTop: "1px solid #f0e0d8" },
  userRow:      { display: "flex", alignItems: "center", gap: 10 },
  avatar:       { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#e8a0b0,#c0485a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff", flexShrink: 0 },
  userName:     { fontSize: 12, fontWeight: 500, color: "#3a2a2a" },
  userEmail:    { fontSize: 10, color: "#c9a8a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 },
  // Main
  main:         { flex: 1, padding: "36px 36px 80px", overflowY: "auto" },
  eyebrow:      { fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#c9a8a8", marginBottom: 10 },
  pageTitle:    { fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 5vw, 46px)", fontWeight: 300, lineHeight: 1.1, color: "#2a1a1a" },
  pageSub:      { fontSize: 13, color: "#b08080", marginTop: 8, lineHeight: 1.6 },
  filterRow:    { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, margin: "28px 0" },
  filterPill:   { border: "1px solid #f0ddd8", background: "transparent", color: "#b08080", fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: "6px 14px", borderRadius: 100, cursor: "pointer" },
  filterPillActive: { background: "#fdf0ed", borderColor: "#e8b0bc", color: "#c0485a" },
  addBtn:       { display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: "#c0485a", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "8px 18px", borderRadius: 100, cursor: "pointer", whiteSpace: "nowrap" },
  monthGroup:   { marginBottom: 44 },
  monthLabel:   { fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: "italic", color: "#c9a8a8", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  monthLine:    { flex: 1, height: 1, background: "#f0e0d8" },
  countPill:    { fontSize: 10, color: "#c9a8a8", background: "#fdf0ed", border: "1px solid #f0ddd8", borderRadius: 100, padding: "2px 9px", fontStyle: "normal", fontFamily: "'DM Sans', sans-serif" },
  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 },
  empty:        { textAlign: "center", padding: "64px 0", color: "#e0c0c0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18 },
  // Card
  card:         { borderRadius: 18, overflow: "hidden", background: "#fff", border: "1px solid #f5e4e0", cursor: "pointer", transition: "transform .22s ease, box-shadow .22s ease" },
  cardHover:    { transform: "translateY(-3px)", boxShadow: "0 8px 28px rgba(192,72,90,.1)" },
  photoWrap:    { position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#fdf0ed" },
  photo:        { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .4s ease" },
  photoHover:   { transform: "scale(1.06)" },
  photoOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(42,20,20,.45))" },
  photoMood:    { position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 100, background: "rgba(253,246,240,.85)", letterSpacing: "0.04em" },
  photoDate:    { position: "absolute", bottom: 10, right: 10, fontSize: 10, color: "rgba(255,240,235,.7)", letterSpacing: "0.04em" },
  leafWatermark:{ position: "absolute", bottom: -10, right: -10, fontSize: 64, lineHeight: 1, transform: "rotate(-20deg)", opacity: 0.12, pointerEvents: "none" },
  cardBody:     { padding: "14px 16px 16px" },
  cardTitle:    { fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 400, lineHeight: 1.3, color: "#2a1a1a", marginBottom: 4 },
  cardNote:     { fontSize: 12, color: "#b08080", lineHeight: 1.6, marginTop: 4 },
  tagRow:       { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 },
  tag:          { fontSize: 10, color: "#c9a8a8", background: "#fdf6f2", border: "1px solid #f0ddd8", borderRadius: 100, padding: "3px 9px", letterSpacing: "0.03em" },
  // Modal
  modalBg:      { position: "fixed", inset: 0, background: "rgba(42,20,20,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modalCard:    { width: "100%", maxWidth: 460, background: "#fdf6f0", border: "1px solid #f0ddd8", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 12, maxHeight: "90vh", overflowY: "auto" },
  modalHeader:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle:   { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, fontStyle: "italic", color: "#2a1a1a" },
  modalClose:   { background: "none", border: "none", color: "#c9a8a8", fontSize: 15, cursor: "pointer", padding: 4 },
  fieldLabel:   { fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c9a8a8" },
  fieldInput:   { width: "100%", background: "#fff", border: "1px solid #f0ddd8", borderRadius: 10, color: "#2a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "10px 14px", outline: "none" },
  uploadArea:   { width: "100%", border: "1.5px dashed #f0c4c8", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", background: "#fff" },
  uploadPreview:{ width: "100%", borderRadius: 8, aspectRatio: "4/3", objectFit: "cover" },
  moodGrid:     { display: "flex", flexWrap: "wrap", gap: 7 },
  moodPill:     { border: "1px solid #f0ddd8", background: "transparent", color: "#b08080", fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: "5px 12px", borderRadius: 100, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 },
  saveBtn:      { marginTop: 6, width: "100%", background: "#c0485a", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: 12, borderRadius: 12, cursor: "pointer" },
};