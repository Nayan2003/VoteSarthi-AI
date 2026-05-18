import dotenv from "dotenv";

dotenv.config();

export const env = {
  port:                 process.env.PORT || 5000,
  corsOrigin:           process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || "*",
  googleCloudProjectId: process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
  googleCloudLocation:  process.env.VERTEX_LOCATION   || process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  geminiModel:          process.env.VERTEX_MODEL       || process.env.GEMINI_MODEL || "gemini-1.5-flash-001",
  firebaseProjectId:    process.env.FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  chatCollection:       process.env.FIRESTORE_CHAT_COLLECTION     || "chatHistory",
  boothCollection:      process.env.FIRESTORE_BOOTH_COLLECTION    || "pollingBooths",
  electionCollection:   process.env.FIRESTORE_ELECTION_COLLECTION || "electionInfo",
  vaultCollection:      process.env.FIRESTORE_VAULT_COLLECTION    || "vaultMetadata"
};
