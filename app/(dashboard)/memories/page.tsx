'use client'
import { useState, useEffect, useRef, useCallback } from "react";

const MOODS = [
  { label: "☀️ happy", value: "happy" },
  { label: "🌸 soft", value: "soft" },
  { label: "🌧️ melancholic", value: "melancholic" },
  { label: "⚡ excited", value: "excited" },
  { label: "🌙 tired", value: "tired" },
  { label: "🦋 grateful", value: "grateful" },
];

const REVEAL_OPTS = [
  { label: "1", sub: "year", value: 1 },
  { label: "2", sub: "years", value: 2 },
  { label: "3", sub: "years", value: 3 },
  { label: "5", sub: "years", value: 5 },
];



const SAMPLE_CARDS = [
  {
    id: 1,
    emoji: "🌸",
    bg: "linear-gradient(135deg,#fde8f0,#f4c2d0)",
    date: "May 28, 2024",
    cap: "Golden hour from the hostel terrace",
    mood: "grateful",
    unlockStr: "May 28, 2025",
  },
  {
    id: 2,
    emoji: "✨",
    bg: "linear-gradient(135deg,#eef0fb,#d0c8f0)",
    date: "May 15, 2024",
    cap: "Library corner, my favourite spot",
    mood: "soft",
    unlockStr: "May 15, 2026",
  },
  {
    id: 3,
    emoji: "🌿",
    bg: "linear-gradient(135deg,#eef8f4,#b0dcc8)",
    date: "Apr 30, 2024",
    cap: "Maa's garden after rain",
    mood: "happy",
    unlockStr: "Apr 30, 2025",
  },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad(n) { return String(n).padStart(2, "0"); }

function formatDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function Toast({ message, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: "#3a2a2a", color: "white",
      padding: "12px 20px", borderRadius: 14,
      fontSize: 13, zIndex: 999,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "all .3s", pointerEvents: "none",
    }}>
      {message}
    </div>
  );
}

