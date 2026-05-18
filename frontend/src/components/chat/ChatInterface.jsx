// frontend/src/components/chat/ChatInterface.jsx
/**
 * Main chat interface — message list + input + suggestion chips + voice.
 * Auto-redirects to /map when user asks about polling booths or navigation.
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { Mic, MicOff, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { useSocket } from "../../hooks/useSocket";
import { useVoice } from "../../hooks/useVoice";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";

// ── Keywords that trigger auto-redirect to Map ──────────────────────────────
// Matches any message containing booth/polling/matadn related terms
const MAP_PHRASES = [
  // Direct booth phrases — English
  "polling booth", "polling station", "polling center",
  "voting booth",  "voting station",  "voting center",
  "vote location", "vote centre",
  "pooling booth", "pooling station", // common typo
  // Action + booth
  "find booth",    "show booth",      "nearby booth",
  "nearest booth", "closest booth",   "booth near",
  "booth location","booth address",   "booth number",
  "my booth",      "our booth",       "get booth",
  "locate booth",  "search booth",    "booth finder",
  "booths near",   "nearest polling", "nearest voting",
  "find polling",  "show polling",    "find voting",
  "where to vote", "where can i vote","where do i vote",
  "where is poll", "polling place",
  // Map navigation intent
  "show map", "open map", "go to map", "view map",
  "navigate to booth", "directions to booth",
  // Hindi / Hinglish
  "मतदान केंद्र", "मतदान केन्द्र", "matdan kendra",
  "booth kahan",   "booth dikhao",   "booth dikha",
  "mera booth",    "mere booth",     "nearest booth",
  "paas mein booth","booth paas",    "booth dhundho",
  "booth khojo",   "booth batao",
];

// Looser single-word check (only if also contains location intent)
const BOOTH_WORDS = ["booth", "polling", "matadn"];
const LOCATION_WORDS = ["nearest", "nearby", "near", "closest", "where", "find", "show", "locate", "search", "kahan", "paas", "dhundh"];

function isMapQuery(text) {
  const lower = text.toLowerCase();
  // Check exact phrases first
  if (MAP_PHRASES.some(kw => lower.includes(kw.toLowerCase()))) return true;
  // Fallback: booth word + location intent word
  const hasBooth    = BOOTH_WORDS.some(w => lower.includes(w));
  const hasLocation = LOCATION_WORDS.some(w => lower.includes(w));
  return hasBooth && hasLocation;
}


const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function ChatInterface() {
  const { messages, avatarState, setMapRedirect, addMessage } = useChat();
  const { transcript, clearTranscript, speak, isListening, isSpeaking,
          supported, startListening, stopListening } = useVoice();
  const { sendMessage } = useSocket({ speak });
  const navigate = useNavigate();

  const [input,         setInput]         = useState("");
  const [mapToast,      setMapToast]      = useState(false);
  const bottomRef = useRef(null);

  // ── Transcript → input ────────────────────────────────────────────────
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // ── Auto-scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Fetch booths + post as chat message ─────────────────────────────
  const fetchAndShowBooths = useCallback(async () => {
    // Try to get GPS
    let queryStr = "";
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      queryStr = `?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`;
    } catch { /* no GPS — will return curated list */ }

    // Fetch booths
    let booths = [];
    try {
      const res  = await fetch(`${BACKEND}/api/booths${queryStr}`);
      const data = await res.json();
      booths     = data.booths || [];
    } catch { booths = []; }

    if (booths.length === 0) {
      addMessage({
        id:      `booth-${Date.now()}`,
        role:    "assistant",
        content: "📍 Could not fetch nearby polling booths right now. Opening the Map tab where you can use **Scan Nearby** to find them live.",
      });
      return;
    }

    // Format as numbered list
    const list = booths
      .slice(0, 8)
      .map((b, i) => {
        const dist = b.distanceKm != null ? ` — 📏 ${b.distanceKm} km away` : "";
        const area = b.constituency ? ` (${b.constituency})` : "";
        return `${i + 1}. **${b.name}**${area}\n   📍 ${b.address}${dist}`;
      })
      .join("\n\n");

    addMessage({
      id:      `booth-${Date.now()}`,
      role:    "assistant",
      content: `📍 **Nearby Polling Booths**\n\nHere are the nearest polling stations${queryStr ? " near your location" : " in Navi Mumbai / Panvel area"}:\n\n${list}\n\n---\n↗️ Opening **Map tab** for full navigation & directions…`,
    });
  }, [addMessage]);

  // ── Check if message is map-related and redirect ──────────────────────
  const checkAndRedirect = useCallback((text) => {
    if (!isMapQuery(text)) {
      console.log("[MapRedirect] no match for:", text);
      return false;
    }
    console.log("[MapRedirect] ✅ matched! navigating to /map for:", text);
    // Set redirect signal FIRST, then navigate after a tick so context commits
    setMapRedirect({ action: "scan", query: text });
    setMapToast(true);
    // Fetch + show booths in chat immediately
    fetchAndShowBooths();
    setTimeout(() => {
      navigate("/map");
      setTimeout(() => setMapToast(false), 3000);
    }, 80);
    return true;
  }, [navigate, setMapRedirect, fetchAndShowBooths]);


  // ── Auto-send from voice ──────────────────────────────────────────────
  const handleAutoSend = useCallback((text) => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    checkAndRedirect(text.trim());
    setInput("");
    clearTranscript();
  }, [sendMessage, checkAndRedirect, clearTranscript]);

  // ── Mic button ────────────────────────────────────────────────────────
  const handleMicClick = () => {
    if (isListening) stopListening();
    else startListening(handleAutoSend);
  };

  // ── Manual submit ─────────────────────────────────────────────────────
  const onSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    checkAndRedirect(text);
    setInput("");
    clearTranscript();
  };

  const onChipClick = (text) => {
    sendMessage(text);
    checkAndRedirect(text);
  };

  const isStreaming      = avatarState === "speaking" || avatarState === "thinking";
  const lastAssistantIdx = messages.length - 1;

  return (
    <div className="flex h-full flex-col relative">

      {/* Header */}
      <div className="mb-3 text-sm font-semibold text-slate-200">
        🗳️ Election Assistant
      </div>

      {/* Map-redirect toast */}
      {mapToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-blue-600/95 px-4 py-2.5 text-xs text-white shadow-xl backdrop-blur-sm animate-slideDown">
          <MapPin size={13} />
          <span>Redirecting to Map — scanning nearby polling booths…</span>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-500 mt-8">
            <div className="text-3xl mb-2">🗳️</div>
            <p>Ask me anything about Indian elections!</p>
            <p className="text-xs mt-1 text-slate-600">Voter registration · Polling booths · EVM · Rights</p>
            <p className="text-[11px] mt-2 text-blue-500/70">
              💡 Ask <em>"Where is my polling booth?"</em> to open the map
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            isStreaming={isStreaming && m.role === "assistant" && i === lastAssistantIdx}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length === 0 && <SuggestionChips onSelect={onChipClick} />}

      {/* Input + mic */}
      <form className="mt-3 flex gap-2 items-center" onSubmit={onSubmit}>
        {supported && (
          <button
            id="voice-mic"
            type="button"
            onClick={handleMicClick}
            title={isListening ? "Stop listening" : "Speak your question"}
            className={`flex-shrink-0 rounded-xl p-2.5 text-white transition-all duration-300 ${
              isListening ? "bg-red-600 animate-pulse shadow-[0_0_12px_#ef4444aa]"
              : isSpeaking ? "bg-amber-700 hover:bg-amber-600"
              : "bg-purple-700 hover:bg-purple-600"
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        <input
          id="chat-input"
          className={`flex-1 rounded-xl border px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
            isListening ? "border-red-500 bg-red-950/30 focus:border-red-400"
            : "border-slate-600 bg-slate-800/60 focus:border-blue-500"
          }`}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            isListening ? "🎤 Listening… speak now" :
            isSpeaking   ? "🔊 AI is speaking…" :
            "Ask about booths, voter ID, elections…"
          }
        />

        <button
          id="chat-send"
          type="submit"
          disabled={!input.trim()}
          className="flex-shrink-0 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      {isListening && (
        <p className="mt-1.5 text-center text-[10px] text-red-400 animate-pulse">
          🎤 Listening — will auto-send 1s after you stop speaking
        </p>
      )}
    </div>
  );
}
