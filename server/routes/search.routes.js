import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query required" });

  try {
    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: process.env.GOOGLE_API_KEY,
          cx: process.env.SEARCH_ENGINE_ID,
          q: `${q} site:soundcloud.com`,
        },
      },
    );

    const tracks = response.data.items.map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