export default function MoodosDailyPhoto() {
  const [clock, setClock] = useState("");
  const [selMood, setSelMood] = useState("");
  const [selReveal, setSelReveal] = useState(1);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selFile, setSelFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState(SAMPLE_CARDS);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  // Clock
  useEffect(() => {
    function tick() {
      const d = new Date();
      let h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
      const ap = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      setClock(`${pad(h)}:${pad(m)}:${pad(s)} ${ap}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  function handleFile(f) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { showToast("Please select an image ♡"); return; }
    if (f.size > 5 * 1024 * 1024) { showToast("File too large — max 5 MB ♡"); return; }
    setSelFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function removePhoto() {
    setSelFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  function savePhoto() {
    if (!selFile) { showToast("Add a photo first 📷"); return; }
    if (!caption.trim()) { showToast("Add a caption ♡"); return; }
    setSaving(true);
    setTimeout(() => {
      const today = new Date();
      const unlockDate = new Date(today);
      unlockDate.setFullYear(unlockDate.getFullYear() + selReveal);
      const newCard = {
        id: Date.now(),
        imgUrl: URL.createObjectURL(selFile),
        date: formatDate(today),
        cap: caption.trim(),
        mood: selMood || "🌸 soft",
        unlockStr: formatDate(unlockDate),
      };
      setCards(prev => [newCard, ...prev]);
      setSelFile(null);
      setPreviewUrl(null);
      setCaption("");
      setNote("");
      setSelMood("");
      setSelReveal(1);
      if (fileRef.current) fileRef.current.value = "";
      setSaving(false);
      showToast("Memory sealed ✨ your future self will love this");
    }, 900);
  }

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FDF6F0", color: "#3a2a2a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,92,122,.2); border-radius: 3px; }
      `}</style>

      

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".14em", color: "#bba0a0", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              🕐 {todayStr}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 400, lineHeight: 1.1, marginTop: 8 }}>
              Daily Photo<br />
              <span style={{ color: "#c45c7a", fontStyle: "italic" }}>Time Capsule ♡</span>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(196,92,122,.08)", border: "1px solid rgba(196,92,122,.2)",
              borderRadius: 20, padding: "7px 16px", fontSize: 12, color: "#c45c7a", marginTop: 12,
            }}>
              ✨ your future self will thank you
            </div>
          </div>
          <div style={{
            background: "rgba(196,92,122,.08)", border: "1px solid rgba(196,92,122,.15)",
            borderRadius: 16, padding: "12px 20px", textAlign: "right",
          }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#3a2a2a" }}>{clock}</div>
            <div style={{ fontSize: 10, color: "#bba0a0", letterSpacing: ".1em" }}>IST</div>
          </div>
        </div>

        {/* Memory Banner */}
        <SectionDivider label="a memory surfaced today" />
        <div style={{
          background: "linear-gradient(135deg,rgba(196,92,122,.08),rgba(138,106,184,.08))",
          border: "1px solid rgba(196,92,122,.2)", borderRadius: 18,
          padding: "20px 24px", marginBottom: 8, display: "flex", alignItems: "center", gap: 18,
        }}>
          <div style={{ fontSize: 36 }}>🎞️</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#3a2a2a", marginBottom: 4 }}>
              1 year ago today — June 2, 2023
            </div>
            <p style={{ fontSize: 13, color: "#8a6a6a", lineHeight: 1.5 }}>
              You uploaded a photo captioned <em>"Rainy day chai and my favourite book"</em>. Look how far you've come.
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(196,92,122,.1)", color: "#c45c7a",
              fontSize: 11, padding: "4px 12px", borderRadius: 20, marginTop: 8,
            }}>
              🎉 this memory is now unlocked
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <SectionDivider label="today's photo" />
        <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(200,140,140,.15)", padding: "28px 28px 24px", marginBottom: 8 }}>

          {!previewUrl ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#c45c7a" : "rgba(196,92,122,.3)"}`,
                borderRadius: 16, padding: "36px 20px", textAlign: "center",
                cursor: "pointer", transition: "all .2s",
                background: dragging ? "rgba(196,92,122,.08)" : "rgba(196,92,122,.02)",
                position: "relative",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])}
              />
              <div style={{ fontSize: 36, color: "rgba(196,92,122,.4)", marginBottom: 10 }}>📷</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#5a3a3a", marginBottom: 6 }}>Drop your moment here</div>
              <div style={{ fontSize: 12, color: "#bba0a0" }}>or click to browse · jpg, png, webp, heic · max 5mb</div>
            </div>
          ) : (
            <div style={{ position: "relative", marginTop: 0 }}>
              <img src={previewUrl} alt="preview" style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 14, display: "block" }} />
              <button
                onClick={removePhoto}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%",
                  width: 30, height: 30, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#c45c7a", fontSize: 16,
                }}
              >✕</button>
            </div>
          )}

          {/* Form */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
            {/* Caption */}
            <div style={{ gridColumn: "1 / -1" }}>
              <FormLabel>caption</FormLabel>
              <input
                type="text"
                maxLength={140}
                placeholder="what's happening in this moment?"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#c45c7a"}
                onBlur={e => e.target.style.borderColor = "rgba(200,140,140,.2)"}
              />
            </div>

            {/* Mood */}
            <div style={{ gridColumn: "1 / -1" }}>
              <FormLabel>mood right now</FormLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setSelMood(m.label)}
                    style={{
                      padding: "6px 14px", borderRadius: 20,
                      border: "1px solid rgba(200,140,140,.2)",
                      fontSize: 12, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all .15s",
                      background: selMood === m.label ? "rgba(196,92,122,.12)" : "white",
                      color: selMood === m.label ? "#c45c7a" : "#9a7a7a",
                      borderColor: selMood === m.label ? "rgba(196,92,122,.35)" : "rgba(200,140,140,.2)",
                    }}
                  >{m.label}</button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ gridColumn: "1 / -1" }}>
              <FormLabel>a little note to future you</FormLabel>
              <textarea
                maxLength={300}
                placeholder="dear future me, today I felt..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                onFocus={e => e.target.style.borderColor = "#c45c7a"}
                onBlur={e => e.target.style.borderColor = "rgba(200,140,140,.2)"}
              />
            </div>

            {/* Reveal */}
            <div style={{ gridColumn: "1 / -1" }}>
              <FormLabel>unlock this memory after</FormLabel>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {REVEAL_OPTS.map(r => (
                  <div
                    key={r.value}
                    onClick={() => setSelReveal(r.value)}
                    style={{
                      flex: 1, padding: 10, borderRadius: 12,
                      border: "1px solid rgba(200,140,140,.2)",
                      textAlign: "center", cursor: "pointer", transition: "all .15s",
                      background: selReveal === r.value ? "rgba(196,92,122,.08)" : "white",
                      borderColor: selReveal === r.value ? "rgba(196,92,122,.3)" : "rgba(200,140,140,.2)",
                    }}
                  >
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#c45c7a" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: "#bba0a0", marginTop: 2 }}>{r.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={savePhoto}
            disabled={saving}
            style={{
              marginTop: 20, width: "100%", padding: 13,
              background: "linear-gradient(135deg,#e8789a,#c45c7a)",
              color: "white", border: "none", borderRadius: 16,
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? .5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "opacity .2s",
            }}
          >
            {saving ? "⏳ sealing..." : "💾 seal this memory"}
          </button>
        </div>

        {/* Timeline */}
        <SectionDivider label="sealed away" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
          {cards.map(card => <PhotoCard key={card.id} card={card} />)}
        </div>
        <div style={{ height: 36 }} />
      </main>

      <Toast message={toast.msg} visible={toast.visible} />
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      fontSize: 10, letterSpacing: ".18em", color: "#bba0a0", textTransform: "uppercase",
      margin: "26px 0 18px",
    }}>
      ○ {label} ○
    </div>
  );
}

function FormLabel({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#bba0a0", marginBottom: 6 }}>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "1px solid rgba(200,140,140,.2)", borderRadius: 12,
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3a2a2a",
  background: "white", outline: "none", transition: "border .15s",
};

function PhotoCard({ card }) {
  return (
    <div style={{
      background: "white", borderRadius: 18, overflow: "hidden",
      border: "1px solid rgba(200,140,140,.12)",
      transition: "transform .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      {card.imgUrl ? (
        <img src={card.imgUrl} alt={card.cap} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: 180, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
          {card.emoji}
        </div>
      )}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 10, color: "#bba0a0", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>{card.date}</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#3a2a2a", lineHeight: 1.4, marginBottom: 8 }}>{card.cap}</div>
        <div style={{ fontSize: 11, color: "#c45c7a", display: "flex", alignItems: "center", gap: 5 }}>🩷 {card.mood}</div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "rgba(138,106,184,.1)", color: "#8a6ab8",
          fontSize: 10, padding: "3px 10px", borderRadius: 20, marginTop: 8,
        }}>🔒 unlocks {card.unlockStr}</div>
      </div>
    </div>
  );
}