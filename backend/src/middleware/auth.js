import { adminAuth } from "../config/firebaseAdmin.js";

/**
 * Firebase Admin token verification middleware.
 * Attaches decoded user to req.user on success.
 */
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    req.user = await adminAuth.verifyIdToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Firebase token", details: error.message });
  }
}
