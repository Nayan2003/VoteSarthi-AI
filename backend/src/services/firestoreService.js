import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "../config/firebaseAdmin.js";
import { env } from "../config/env.js";

export async function saveChatMessage({ uid, role, content }) {
  await firestore.collection(env.chatCollection).add({
    uid,
    role,
    content,
    createdAt: Timestamp.now()
  });
}

export async function getRecentChatHistory({ uid, limit = 10 }) {
  const snapshot = await firestore
    .collection(env.chatCollection)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => doc.data())
    .reverse()
    .map((item) => ({ role: item.role, content: item.content }));
}

export async function listPollingBooths() {
  const snapshot = await firestore.collection(env.boothCollection).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function listElectionInfo() {
  const snapshot = await firestore.collection(env.electionCollection).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveVaultMetadata({ uid, fileName, storagePath, contentType, size, obfuscatedName }) {
  await firestore.collection(env.vaultCollection).add({
    uid,
    fileName,
    storagePath,
    contentType,
    size,
    obfuscatedName,
    createdAt: Timestamp.now()
  });
}

export async function listVaultMetadata({ uid }) {
  const snapshot = await firestore
    .collection(env.vaultCollection)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
