// server/routes/search.js
import express from "express";
import axios from "axios";

const router = express.Router();

// YouTube API Configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; 
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos";

// ========== YOUTUBE AUDIO SEARCH ==========
async function searchYouTube(query) {
  try {
    console.log(`Searching YouTube for: "${query}"`);

    // Step 1: Search for videos
    const searchResponse = await axios.get(YOUTUBE_SEARCH_URL, {
      params: {
        part: "snippet",
        q: `${query} song audio`,
        type: "video",
        videoCategoryId: "10", // Music category
        maxResults: 15,
        key: YOUTUBE_API_KEY,
        videoDuration: "medium", // 4-20 minutes (typical for songs)
        relevanceLanguage: "en",
        safeSearch: "moderate",
      },
      timeout: 10000,
    });

    const videoIds = searchResponse.data.items.map((item) => item.id.videoId);

    if (videoIds.length === 0) {
      return [];
    }

    // Step 2: Get video details (including duration)
    const videoResponse = await axios.get(YOUTUBE_VIDEO_URL, {
      params: {
        part: "contentDetails,snippet",
        id: videoIds.join(","),
        key: YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });

    // Step 3: Format tracks
    const tracks = videoResponse.data.items
      .map((item) => {
        // Extract duration in seconds
        const duration = parseYouTubeDuration(item.contentDetails.duration);

        // Skip if too short or too long (likely not a song)
        if (duration < 60 || duration > 600) {
          // 1-10 minutes
          return null;
        }

        return {
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id}`,
          thumbnail:
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default.url,
          duration: duration,
          source: "YouTube",
          videoId: item.id,
        };
      })
      .filter((track) => track !== null);

    console.log(`Found ${tracks.length} YouTube tracks`);
    return tracks;
  } catch (error) {
    console.log(
      "YouTube search error:",
      error.response?.data?.error?.message || error.message,
    );

    // If quota exceeded, return empty array
    if (error.response?.data?.error?.code === 403) {
      console.log("YouTube API quota exceeded");
      return [];
    }

    return [];
  }
}

// Helper: Parse YouTube duration (PT1H2M10S format)
function parseYouTubeDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || "").replace("H", "") || 0;
  const minutes = (match[2] || "").replace("M", "") || 0;
  const seconds = (match[3] || "").replace("S", "") || 0;
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}

// ========== INTERNET ARCHIVE SEARCH ==========
async function searchInternetArchive(query) {
  try {
    console.log(`Searching Internet Archive for: "${query}"`);

    const searchUrl = "https://archive.org/advancedsearch.php";
    const searchParams = {
      q: `${query} AND mediatype:audio`,
      fl: "identifier,title,creator,year",
      rows: 10,
      page: 1,
      output: "json",
      sort: "downloads desc",
    };

    const response = await axios.get(searchUrl, {
      params: searchParams,
      timeout: 10000,
    });

    const docs = response.data.response?.docs || [];

    const tracks = await Promise.all(
      docs.slice(0, 8).map(async (item) => {
        try {
          const metadataUrl = `https://archive.org/metadata/${item.identifier}`;
          const metaResponse = await axios.get(metadataUrl, { timeout: 8000 });
          const files = metaResponse.data.files || [];

          const audioFile = files.find(
            (f) =>
              f.name?.endsWith(".mp3") ||
              f.name?.endsWith(".ogg") ||
              (f.format && f.format.includes("MP3")),
          );

          if (!audioFile) return null;

          return {
            title: item.title || "Unknown Track",
            artist: Array.isArray(item.creator)
              ? item.creator.join(", ")
              : item.creator || "Unknown Artist",
            year: item.year,
            url: `https://archive.org/download/${item.identifier}/${audioFile.name}`,
            source: "Internet Archive",
            format: audioFile.format || "mp3",
          };
        } catch (err) {
          console.log(`Skipping ${item.identifier}:`, err.message);
          return null;
        }
      }),
    );

    return tracks.filter((t) => t !== null);
  } catch (error) {
    console.log("Internet Archive search failed:", error.message);
    return [];
  }
}

// ========== MAIN SEARCH ROUTE ==========
router.get("/search", async (req, res) => {
  const { q, source } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({
      message: "Search query required",
      example: "/search?q=tamil songs",
      available_sources: ["both", "youtube", "archive"],
    });
  }

  try {
    console.log(`\n=== SEARCH START: "${q}" ===`);

    let tracks = [];
    const sourcesUsed = [];
    const searchSource = source || "both";

    // Search YouTube
    if (searchSource === "both" || searchSource === "youtube") {
      console.log("Searching YouTube...");
      const youtubeTracks = await searchYouTube(q);
      if (youtubeTracks.length > 0) {
        tracks.push(...youtubeTracks);
        sourcesUsed.push("YouTube");
        console.log(`YouTube results: ${youtubeTracks.length}`);
      }
    }

    // Search Internet Archive
    if (searchSource === "both" || searchSource === "archive") {
      console.log("Searching Internet Archive...");
      const archiveTracks = await searchInternetArchive(q);
      if (archiveTracks.length > 0) {
        tracks.push(...archiveTracks);
        sourcesUsed.push("Internet Archive");
        console.log(`Archive results: ${archiveTracks.length}`);
      }
    }

    // Remove duplicates
    const uniqueTracks = [];
    const seenUrls = new Set();

    tracks.forEach((track) => {
      if (track.url && !seenUrls.has(track.url)) {
        seenUrls.add(track.url);
        uniqueTracks.push(track);
      }
    });

    const finalTracks = uniqueTracks.slice(0, 15);

    const response = {
      query: q,
      total: finalTracks.length,
      sources: sourcesUsed,
      timestamp: new Date().toISOString(),
      tracks: finalTracks,
    };

    console.log(`=== SEARCH COMPLETE: ${finalTracks.length} tracks ===\n`);

    res.json(response);
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({
      message: "Search service error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========== YOUTUBE AUDIO EXTRACTION (Client-Side) ==========
// Note: For legal audio extraction, use a dedicated service or player
// Here are two approaches:

// Approach 1: Direct YouTube embed (Legal)
router.get("/youtube/player/:videoId", (req, res) => {
  const { videoId } = req.params;
  res.json({
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    playerType: "youtube_embed",
  });
});

// Approach 2: YouTube IFrame API info
router.get("/youtube/info/:videoId", async (req, res) => {
  const { videoId } = req.params;

  try {
    const response = await axios.get(YOUTUBE_VIDEO_URL, {
      params: {
        part: "snippet,contentDetails",
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });

    const video = response.data.items[0];
    res.json({
      title: video.snippet.title,
      artist: video.snippet.channelTitle,
      duration: parseYouTubeDuration(video.contentDetails.duration),
      thumbnail: video.snippet.thumbnails.medium?.url,
      publishedAt: video.snippet.publishedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== HEALTH CHECK ==========
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    services: {
      youtube: YOUTUBE_API_KEY ? "configured" : "not configured",
      internetArchive: "enabled",
    },
    endpoints: {
      search: "/search?q=YOUR_QUERY",
      youtubeInfo: "/youtube/info/VIDEO_ID",
      youtubePlayer: "/youtube/player/VIDEO_ID",
    },
  });
});

export default router;
