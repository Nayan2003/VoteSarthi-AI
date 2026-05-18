# 🗳️ VoteSarthi AI — Intelligent Election Education Platform

> *"Sarthi"* means **guide or charioteer** in Hindi. VoteSarthi is your AI-powered guide through India's democratic process.

---

## 💡 Brief Idea

**VoteSarthi AI** is a full-stack, AI-powered civic-education web application built specifically for Indian voters. The platform makes democracy **accessible, interactive, and understandable** for every citizen — from first-time voters in rural areas to NRIs navigating overseas voting rules.

The app combines:
- A **bilingual AI chatbot** (Hindi / English / Hinglish) powered by `Llama 3.3-70B` via Groq, answering questions about voter registration, EVM procedures, election timelines, and more.
- An **interactive polling booth map** that finds real nearby booths using the Google Maps Places API, with a curated Maharashtra fallback dataset.
- A **Document Vault** where users can securely upload Aadhaar cards and Voter IDs, with automatic AI extraction of key details via **Vertex AI (Gemini 1.5 Flash)**.
- A **Text-to-Speech (TTS)** voice layer using Google Cloud TTS WaveNet voices for accessibility.
- A **real-time streaming** chat interface via WebSockets (Socket.IO) for a fluid, token-by-token AI response experience.

---

## 🏛️ Chosen Vertical

**Civic Technology / Election Accessibility**

The vertical chosen is **AI-assisted voter education and participation**, targeting the challenge that millions of Indian voters — especially first-timers, elderly citizens, and those in tier-2/tier-3 cities — lack accessible, plain-language guidance on:
1. How to register to vote (Form 6, NVSP portal).
2. What happens inside a polling booth (EVM, VVPAT, indelible ink).
3. Where their nearest polling station is.
4. What documents are required and how to store/verify them digitally.

The solution specifically addresses the **language barrier** (Hindi, English, Hinglish support) and the **digital literacy gap** (voice output, step-by-step explanations, suggestion chips for guided flows).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐      ┌──────────────────────────────────────┐
│          FRONTEND (React/Vite)      │      │          BACKEND (Node/Express)       │
│                                     │      │                                      │
│  ┌──────────┐  ┌───────────────┐   │      │  ┌─────────────────────────────────┐ │
│  │ AuthPage │  │  ChatInterface │──WebSocket─▶│  Socket.IO  → Groq Llama 3.3    │ │
│  └──────────┘  │  (streaming)  │   │      │  └─────────────────────────────────┘ │
│                └───────────────┘   │      │                                      │
│  ┌──────────────────────────────┐  │      │  ┌──────────────────┐                │
│  │     MapView                  │───REST──▶│  /api/booths       │                │
│  │   (Google Maps JS API)       │  │      │  (Places API + curated data)         │
│  └──────────────────────────────┘  │      │  └──────────────────┘                │
│                                     │      │                                      │
│  ┌──────────────────────────────┐  │      │  ┌──────────────────┐                │
│  │   VaultDashboard             │───REST──▶│  /api/vault        │                │
│  │ (upload, view, delete docs)  │  │      │  Multer → Firebase Storage           │
│  └──────────────────────────────┘  │      │  Vertex AI OCR (Gemini 1.5 Flash)   │
│                                     │      │  └──────────────────┘                │
│  ┌──────────────────────────────┐  │      │  ┌──────────────────┐                │
│  │  Voice / TTS                 │───REST──▶│  /api/tts          │                │
│  │ (plays AI audio responses)   │  │      │  Google Cloud TTS (WaveNet)          │
│  └──────────────────────────────┘  │      │  └──────────────────┘                │
└─────────────────────────────────────┘      └──────────────────────────────────────┘
                    │                                        │
              Firebase Auth                       Firebase Firestore
              (JWT tokens)                        (chat history, vault metadata)
                                                  Firebase Storage
                                                  (document vault files)
