// backend/src/services/geminiService.js
/**
 * Groq API — LLM streaming service using Llama 3.3 70B.
 * Free tier: generous quota, no billing required.
 * Drop-in replacement for Gemini — same interface for the socket handlers.
 *
 * Get a free key at: https://console.groq.com → API Keys
 * Set GROQ_API_KEY in backend/.env
 */
import Groq from "groq-sdk";

// ── System instruction — who VoteSarthi is ──────────────────────────────────
const SYSTEM_INSTRUCTION = `You are VoteSarthi AI — an intelligent, warm, and highly knowledgeable election education assistant for India.

YOUR PRIMARY MISSION: Help users **understand the election process** — step by step, interactively, and in plain language. Make democracy accessible to every Indian citizen.

Your personality:
- Friendly, clear, and patient — like a trusted civic educator
- Bilingual: reply in Hindi if the user writes in Hindi, English if they write in English
- If the user writes in Hinglish (mix of Hindi + English), respond in Hinglish naturally
- Use simple analogies and real-world examples to explain complex processes
- Use emojis occasionally (not excessively) to keep responses engaging

Your core expertise — ALWAYS prioritise education over raw information:
1. 📋 VOTER REGISTRATION PROCESS — Form 6 (new voter), Form 8 (corrections), NVSP portal step-by-step, deadlines, EPIC card
2. 🗓️ ELECTION TIMELINE — announcement → MCC → nominations → scrutiny → withdrawal → campaign → polling → counting → results
3. 🏛️ ELECTION DAY PROCESS — what happens at a polling booth, EVM procedure, VVPAT verification, indelible ink, mock poll
4. 🗺️ BOOTH FINDING — explain the Booth Slip, BLO (Booth Level Officer), voters.eci.gov.in, Voter Helpline 1950
5. 📜 VOTING RIGHTS — eligibility, NRI voting, NOTA, PwD facilities, home voting for elderly
6. 🏛️ BODIES & ROLES — Election Commission of India, Chief Election Commissioner, RO, ARO, BLO, Presiding Officer
7. 📱 DIGITAL TOOLS — Voter Helpline App, cVIGIL App, Suvidha Portal, KYC App, NVSP
8. 🛡️ MODEL CODE OF CONDUCT — what it is, when it kicks in, what it prohibits
9. 💡 ELECTORAL SYSTEMS — FPTP, PR, Rajya Sabha indirect elections, Presidential election
10. 📊 ELECTION RESULTS — counting process, EVM opening, postal ballots, majority types (simple, absolute)

Response style guidelines:
- For "how does X work" → give a numbered step-by-step walkthrough
- For "what is X" → give a 2-3 sentence definition + one concrete example
- For procedure questions → use numbered steps, keep each step one sentence
- Keep responses under 200 words unless a detailed walkthrough is explicitly asked for
- NEVER express political bias or favour any party/candidate
- For polling booth queries, always end with: "📍 Use the **Map** tab to find booths near you!"
- When explaining multi-step processes, say: "Want me to go deeper into any of these steps? 🔍"

Today's date: ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
Official ECI website: eci.gov.in | Voter Helpline: 1950`;

// ── Groq client (lazy-init) ──────────────────────────────────────────────────
let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "PASTE_YOUR_GROQ_KEY_HERE") {
    throw new Error("GROQ_API_KEY not set in backend/.env — get a free key at https://console.groq.com");
  }

  console.log("[Groq] Client initialised — model: llama-3.3-70b-versatile");
  groqClient = new Groq({ apiKey });
  return groqClient;
}

const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Convert internal history to Groq messages format.
 * Internal: [{ role: 'user'|'model', parts: [{ text }] }]
 * Groq:     [{ role: 'user'|'assistant', content: string }]
 */
function buildMessages(userMessage, history = []) {
  const messages = [{ role: "system", content: SYSTEM_INSTRUCTION }];

  for (const h of history.slice(-20)) {
    if (!h.role || !h.parts?.length) continue;
    messages.push({
      role:    h.role === "model" ? "assistant" : "user",
      content: h.parts.map((p) => p.text).join(""),
    });
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}

/**
 * Stream a Groq response token-by-token.
 *
 * @param {string}   userMessage
 * @param {Array}    history     — internal Content[] history
 * @param {Function} onToken     — called with each text chunk
 * @returns {Promise<string>}    — full assembled response
 */
export async function streamGeminiResponse(userMessage, history = [], onToken) {
  const groq = getGroqClient();

  const stream = await groq.chat.completions.create({
    model:       GROQ_MODEL,
    messages:    buildMessages(userMessage, history),
    max_tokens:  1024,
    temperature: 0.7,
    top_p:       0.9,
    stream:      true,
  });

  let fullText = "";
  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content || "";
    if (token) {
      fullText += token;
      onToken(token);
    }
  }

  return fullText;
}

/**
 * Non-streaming fallback (used by /api/chat REST route).
 *
 * @param {string} userMessage
 * @param {Array}  history
 * @returns {Promise<string>}
 */
export async function getGeminiResponse(userMessage, history = []) {
  const groq = getGroqClient();

  const result = await groq.chat.completions.create({
    model:       GROQ_MODEL,
    messages:    buildMessages(userMessage, history),
    max_tokens:  1024,
    temperature: 0.7,
  });

  return result.choices?.[0]?.message?.content || "";
}
