// backend/src/routes/tts.js
/**
 * Google Cloud Text-to-Speech endpoint.
 * POST /api/tts
 * Body: { text: string, language?: 'hi-IN' | 'en-IN' | 'en-US' }
 * Returns: audio/mpeg binary
 *
 * Auth: Optional — currently open so the browser can call it directly.
 * Lock it down with authMiddleware in production if needed.
 */
import { Router } from "express";
import textToSpeech from "@google-cloud/text-to-speech";

const router = Router();

// Lazy-initialise the TTS client (uses GOOGLE_APPLICATION_CREDENTIALS or ADC)
let ttsClient = null;
function getTTSClient() {
  if (!ttsClient) ttsClient = new textToSpeech.TextToSpeechClient();
  return ttsClient;
}

// Language → voice name mapping (WaveNet voices for best quality)
const VOICE_MAP = {
  "hi-IN": { languageCode: "hi-IN", name: "hi-IN-Wavenet-D", ssmlGender: "FEMALE" },
  "en-IN": { languageCode: "en-IN", name: "en-IN-Wavenet-D", ssmlGender: "FEMALE" },
  "en-US": { languageCode: "en-US", name: "en-US-Wavenet-F", ssmlGender: "FEMALE" }
};

router.post("/", async (req, res) => {
  const { text, language = "hi-IN" } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "text is required" });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: "text too long (max 5000 chars)" });
  }

  const voice = VOICE_MAP[language] || VOICE_MAP["hi-IN"];

  try {
    const client = getTTSClient();

    const [response] = await client.synthesizeSpeech({
      input:       { text: text.trim() },
      voice,
      audioConfig: {
        audioEncoding:    "MP3",
        speakingRate:     0.95,
        pitch:            1.0,
        volumeGainDb:     0.0,
        effectsProfileId: ["handset-class-device"]
      }
    });

    // Return raw audio bytes
    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "no-store");
    res.send(response.audioContent);

  } catch (err) {
    console.error("[TTS] Error:", err.message);

    // Graceful degradation — client falls back to Web Speech API
    if (err.message?.includes("credentials") || err.message?.includes("ADC")) {
      return res.status(503).json({
        error: "Google Cloud TTS credentials not configured.",
        fallback: true
      });
    }
    return res.status(500).json({ error: "TTS service error.", fallback: true });
  }
});

export default router;
