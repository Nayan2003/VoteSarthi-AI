// frontend/src/components/chat/ChatHistoryPanel.jsx
/**
 * Left panel — Chat history sidebar with search.
 * Shows previous messages grouped by session.
 */
import { useState } from "react";
import { useChat } from "../../context/ChatContext";

export default function ChatHistoryPanel() {
  const { messages, clearMessages } = useChat();
  const [search, setSearch] = useState("");

  const userMessages = messages.filter(m => m.role === "user");

  const filtered = search.trim()
    ? userMessages.filter(m =>
        m.content.toLowerCase().includes(search.toLowerCase())
      )
    : userMessages;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-200">💬 Chat History</div>
        {messages.length > 0 && (
          <button
            id="clear-history"
            onClick={clearMessages}
            className="text-xs text-slate-500 hover:text-red-400 transition"
          >
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
        className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
      />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 text-center mt-6">
            {messages.length === 0 ? "No messages yet." : "No results found."}
          </p>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="rounded-lg bg-slate-800/60 p-2 text-xs text-slate-300 hover:bg-slate-700/60 cursor-default transition"
            >
              {m.content.slice(0, 90)}{m.content.length > 90 ? "…" : ""}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {messages.length > 0 && (
        <div className="mt-2 text-[10px] text-slate-600">
          {messages.length} message{messages.length !== 1 ? "s" : ""} this session
        </div>
      )}
    </div>
  );
}
