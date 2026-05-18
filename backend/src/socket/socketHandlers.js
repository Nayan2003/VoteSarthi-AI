// backend/src/socket/socketHandlers.js
/**
 * WebSocket streaming handler for VoteSarthi.
 * All Vertex AI streaming goes through here token by token.
 */
import { streamGeminiResponse } from "../services/geminiService.js";

// Per-socket rate limiter — 20 messages / minute
const rateMap = new Map();

function checkRateLimit(socketId) {
  const now   = Date.now();
  const entry = rateMap.get(socketId);
  if (!entry || now > entry.resetAt) {
    rateMap.set(socketId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

/**
 * Register all socket event handlers for a connected client.
 * @param {import('socket.io').Socket} socket
 */
export function registerSocketHandlers(socket) {

  // ── chat:message ────────────────────────────────────────────────────────────
  socket.on("chat:message", async ({ text, history = [] }) => {
    // Validate
    if (!text || typeof text !== "string" || !text.trim()) {
      socket.emit("ai:error", "Empty message received.");
      return;
    }
    if (text.length > 2000) {
      socket.emit("ai:error", "Message too long (max 2000 characters).");
      return;
    }
    // Rate limit
    if (!checkRateLimit(socket.id)) {
      socket.emit("ai:error", "Too many messages. Please wait a moment.");
      return;
    }

    console.log(`[Socket ${socket.id}] "${text.slice(0, 80)}${text.length > 80 ? "…" : ""}"`);

    try {
      await streamGeminiResponse(text.trim(), history, (token) => {
        socket.emit("ai:token", token);
      });
      socket.emit("ai:done");
    } catch (err) {
      console.error(`[Socket ${socket.id}] Vertex AI error:`, err.message);

      let msg = "The AI service is temporarily unavailable. Please try again.";
      if (err.message?.includes("VERTEX_PROJECT_ID") || err.message?.includes("not set")) {
        msg = "⚙️ Vertex AI project is not configured. Please check backend .env (VERTEX_PROJECT_ID).";
      } else if (err.message?.includes("credentials") || err.message?.includes("ADC")) {
        msg = "⚙️ Google Cloud credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS in your .env.";
      } else if (err.message?.includes("quota") || err.message?.includes("429")) {
        msg = "⏳ Vertex AI quota exceeded. Please try again in a moment.";
      } else if (err.message?.includes("SAFETY") || err.message?.includes("safety")) {
        msg = "🛡️ That question triggered a content safety filter. Please rephrase.";
      } else if (err.message?.includes("403") || err.message?.includes("permission")) {
        msg = "🔑 Vertex AI permission denied. Ensure your service account has \"Vertex AI User\" role.";
      }

      socket.emit("ai:error", msg);
    }
  });

  // ── ping ────────────────────────────────────────────────────────────────────
  socket.on("ping", () => socket.emit("pong", { ts: Date.now() }));

  // ── cleanup ─────────────────────────────────────────────────────────────────
  socket.on("disconnect", () => rateMap.delete(socket.id));
}
