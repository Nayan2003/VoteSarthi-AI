// frontend/src/components/map/MapView.jsx
/**
 * Polling Booth Finder — in-app navigation with Drive/Walk/Bike/Transit modes.
 * Re-center button, draggable map resize, inline location search bar.
 * Uses Google Maps DirectionsService. No external redirects.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";

const BACKEND  = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const TRAVEL_MODES = [
  { key: "DRIVING",   label: "Drive",   icon: "🚗", color: "#3b82f6" },
  { key: "WALKING",   label: "Walk",    icon: "🚶", color: "#10b981" },
  { key: "BICYCLING", label: "Bike",    icon: "🚲", color: "#f59e0b" },
  { key: "TRANSIT",   label: "Transit", icon: "🚌", color: "#8b5cf6" },
];

export default function MapView() {
  // DOM refs
  const mapRef      = useRef(null);
  const mapObj      = useRef(null);
  const markersRef  = useRef([]);
  const dirRenderer = useRef(null);
  const dragRef     = useRef(null);
  const searchRef   = useRef(null);
  const acRef       = useRef(null);
  const circleRef   = useRef(null); // Ref for the 5km radius circle

  // UI state
  const [booths,    setBooths]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [userLoc,   setUserLoc]   = useState(null);
  const [locError,  setLocError]  = useState("");
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps);
  const [selected,  setSelected]  = useState(null);
  const [mapHeight, setMapHeight] = useState(260);
  const [expanded,  setExpanded]  = useState(false);
  const [searchQ,   setSearchQ]   = useState("");

  // Nav state
  const [navMode,    setNavMode]    = useState(false);
  const [navSteps,   setNavSteps]   = useState([]);
  const [navSummary, setNavSummary] = useState(null);
  const [navLoading, setNavLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerBooth,setPickerBooth]= useState(null);

  // Shared location from left panel + map redirect from chat
  const { searchLocation, mapRedirect, setMapRedirect } = useChat();

  // Toast for map redirect
  const [redirectToast, setRedirectToast] = useState("");

  // ── 1. Load Google Maps script ─────────────────────────────────────────
  useEffect(() => {
    if (!MAPS_KEY || window.google?.maps) { setMapsReady(!!window.google?.maps); return; }
    const s   = document.createElement("script");
    s.src     = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places,directions`;
    s.async   = true;
    s.onload  = () => setMapsReady(true);
    s.onerror = () => console.error("[Maps] script failed");
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  // ── 2. fetchBooths — must be declared BEFORE any useEffect that uses it ──
  const fetchBooths = useCallback(async (loc) => {
    setLoading(true);
    setLocError("");
    setNavMode(false);
    setNavSteps([]);
    setNavSummary(null);
    setShowPicker(false);
    try {
      const q   = loc ? `?lat=${loc.lat}&lng=${loc.lng}` : "";
      const res = await fetch(`${BACKEND}/api/booths${q}`);
      const d   = await res.json();
      setBooths(d.booths || []);
    } catch {
      setBooths([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 3. Init Places Autocomplete on search input ────────────────────────
  useEffect(() => {
    if (!mapsReady || !searchRef.current || acRef.current) return;
    acRef.current = new window.google.maps.places.Autocomplete(searchRef.current, {
      types: ["geocode", "establishment"],
      componentRestrictions: { country: "in" },
      fields: ["geometry", "name", "formatted_address"],
    });
    acRef.current.addListener("place_changed", () => {
      const place = acRef.current.getPlace();
      if (!place?.geometry?.location) return;
      const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      setSearchQ(place.formatted_address || place.name || "");
      if (mapObj.current) {
        mapObj.current.setCenter(loc);
        mapObj.current.setZoom(14);
      }
      setUserLoc(loc); // Move the 5km zone circle to searched location
      fetchBooths(loc);
    });
  }, [mapsReady, fetchBooths]);

  // ── 4. GPS request ────────────────────────────────────────────────────
  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported.");
      fetchBooths(null);
      return;
    }
    setLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        fetchBooths(loc);
      },
      () => {
        setLocError("Location denied — showing Maharashtra booths.");
        fetchBooths(null);
      },
      { timeout: 8000 }
    );
  }, [fetchBooths]);

  useEffect(() => { requestGPS(); }, [requestGPS]);

  // ── 5. Left-panel location search → pan map ────────────────────────────
  useEffect(() => {
    if (!searchLocation || !mapObj.current) return;
    const loc = { lat: searchLocation.lat, lng: searchLocation.lng };
    mapObj.current.setCenter(loc);
    mapObj.current.setZoom(14);
    setUserLoc(loc); // Move the 5km zone circle to searched location
    fetchBooths(loc);
  }, [searchLocation, fetchBooths]);

  // ── 5b. Chat redirect → auto-trigger GPS scan ─────────────────────────
  useEffect(() => {
    if (!mapRedirect) return;
    setMapRedirect(null);
    const q = mapRedirect.query || "";
    setRedirectToast(q ? `"${q.slice(0, 35)}" — scanning nearby booths` : "Scanning nearby polling booths…");
    setTimeout(() => setRedirectToast(""), 3500);
    requestGPS();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRedirect]);

  // ── 6. Re-center ──────────────────────────────────────────────────────

  const reCenter = useCallback(() => {
    if (!mapObj.current || !userLoc) return;
    mapObj.current.setCenter({ lat: userLoc.lat, lng: userLoc.lng });
    mapObj.current.setZoom(14);
  }, [userLoc]);

  // ── 7. Init map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    const center = userLoc || { lat: 18.9894, lng: 73.1175 };
    if (!mapObj.current) {
      mapObj.current = new window.google.maps.Map(mapRef.current, {
        center, zoom: userLoc ? 13 : 11,
        streetViewControl: false,
        zoomControl: false,
        panControl: false,
        rotateControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: window.google.maps.ControlPosition.TOP_LEFT,
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        styles: [
          { elementType: "geometry",           stylers: [{ color: "#1d2c3d" }] },
          { elementType: "labels.text.fill",   stylers: [{ color: "#8ec3b9" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
          { featureType: "road", elementType: "geometry",         stylers: [{ color: "#304a57" }] },
          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
          { featureType: "water", elementType: "geometry",        stylers: [{ color: "#0e1626" }] },
        ],
      });
    } else {
      mapObj.current.setCenter(center);
      if (userLoc) mapObj.current.setZoom(13);
    }
    if (userLoc) {
      new window.google.maps.Marker({
        map: mapObj.current, position: userLoc, title: "You are here",
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#3b82f6", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
        zIndex: 999,
      });

      // Draw 5km radius circle
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
      circleRef.current = new window.google.maps.Circle({
        strokeColor: "#3b82f6",
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        map: mapObj.current,
        center: userLoc,
        radius: 5000, // 5km
      });
    }
  }, [mapsReady, userLoc]);

  // Notify map on size change
  useEffect(() => {
    if (mapObj.current && window.google?.maps)
      window.google.maps.event.trigger(mapObj.current, "resize");
  }, [mapHeight, expanded]);

  // ── 8. Booth markers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapObj.current || booths.length === 0) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    booths.forEach((booth, i) => {
      const marker = new window.google.maps.Marker({
        map: mapObj.current, position: { lat: booth.lat, lng: booth.lng }, title: booth.name,
        label: { text: String(i + 1), color: "#000", fontSize: "11px", fontWeight: "bold" },
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 16, fillColor: "#f59e0b", fillOpacity: 0.95, strokeColor: "#92400e", strokeWeight: 2 },
      });
      marker.addListener("click", () => {
        setSelected(booth);
        mapObj.current.setCenter({ lat: booth.lat, lng: booth.lng });
        mapObj.current.setZoom(15);
      });
      markersRef.current.push(marker);
    });
  }, [mapsReady, booths]);

  // ── 9. Drag to resize ────────────────────────────────────────────────
  useEffect(() => {
    const handle = dragRef.current;
    if (!handle) return;
    let startY = 0, startH = 0;
    const onMove = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      setMapHeight(Math.min(Math.max(startH + (y - startY), 140), window.innerHeight * 0.75));
    };
    const onUp   = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onUp); };
    const onDown = (e) => { startY = e.touches ? e.touches[0].clientY : e.clientY; startH = mapHeight; document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp); document.addEventListener("touchmove", onMove, { passive: true }); document.addEventListener("touchend", onUp); };
    handle.addEventListener("mousedown",  onDown);
    handle.addEventListener("touchstart", onDown, { passive: true });
    return () => { handle.removeEventListener("mousedown", onDown); handle.removeEventListener("touchstart", onDown); };
  }, [mapHeight]);

  // ── 10. Directions ───────────────────────────────────────────────────
  const showDirections = useCallback((booth, mode = "DRIVING", startNav = false) => {
    if (!mapsReady || !mapObj.current || !userLoc) return;
    setNavLoading(true); setNavMode(false); setNavSteps([]); setNavSummary(null); setShowPicker(false);
    if (dirRenderer.current) { dirRenderer.current.setMap(null); dirRenderer.current = null; }
    const cfg = TRAVEL_MODES.find(m => m.key === mode) || TRAVEL_MODES[0];
    const ren = new window.google.maps.DirectionsRenderer({
      map: mapObj.current, suppressMarkers: false,
      polylineOptions: { strokeColor: cfg.color, strokeWeight: 5, strokeOpacity: 0.85 },
    });
    dirRenderer.current = ren;
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      { origin: { lat: userLoc.lat, lng: userLoc.lng }, destination: { lat: booth.lat, lng: booth.lng }, travelMode: window.google.maps.TravelMode[mode] },
      (result, status) => {
        setNavLoading(false);
        if (status === "OK") {
          ren.setDirections(result);
          const leg = result.routes[0].legs[0];
          setNavSummary({ distance: leg.distance.text, duration: leg.duration.text, mode, booth: booth.name });
          const parser = new DOMParser();
          setNavSteps(leg.steps.map((s, idx) => ({
            idx,
            instruction: parser.parseFromString(s.html_instructions, "text/html").body.textContent || "",
            distance: s.distance?.text || "",
            duration: s.duration?.text || "",
            maneuver: s.maneuver || "",
          })));
          setNavMode(true);
          if (startNav) setMapHeight(h => Math.max(h, 340));
        } else {
          alert("Directions not found: " + status);
        }
      }
    );
  }, [mapsReady, userLoc]);

  const clearRoute = () => {
    if (dirRenderer.current) { dirRenderer.current.setMap(null); dirRenderer.current = null; }
    setNavMode(false); setNavSteps([]); setNavSummary(null); setShowPicker(false);
    if (mapObj.current && userLoc) { mapObj.current.setCenter({ lat: userLoc.lat, lng: userLoc.lng }); mapObj.current.setZoom(13); }
  };

  const maneuverIcon = (m) => {
    if (!m) return "➡️";
    if (m.includes("left")) return "↰";
    if (m.includes("right")) return "↱";
    if (m.includes("uturn")) return "↩️";
    if (m.includes("roundabout")) return "🔄";
    if (m.includes("merge")) return "⤵️";
    if (m.includes("ramp")) return "↗️";
    return "➡️";
  };

  const mapH = expanded ? Math.floor(window.innerHeight * 0.6) : mapHeight;

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      <style>{`
        /* Map Type Control (Map/Satellite) */
        .gm-style .gm-style-mtc > div {
          background-color: #1e293b !important;
          color: #cbd5e1 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
          font-family: inherit !important;
          font-weight: 500 !important;
          border: 1px solid #334155 !important;
          font-size: 11px !important;
        }
        .gm-style .gm-style-mtc > div:hover {
          background-color: #334155 !important;
          color: #f8fafc !important;
        }
        /* Fullscreen Control */
        .gm-control-active.gm-fullscreen-control {
          background-color: #1e293b !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
          border: 1px solid #334155 !important;
        }
        .gm-control-active.gm-fullscreen-control:hover {
          background-color: #334155 !important;
        }
        /* Invert icons for dark mode */
        .gm-control-active.gm-fullscreen-control img {
          filter: invert(1) opacity(0.8) !important;
        }
      `}</style>

      {/* Chat-redirect toast */}
      {redirectToast && (
        <div className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-blue-600/90 border border-blue-500/40 px-4 py-2.5 text-xs text-white shadow-md">
          <span>📍</span>
          <span className="flex-1 truncate">{redirectToast}</span>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent flex-shrink-0" />
        </div>
      )}

      {/* Header row: title | search bar | controls */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Title */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-200 whitespace-nowrap">
            {navMode ? "🗺️ Nav" : "📍 Booths"}
          </span>
          {navMode && (
            <button onClick={clearRoute} className="text-[10px] text-red-400 hover:text-red-300 border border-red-800/40 rounded-lg px-1.5 py-0.5 transition">✕</button>
          )}
        </div>

        {/* Location search bar */}
        <div className="flex-1 relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            id="map-location-search"
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search any location…"
            className="w-full rounded-xl border border-slate-600 bg-slate-800/80 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
          />
          {searchQ && (
            <button
              onClick={() => { setSearchQ(""); if (searchRef.current) searchRef.current.value = ""; }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition text-xs"
            >✕</button>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => { setExpanded(e => !e); setMapHeight(expanded ? 260 : Math.floor(window.innerHeight * 0.6)); }}
            className="rounded-xl bg-slate-700 px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-600 transition"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "⊖" : "⊕"}
          </button>
          <button
            onClick={requestGPS}
            disabled={loading}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
          >
            {loading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "📡"}
            {loading ? "…" : "Scan Nearby"}
          </button>
        </div>
      </div>

      {/* Status */}
      {userLoc && !locError && <div className="flex-shrink-0 text-[11px] text-emerald-400">✅ Your location detected</div>}
      {locError && <div className="flex-shrink-0 text-[11px] text-amber-400">{locError}</div>}

      {/* Nav summary + mode switcher */}
      {navSummary && (
        <div className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-blue-950/50 border border-blue-700/40 px-3 py-2 text-xs">
          <span className="text-base">{TRAVEL_MODES.find(m => m.key === navSummary.mode)?.icon}</span>
          <span className="font-bold text-white">{navSummary.duration}</span>
          <span className="text-slate-400">({navSummary.distance})</span>
          <div className="flex gap-1 ml-auto">
            {TRAVEL_MODES.map(m => (
              <button key={m.key} onClick={() => showDirections(selected, m.key, true)} title={m.label}
                className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold transition border ${navSummary.mode === m.key ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-blue-400"}`}>
                {m.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative flex-shrink-0">
        <div ref={mapRef} className="rounded-xl bg-slate-800 overflow-hidden" style={{ height: `${mapH}px` }} />
        {userLoc && (
          <button onClick={reCenter} title="Re-center"
            className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-900/90 border border-slate-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 hover:border-blue-400 transition">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>
        )}
      </div>

      {/* Drag handle */}
      <div ref={dragRef} className="flex-shrink-0 flex items-center justify-center h-5 cursor-ns-resize select-none group">
        <div className="w-16 h-1 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* Mode picker */}
      {showPicker && pickerBooth && (
        <div className="flex-shrink-0 rounded-2xl border border-slate-600 bg-slate-900/95 p-4">
          <div className="text-xs font-semibold text-slate-200 mb-3">
            🗺️ Choose mode to <span className="text-amber-400">{pickerBooth.name}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TRAVEL_MODES.map(m => (
              <button key={m.key} onClick={() => showDirections(pickerBooth, m.key, true)}
                className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 py-3 hover:border-blue-500 hover:bg-blue-950/40 transition">
                <span className="text-2xl">{m.icon}</span>
                <span className="text-[10px] text-slate-300">{m.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowPicker(false)} className="mt-2 w-full text-[10px] text-slate-500 hover:text-slate-300 transition">Cancel</button>
        </div>
      )}

      {/* Turn-by-turn steps */}
      {navMode && navSteps.length > 0 && (
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 min-h-0">
          <div className="text-[11px] text-slate-400 mb-2">📋 {navSteps.length} steps</div>
          <div className="space-y-1">
            {navSteps.map(step => (
              <div key={step.idx} className="flex items-start gap-3 rounded-xl bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                <span className="flex-shrink-0 text-base w-5 text-center">{maneuverIcon(step.maneuver)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white leading-relaxed">{step.instruction}</div>
                  {step.distance && <div className="text-[10px] text-slate-500 mt-0.5">{step.distance} · {step.duration}</div>}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-xl bg-emerald-900/30 border border-emerald-700/40 px-3 py-2.5">
              <span>🏁</span>
              <span className="text-xs text-emerald-300 font-medium">You have arrived at the polling booth</span>
            </div>
          </div>
        </div>
      )}

      {/* Booth list */}
      {!navMode && !showPicker && (
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <p className="text-xs text-slate-500">Scanning nearby polling booths…</p>
            </div>
          ) : booths.length === 0 ? (
            <p className="text-center text-xs text-slate-600 py-6">No booths found. Click "Scan Nearby".</p>
          ) : (
            booths.map((b, i) => {
              const isActive = selected?.id === b.id;
              return (
                <div key={b.id}
                  onClick={() => { setSelected(isActive ? null : b); if (mapObj.current) { mapObj.current.setCenter({ lat: b.lat, lng: b.lng }); mapObj.current.setZoom(15); } }}
                  className={`rounded-xl px-4 py-3 text-xs border cursor-pointer transition-all ${isActive ? "border-amber-500/60 bg-amber-950/30" : "border-slate-700/50 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800"}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{b.name}</div>
                      <div className="text-slate-400 mt-0.5 line-clamp-1">{b.address}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {b.constituency && <span className="text-[10px] text-purple-400">🗳️ {b.constituency}</span>}
                        {b.distanceKm != null && <span className="text-[10px] text-blue-400 font-medium">📏 {b.distanceKm} km</span>}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-amber-700/30" onClick={e => e.stopPropagation()}>
                      <button onClick={() => showDirections(b, "DRIVING", false)} disabled={!userLoc || navLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-600/60 bg-blue-950/40 py-2 text-[11px] font-semibold text-blue-300 hover:bg-blue-700/50 hover:text-white transition disabled:opacity-40">
                        {navLoading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
                          : <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12l19-9-9 19-2-8-8-2z"/></svg>}
                        {navLoading ? "Loading…" : "Directions"}
                      </button>
                      <button onClick={() => { setPickerBooth(b); setShowPicker(true); }} disabled={!userLoc || navLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-[11px] font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-40">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Start Navigation
                      </button>
                    </div>
                  )}
                  {isActive && !userLoc && <p className="mt-2 text-[10px] text-amber-400">⚠️ Allow location access for directions</p>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
