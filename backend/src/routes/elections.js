// backend/src/routes/elections.js
/**
 * Election data API — no auth required (public information).
 * GET /api/elections/upcoming    → upcoming elections list
 * GET /api/elections/rules       → voting rules data
 * GET /api/elections/candidates  → candidate list (placeholder)
 */
import { Router } from "express";

const router = Router();

// ── Upcoming elections ───────────────────────────────────────────────────────
router.get("/upcoming", (_req, res) => {
  // TODO: integrate live ECI API. Static data for now.
  res.json({
    elections: [
      {
        id: "lok-sabha-2024",
        name: "Lok Sabha General Election 2024",
        phases: 7,
        startDate: "2024-04-19",
        resultDate: "2024-06-04",
        status: "completed"
      },
      {
        id: "bihar-2025",
        name: "Bihar Legislative Assembly Election 2025",
        phases: 3,
        startDate: "2025-10-01",
        resultDate: "2025-11-08",
        status: "upcoming"
      }
    ]
  });
});

// ── Voting rules ─────────────────────────────────────────────────────────────
router.get("/rules", (_req, res) => {
  res.json({
    rules: [
      { id: "eligibility",    title: "Voter Eligibility",       description: "Must be 18+ years old and a citizen of India." },
      { id: "id-required",   title: "Valid ID Required",        description: "Carry EPIC card or any ECI-approved photo ID." },
      { id: "nota",          title: "NOTA Option",              description: "You may choose NOTA (None of the Above) on the EVM." },
      { id: "ink",           title: "Indelible Ink",            description: "Ink is applied to left index finger after voting to prevent double voting." },
      { id: "mcc",           title: "Model Code of Conduct",   description: "MCC is enforced from announcement date until results." },
      { id: "proxy-banned",  title: "No Proxy Voting",         description: "Only the registered voter may cast the vote in person (except postal ballot)." }
    ]
  });
});

// ── Candidate list (placeholder) ─────────────────────────────────────────────
router.get("/candidates", (_req, res) => {
  res.json({
    message: "Live candidate data integration with ECI is on the roadmap.",
    candidates: []
  });
});

export default router;
