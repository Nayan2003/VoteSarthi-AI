// frontend/src/hooks/useVoice.js
/**
 * Voice interaction hook.
 *
 * STT → Web Speech API (browser-native)
 * TTS → Browser SpeechSynthesis (with Google Cloud TTS backend fallback)
 *
 * Behaviours:
 *  - startListening(onAutoSend?) → cancels any TTS playing → starts mic
 *  - When speech recognition ends with a transcript → writes to chat input
 *  - After 1 second silence post-speech → auto-calls onAutoSend(transcript)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useChat } from '../context/ChatContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function detectLang(text = '') {
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  return hindiChars > 3 ? 'hi-IN' : 'en-IN';
}

/**
 * Strip everything that sounds unnatural when spoken aloud:
 * emojis, markdown symbols, brackets, URLs, bullet/dash markers.
 */
function cleanForSpeech(raw = '') {
  return raw
    // Remove emojis (Unicode emoji ranges)
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu, '')
    // Remove markdown bold/italic/header/code fences
    .replace(/\*\*|\*|_{1,2}|`{1,3}|#{1,6}\s?/g, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove bullet / numbered list markers
    .replace(/^\s*[\-\*\•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove brackets and their content if they look like markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [text](url) → text
    // Remove remaining parentheses, brackets, curly braces
    .replace(/[()\[\]{}]/g, '')
    // Remove standalone dashes used as separators (--- or --)
    .replace(/\s*-{2,}\s*/g, '. ')
    // Remove | pipe chars (table separators)
    .replace(/\|/g, '')
    // Remove remaining stray punctuation that reads oddly
    .replace(/[_^~<>]/g, '')
    // Remove HTML tags if any slipped through
    .replace(/<[^>]+>/g, '')
    // Collapse multiple spaces/newlines to single space
    .replace(/\s+/g, ' ')
    .trim();
}


export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [supported,   setSupported]   = useState(false);
  const [ttsMode,     setTtsMode]     = useState('browser'); // start with browser TTS

  const recRef       = useRef(null);
  const audioRef     = useRef(null);
  const synthRef     = useRef(window.speechSynthesis);
  const autoSendRef  = useRef(null);   // stores onAutoSend callback
  const autoTimerRef = useRef(null);   // 1-second auto-send timer
  const transcriptRef = useRef('');    // mirror of transcript state for callbacks

  const { setAvatarState } = useChat();

  // ── Keep transcriptRef in sync ─────────────────────────────────────────────
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // ── Initialise Speech Recognition ─────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    setSupported(true);
    const rec           = new SR();
    rec.lang            = 'hi-IN';   // also picks up English
    rec.interimResults  = true;
    rec.continuous      = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      transcriptRef.current = t;

      // Reset auto-send timer on each new result
      clearTimeout(autoTimerRef.current);
      if (e.results[e.results.length - 1].isFinal) {
        autoTimerRef.current = setTimeout(() => {
          const text = transcriptRef.current.trim();
          if (text && autoSendRef.current) {
            autoSendRef.current(text);
          }
        }, 1000);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setAvatarState('thinking');
      // If no final result triggered auto-send yet, start the 1s timer now
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = setTimeout(() => {
        const text = transcriptRef.current.trim();
        if (text && autoSendRef.current) {
          autoSendRef.current(text);
        }
      }, 1000);
    };

    rec.onerror = (e) => {
      console.error('[STT]', e.error);
      setIsListening(false);
      setAvatarState('idle');
      clearTimeout(autoTimerRef.current);
    };

    recRef.current = rec;
  }, [setAvatarState]);

  // ── Cancel speech (TTS stop) ───────────────────────────────────────────────
  const cancelSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    synthRef.current?.cancel();
    setIsSpeaking(false);
    setAvatarState('idle');
  }, [setAvatarState]);

  // ── Start listening ────────────────────────────────────────────────────────
  const startListening = useCallback((onAutoSend) => {
    if (!recRef.current || isListening) return;

    // Stop any ongoing TTS first
    cancelSpeech();

    autoSendRef.current = onAutoSend || null;
    clearTimeout(autoTimerRef.current);
    setTranscript('');
    transcriptRef.current = '';
    setIsListening(true);
    setAvatarState('listening');

    try { recRef.current.start(); }
    catch (e) { console.warn('[STT start]', e); setIsListening(false); setAvatarState('idle'); }
  }, [isListening, cancelSpeech, setAvatarState]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── Browser TTS ──────────────────────────────────────────────────────
  const speakBrowser = useCallback((text, onEnd) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const lang  = detectLang(text);
    utter.lang  = lang;
    utter.rate  = 0.88;
    utter.pitch = 1.05;  // slightly higher = more feminine

    const voices = synthRef.current.getVoices();

    // Female voice priority (works on Chrome, Edge, Safari, Windows, macOS)
    const isFemale = (v) => /female|woman|girl|zira|samantha|victoria|moira|karen|tessa|fiona|allison|ava|susan|linda|heather|hazel|eva|amelie|anna|alice|nora|sara|satu|yuna/i.test(v.name);

    const pick = (
      // 1. Explicitly-named female English voices
      voices.find(v => /google uk english female/i.test(v.name))                          ||
      voices.find(v => /microsoft zira/i.test(v.name))                                    ||
      voices.find(v => /microsoft hazel/i.test(v.name))                                   ||
      voices.find(v => v.lang === 'en-US' && isFemale(v))                                 ||
      voices.find(v => v.lang === 'en-GB' && isFemale(v))                                 ||
      voices.find(v => v.lang === lang    && isFemale(v))                                 ||
      // 2. Any English female
      voices.find(v => v.lang.startsWith('en') && isFemale(v))                            ||
      // 3. Google US English (Chrome's default, tends to sound female)
      voices.find(v => /google us english/i.test(v.name))                                 ||
      // 4. Any en-US / lang match
      voices.find(v => v.lang === 'en-US')                                                ||
      voices.find(v => v.lang === lang)                                                   ||
      voices.find(v => v.lang.startsWith('en'))                                           ||
      voices[0]
    );
    utter.voice = pick || null;

    utter.onstart = () => { setIsSpeaking(true);  setAvatarState('speaking'); };
    utter.onend   = () => { setIsSpeaking(false); setAvatarState('idle'); onEnd?.(); };
    utter.onerror = () => { setIsSpeaking(false); setAvatarState('idle'); };

    synthRef.current.speak(utter);
  }, [setAvatarState]);

  // ── Google Cloud TTS (backend) ─────────────────────────────────────────────
  const speakGoogle = useCallback(async (text, onEnd) => {
    try {
      const lang = detectLang(text);
      const res  = await fetch(`${BACKEND}/api/tts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text, language: lang }),
      });
      if (!res.ok || res.headers.get('Content-Type')?.includes('json')) throw new Error('fallback');

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay  = () => { setIsSpeaking(true);  setAvatarState('speaking'); };
      audio.onended = () => { setIsSpeaking(false); setAvatarState('idle'); URL.revokeObjectURL(url); onEnd?.(); };
      audio.onerror = () => { setIsSpeaking(false); setAvatarState('idle'); URL.revokeObjectURL(url); };
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }, [setAvatarState]);

  // ── Unified speak ──────────────────────────────────────────────────────
  const speak = useCallback(async (text, onEnd) => {
    if (!text?.trim()) return;
    // Strip emojis, symbols, markdown — full clean pipeline
    const clean = cleanForSpeech(text);
    if (!clean) return;
    if (ttsMode === 'google') {
      const ok = await speakGoogle(clean, onEnd);
      if (!ok) { setTtsMode('browser'); speakBrowser(clean, onEnd); }
    } else {
      speakBrowser(clean, onEnd);
    }
  }, [ttsMode, speakGoogle, speakBrowser]);

  return {
    isListening, isSpeaking, transcript, supported, ttsMode,
    startListening, stopListening, speak, cancelSpeech,
    clearTranscript: () => {
      setTranscript('');
      transcriptRef.current = '';
      clearTimeout(autoTimerRef.current);
    },
  };
};
