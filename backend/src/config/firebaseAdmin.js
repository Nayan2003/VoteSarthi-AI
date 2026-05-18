import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./env.js";

/**
 * Credential resolution order:
 *  1. GOOGLE_APPLICATION_CREDENTIALS → path to service-account JSON (local dev / Docker)
 *  2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY → inline env vars
 *  3. applicationDefault() → Cloud Run ADC (attached service account)
 */
function getCredential() {
  // ── Option 1: file path ────────────────────────────────────────────────────
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const absolutePath = resolve(process.cwd(), credPath);
    if (existsSync(absolutePath)) {
      try {
        // Use fs.readFileSync — more reliable than createRequire in ESM + Node 20
        const raw = readFileSync(absolutePath, "utf8");
        const serviceAccount = JSON.parse(raw);
        console.log(`[Firebase Admin] ✓ Loaded service account from: ${absolutePath}`);
        return cert(serviceAccount);
      } catch (e) {
        console.warn(`[Firebase Admin] ✗ Failed to parse service account at ${absolutePath}: ${e.message}`);
      }
    } else {
      console.warn(`[Firebase Admin] ✗ Service account file not found: ${absolutePath}`);
    }
  }

  // ── Option 2: inline env vars ──────────────────────────────────────────────
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const key   = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (email && key) {
    console.log("[Firebase Admin] ✓ Using FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY credentials.");
    return cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: email,
      privateKey:  key
    });
  }

  // ── Option 3: ADC (Cloud Run service account) ─────────────────────────────
  console.log("[Firebase Admin] ✓ Using Application Default Credentials (ADC) — Cloud Run mode.");
  return applicationDefault();
}

// ── Init ───────────────────────────────────────────────────────────────────
const storageBucket = env.firebaseStorageBucket;
if (!storageBucket) {
  console.warn("[Firebase Admin] FIREBASE_STORAGE_BUCKET not set — Storage will be disabled.");
}

let adminApp;
try {
  adminApp = initializeApp({
    credential: getCredential(),
    ...(storageBucket ? { storageBucket } : {})
  });
  console.log("[Firebase Admin] ✓ App initialised.");
} catch (err) {
  console.error("[Firebase Admin] ✗ initializeApp() failed:", err.message);
  throw err;  // let index.js catch and log this clearly
}

export const adminAuth = getAuth(adminApp);
export const firestore = getFirestore(adminApp);
console.log("[Firebase Admin] ✓ Firestore connected.");

let bucket = null;
if (storageBucket) {
  try {
    bucket = getStorage(adminApp).bucket(storageBucket);
    console.log(`[Firebase Admin] ✓ Storage bucket: ${storageBucket}`);
  } catch (e) {
    console.warn(`[Firebase Admin] ✗ Storage init failed: ${e.message}`);
  }
}
export { bucket };
