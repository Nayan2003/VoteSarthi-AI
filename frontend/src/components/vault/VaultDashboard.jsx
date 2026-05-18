// frontend/src/components/vault/VaultDashboard.jsx
/**
 * Secure Document Vault — uploads via backend (Admin SDK).
 * Clicking a file opens an inline preview (image/PDF) inside the vault panel.
 */
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(contentType = "") {
  if (contentType.includes("pdf"))   return "📄";
  if (contentType.includes("image")) return "🖼️";
  return "📎";
}

const CATEGORIES = ["Aadhaar Card", "Voter ID", "Driving Licence", "Other"];

export default function VaultDashboard() {
  const { user }                    = useAuth();
  const [files,    setFiles]        = useState([]);
  const [loading,  setLoading]      = useState(false);
  const [error,    setError]        = useState("");
  const [success,  setSuccess]      = useState("");
  const [dragging, setDragging]     = useState(false);
  const [preview,  setPreview]      = useState(null); // { fileName, downloadUrl, contentType }
  const [activeFolder, setActiveFolder] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("Aadhaar Card");
  const inputRef                    = useRef(null);

  // ── Authenticated fetch ──────────────────────────────────────────────────
  const authFetch = async (url, options = {}) => {
    const token = await user.getIdToken();
    return fetch(`${BACKEND}${url}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    });
  };

  // ── Load file list ───────────────────────────────────────────────────────
  const loadFiles = async () => {
    try {
      const res  = await authFetch("/api/vault/metadata");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setFiles(data.files || []);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { if (user) loadFiles(); }, [user]);

  // ── Upload ───────────────────────────────────────────────────────────────
  const uploadFile = async (file) => {
    if (!file) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) { setError("Only PDF, PNG, JPG files are supported."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File too large — max 10 MB."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", uploadCategory);
      const res  = await authFetch("/api/vault/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setSuccess(`✅ "${data.fileName}" uploaded successfully!`);
      await loadFiles();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteFile = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res  = await authFetch(`/api/vault/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFiles(prev => prev.filter(f => f.id !== id));
      if (preview?.fileName === name) setPreview(null);
      setSuccess(`🗑️ "${name}" deleted.`);
    } catch (err) { setError(err.message); }
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-sm font-semibold text-slate-200">🔒 Secure Document Vault</div>

      {/* ── Inline Preview Panel ── */}
      {preview && (
        <div className="relative rounded-2xl border border-slate-600 bg-slate-900/80 overflow-hidden"
          style={{ minHeight: "260px", maxHeight: "340px" }}>

          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700">
            <span className="text-xs text-slate-300 font-medium truncate max-w-[80%]">
              {fileIcon(preview.contentType)} {preview.fileName}
            </span>
            <button
              onClick={() => setPreview(null)}
              className="text-slate-400 hover:text-white transition text-lg leading-none ml-2"
              title="Close preview"
            >✕</button>
          </div>

          {/* Preview content */}
          <div className="flex items-center justify-center bg-slate-950/60" style={{ height: "290px" }}>
            {preview.contentType?.includes("image") ? (
              <img
                src={preview.downloadUrl}
                alt={preview.fileName}
                className="max-h-full max-w-full object-contain rounded"
                style={{ maxHeight: "280px" }}
              />
            ) : preview.contentType?.includes("pdf") ? (
              <iframe
                src={preview.downloadUrl}
                title={preview.fileName}
                className="w-full rounded"
                style={{ height: "285px", border: "none" }}
              />
            ) : (
              <p className="text-xs text-slate-500">Preview not available for this file type.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Upload area (compact when preview is open) ── */}
      {!preview && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 font-medium">Select Category:</span>
            <select
              value={uploadCategory}
              onChange={e => setUploadCategory(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label
            htmlFor="vault-upload"
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all duration-300 ${
              dragging
                ? "border-blue-400 bg-blue-950/30 scale-[1.02]"
                : "border-slate-600 bg-slate-800/40 hover:border-blue-500 hover:bg-slate-800/60"
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="mb-1 text-2xl">{loading ? "⏳" : "📤"}</div>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                Uploading securely…
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 font-medium">Click to upload or drag & drop</p>
                <p className="text-[10px] text-slate-500 mt-0.5">PDF · PNG · JPG — max 10 MB</p>
              </>
            )}
            <input ref={inputRef} id="vault-upload" type="file" className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          </label>
        </div>
      )}

      {/* Upload button when preview is open */}
      {preview && (
        <label htmlFor="vault-upload-mini"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 py-2 text-xs text-slate-400 hover:border-blue-500 hover:text-blue-400 transition">
          📤 Upload another document
          <input ref={inputRef} id="vault-upload-mini" type="file" className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
        </label>
      )}

      {/* Status messages */}
      {error   && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-400 border border-red-800">{error}</p>}
      {success && <p className="rounded-lg bg-emerald-950/40 px-3 py-2 text-xs text-emerald-400 border border-emerald-800">{success}</p>}

      {/* File list header */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          {activeFolder && (
            <button onClick={() => setActiveFolder(null)} className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded">
              ← Back
            </button>
          )}
          <div className="text-xs text-slate-500">
            {activeFolder ? (
              <><span className="text-slate-300 font-medium">{activeFolder}</span> ({files.filter(f => (f.category || "Other") === activeFolder).length})</>
            ) : (
              <>Document Folders <span className="text-slate-400 font-medium">({files.length} total files)</span></>
            )}
          </div>
        </div>
        <button id="vault-refresh" onClick={loadFiles}
          className="text-[10px] text-slate-500 hover:text-blue-400 transition">↻ Refresh</button>
      </div>

      {/* ── Folders / File list ── */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
        {!activeFolder ? (
          /* Folders Grid */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            {CATEGORIES.map(cat => {
              const count = files.filter(f => (f.category || "Other") === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveFolder(cat); setUploadCategory(cat); }}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/80 hover:border-blue-500/50 transition cursor-pointer shadow-sm group"
                >
                  <span className="text-5xl group-hover:scale-110 transition-transform">🗂️</span>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-200">{cat}</div>
                    <div className="text-[10px] text-slate-500">{count} file{count !== 1 ? "s" : ""}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Files in active folder */
          files.filter(f => (f.category || "Other") === activeFolder).length === 0 ? (
            <div className="text-center mt-6">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-xs text-slate-600">No documents in {activeFolder}.</p>
            </div>
          ) : (
            <div className="space-y-2 mt-1">
              {files.filter(f => (f.category || "Other") === activeFolder).map(file => {
                const isActive = preview?.fileName === file.fileName;
                return (
                  <div
                    key={file.id}
                    onClick={() => setPreview(isActive ? null : {
                      fileName:    file.fileName,
                      downloadUrl: file.downloadUrl,
                      contentType: file.contentType,
                    })}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 border cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-slate-700/50 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800/90"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{fileIcon(file.contentType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{file.fileName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatSize(file.size)} · {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString("en-IN") : ""}
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && <span className="text-[9px] text-blue-400 font-medium">Previewing</span>}

                    {/* Delete button (hover) */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteFile(file.id, file.fileName); }}
                      title="Delete"
                      className="opacity-0 group-hover:opacity-100 rounded-lg bg-red-900/40 p-1.5 text-red-400 hover:bg-red-800 transition flex-shrink-0"
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
