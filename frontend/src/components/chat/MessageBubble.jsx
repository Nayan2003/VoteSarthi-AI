// frontend/src/components/chat/MessageBubble.jsx
/**
 * Individual chat message bubble with markdown-like formatting.
 */
import { useEffect, useRef } from "react";

const ROLE_STYLES = {
  user:      "ml-auto bg-blue-600 text-white",
  assistant: "mr-auto bg-slate-800 text-slate-100",
  system:    "mx-auto bg-amber-900/40 text-amber-300 text-xs border border-amber-700/40"
};

/** Render markdown-like content: bold, italic, code, hr, line breaks */
function formatContent(text = "") {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class=\"bg-slate-700 px-1 rounded text-emerald-300\">$1</code>")
    .replace(/^---$/gm, "<hr class=\"my-2 border-slate-600/50\"/>")
    .replace(/\n/g, "<br/>");
}


export default function MessageBubble({ message, isStreaming = false }) {
  const ref = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [message.content]);

  const roleStyle = ROLE_STYLES[message.role] || ROLE_STYLES.assistant;

  return (
    <div ref={ref} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${roleStyle}`}>
      <span
        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
      />
      {isStreaming && (
        <span className="ml-1 inline-block h-3 w-1 animate-pulse rounded-sm bg-current opacity-70" />
      )}
    </div>
  );
}
