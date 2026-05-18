// backend/src/routes/chat.js
/**
 * REST fallback chat routes.
 * POST /api/chat         → non-streaming response (Bearer auth required)
 * DELETE /api/chat/history → clear session history (Bearer auth required)
 */
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getGeminiResponse } from "../services/geminiService.js";

const router = Router();

// ── Non-streaming REST chat ──────────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }
    const response = await getGeminiResponse(message.trim(), history);
    res.json({ response });
  } catch (err) {
    console.error("[Chat REST] Error:", err.message);
    res.status(500).json({ error: "Chat service error.", details: err.message });
  }
});

// ── Clear session history (session-local — no-op placeholder for future Firestore) ─
router.delete("/history", authMiddleware, (req, res) => {
  // History is currently per-socket. This endpoint signals intent to clear.
  res.json({ ok: true, message: "History cleared." });
});

export default router;
