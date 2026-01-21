// server/routes/search.js
import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim())
    return res.status(400).json({ message: "Query required" });

  try {
    const searchUrl = "https://archive.org/advancedsearch.php";
    const searchParams = {
      q: `${q} AND mediatype:audio`,
      fl: "identifier,title,creator",
      rows: 20,
      page: 1,
      output: "json",
    };

    const response = await axios.get(searchUrl, { params: searchParams });
    const docs = response.data.response.docs || [];

    const tracks = await Promise.all(
      docs.map(async (item) => {
        // Get the files for this item
        const filesRes = await axios.get(
          `https://archive.org/metadata/${item.identifier}`,
        );
        const files = filesRes.data.files || [];

        // Try to find an mp3 file
        const mp3File = files.find((f) => f.name.endsWith(".mp3"));
        const mp3Url = mp3File
          ? `https://archive.org/download/${item.identifier}/${mp3File.name}`
          : null;

        return {
          title: item.title,
          artist: item.creator || "Unknown Artist",
          url: mp3Url, // direct playable mp3
        };
      }),
    );

    res.json({ tracks });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