```

---

## ⚙️ How the Solution Works

### 1. Authentication
- Firebase Authentication (Email/Password + Google Sign-In) guards all routes.
- The React `AuthContext` watches `onAuthStateChanged` and injects the Firebase user globally.
- On each protected API call, the frontend sends the Firebase **JWT ID token** in the `Authorization: Bearer <token>` header. The backend's `authMiddleware` verifies this token using the Firebase Admin SDK before processing the request.

### 2. AI Chat (WebSocket Streaming)
- The user types a question in `ChatInterface.jsx`.
- The frontend emits `chat:message` via **Socket.IO** with the user's text and the last 20 turns of chat history.
- `socketHandlers.js` on the backend validates the message, applies a **per-socket rate limiter** (20 messages/minute), and calls `streamGeminiResponse()`.
- `geminiService.js` uses the **Groq SDK** with `llama-3.3-70b-versatile` in streaming mode. Each token is emitted back to the client as `ai:token`, producing a real-time typewriter effect.
- A carefully crafted **system prompt** personalises the AI as *VoteSarthi* — a civic educator who knows India's election laws, NVSP portal flows, ECI roles, NOTA, Model Code of Conduct, and more. It responds bilingually based on the language the user writes in.
- A fallback **REST endpoint** (`/api/chat`) handles non-streaming clients.

### 3. Polling Booth Map
- `MapView.jsx` renders an interactive Google Maps interface.
- On load, the browser requests geolocation. The coordinates are sent to `/api/booths` (GET with query params).
- `boothService.js` first attempts the **Google Maps Places Text Search API** with queries `"मतदान केंद्र"`, `"polling booth"`, and `"election booth"` within a 5 km radius.
- If the Places API returns fewer than 3 results (or the API key is absent), it falls back to a **curated, hardcoded dataset** of 20 real polling booths across Navi Mumbai, Panvel, and Mumbai, sourced from the Maharashtra Chief Electoral Officer (CEO) booth register and 2024 Vidhan Sabha election records.
- Distances are computed using the **Haversine formula** and results are sorted nearest-first, capped at 5 km and 15 results.

### 4. Document Vault (AI-Powered OCR)
- `VaultDashboard.jsx` allows authenticated users to upload PDFs, PNGs, and JPGs (up to 10 MB) categorised as "Aadhaar Card", "Voter ID", or "Other".
- The file is sent to `POST /api/vault/upload` as `multipart/form-data`. `multer` stores it in memory (never on disk).
- The backend uploads the file buffer directly to **Firebase Storage** via the Admin SDK, bypassing client-side security rules.
- A signed URL (1-year expiry) is generated for private, authenticated access.
- For Aadhaar Card uploads, **Vertex AI (Gemini 1.5 Flash)** is called with a prompt to extract `name`, `aadhaarNumber`, and `address` from the image inline (base64 encoded). For Voter ID, it extracts the `voterId` (EPIC number).
- Extracted data + file metadata (path, signed URL, size, category) are saved to **Firestore** (`vaultMetadata` collection), scoped by `uid` for per-user isolation.
- Users can also view and delete their documents from the dashboard.

### 5. Text-to-Speech
- After the AI response is complete, the frontend optionally calls `POST /api/tts` with the response text and a detected language code (`hi-IN`, `en-IN`, or `en-US`).
- The backend uses **Google Cloud TTS WaveNet** voices to synthesise MP3 audio, returned as raw bytes.
- If Google Cloud credentials are not configured, the server responds with `{ fallback: true }` and the client silently degrades to the browser's built-in **Web Speech API**.

### 6. Election Info Panel
- A static REST API (`/api/elections/upcoming`, `/api/elections/rules`, `/api/elections/candidates`) serves structured election data about upcoming and past Indian elections and voting rules.
- Designed to integrate with a live ECI API in future iterations.

---

## 🚀 Deployment

| Layer | Platform |
|---|---|
| Frontend | Google Cloud Run (containerised Vite build served via `serve`) |
| Backend | Google Cloud Run (Node.js 20 ESM, Dockerised) |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| File Storage | Firebase Storage |
| AI (Chat) | Groq API — `llama-3.3-70b-versatile` (free tier) |
| AI (OCR/Vault) | Vertex AI — `gemini-1.5-flash` (Google Cloud project) |
| TTS | Google Cloud Text-to-Speech (WaveNet) |
| Maps | Google Maps JS API + Places Text Search API |

The backend uses **Application Default Credentials (ADC)** on Cloud Run, falling back to a local service account key (`config/service-account.json`) during development.

---

## 🧱 Tech Stack

### Backend
| Package | Role |
|---|---|
| `express` v5 | HTTP server / REST API |
| `socket.io` | WebSocket streaming |
| `groq-sdk` | LLM chat (Llama 3.3 70B) |
| `@google-cloud/vertexai` | Gemini 1.5 Flash (OCR/vault) |
| `@google-cloud/text-to-speech` | Voice synthesis |
| `firebase-admin` | Firestore + Storage + JWT verification |
| `multer` | Multipart file upload |
| `cors` | CORS policy |
| `jsonwebtoken` | JWT auth middleware |
| `nodemon` | Dev hot-reload |

### Frontend
| Package | Role |
|---|---|
| `react` v19 + `vite` | UI framework + build tool |
| `react-router-dom` v7 | Client-side routing |
| `socket.io-client` | WebSocket connection to backend |
| `firebase` | Auth + direct Firestore reads |
| `framer-motion` | Animations and transitions |
| `@react-three/fiber` + `three.js` | 3D AI avatar rendering |
| `@googlemaps/markerclusterer` | Map marker clustering |
| `lucide-react` | Icon set |
| `tailwindcss` | Utility CSS |

---

## 📂 Project Structure

```
votingai/
├── backend/
│   ├── Dockerfile                  # Cloud Run container definition
│   ├── .env                        # Local environment variables (not committed)
│   ├── config/
│   │   └── service-account.json    # GCP service account (gitignored)
│   └── src/
│       ├── index.js                # Express + Socket.IO server entry point
│       ├── config/
│       │   ├── env.js              # Centralised env var access
│       │   └── firebaseAdmin.js    # Firebase Admin SDK init (ADC / key)
│       ├── middleware/
│       │   └── auth.js             # JWT verification middleware
│       ├── routes/
│       │   ├── chat.js             # REST fallback for chat
│       │   ├── booths.js           # Polling booth search
│       │   ├── elections.js        # Election info (static)
│       │   ├── tts.js              # Text-to-Speech
│       │   └── vaultRoutes.js      # Document vault (upload/list/delete)
│       ├── services/
│       │   ├── geminiService.js    # Groq LLM streaming service
│       │   ├── boothService.js     # Maps API + curated booth fallback
│       │   └── firestoreService.js # Firestore CRUD helpers
│       └── socket/
│           └── socketHandlers.js   # Socket.IO event handlers + rate limiter
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                 # Route definitions
        ├── main.jsx                # React root + providers
        ├── index.css               # Global styles
        ├── firebase/
        │   └── firebase.js         # Firebase client SDK init
        ├── context/
        │   ├── AuthContext.jsx     # Firebase auth state provider
        │   └── ChatContext.jsx     # Chat history state provider
        ├── hooks/                  # Custom React hooks
        └── components/
            ├── auth/               # Login page
            ├── layout/             # Shell, NotificationPanel, AvatarHistoryPanel
            ├── chat/               # ChatInterface, MessageBubble, SuggestionChips
            ├── map/                # MapView (Google Maps)
            ├── vault/              # VaultDashboard (document upload/management)
            ├── info/               # ElectionInfo panel
            ├── avatar/             # 3D AI avatar (Three.js)
            └── voice/              # TTS voice controls
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
CORS_ORIGIN=*

