// frontend/src/components/layout/NotificationBanner.jsx
/**
 * Slide-in election notification banner — session-dismissed.
 * Shows once per session, can be dismissed by the user.
 */
import { useState, useEffect } from "react";
import { X } from "lucide-react";

const NOTIFICATIONS = [
  "🗳️ General Elections 2024 results are out! Ask VoteSarthi for a summary.",
  "📋 Bihar elections coming up — register to vote at NVSP portal!",
  "📱 Download the Voter Helpline App to check your voter ID status.",
  "🔵 Lok Sabha election results declared on June 4, 2024."
];

const SESSION_KEY = "vs_notification_dismissed";

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [msg,     setMsg]     = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const randomMsg = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
    setMsg(randomMsg);
    setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      id="notification-banner"
      className="mx-3 mt-2 flex items-center justify-between rounded-xl border border-blue-300 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/60 px-4 py-2.5 text-xs font-semibold text-blue-900 dark:text-blue-50 backdrop-blur-sm animate-slideDown shadow-sm"
    >
      <span>{msg}</span>
      <button
        id="dismiss-notification"
        onClick={dismiss}
        className="ml-4 rounded-lg p-1 text-slate-500 hover:text-slate-900 dark:text-blue-300 dark:hover:text-white transition"
        title="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}
