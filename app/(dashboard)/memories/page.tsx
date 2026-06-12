"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

// ── Types ──────────────────────────────────────────────────────────────────
type DailyPhoto = {
  id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  created_at: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function groupByMonth(arr: DailyPhoto[]) {
  const g: Record<string, DailyPhoto[]> = {};
  for (const p of arr) {
    const k = fmtMonth(p.taken_at);
    if (!g[k]) g[k] = [];
    g[k].push(p);
  }
  return g;
}
function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split("T")[0];
}

// ── Memory View / Edit Modal ──────────────────────────────────────────────────
function MemoryViewModal({
  photo,
  onClose,
  onUpdate,
  onDelete,
}: {
  photo: DailyPhoto;
  onClose: () => void;
  onUpdate: (updated: DailyPhoto) => void;
  onDelete: (id: string) => void;
}) {
  const canEdit = isToday(photo.taken_at);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { data, error: err } = await (supabase as any)
  .from("daily_photos")
      .update({ caption: caption.trim() || null })
      .eq("id", photo.id)
      .select()
      .single();
    setSaving(false);
    if (err) return setError(err.message);
    onUpdate(data as DailyPhoto);
    setEditing(false);
  };

  const handleDelete = async () => {
    const urlParts = photo.photo_url.split("/daily-photos/");
    const storagePath = urlParts[1];
    if (storagePath) await supabase.storage.from("daily-photos").remove([storagePath]);
    await (supabase as any).from("daily_photos").delete().eq("id", photo.id);
    onDelete(photo.id);
    onClose();
  };

  return (
    <div style={styles.modalBg} onClick={onClose}>
      <div style={styles.viewModalCard} onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button style={styles.viewClose} onClick={onClose}>✕</button>

        {/* Photo */}
        <div style={styles.viewPhotoWrap}>
          <img src={photo.photo_url} alt={photo.caption ?? "memory"} style={styles.viewPhoto} />
        </div>

        {/* Body */}
        <div style={styles.viewBody}>
          <div style={styles.viewDate}>{fmtDate(photo.taken_at)}</div>

          {editing ? (
            <>
              <textarea
                style={styles.editTextarea}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption…"
                autoFocus
              />
              {error && <p style={{ fontSize: 12, color: "#c0485a", marginTop: 4 }}>{error}</p>}
              <div style={styles.viewActions}>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save ✦"}
                </button>
                <button style={styles.cancelBtn} onClick={() => { setEditing(false); setCaption(photo.caption ?? ""); }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={styles.viewCaption}>
                {photo.caption ?? <span style={{ color: "#d0b0b0", fontStyle: "italic" }}>No caption</span>}
              </p>
              <div style={styles.viewActions}>
                {canEdit && (
                  <button style={styles.editBtn} onClick={() => setEditing(true)}>
                    Edit caption
                  </button>
                )}
                {!canEdit && (
                  <span style={styles.lockedNote}>✦ Editable only on the day it was taken</span>
                )}
                {confirmDelete ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#b08080" }}>Sure?</span>
                    <button style={styles.deleteBtnConfirm} onClick={handleDelete}>Yes, delete</button>
                    <button style={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>No</button>
                  </div>
                ) : (
                  <button style={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>Delete</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Memory Card ──────────────────────────────────────────────────────────────
function MemoryCard({ photo, onClick }: { photo: DailyPhoto; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...styles.card, ...(hovered ? styles.cardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.photoWrap}>
        <img
          src={photo.photo_url}
          alt={photo.caption ?? "memory"}
          style={{ ...styles.photo, ...(hovered ? styles.photoHover : {}) }}
          loading="lazy"
        />
        <div style={styles.photoOverlay} />
        <span style={styles.photoDate}>{fmtDate(photo.taken_at)}</span>
        {isToday(photo.taken_at) && <span style={styles.todayBadge}>today</span>}
      </div>
      {photo.caption && (
        <div style={styles.cardBody}>
          <div style={styles.cardTitle}>{photo.caption}</div>
        </div>
      )}
    </div>
  );
}

// ── Add Memory Modal ─────────────────────────────────────────────────────────
function AddMemoryModal({ onClose, onAdd }: { onClose: () => void; onAdd: (photo: DailyPhoto) => void }) {
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!file) return setError("Please select a photo.");
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("daily-photos").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("daily-photos").getPublicUrl(path);
      const { data, error: insertErr } = await (supabase as any)
  .from("daily_photos")
        .insert({ user_id: user.id, photo_url: publicUrl, caption: caption.trim() || null, taken_at: takenAt })
        .select()
        .single();
      if (insertErr) throw insertErr;
      onAdd(data as DailyPhoto);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modalBg} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>New memory ♡</span>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <span style={styles.fieldLabel}>Photo</span>
        <label style={styles.uploadArea}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {preview ? (
            <img src={preview} alt="preview" style={styles.uploadPreview} />
          ) : (
            <>
              <i className="ti ti-camera" style={{ fontSize: 22, color: "#e8c4c4" }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: "#c9a8a8" }}>Tap to add a photo</span>
            </>
          )}
        </label>
        <span style={styles.fieldLabel}>Caption</span>
        <input style={styles.fieldInput} placeholder="What happened?" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <span style={styles.fieldLabel}>Date</span>
        <input type="date" style={styles.fieldInput} value={takenAt} max={new Date().toISOString().split("T")[0]} onChange={(e) => setTakenAt(e.target.value)} />
        {error && <p style={{ fontSize: 12, color: "#c0485a" }}>{error}</p>}
        <button style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save memory ✦"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Memories() {
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<DailyPhoto | null>(null);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
  .from("daily_photos")
      .select("*")
      .order("taken_at", { ascending: false });
    if (!error && data) setPhotos(data as DailyPhoto[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleUpdate = (updated: DailyPhoto) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
  };

  const handleDelete = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const grouped = groupByMonth(photos);

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
          <div style={styles.eyebrow}>○ Memories ○</div>
          <h1 style={styles.pageTitle}>
            Your <em style={{ fontStyle: "italic", color: "#c0485a" }}>photo memories</em>
          </h1>
          <p style={styles.pageSub}>Moments and the little things worth keeping. ♡</p>
          <div style={styles.filterRow}>
            <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Add memory</button>
          </div>
          {loading ? (
            <div style={styles.empty}>Loading memories…</div>
          ) : Object.keys(grouped).length === 0 ? (
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
                  {mems.map((p) => (
                    <MemoryCard key={p.id} photo={p} onClick={() => setSelected(p)} />
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
          onAdd={(p) => setPhotos((prev) => [p, ...prev])}
        />
      )}

      {selected && (
        <MemoryViewModal
          photo={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  shell:            { display: "flex", minHeight: "100vh", background: "#fdf6f0", fontFamily: "'DM Sans', sans-serif", color: "#3a2a2a" },
  main:             { flex: 1, padding: "36px 36px 80px", overflowY: "auto" },
  eyebrow:          { fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#c9a8a8", marginBottom: 10 },
  pageTitle:        { fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 5vw, 46px)", fontWeight: 300, lineHeight: 1.1, color: "#2a1a1a" },
  pageSub:          { fontSize: 13, color: "#b08080", marginTop: 8, lineHeight: 1.6 },
  filterRow:        { display: "flex", alignItems: "center", margin: "28px 0" },
  addBtn:           { marginLeft: "auto", background: "#c0485a", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "8px 18px", borderRadius: 100, cursor: "pointer" },
  monthGroup:       { marginBottom: 44 },
  monthLabel:       { fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: "italic", color: "#c9a8a8", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  monthLine:        { flex: 1, height: 1, background: "#f0e0d8" },
  countPill:        { fontSize: 10, color: "#c9a8a8", background: "#fdf0ed", border: "1px solid #f0ddd8", borderRadius: 100, padding: "2px 9px", fontStyle: "normal", fontFamily: "'DM Sans', sans-serif" },
  grid:             { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 },
  empty:            { textAlign: "center", padding: "64px 0", color: "#e0c0c0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18 },
  // Card
  card:             { borderRadius: 18, overflow: "hidden", background: "#fff", border: "1px solid #f5e4e0", cursor: "pointer", transition: "transform .22s ease, box-shadow .22s ease" },
  cardHover:        { transform: "translateY(-3px)", boxShadow: "0 8px 28px rgba(192,72,90,.1)" },
  photoWrap:        { position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#fdf0ed" },
  photo:            { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .4s ease" },
  photoHover:       { transform: "scale(1.06)" },
  photoOverlay:     { position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(42,20,20,.45))" },
  photoDate:        { position: "absolute", bottom: 10, right: 10, fontSize: 10, color: "rgba(255,240,235,.7)", letterSpacing: "0.04em" },
  todayBadge:       { position: "absolute", top: 10, left: 10, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c0485a", background: "rgba(253,246,240,.9)", border: "1px solid #f0c4c8", borderRadius: 100, padding: "3px 9px" },
  cardBody:         { padding: "12px 16px 14px" },
  cardTitle:        { fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 400, lineHeight: 1.3, color: "#2a1a1a" },
  // View modal
  viewModalCard:    { position: "relative", width: "100%", maxWidth: 520, background: "#fdf6f0", border: "1px solid #f0ddd8", borderRadius: 24, overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" },
  viewClose:        { position: "absolute", top: 14, right: 14, zIndex: 2, background: "rgba(253,246,240,.85)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#b08080", cursor: "pointer" },
  viewPhotoWrap:    { width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#fdf0ed", flexShrink: 0 },
  viewPhoto:        { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  viewBody:         { padding: "20px 24px 24px", overflowY: "auto" },
  viewDate:         { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c9a8a8", marginBottom: 10 },
  viewCaption:      { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, lineHeight: 1.6, color: "#2a1a1a", marginBottom: 16 },
  viewActions:      { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 8 },
  editBtn:          { background: "none", border: "1px solid #f0c4c8", color: "#c0485a", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 100, cursor: "pointer" },
  lockedNote:       { fontSize: 11, color: "#d0b0b0", fontStyle: "italic" },
  deleteBtn:        { background: "none", border: "1px solid #f0ddd8", color: "#c9a8a8", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 100, cursor: "pointer", marginLeft: "auto" },
  deleteBtnConfirm: { background: "#c0485a", border: "none", color: "#fff", fontSize: 11, borderRadius: 6, padding: "5px 12px", cursor: "pointer" },
  cancelBtn:        { background: "#fdf0ed", border: "1px solid #f0ddd8", color: "#b08080", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 100, cursor: "pointer" },
  editTextarea:     { width: "100%", background: "#fff", border: "1px solid #f0ddd8", borderRadius: 10, color: "#2a1a1a", fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 300, lineHeight: 1.6, padding: "10px 14px", outline: "none", resize: "none", minHeight: 90 },
  // Add modal
  modalBg:          { position: "fixed", inset: 0, background: "rgba(42,20,20,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modalCard:        { width: "100%", maxWidth: 460, background: "#fdf6f0", border: "1px solid #f0ddd8", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 12, maxHeight: "90vh", overflowY: "auto" },
  modalHeader:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle:       { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, fontStyle: "italic", color: "#2a1a1a" },
  modalClose:       { background: "none", border: "none", color: "#c9a8a8", fontSize: 15, cursor: "pointer", padding: 4 },
  fieldLabel:       { fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c9a8a8" },
  fieldInput:       { width: "100%", background: "#fff", border: "1px solid #f0ddd8", borderRadius: 10, color: "#2a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "10px 14px", outline: "none" },
  uploadArea:       { width: "100%", border: "1.5px dashed #f0c4c8", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", background: "#fff" },
  uploadPreview:    { width: "100%", borderRadius: 8, aspectRatio: "4/3", objectFit: "cover" },
  saveBtn:          { marginTop: 6, width: "100%", background: "#c0485a", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: 12, borderRadius: 12, cursor: "pointer" },
};