# Groq (free LLM)
GROQ_API_KEY=your_groq_key_here

# Google Cloud / Firebase
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Vertex AI
VERTEX_PROJECT_ID=your-gcp-project-id
VERTEX_LOCATION=us-central1

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app

# Firestore Collections
FIRESTORE_CHAT_COLLECTION=chatHistory
FIRESTORE_VAULT_COLLECTION=vaultMetadata

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```

### Frontend (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_BACKEND_URL=https://your-cloud-run-backend-url
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```

---

## ⚡ Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd votingai

# 2. Install backend dependencies
cd backend
npm install
# Add your keys to backend/.env
npm run dev          # Starts on http://localhost:5000

# 3. Install frontend dependencies (new terminal)
cd frontend
npm install
# Add your keys to frontend/.env
npm run dev          # Starts on http://localhost:5173
```

---

## 📋 Assumptions Made

1. **Target Region — Maharashtra/Navi Mumbai**: The curated polling booth fallback dataset covers Panvel, Belapur, Airoli, Vashi, Nerul, Uran, and Mumbai suburban constituencies. A production build would integrate the full national ECI booth database.

2. **Groq as Primary LLM**: The service file is named `geminiService.js` for interface compatibility but internally uses the **Groq SDK** with `llama-3.3-70b-versatile`. Groq's free tier provides generous quota without billing, making it ideal for a demo/hackathon environment. Swapping to Vertex AI Gemini requires only changing the client inside `geminiService.js`.

3. **Vertex AI for OCR**: Vertex AI (Gemini 1.5 Flash) is used for document information extraction because it supports multimodal (image + text) prompts. If Vertex AI is unavailable, the vault route returns hardcoded demo data as a graceful fallback so the demo still functions.

4. **Google Cloud TTS with Web Speech Fallback**: TTS is treated as an enhancement, not a dependency. If Google Cloud credentials are missing, the client falls back to the browser's native `window.speechSynthesis` API silently.

5. **Firebase Storage Rules Bypassed via Admin SDK**: Instead of configuring client-side Firebase Storage rules, all file uploads go through the Node.js backend using the Admin SDK. This simplifies rules management and allows server-side validation (file type, size, category) before storage.

6. **CORS Open Policy on Cloud Run**: Since Cloud Run does not read `.env` files, and the application uses Firebase JWT for auth, the CORS policy allows all origins (`*`) and relies on token verification rather than origin whitelisting for security.

7. **Single-User Vault Isolation**: Documents are isolated by Firebase UID stored in Firestore. Each user can only read/delete their own documents (enforced server-side in `vaultRoutes.js`).

8. **Election Data is Static**: The `/api/elections` endpoints return hardcoded election data. The assumption is that a live ECI API integration would be implemented in the production version.

9. **Deployment on Cloud Run (not Firebase Hosting for backend)**: The Node.js/Socket.IO backend requires long-lived connections (WebSockets), which are not supported by Firebase Hosting. Cloud Run is used for both frontend and backend with full container control.

---

## 🎯 Evaluation Focus Areas

| Area | Implementation |
|---|---|
| **AI Integration** | Real streaming LLM (Groq/Llama 3.3 70B) via Socket.IO, Vertex AI multimodal OCR for document extraction, Google Cloud TTS for voice |
| **Civic Impact** | Targets voter education gap in India; bilingual (Hindi/English/Hinglish); accessible voice output; step-by-step process explanations |
| **Full-Stack Architecture** | React 19 + Vite frontend, Express 5 + Socket.IO backend, Firebase Auth/Firestore/Storage, Cloud Run deployment |
| **Real-time UX** | Token-by-token streaming chat, animated typewriter effect, 3D AI avatar, per-socket rate limiting |
| **Data Security** | Firebase JWT auth middleware on all protected routes, server-side file validation, per-user Firestore scoping |
| **Resilience & Fallbacks** | Google Maps → curated Maharashtra booth data, Vertex AI OCR → demo data, Google TTS → Web Speech API, global crash guards in `index.js` |
| **Scalability** | Stateless Cloud Run containers, Firestore auto-scaling, Groq API with configurable rate limits |
| **Accessibility** | Bilingual AI, TTS voice output for visually impaired users, PwD-friendly information in AI knowledge base |

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| Frontend | Deployed on Google Cloud Run |
| Backend API | Deployed on Google Cloud Run |
| Health Check | `GET /health` → `{ status: "ok", service: "VoteSarthi backend" }` |

---

## 📜 License

MIT — built for civic good. Feel free to fork and extend for your constituency!

---

*Built with ❤️ for Indian democracy — powered by AI, designed for every voter.*
