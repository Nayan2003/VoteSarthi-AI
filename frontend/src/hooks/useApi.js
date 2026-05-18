// frontend/src/hooks/useApi.js
/**
 * REST API helpers.
 * Wraps fetch with Firebase auth token injection and error handling.
 */
import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * Standalone apiFetch for use outside React components.
 * Accepts an optional token for auth injection.
 */
export async function apiFetch(path, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${BACKEND}${path}`, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Request failed with ${response.status}`);
  }

  return response.json();
}

/**
 * React hook version — auto-injects current user's Firebase token.
 */
export function useApi() {
  const { user } = useAuth();

  const fetchWithAuth = useCallback(async (path, options = {}) => {
    const token = user ? await user.getIdToken() : null;
    return apiFetch(path, options, token);
  }, [user]);

  return { fetchWithAuth };
}
