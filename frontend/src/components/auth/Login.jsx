// frontend/src/components/auth/Login.jsx
/**
 * Login page — Firebase Email/Password + Google Sign-In.
 */
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGoogle } from "../../firebase/firebase";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [isNew,    setIsNew]    = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isNew) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 p-8 shadow-2xl backdrop-blur-lg border border-slate-700">
        <div className="mb-6 text-center">
          <div className="text-3xl font-bold text-white">🗳️ VoteSarthi AI</div>
          <p className="mt-2 text-sm text-slate-400">Your Jarvis for Indian Elections</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="login-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Please wait…" : isNew ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs text-slate-500">or</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <button
          id="login-google"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full rounded-xl border border-slate-600 bg-slate-800 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          🔵 Continue with Google
        </button>

        <button
          className="mt-4 w-full text-xs text-slate-400 hover:text-white"
          onClick={() => setIsNew(n => !n)}
        >
          {isNew ? "Already have an account? Sign In" : "New here? Create account"}
        </button>
      </div>
    </div>
  );
}
