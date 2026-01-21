import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/embed", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.includes("soundcloud.com")) {
    return res.status(400).json({ message: "Valid SoundCloud URL required" });
  }

  try {
    const response = await axios.get("https://soundcloud.com/oembed", {
      params: {
        format: "json",
        url,
        maxheight: 166,
      },
      timeout: 5000,
    });

    res.json({
      html: response.data.html,
      title: response.data.title,
      author: response.data.author_name,
      thumbnail: response.data.thumbnail_url,
    });
  } catch (error) {
    console.error("SoundCloud embed error:", error.message);
    res.status(500).json({ message: "Failed to load embed" });
  }
});

export default router;
