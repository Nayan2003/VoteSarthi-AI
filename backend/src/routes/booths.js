// backend/src/routes/booths.js
/**
 * Polling booth lookup endpoint.
 * GET /api/booths?lat=&lng=   → returns nearby polling booths (no auth required)
 */
import { Router } from "express";
import { getNearbyBooths } from "../services/boothService.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    const booths = await getNearbyBooths({ lat, lng });
    res.json({ booths });
  } catch (err) {
    console.error("[Booths] Error:", err.message);
    res.status(500).json({ error: "Booth lookup failed.", details: err.message });
  }
});

export default router;
