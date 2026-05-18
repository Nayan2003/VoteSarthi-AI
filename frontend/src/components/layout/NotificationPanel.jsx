// frontend/src/components/layout/NotificationPanel.jsx
/**
 * Left panel — Election notifications canvas + Google Places location search.
 * Location search result is shared via ChatContext → MapView pans to it.
 */
import { useEffect, useRef, useState } from "react";
import { X, Search, MapPin, Bell } from "lucide-react";
import { useChat } from "../../context/ChatContext";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const ELECTION_NOTIFICATIONS = [
  { id: 1, type: "result",   emoji: "🗳️", title: "Lok Sabha 2024 Results", body: "Results declared June 4, 2024. BJP-led NDA wins majority.", time: "2024" },
  { id: 2, type: "upcoming", emoji: "📋", title: "Maharashtra Assembly Poll", body: "Maharashtra Vidhan Sabha election 2024 results declared.", time: "Nov 2024" },
  { id: 3, type: "register", emoji: "📝", title: "Voter Registration Open", body: "Register/update voter ID at voters.eci.gov.in before cutoff.", time: "Ongoing" },
  { id: 4, type: "info",     emoji: "📱", title: "Voter Helpline App", body: "Check voter ID status, find booth via Voter Helpline 1950.", time: "Active" },
  { id: 5, type: "alert",    emoji: "🔔", title: "EVM Results Portal Live", body: "Track constituency-wise results at results.eci.gov.in.", time: "Live" },
  { id: 6, type: "register", emoji: "🪪", title: "New Voter? Apply Now", body: "Form 6 for first-time voters available on NVSP portal.", time: "Open" },
  { id: 7, type: "info",     emoji: "🗺️", title: "Booth Slip Download", body: "Download your polling slip from the CEO Maharashtra website.", time: "Active" },
];

const TYPE_COLORS = {
  result:   "border-l-blue-500   bg-blue-950/20",
  upcoming: "border-l-purple-500 bg-purple-950/20",
  register: "border-l-emerald-500 bg-emerald-950/20",
  info:     "border-l-amber-500  bg-amber-950/20",
  alert:    "border-l-red-500    bg-red-950/20",
};

export default function NotificationPanel() {
  const { setSearchLocation } = useChat();
  const inputRef     = useRef(null);
  const autocomplete = useRef(null);

  const [query,      setQuery]      = useState("");
  const [dismissed,  setDismissed]  = useState(new Set());
  const [mapsLoaded, setMapsLoaded] = useState(!!window.google?.maps?.places);

  // ── Load Maps / Places if not already loaded ───────────────────────────
  useEffect(() => {
    if (window.google?.maps?.places) { setMapsLoaded(true); return; }
    const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existing) {
      existing.addEventListener("load", () => setMapsLoaded(true));
      return;
    }
    const s   = document.createElement("script");
    s.src     = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    s.async   = true;
    s.onload  = () => setMapsLoaded(true);
    document.head.appendChild(s);
  }, []);

  // ── Init Places Autocomplete on input ──────────────────────────────────
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocomplete.current) return;
    autocomplete.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types:               ["geocode", "establishment"],
      componentRestrictions: { country: "in" },
      fields:              ["geometry", "name", "formatted_address"],
    });
    autocomplete.current.addListener("place_changed", () => {
      const place = autocomplete.current.getPlace();
      if (place?.geometry?.location) {
        const loc = {
          lat:   place.geometry.location.lat(),
          lng:   place.geometry.location.lng(),
          label: place.name || place.formatted_address || "",
        };
        setSearchLocation(loc);
        setQuery(place.formatted_address || place.name || "");
      }
    });
  }, [mapsLoaded, setSearchLocation]);

  const dismiss = (id) => setDismissed(s => new Set([...s, id]));
  const visible = ELECTION_NOTIFICATIONS.filter(n => !dismissed.has(n.id));

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0 pr-6">
        <Bell size={14} className="text-amber-400" />
        <span className="text-sm font-semibold text-slate-200">Election Updates</span>
        <span className="ml-auto text-[10px] text-slate-500">{visible.length} active</span>
      </div>

      {/* ── Location search ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          id="location-search"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search location for map…"
          className="w-full rounded-xl border border-slate-600 bg-slate-800/70 pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setSearchLocation(null); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* ── Notifications list ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 min-h-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
            <Bell size={28} className="opacity-30" />
            <p className="text-xs">All notifications cleared</p>
          </div>
        ) : (
          visible.map(n => (
            <div
              key={n.id}
              className={`relative rounded-xl border-l-4 px-3 py-2.5 text-xs ${TYPE_COLORS[n.type] || "border-l-slate-500 bg-slate-800/30"} border border-slate-700/30`}
            >
              <button
                onClick={() => dismiss(n.id)}
                className="absolute top-2 right-2 text-slate-600 hover:text-slate-300 transition"
              >
                <X size={10} />
              </button>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{n.emoji}</span>
                <span className="font-semibold text-white text-[11px]">{n.title}</span>
              </div>
              <p className="text-slate-400 leading-relaxed pr-4">{n.body}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                <MapPin size={9} /> {n.time}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Restore dismissed */}
      {dismissed.size > 0 && (
        <button
          onClick={() => setDismissed(new Set())}
          className="flex-shrink-0 text-[10px] text-slate-600 hover:text-slate-400 transition text-center"
        >
          Restore {dismissed.size} cleared notification{dismissed.size > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
