import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { env } from "./config/env.js";

// ── Global crash guards (log before dying so Cloud Run shows the real error) ──
process.on("uncaughtException",  (err) => { console.error("[FATAL] uncaughtException:",  err); process.exit(1); });
process.on("unhandledRejection", (err) => { console.error("[FATAL] unhandledRejection:", err); process.exit(1); });

// ── CORS ──────────────────────────────────────────────────────────────────────
// Cloud Run does NOT read .env — CORS_ORIGIN env var must be set in the
// Cloud Run service config. We default to "*" so requests are never blocked.
const corsOptions = {
  origin: (_origin, callback) => callback(null, true),   // allow all — JWT handles auth
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
};

async function main() {
  console.log("[Startup] Initialising VoteSarthi backend...");
  console.log(`[Startup] NODE_ENV=${process.env.NODE_ENV} PORT=${process.env.PORT || env.port}`);

  // ── Lazy-import routes (so any init crash is caught here, not silently) ──
  let chatRoutes, boothRoutes, electionRoutes, ttsRoutes, vaultRoutes, registerSocketHandlers;
  try {
    ({ default: chatRoutes }          = await import("./routes/chat.js"));
    ({ default: boothRoutes }         = await import("./routes/booths.js"));
    ({ default: electionRoutes }      = await import("./routes/elections.js"));
    ({ default: ttsRoutes }           = await import("./routes/tts.js"));
    ({ default: vaultRoutes }         = await import("./routes/vaultRoutes.js"));
    ({ registerSocketHandlers }       = await import("./socket/socketHandlers.js"));
    console.log("[Startup] All routes loaded successfully.");
  } catch (err) {
    console.error("[Startup] FAILED to load routes/modules:", err);
    process.exit(1);
  }

  const app = express();

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));   // handle ALL preflight OPTIONS (Express v5 requires regex, not "*")
  app.use(express.json());

  // ── Health check — always responds, even if Firebase is degraded ──────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "VoteSarthi backend", ts: new Date().toISOString() });
  });

  app.use("/api/chat",      chatRoutes);
  app.use("/api/booths",    boothRoutes);
  app.use("/api/elections", electionRoutes);
  app.use("/api/tts",       ttsRoutes);
  app.use("/api/vault",     vaultRoutes);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { ...corsOptions }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] connected: ${socket.id}`);
    registerSocketHandlers(socket);
    socket.on("disconnect", () => console.log(`[Socket] disconnected: ${socket.id}`));
  });

  const port = process.env.PORT || env.port || 8080;
  server.listen(port, "0.0.0.0", () => {
    console.log(`[Startup] VoteSarthi backend listening on 0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  console.error("[Startup] main() failed:", err);
  process.exit(1);
});
