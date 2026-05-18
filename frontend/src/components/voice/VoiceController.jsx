// frontend/src/components/voice/VoiceController.jsx
/**
 * Voice controller component.
 * STT via Web Speech API, TTS via Google Cloud TTS + browser fallback.
 * Renamed from VoiceControls per doc spec.
 */
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useVoice } from "../../hooks/useVoice";
import { useSocket } from "../../hooks/useSocket";

export default function VoiceController() {
  const {
    isListening,
    isSpeaking,
    transcript,
    supported,
    startListening,
    stopListening,
    cancelSpeech,
    clearTranscript
  } = useVoice();
  const { sendMessage } = useSocket();

  if (!supported) {
    return (
      <div className="mt-2 text-xs text-slate-500">
        🎤 Voice not supported in this browser.
      </div>
    );
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      // transcript will populate chat input via ChatInterface
    } else {
      clearTranscript();
      startListening();
    }
  };

  const handleSendVoice = () => {
    if (transcript.trim()) {
      sendMessage(transcript.trim());
      clearTranscript();
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      {/* Mic button */}
      <button
        id="voice-mic"
        onClick={handleMicClick}
        title={isListening ? "Stop listening" : "Start voice input"}
        className={`rounded-xl p-2.5 text-white transition ${
          isListening ? "bg-red-600 animate-pulse" : "bg-purple-700 hover:bg-purple-600"
        }`}
      >
        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
      </button>

      {/* Transcript preview + send */}
      {transcript && (
        <>
          <div className="flex-1 rounded-lg bg-slate-800/70 px-3 py-1.5 text-xs text-slate-200 truncate">
            {transcript}
          </div>
          <button
            id="voice-send"
            onClick={handleSendVoice}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-500 transition"
          >
            Send ↵
          </button>
        </>
      )}

      {/* TTS cancel */}
      {isSpeaking && (
        <button
          id="voice-cancel"
          onClick={cancelSpeech}
          title="Stop speaking"
          className="rounded-xl bg-slate-700 p-2.5 text-white hover:bg-slate-600 transition"
        >
          <VolumeX size={15} />
        </button>
      )}

      {!isListening && !transcript && (
        <span className="text-[10px] text-slate-600">
          {isSpeaking ? "🔊 Speaking…" : "🎤 Tap mic to speak"}
        </span>
      )}
    </div>
  );
}
