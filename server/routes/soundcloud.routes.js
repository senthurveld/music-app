import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/embed", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ message: "Track URL required" });

  try {
    const response = await axios.get("https://soundcloud.com/oembed", {
      params: {
        format: "json",
        url,
      },
    });

    res.json(response.data);
  } catch {
    res.status(500).json({ message: "Failed to load embed" });
  }
});

export default router;
