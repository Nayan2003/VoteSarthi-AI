// frontend/src/components/layout/Shell.jsx
/**
 * 3-panel Jarvis layout — History + Chat + Avatar with collapsible panels.
 * Fully Responsive Web Design (RWD) for desktop, tablet, and mobile.
 */
import { NavLink } from "react-router-dom";
import { Moon, Sun, X, Bell, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import NotificationBanner from "./NotificationBanner";
import UserProfileMenu from "./UserProfileMenu";

export default function Shell({ left, center, right }) {
  const { theme, setTheme } = useChat();
  const { user }            = useAuth();
  
  const [isDesktop, setIsDesktop] = useState(true);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) {
        setLeftOpen(false);
        setRightOpen(false);
      } else {
        setLeftOpen(true);
        setRightOpen(true);
      }
    };
    handleResize(); // Initialize on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Apply dark/light class to <html> so Tailwind dark: variants work globally
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-[Inter,sans-serif] transition-colors duration-300">
      
      {/* Election notification banner */}
      <NotificationBanner />

      {/* Header */}
      <header className="relative z-50 mx-2 sm:mx-3 mt-2 sm:mt-3 flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/80 px-3 sm:px-5 py-2 sm:py-3 backdrop-blur-md shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1">
            <span className="text-xl">🗳️</span>
            <span className="hidden sm:inline">VoteSarthi AI</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex gap-1 sm:gap-2 text-sm">
          {[
            { to: "/",       label: "Chat",      emoji: "💬" },
            { to: "/map",    label: "Map",        emoji: "📍" },
            { to: "/vault",  label: "Vault",      emoji: "🔒" },
            { to: "/info",   label: "Elections",  emoji: "📋" }
          ].map(({ to, label, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center justify-center rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:scale-105"
                }`
              }
            >
              <span className="text-base">{emoji}</span>
              <span className="hidden md:inline ml-1.5">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            id="theme-toggle"
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110 active:scale-95"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && <UserProfileMenu user={user} />}
        </div>
      </header>

      {/* Main Layout */}
      <main 
        className={`relative h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden ${isDesktop ? 'grid' : 'flex'}`}
        style={isDesktop ? {
          gridTemplateColumns: [
            leftOpen  ? "280px" : "0",
            "1fr",
            rightOpen ? "300px" : "0"
          ].join(" "),
          transition: "grid-template-columns 0.3s ease-in-out"
        } : {}}
      >
        {/* Mobile Overlays */}
        {!isDesktop && (leftOpen || rightOpen) && (
          <div 
            className="absolute inset-0 z-20 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => { setLeftOpen(false); setRightOpen(false); }}
          />
        )}

        {/* Left Toggle Button (Visible when closed) */}
        {!leftOpen && (
          <button
            onClick={() => { setLeftOpen(true); if(!isDesktop) setRightOpen(false); }}
            className="absolute left-0 top-6 sm:top-4 z-40 flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-r-2xl border border-l-0 border-slate-300 bg-white/90 text-slate-600 shadow-lg backdrop-blur-md transition-all hover:bg-white dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700 group hover:w-14"
            title="Open Notifications"
          >
            <div className="relative flex items-center justify-center">
              <Bell size={20} className="text-amber-500 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-800">
                7
              </span>
            </div>
          </button>
        )}

        {/* Left — History / Notifications */}
        <aside 
          className={`
            ${isDesktop ? 'relative' : 'absolute left-2 top-2 bottom-2 w-[280px] z-30 shadow-2xl'}
            overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 
            bg-white/95 dark:bg-slate-900/95 lg:bg-white/80 lg:dark:bg-slate-900/70 p-4 
            backdrop-blur-xl transition-all duration-300 ease-in-out
            ${leftOpen ? "translate-x-0 opacity-100" : "-translate-x-full lg:translate-x-0 opacity-0 pointer-events-none"}
          `}
        >
          <button 
            onClick={() => setLeftOpen(false)} 
            className="absolute top-3 right-3 z-50 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Close panel"
          >
            <X size={16} />
          </button>
          {left}
        </aside>

        {/* Center — Chat / Content */}
        <section className="flex-1 w-full min-w-0 relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/70 p-2 sm:p-4 backdrop-blur-sm transition-colors duration-300 shadow-sm">
          {center}
        </section>

        {/* Right — Avatar / History */}
        <aside 
          className={`
            ${isDesktop ? 'relative' : 'absolute right-2 top-2 bottom-2 w-[300px] z-30 shadow-2xl'}
            overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 
            bg-white/95 dark:bg-slate-900/95 lg:bg-white/80 lg:dark:bg-slate-900/70 p-4 
            backdrop-blur-xl transition-all duration-300 ease-in-out
            ${rightOpen ? "translate-x-0 opacity-100" : "translate-x-full lg:translate-x-0 opacity-0 pointer-events-none"}
          `}
        >
          <button 
            onClick={() => setRightOpen(false)} 
            className="absolute top-3 right-3 z-50 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Close panel"
          >
            <X size={16} />
          </button>
          {right}
        </aside>

        {/* Right Toggle Button (Visible when closed) */}
        {!rightOpen && (
          <button
            onClick={() => { setRightOpen(true); if(!isDesktop) setLeftOpen(false); }}
            className="absolute right-0 top-6 sm:top-4 z-40 flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-l-2xl border border-r-0 border-slate-300 bg-white/90 text-slate-600 shadow-lg backdrop-blur-md transition-all hover:bg-white dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700 group hover:w-14"
            title="Open AI Avatar"
          >
            <div className="relative flex items-center justify-center">
              <Bot size={22} className="text-purple-500 group-hover:scale-110 group-hover:-rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-800">
                ?
              </span>
            </div>
          </button>
        )}
      </main>
    </div>
  );
}
