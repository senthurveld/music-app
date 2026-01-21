// server/routes/search.js
import express from "express";
import axios from "axios";

const router = express.Router();

// IMPORTANT: Get this from Google Cloud Console
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "YOUR_API_KEY_HERE";

// Test YouTube API connection
router.get("/test", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: "test music",
          type: "video",
          maxResults: 1,
          key: YOUTUBE_API_KEY,
        },
        timeout: 5000,
      },
    );

    res.json({
      success: true,
      message: "YouTube API is working!",
      data: response.data,
      apiKeyExists: !!YOUTUBE_API_KEY,
    });
  } catch (error) {
    console.error(
      "YouTube API test failed:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      success: false,
      message: "YouTube API test failed",
      error: error.response?.data?.error?.message || error.message,
      apiKeyExists: !!YOUTUBE_API_KEY,
      help: "Get API key from: https://console.cloud.google.com/",
    });
  }
});

// Main search route
router.get("/", async (req, res) => {
  const { q, source = "youtube" } = req.query;

  console.log(`🔍 Search request: ${q}, source: ${source}`);

  if (!q || !q.trim()) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
      example: "/api/search?q=tamil+songs",
    });
  }

  try {
    let tracks = [];

    if (source === "youtube" || source === "both") {
      console.log("📺 Searching YouTube...");

      if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_API_KEY_HERE") {
        return res.status(500).json({
          success: false,
          message: "YouTube API key not configured",
          help: "Add YOUTUBE_API_KEY to environment variables",
          steps: [
            "1. Go to: https://console.cloud.google.com/",
            "2. Create project and enable YouTube Data API v3",
            "3. Create API key",
            "4. Add to .env file as YOUTUBE_API_KEY=your_key_here",
          ],
        });
      }

      // Search YouTube
      const searchResponse = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            q: `${q} song music`,
            type: "video",
            maxResults: 10,
            key: YOUTUBE_API_KEY,
            videoCategoryId: "10", // Music
            safeSearch: "moderate",
          },
          timeout: 10000,
        },
      );

      const videoIds = searchResponse.data.items
        .map((item) => item.id.videoId)
        .filter(Boolean);

      if (videoIds.length > 0) {
        // Get video details
        const videoResponse = await axios.get(
          "https://www.googleapis.com/youtube/v3/videos",
          {
            params: {
              part: "snippet,contentDetails",
              id: videoIds.join(","),
              key: YOUTUBE_API_KEY,
            },
            timeout: 10000,
          },
        );

        tracks = videoResponse.data.items.map((item) => {
          // Parse duration
          const durationStr = item.contentDetails.duration;
          let duration = 0;
          const match = durationStr.match(
            /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
          );

          if (match) {
            const hours = parseInt(match[1] || 0);
            const minutes = parseInt(match[2] || 0);
            const seconds = parseInt(match[3] || 0);
            duration = hours * 3600 + minutes * 60 + seconds;
          }

          return {
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id}`,
            thumbnail: item.snippet.thumbnails.medium?.url,
            duration: duration,
            source: "YouTube",
            videoId: item.id,
          };
        });
      }
    }

    // If no YouTube results and source is "both" or "archive"
    if ((tracks.length === 0 && source === "both") || source === "archive") {
      console.log("🏛️ Searching Internet Archive...");

      try {
        const archiveResponse = await axios.get(
          "https://archive.org/advancedsearch.php",
          {
            params: {
              q: `${q} AND mediatype:audio`,
              fl: "identifier,title,creator",
              rows: 10,
              output: "json",
              sort: "downloads desc",
            },
            timeout: 10000,
          },
        );

        const archiveItems = archiveResponse.data.response?.docs || [];

        for (const item of archiveItems.slice(0, 5)) {
          try {
            const metaResponse = await axios.get(
              `https://archive.org/metadata/${item.identifier}`,
              { timeout: 5000 },
            );

            const files = metaResponse.data.files || [];
            const audioFile = files.find((f) => f.name?.endsWith(".mp3"));

            if (audioFile) {
              tracks.push({
                title: item.title || "Unknown Track",
                artist: Array.isArray(item.creator)
                  ? item.creator[0]
                  : item.creator || "Unknown Artist",
                url: `https://archive.org/download/${item.identifier}/${audioFile.name}`,
                source: "Internet Archive",
              });
            }
          } catch (err) {
            console.log(`Skipping ${item.identifier}:`, err.message);
          }
        }
      } catch (error) {
        console.log("Archive search failed:", error.message);
      }
    }

    res.json({
      success: true,
      query: q,
      total: tracks.length,
      tracks: tracks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Search error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Search failed",
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
      debug:
        process.env.NODE_ENV !== "production"
          ? {
              youtubeKeyExists: !!YOUTUBE_API_KEY,
              errorDetails: error.response?.data,
            }
          : undefined,
    });
  }
});

export default router;
