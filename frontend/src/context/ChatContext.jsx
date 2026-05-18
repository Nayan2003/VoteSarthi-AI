// frontend/src/context/ChatContext.jsx
/**
 * Global chat + avatar state context.
 * Provides messages, avatarState, theme — shared across all components.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages,      setMessages]      = useState([]);
  const [avatarState,   setAvatarState]   = useState("idle");  // idle | listening | thinking | speaking
  const [theme,         setTheme]         = useState("dark");
  const [searchLocation,setSearchLocation]= useState(null); // { lat, lng, label } from location search bar
  const [mapRedirect,   setMapRedirect]   = useState(null); // { action: 'scan' } — tells MapView to auto-scan


  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id, updater) => {
    setMessages(prev => prev.map(m => (m.id === id ? updater(m) : m)));
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const value = useMemo(
    () => ({
      messages,
      setMessages,
      addMessage,
      updateMessage,
      clearMessages,
      avatarState,
      setAvatarState,
      theme,
      setTheme,
      searchLocation,
      setSearchLocation,
      mapRedirect,
      setMapRedirect,
    }),
    [messages, addMessage, updateMessage, clearMessages, avatarState, theme, searchLocation, mapRedirect]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
