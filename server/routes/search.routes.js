// server/routes/search.js
import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim())
    return res.status(400).json({ message: "Query required" });

  try {
    // Internet Archive Advanced Search API
    const searchUrl = "https://archive.org/advancedsearch.php";
    const params = {
      q: `${q} AND mediatype:audio`, // search audio only
      fl: "identifier,title,creator", // fields to fetch
      rows: 20, // number of results
      page: 1,
      output: "json",
    };

    const response = await axios.get(searchUrl, { params });

    const docs = response.data.response.docs || [];

    const tracks = docs.map((item) => ({
      title: item.title,
      artist: item.creator || "Unknown Artist",
      url: `https://archive.org/download/${item.identifier}/${item.identifier}_64kb.mp3`, // example mp3 file
      embedUrl: `https://archive.org/download/${item.identifier}/${item.identifier}_64kb.mp3`,
    }));

    res.json({ tracks });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
