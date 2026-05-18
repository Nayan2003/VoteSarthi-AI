// frontend/src/hooks/useSocket.js
/**
 * WebSocket streaming hook.
 * Connects to backend via Socket.io and handles:
 *   - send:    emit chat:message  → streaming ai:token → ai:done
 *   - receive: ai:token, ai:done, ai:error events
 *   - TTS:     auto-speaks the full AI response when ai:done fires
 */
import { useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export function useSocket({ speak } = {}) {
  const { addMessage, updateMessage, setAvatarState, messages } = useChat();
  const { user } = useAuth();
  const socketRef   = useRef(null);
  const streamIdRef = useRef(null);
  const speakRef    = useRef(speak);          // keep ref fresh without re-registering listeners
  const messagesRef = useRef(messages);

  // Keep refs in sync
  useEffect(() => { speakRef.current    = speak;    }, [speak]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    async function connect() {
      const token  = await user.getIdToken();
      const socket = io(BACKEND, {
        transports: ["websocket"],
        auth:       { token }
      });
      socketRef.current = socket;

      socket.on("ai:token", (token) => {
        setAvatarState("speaking");
        if (streamIdRef.current) {
          updateMessage(streamIdRef.current, m => ({
            ...m,
            content: m.content + token
          }));
        }
      });

      socket.on("ai:done", () => {
        // Find the last assistant message and speak it
        const msgs   = messagesRef.current;
        const lastAI = [...msgs].reverse().find(m => m.role === "assistant");
        if (lastAI?.content && speakRef.current) {
          speakRef.current(lastAI.content, () => setAvatarState("idle"));
        } else {
          setAvatarState("idle");
        }
        streamIdRef.current = null;
      });

      socket.on("ai:error", (msg) => {
        streamIdRef.current = null;
        setAvatarState("idle");
        addMessage({
          id:      crypto.randomUUID(),
          role:    "system",
          content: msg
        });
      });
    }

    connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, addMessage, updateMessage, setAvatarState]);

  const sendMessage = useCallback((text) => {
    if (!socketRef.current || !text?.trim()) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    addMessage(userMsg);
    setAvatarState("thinking");

    const streamMsg = { id: crypto.randomUUID(), role: "assistant", content: "" };
    streamIdRef.current = streamMsg.id;
    addMessage(streamMsg);

    socketRef.current.emit("chat:message", { text: text.trim() });
  }, [addMessage, setAvatarState]);

  return { sendMessage };
}
