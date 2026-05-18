// frontend/src/components/avatar/AIAvatar.jsx
/**
 * Animated girl AI avatar with 4 states: idle | listening | thinking | speaking
 * Toggle Pause/Play button below — pause stops TTS, play re-reads last AI message.
 */
import { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useVoice } from "../../hooks/useVoice";

const STATE_CONFIG = {
  idle:      { label: "Idle — Ready",  color: "#38bdf8", glow: "#38bdf833" },
  listening: { label: "Listening…",   color: "#22c55e", glow: "#22c55e33" },
  thinking:  { label: "Thinking…",    color: "#eab308", glow: "#eab30833" },
  speaking:  { label: "Speaking…",    color: "#a855f7", glow: "#a855f733" },
};

const MOUTH = {
  idle:      "M 112 158 Q 128 165 144 158",
  listening: "M 112 156 Q 128 162 144 156",
  thinking:  "M 116 160 Q 128 157 140 160",
  speaking:  "M 110 157 Q 128 170 146 157",
};

export default function AIAvatar() {
  const { avatarState, messages } = useChat();
  const { isSpeaking, cancelSpeech, speak } = useVoice();
  const cfg = STATE_CONFIG[avatarState] || STATE_CONFIG.idle;

  // ── Last AI message (for play) ───────────────────────────────────────────
  const lastAIMessage = [...messages].reverse().find(m => m.role === "assistant")?.content || "";

  // ── Toggle handler ───────────────────────────────────────────────────────
  const handleToggle = () => {
    if (isSpeaking) {
      // PAUSE — stop TTS
      cancelSpeech();
    } else {
      // PLAY — re-read last AI message
      if (lastAIMessage) speak(lastAIMessage);
    }
  };

  // ── Blink ────────────────────────────────────────────────────────────────
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const schedule = () => {
      const delay = 2500 + Math.random() * 3000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 180);
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // ── Lip sync ─────────────────────────────────────────────────────────────
  const [mouthOpen, setMouthOpen] = useState(false);
  useEffect(() => {
    if (avatarState !== "speaking") { setMouthOpen(false); return; }
    const iv = setInterval(() => setMouthOpen(p => !p), 160);
    return () => clearInterval(iv);
  }, [avatarState]);

  const currentMouth = avatarState === "speaking" && mouthOpen
    ? "M 108 157 Q 128 175 148 157 Q 128 162 108 157"
    : MOUTH[avatarState] || MOUTH.idle;

  // ── Float ────────────────────────────────────────────────────────────────
  const [floatY, setFloatY] = useState(0);
  const tickRef = useRef(0);
  useEffect(() => {
    let raf;
    const loop = () => {
      tickRef.current += 0.03;
      setFloatY(Math.sin(tickRef.current) * 5);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const eyeScaleY = blink ? 0.08 : 1;

  // Button appearance
  const hasMessage = lastAIMessage.length > 0;
  const btnColor   = isSpeaking ? "#ef4444" : "#38bdf8";
  const btnBg      = isSpeaking ? "#ef444420" : "#38bdf820";
  const btnBorder  = isSpeaking ? "#ef4444"   : "#38bdf8";
  const btnGlow    = isSpeaking ? "0 0 20px #ef444455" : "0 0 16px #38bdf855";

  return (
    <div className="flex h-full flex-col items-center select-none">

      {/* Title */}
      <div className="mb-2 w-full text-sm font-semibold text-slate-200">AI Avatar</div>

      {/* State badge */}
      <div
        className="mb-3 rounded-full px-4 py-1 text-xs font-medium transition-all duration-500"
        style={{ background: cfg.glow, color: cfg.color, border: `1px solid ${cfg.color}55` }}
      >
        {cfg.label}
      </div>

      {/* Avatar SVG with float */}
      <div
        className="relative transition-all duration-300"
        style={{ transform: `translateY(${floatY}px)` }}
      >

        <svg viewBox="60 40 136 200" width="210" height="210" xmlns="http://www.w3.org/2000/svg">
          {/* Neck */}
          <rect x="116" y="185" width="24" height="22" rx="8" fill="#FDDBB4" />
          {/* Shoulders */}
          <ellipse cx="128" cy="225" rx="46" ry="18" fill="#E85D7A" />
          <rect x="82" y="215" width="92" height="30" rx="12" fill="#E85D7A" />
          {/* Hair back */}
          <ellipse cx="128" cy="108" rx="52" ry="56" fill="#3B2314" />
          <ellipse cx="83"  cy="148" rx="16" ry="42" fill="#3B2314" />
          <ellipse cx="173" cy="148" rx="16" ry="42" fill="#3B2314" />
          {/* Face */}
          <ellipse cx="128" cy="118" rx="44" ry="48" fill="#FDDBB4" />
          {/* Hair front */}
          <ellipse cx="128" cy="76" rx="46" ry="28" fill="#3B2314" />
          <path d="M 90 80 Q 88 100 84 110"   stroke="#3B2314" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 104 68 Q 100 88 98 102"  stroke="#3B2314" strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M 160 80 Q 164 100 168 110" stroke="#3B2314" strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* Left eye */}
          <g transform={`translate(108,118) scale(1,${eyeScaleY})`} style={{ transformOrigin: "0 0" }}>
            <ellipse cx="0" cy="0" rx="10" ry="11" fill="white" />
            <ellipse cx="0" cy="1" rx="7"  ry="8"  fill="#6B3A2A" />
            <ellipse cx="0" cy="1" rx="4"  ry="4.5" fill="#1a0a00" />
            <ellipse cx="3" cy="-3" rx="2.5" ry="2.5" fill="white" opacity="0.9" />
          </g>
          {/* Right eye */}
          <g transform={`translate(148,118) scale(1,${eyeScaleY})`} style={{ transformOrigin: "0 0" }}>
            <ellipse cx="0" cy="0" rx="10" ry="11" fill="white" />
            <ellipse cx="0" cy="1" rx="7"  ry="8"  fill="#6B3A2A" />
            <ellipse cx="0" cy="1" rx="4"  ry="4.5" fill="#1a0a00" />
            <ellipse cx="3" cy="-3" rx="2.5" ry="2.5" fill="white" opacity="0.9" />
          </g>
          {/* Eyelashes */}
          <path d="M 99 110 Q 104 106 108 108"  stroke="#3B2314" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 156 108 Q 152 106 148 108" stroke="#3B2314" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Eyebrows */}
          <path d={avatarState === "thinking" ? "M 98 104 Q 108 100 118 104" : "M 98 105 Q 108 102 118 105"}
            stroke="#3B2314" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d={avatarState === "thinking" ? "M 138 104 Q 148 100 158 104" : "M 138 105 Q 148 102 158 105"}
            stroke="#3B2314" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Nose */}
          <ellipse cx="128" cy="140" rx="4" ry="3" fill="#f0b88a" />
          {/* Cheeks */}
          <ellipse cx="100" cy="148" rx="12" ry="7" fill="#ffb3c1" opacity="0.45" />
          <ellipse cx="156" cy="148" rx="12" ry="7" fill="#ffb3c1" opacity="0.45" />
          {/* Mouth */}
          <path d={currentMouth} stroke="#c0605a" strokeWidth="2.5"
            fill={avatarState === "speaking" && mouthOpen ? "#c0605a" : "none"} strokeLinecap="round" />
          {avatarState === "speaking" && mouthOpen && (
            <path d="M 114 159 Q 128 165 142 159 L 142 163 Q 128 170 114 163 Z" fill="white" />
          )}
          {/* Earrings */}
          <circle cx="84"  cy="130" r="4" fill="#ffd700" />
          <circle cx="172" cy="130" r="4" fill="#ffd700" />
          {/* Collar */}
          <path d="M 106 215 L 118 200 L 128 207 L 138 200 L 150 215" stroke="#c0405a" strokeWidth="2" fill="none" />

          {/* Listening / speaking ring */}
          {(avatarState === "listening" || avatarState === "speaking") && (
            <ellipse cx="128" cy="118" rx="50" ry="54"
              fill="none" stroke={cfg.color} strokeWidth="2" opacity="0.5" strokeDasharray="8 6">
              <animateTransform attributeName="transform" type="rotate"
                from="0 128 118" to="360 128 118" dur="4s" repeatCount="indefinite" />
            </ellipse>
          )}
          {/* Thinking dots */}
          {avatarState === "thinking" && (
            <g>
              {[0, 1, 2].map(i => (
                <circle key={i} cx={160 + i * 10} cy="95" r="3.5" fill={cfg.color}>
                  <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="cy" values="95;90;95" dur="1.2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          )}
          {/* Sound waves */}
          {avatarState === "speaking" && (
            <g>
              {[1, 2, 3].map(i => (
                <ellipse key={i} cx="128" cy="118" rx={50 + i * 12} ry={54 + i * 12}
                  fill="none" stroke={cfg.color} strokeWidth="1.5" opacity={0.4 / i}>
                  <animate attributeName="rx" values={`${50+i*12};${62+i*12};${50+i*12}`} dur="1.5s" begin={`${i*0.25}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values={`${0.4/i};0;${0.4/i}`} dur="1.5s" begin={`${i*0.25}s`} repeatCount="indefinite" />
                </ellipse>
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* ── Pause / Play toggle button — BELOW avatar ── */}
      <div className="mt-5 flex flex-col items-center gap-1.5">
        <button
          id="avatar-play-pause"
          onClick={handleToggle}
          disabled={!isSpeaking && !hasMessage}
          title={isSpeaking ? "Pause speaking" : "Play last response"}
          className="flex items-center gap-2.5 rounded-full px-6 py-2.5 border-2 text-sm font-bold tracking-wide transition-all duration-400 active:scale-95"
          style={{
            background:   btnBg,
            borderColor:  btnBorder,
            color:        btnColor,
            boxShadow:    (isSpeaking || hasMessage) ? btnGlow : "none",
            opacity:      (!isSpeaking && !hasMessage) ? 0.3 : 1,
            pointerEvents: (!isSpeaking && !hasMessage) ? "none" : "auto",
          }}
        >
          {isSpeaking ? (
            /* Pause icon */
            <>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <rect x="6"  y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
              Pause
            </>
          ) : (
            /* Play icon */
            <>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
              Play
            </>
          )}
        </button>

        <span className="text-[9px] font-medium transition-all duration-300"
          style={{ color: isSpeaking ? "#a855f7" : "#475569" }}>
          {isSpeaking
            ? "🔊 Speaking — tap to pause"
            : hasMessage
            ? "▶ Tap to replay last response"
            : "No response yet"}
        </span>
      </div>

    </div>
  );
}
