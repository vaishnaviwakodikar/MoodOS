"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

// ── Types ──────────────────────────────────────────────────────────────────
type DailyPhoto = {
  id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  created_at: string;
  is_favorite?: boolean | null;
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
function matchesSearch(p: DailyPhoto, q: string) {
  if (!q.trim()) return true;
  return (p.caption ?? "").toLowerCase().includes(q.trim().toLowerCase());
}

// ── Memory View / Edit Modal ──────────────────────────────────────────────────
function MemoryViewModal({
  photo,
  onClose,
  onUpdate,
  onDelete,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  photo: DailyPhoto;
  onClose: () => void;
  onUpdate: (updated: DailyPhoto) => void;
  onDelete: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const canEdit = isToday(photo.taken_at);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favBusy, setFavBusy] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // Reset local edit state when the underlying photo changes (e.g. via nav)
  useEffect(() => {
    setCaption(photo.caption ?? "");
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
    setFavError(null);
  }, [photo.id]);

  // Keyboard navigation: arrows + escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editing) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editing, hasPrev, hasNext, onPrev, onNext, onClose]);

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

  // ── FIX: proper error handling + optimistic update for snappy UX ──
  const handleToggleFavorite = async () => {
    if (favBusy) return;
    setFavBusy(true);
    setFavError(null);

    const newValue = !photo.is_favorite;

    // Optimistic update so the heart flips instantly
    onUpdate({ ...photo, is_favorite: newValue });

    const { data, error: err } = await (supabase as any)
      .from("daily_photos")
      .update({ is_favorite: newValue })
      .eq("id", photo.id)
      .select()
      .single();

    setFavBusy(false);

    if (err) {
      // Roll back the optimistic update on failure
      onUpdate({ ...photo, is_favorite: !newValue });
      setFavError(
        err.message.includes("column")
          ? 'Column missing — run: ALTER TABLE daily_photos ADD COLUMN is_favorite boolean DEFAULT false;'
          : err.message
      );
      return;
    }

    if (data) onUpdate(data as DailyPhoto);
  };

  const handleDelete = async () => {
    const urlParts = photo.photo_url.split("/daily-photos/");
    const storagePath = urlParts[1];
    if (storagePath) await supabase.storage.from("daily-photos").remove([storagePath]);
    await (supabase as any).from("daily_photos").delete().eq("id", photo.id);
    onDelete(photo.id);
    onClose();
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(photo.photo_url);
      const blob = await res.blob();
      const ext = (photo.photo_url.split(".").pop() || "jpg").split("?")[0];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `memory-${photo.taken_at}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(photo.photo_url, "_blank");
    }
  };

  return (
    <div style={styles.modalBg} onClick={onClose}>
      <div style={styles.viewModalCard} onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button style={styles.viewClose} onClick={onClose}>✕</button>

        {/* Favorite toggle */}
        <button
          style={{
            ...styles.viewFav,
            ...(photo.is_favorite ? styles.viewFavActive : {}),
            opacity: favBusy ? 0.5 : 1,
          }}
          onClick={handleToggleFavorite}
          disabled={favBusy}
          title={photo.is_favorite ? "Remove from favorites" : "Add to favorites"}
        >
          {photo.is_favorite ? "♥" : "♡"}
        </button>

        {/* Prev / Next nav */}
        {hasPrev && (
          <button style={styles.viewNavLeft} onClick={onPrev} title="Previous memory">‹</button>
        )}
        {hasNext && (
          <button style={styles.viewNavRight} onClick={onNext} title="Next memory">›</button>
        )}

        {/* Photo */}
        <div style={styles.viewPhotoWrap}>
          <img src={photo.photo_url} alt={photo.caption ?? "memory"} style={styles.viewPhoto} />
        </div>

        {/* Body */}
        <div style={styles.viewBody}>
          <div style={styles.viewDate}>{fmtDate(photo.taken_at)}</div>

          {/* Favorite error banner */}
          {favError && (
            <div style={styles.favErrorBanner}>
              <span>⚠ {favError}</span>
              <button style={styles.favErrorDismiss} onClick={() => setFavError(null)}>✕</button>
            </div>
          )}

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
                <button style={styles.downloadBtn} onClick={handleDownload}>
                  Download
                </button>
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
        {photo.is_favorite && <span style={styles.favBadge}>♥</span>}
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
function AddMemoryModal({ onClose, onAdd }: { onClose: () => void; onAdd: (photos: DailyPhoto[]) => void }) {
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split("T")[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    setFiles(list);
    setPreviews([]);
    list.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleSave = async () => {
    if (!files.length) return setError("Please select at least one photo.");
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const rows: any[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("daily-photos").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("daily-photos").getPublicUrl(path);
        rows.push({ user_id: user.id, photo_url: publicUrl, caption: caption.trim() || null, taken_at: takenAt });
      }

      const { data, error: insertErr } = await (supabase as any)
        .from("daily_photos")
        .insert(rows)
        .select();
      if (insertErr) throw insertErr;

      onAdd((data as DailyPhoto[]) ?? []);
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
        <span style={styles.fieldLabel}>Photo{files.length > 1 ? "s" : ""}</span>
        <label style={styles.uploadArea}>
          <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFile} />
          {previews.length ? (
            <div style={styles.uploadPreviewGrid}>
              {previews.map((src, i) => (
                <img key={i} src={src} alt={`preview ${i + 1}`} style={styles.uploadPreviewThumb} />
              ))}
            </div>
          ) : (
            <>
              <i className="ti ti-camera" style={{ fontSize: 22, color: "#e8c4c4" }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: "#c9a8a8" }}>Tap to add one or more photos</span>
            </>
          )}
        </label>
        {files.length > 1 && (
          <span style={{ fontSize: 11, color: "#b08080" }}>
            {files.length} photos selected — same caption and date will apply to all.
          </span>
        )}
        <span style={styles.fieldLabel}>Caption</span>
        <input style={styles.fieldInput} placeholder="What happened?" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <span style={styles.fieldLabel}>Date</span>
        <input type="date" style={styles.fieldInput} value={takenAt} max={new Date().toISOString().split("T")[0]} onChange={(e) => setTakenAt(e.target.value)} />
        {error && <p style={{ fontSize: 12, color: "#c0485a" }}>{error}</p>}
        <button style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : `Save memor${files.length > 1 ? "ies" : "y"} ✦`}
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

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

  const handleUpdate = useCallback((updated: DailyPhoto) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const filtered = useMemo(() => {
    return photos
      .filter((p) => matchesSearch(p, search))
      .filter((p) => !favoritesOnly || !!p.is_favorite)
      .sort((a, b) =>
        sortOrder === "newest"
          ? b.taken_at.localeCompare(a.taken_at)
          : a.taken_at.localeCompare(b.taken_at)
      );
  }, [photos, search, favoritesOnly, sortOrder]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  const selectedIndex = selectedId ? filtered.findIndex((p) => p.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? filtered[selectedIndex] : null;

  const totalCount = photos.length;
  const favCount = photos.filter((p) => p.is_favorite).length;
  const thisMonthCount = photos.filter((p) => fmtMonth(p.taken_at) === fmtMonth(new Date().toISOString())).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fdf6f0; }
        ::placeholder { color: #d8b8b8; }
      `}</style>

      <div style={styles.shell}>
        <main style={styles.main}>
          <div style={styles.eyebrow}>○ Memories ○</div>
          <h1 style={styles.pageTitle}>
            Your <em style={{ fontStyle: "italic", color: "#c0485a" }}>photo memories</em>
          </h1>
          <p style={styles.pageSub}>Moments and the little things worth keeping. ♡</p>

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statPill}>{totalCount} memor{totalCount === 1 ? "y" : "ies"}</div>
            <div style={styles.statPill}>{thisMonthCount} this month</div>
            <div style={styles.statPill}>♥ {favCount} favorite{favCount === 1 ? "" : "s"}</div>
          </div>

          {/* Controls */}
          <div style={styles.controlsRow}>
            <input
              style={styles.searchInput}
              placeholder="Search captions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              style={{ ...styles.toggleBtn, ...(favoritesOnly ? styles.toggleBtnActive : {}) }}
              onClick={() => setFavoritesOnly((v) => !v)}
            >
              {favoritesOnly ? "♥ Favorites" : "♡ Favorites"}
            </button>
            <button
              style={styles.toggleBtn}
              onClick={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}
            >
              {sortOrder === "newest" ? "Newest first" : "Oldest first"}
            </button>
            <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Add memory</button>
          </div>

          {loading ? (
            <div style={styles.empty}>Loading memories…</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>
              {photos.length === 0
                ? "No memories here yet… ♡"
                : "No memories match your filters… ♡"}
            </div>
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
                    <MemoryCard key={p.id} photo={p} onClick={() => setSelectedId(p.id)} />
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
          onAdd={(ps) => setPhotos((prev) => [...ps, ...prev])}
        />
      )}

      {selected && (
        <MemoryViewModal
          photo={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onPrev={() => selectedIndex > 0 && setSelectedId(filtered[selectedIndex - 1].id)}
          onNext={() => selectedIndex < filtered.length - 1 && setSelectedId(filtered[selectedIndex + 1].id)}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex >= 0 && selectedIndex < filtered.length - 1}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  shell:              { display: "flex", minHeight: "100vh", background: "#fdf6f0", fontFamily: "'DM Sans', sans-serif", color: "#3a2a2a" },
  main:               { flex: 1, padding: "36px 36px 80px", overflowY: "auto" },
  eyebrow:            { fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#c9a8a8", marginBottom: 10 },
  pageTitle:          { fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 5vw, 46px)", fontWeight: 300, lineHeight: 1.1, color: "#2a1a1a" },
  pageSub:            { fontSize: 13, color: "#b08080", marginTop: 8, lineHeight: 1.6 },
  // Stats
  statsRow:           { display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" as const },
  statPill:           { fontSize: 11, color: "#b08080", background: "#fff", border: "1px solid #f0ddd8", borderRadius: 100, padding: "6px 14px" },
  // Controls
  controlsRow:        { display: "flex", alignItems: "center", gap: 10, margin: "20px 0 28px", flexWrap: "wrap" as const },
  searchInput:        { flex: "1 1 200px", minWidth: 160, background: "#fff", border: "1px solid #f0ddd8", borderRadius: 100, color: "#2a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "9px 16px", outline: "none" },
  toggleBtn:          { background: "#fff", border: "1px solid #f0ddd8", color: "#b08080", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "9px 16px", borderRadius: 100, cursor: "pointer", whiteSpace: "nowrap" as const },
  toggleBtnActive:    { background: "#fdf0ed", border: "1px solid #f0c4c8", color: "#c0485a" },
  addBtn:             { marginLeft: "auto", background: "#c0485a", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "9px 18px", borderRadius: 100, cursor: "pointer", whiteSpace: "nowrap" as const },
  monthGroup:         { marginBottom: 44 },
  monthLabel:         { fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: "italic", color: "#c9a8a8", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  monthLine:          { flex: 1, height: 1, background: "#f0e0d8" },
  countPill:          { fontSize: 10, color: "#c9a8a8", background: "#fdf0ed", border: "1px solid #f0ddd8", borderRadius: 100, padding: "2px 9px", fontStyle: "normal", fontFamily: "'DM Sans', sans-serif" },
  grid:               { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 },
  empty:              { textAlign: "center", padding: "64px 0", color: "#e0c0c0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18 },
  // Card
  card:               { borderRadius: 18, overflow: "hidden", background: "#fff", border: "1px solid #f5e4e0", cursor: "pointer", transition: "transform .22s ease, box-shadow .22s ease" },
  cardHover:          { transform: "translateY(-3px)", boxShadow: "0 8px 28px rgba(192,72,90,.1)" },
  photoWrap:          { position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#fdf0ed" },
  photo:              { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .4s ease" },
  photoHover:         { transform: "scale(1.06)" },
  photoOverlay:       { position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(42,20,20,.45))" },
  photoDate:          { position: "absolute", bottom: 10, right: 10, fontSize: 10, color: "rgba(255,240,235,.7)", letterSpacing: "0.04em" },
  todayBadge:         { position: "absolute", top: 10, left: 10, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c0485a", background: "rgba(253,246,240,.9)", border: "1px solid #f0c4c8", borderRadius: 100, padding: "3px 9px" },
  favBadge:           { position: "absolute", top: 10, right: 10, fontSize: 13, color: "#c0485a", background: "rgba(253,246,240,.9)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" },
  cardBody:           { padding: "12px 16px 14px" },
  cardTitle:          { fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 400, lineHeight: 1.3, color: "#2a1a1a" },
  // View modal
  viewModalCard:      { position: "relative", width: "100%", maxWidth: 520, background: "#fdf6f0", border: "1px solid #f0ddd8", borderRadius: 24, overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" },
  viewClose:          { position: "absolute", top: 14, right: 14, zIndex: 2, background: "rgba(253,246,240,.85)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#b08080", cursor: "pointer" },
  viewFav:            { position: "absolute", top: 14, left: 14, zIndex: 2, background: "rgba(253,246,240,.85)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#c9a8a8", cursor: "pointer", transition: "color .15s ease, transform .15s ease" },
  viewFavActive:      { color: "#c0485a", transform: "scale(1.15)" },
  viewNavLeft:        { position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)", zIndex: 2, background: "rgba(253,246,240,.85)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#b08080", cursor: "pointer" },
  viewNavRight:       { position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", zIndex: 2, background: "rgba(253,246,240,.85)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#b08080", cursor: "pointer" },
  viewPhotoWrap:      { width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#fdf0ed", flexShrink: 0 },
  viewPhoto:          { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  viewBody:           { padding: "20px 24px 24px", overflowY: "auto" },
  viewDate:           { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c9a8a8", marginBottom: 10 },
  viewCaption:        { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, lineHeight: 1.6, color: "#2a1a1a", marginBottom: 16 },
  viewActions:        { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 8 },
  editBtn:            { background: "none", border: "1px solid #f0c4c8", color: "#c0485a", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 100, cursor: "pointer" },
  downloadBtn:        { background: "none", border: "1px solid #f0ddd8", color: "#b08080", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 100, cursor: "pointer" },
  lockedNote:         { fontSize: 11, color: "#d0b0b0", fontStyle: "italic" },
  deleteBtn:          { background: "none", border: "1px solid #f0ddd8", color: "#c9a8a8", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 100, cursor: "pointer", marginLeft: "auto" },
  deleteBtnConfirm:   { background: "#c0485a", border: "none", color: "#fff", fontSize: 11, borderRadius: 6, padding: "5px 12px", cursor: "pointer" },
  cancelBtn:          { background: "#fdf0ed", border: "1px solid #f0ddd8", color: "#b08080", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 100, cursor: "pointer" },
  editTextarea:       { width: "100%", background: "#fff", border: "1px solid #f0ddd8", borderRadius: 10, color: "#2a1a1a", fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 300, lineHeight: 1.6, padding: "10px 14px", outline: "none", resize: "none", minHeight: 90 },
  // Fav error banner
  favErrorBanner:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, background: "#fff0f2", border: "1px solid #f0c4c8", borderRadius: 10, padding: "10px 14px", fontSize: 11, color: "#c0485a", marginBottom: 12, lineHeight: 1.5 },
  favErrorDismiss:    { background: "none", border: "none", color: "#c0485a", cursor: "pointer", fontSize: 12, flexShrink: 0, padding: 0 },
  // Add modal
  modalBg:            { position: "fixed", inset: 0, background: "rgba(42,20,20,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modalCard:          { width: "100%", maxWidth: 460, background: "#fdf6f0", border: "1px solid #f0ddd8", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 12, maxHeight: "90vh", overflowY: "auto" },
  modalHeader:        { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle:         { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, fontStyle: "italic", color: "#2a1a1a" },
  modalClose:         { background: "none", border: "none", color: "#c9a8a8", fontSize: 15, cursor: "pointer", padding: 4 },
  fieldLabel:         { fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c9a8a8" },
  fieldInput:         { width: "100%", background: "#fff", border: "1px solid #f0ddd8", borderRadius: 10, color: "#2a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "10px 14px", outline: "none" },
  uploadArea:         { width: "100%", border: "1.5px dashed #f0c4c8", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", background: "#fff" },
  uploadPreviewGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, width: "100%" },
  uploadPreviewThumb: { width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 },
  saveBtn:            { marginTop: 6, width: "100%", background: "#c0485a", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: 12, borderRadius: 12, cursor: "pointer" },
};