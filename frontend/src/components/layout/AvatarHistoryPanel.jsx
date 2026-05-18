// frontend/src/components/layout/AvatarHistoryPanel.jsx
/**
 * Right panel — AI Avatar (top half) + Chat History (bottom half).
 * Stacked vertically with a draggable divider.
 */
import AIAvatar from "../avatar/AIAvatar";
import { useState, useEffect } from "react";
import { useChat } from "../../context/ChatContext";

export default function AvatarHistoryPanel() {
  const { messages, clearMessages } = useChat();
  const [search, setSearch] = useState("");
  // px height of the avatar section — draggable, scaled down on small heights
  const [avatarH, setAvatarH] = useState(() => typeof window !== 'undefined' && window.innerHeight < 800 ? 220 : 320);

  const userMessages = messages.filter(m => m.role === "user");
  const filtered     = search.trim()
    ? userMessages.filter(m => m.content.toLowerCase().includes(search.toLowerCase()))
    : userMessages;

  // Drag divider
  const onDragStart = (e) => {
    const startY = e.clientY;
    const startH = avatarH;
    const onMove = (ev) => {
      const newH = Math.min(Math.max(startH + (ev.clientY - startY), 180), 520);
      setAvatarH(newH);
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── AI Avatar section ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 overflow-hidden" style={{ height: `${avatarH}px` }}>
        <div className="text-xs font-semibold text-slate-400 mb-2 pr-6">🤖 AI Avatar</div>
        <AIAvatar />
      </div>

      {/* ── Drag divider ───────────────────────────────────────────────── */}
      <div
        onMouseDown={onDragStart}
        className="flex-shrink-0 flex items-center justify-center h-4 cursor-ns-resize select-none group my-1"
      >
        <div className="w-12 h-1 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* ── Chat History section ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-slate-700/40 pt-2">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-300">💬 Chat History</span>
          {messages.length > 0 && (
            <button onClick={clearMessages} className="text-[10px] text-slate-500 hover:text-red-400 transition">
              Clear
            </button>
          )}
        </div>

        {/* Search */}
        <input
          id="history-search"
          type="text"
          placeholder="Search history…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2 flex-shrink-0 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />

        {/* Message list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 min-h-0">
          {filtered.length === 0 ? (
            <p className="text-[11px] text-slate-600 text-center mt-4">
              {messages.length === 0 ? "No messages yet." : "No results."}
            </p>
          ) : (
            filtered.map(m => (
              <div key={m.id} className="rounded-lg bg-slate-800/60 px-2.5 py-2 text-[11px] text-slate-300 hover:bg-slate-700/60 transition cursor-default border border-slate-700/30">
                {m.content.slice(0, 80)}{m.content.length > 80 ? "…" : ""}
              </div>
            ))
          )}
        </div>

        {messages.length > 0 && (
          <div className="flex-shrink-0 mt-1 text-[10px] text-slate-600">
            {messages.length} message{messages.length !== 1 ? "s" : ""} this session
          </div>
        )}
      </div>
    </div>
  );
}
