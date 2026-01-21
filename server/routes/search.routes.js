import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: "Query required" });
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: process.env.GOOGLE_API_KEY,
          cx: process.env.SEARCH_ENGINE_ID,
          q: `${q} site:soundcloud.com`,
          num: 10,
        },
      },
    );

    const items = response.data.items || [];

    const tracks = items
      .filter(
        (item) =>
          item.link.includes("soundcloud.com") &&
          !item.link.includes("/sets") &&
          !item.link.includes("/followers"),
      )
      .map((item) => ({
        title: item.title.replace("- SoundCloud", "").trim(),
        artist: item.displayLink.replace("soundcloud.com", ""),
        url: item.link,
        description: item.snippet,
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
          item.link,
        )}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`,
      }));

    res.json({ tracks });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
