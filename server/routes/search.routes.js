// server/routes/search.js - UPDATED WITH DEBUG LOGS
import express from "express";
import axios from "axios";

const router = express.Router();

const YOUTUBE_API_KEY =
  process.env.YOUTUBE_API_KEY || "AIzaSyBmaAJIeWtYUGZBnNIeoVRyLQ6xLh9t0ys";

// Debug function to log requests
const logRequest = (url, params, response, error = null) => {
  console.log("\n=== YOUTUBE API REQUEST ===");
  console.log("URL:", url);
  console.log("Params:", JSON.stringify(params, null, 2));
  if (response) {
    console.log("Status:", response.status);
    console.log("Response keys:", Object.keys(response.data || {}));
  }
  if (error) {
    console.log("Error:", error.message);
    console.log("Error details:", error.response?.data || "No response data");
  }
  console.log("=== END REQUEST ===\n");
};

// Search YouTube with detailed logging
async function searchYouTube(query) {
  try {
    console.log(`\n🔍 Searching YouTube for: "${query}"`);

    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
      console.error("❌ ERROR: YouTube API key not configured!");
      console.log("Get API key from: https://console.cloud.google.com/");
      console.log("Then set YOUTUBE_API_KEY in .env file or replace in code");
      return [];
    }

    // Step 1: Search for videos
    const searchParams = {
      part: "snippet",
      q: `${query} music song`,
      type: "video",
      maxResults: 10,
      key: YOUTUBE_API_KEY,
      videoCategoryId: "10", // Music category
      safeSearch: "moderate",
      order: "relevance",
    };

    console.log("📤 Sending search request...");
    const searchResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: searchParams,
        timeout: 15000,
      },
    );

    logRequest(
      "https://www.googleapis.com/youtube/v3/search",
      searchParams,
      searchResponse,
    );

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      console.log("📭 No videos found in search results");
      return [];
    }

    const videoIds = searchResponse.data.items
      .map((item) => item.id.videoId)
      .filter((id) => id);
    console.log(`📊 Found ${videoIds.length} video IDs:`, videoIds);

    if (videoIds.length === 0) {
      return [];
    }

    // Step 2: Get video details
    const videoParams = {
      part: "contentDetails,snippet,statistics",
      id: videoIds.join(","),
      key: YOUTUBE_API_KEY,
    };

    console.log("📤 Sending video details request...");
    const videoResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: videoParams,
        timeout: 15000,
      },
    );

    logRequest(
      "https://www.googleapis.com/youtube/v3/videos",
      videoParams,
      videoResponse,
    );

    // Step 3: Process results
    const tracks = videoResponse.data.items
      .map((item) => {
        // Parse duration from ISO 8601 format (PT1H2M10S)
        let duration = 0;
        const durationStr = item.contentDetails?.duration || "";

        if (durationStr) {
          const match = durationStr.match(
            /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
          );
          if (match) {
            const hours = parseInt(match[1] || 0);
            const minutes = parseInt(match[2] || 0);
            const seconds = parseInt(match[3] || 0);
            duration = hours * 3600 + minutes * 60 + seconds;
          }
        }

        // Only include if it's likely a song (1-10 minutes)
        if (duration < 60 || duration > 600) {
          console.log(
            `⏱️ Skipping ${item.snippet.title} - Duration: ${duration}s (outside 1-10 minute range)`,
          );
          return null;
        }

        // Get best thumbnail
        let thumbnail =
          item.snippet.thumbnails?.maxres?.url ||
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url;

        return {
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id}`,
          thumbnail: thumbnail,
          duration: duration,
          source: "YouTube",
          videoId: item.id,
          viewCount: item.statistics?.viewCount || 0,
        };
      })
      .filter((track) => track !== null);

    console.log(`✅ Processed ${tracks.length} tracks`);
    tracks.forEach((track, i) => {
      console.log(
        `${i + 1}. ${track.title} - ${track.artist} (${Math.floor(track.duration / 60)}:${track.duration % 60})`,
      );
    });

    return tracks;
  } catch (error) {
    console.error("❌ YouTube search failed!");

    if (error.response) {
      // API error
      console.log("Status:", error.response.status);
      console.log("Status Text:", error.response.statusText);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 403) {
        console.log("\n🔴 POSSIBLE ISSUES:");
        console.log("1. YouTube Data API v3 not enabled");
        console.log("2. API key invalid or expired");
        console.log("3. Daily quota exceeded");
        console.log("4. API key restrictions (IP, referrer, etc.)");
        console.log("\n✅ SOLUTIONS:");
        console.log("- Go to: https://console.cloud.google.com/");
        console.log("- Enable 'YouTube Data API v3'");
        console.log("- Check quota usage");
        console.log("- Remove API key restrictions for testing");
      }
    } else if (error.request) {
      // Network error
      console.log("Network error - No response received");
      console.log("Request:", error.request);
    } else {
      // Other error
      console.log("Error:", error.message);
    }

    return [];
  }
}

// Test function to verify YouTube API
async function testYouTubeAPI() {
  console.log("\n🎵 TESTING YOUTUBE API CONNECTION 🎵");

  try {
    // Test with a simple search
    const testParams = {
      part: "snippet",
      q: "test music",
      type: "video",
      maxResults: 1,
      key: YOUTUBE_API_KEY,
    };

    console.log("Testing API key...");
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: testParams,
        timeout: 10000,
      },
    );

    if (response.data.items && response.data.items.length > 0) {
      console.log("✅ YouTube API is working!");
      console.log(`Found: ${response.data.items[0].snippet.title}`);
      return true;
    } else {
      console.log("⚠️ API responded but no items found");
      return false;
    }
  } catch (error) {
    console.log("❌ API test failed!");
    console.log(
      "Error:",
      error.response?.data?.error?.message || error.message,
    );
    return false;
  }
}

// Search Internet Archive
async function searchInternetArchive(query) {
  try {
    console.log(`Searching Internet Archive for: "${query}"`);

    const response = await axios.get("https://archive.org/advancedsearch.php", {
      params: {
        q: `${query} AND mediatype:audio`,
        fl: "identifier,title,creator,year",
        rows: 10,
        output: "json",
        sort: "downloads desc",
      },
      timeout: 15000,
    });

    const docs = response.data.response?.docs || [];

    const tracks = await Promise.all(
      docs.slice(0, 5).map(async (item) => {
        try {
          const metaResponse = await axios.get(
            `https://archive.org/metadata/${item.identifier}`,
            { timeout: 10000 },
          );

          const files = metaResponse.data.files || [];
          const audioFile = files.find(
            (f) => f.name?.endsWith(".mp3") || f.name?.endsWith(".ogg"),
          );

          if (!audioFile) return null;

          return {
            title: item.title || "Unknown Track",
            artist: Array.isArray(item.creator)
              ? item.creator[0]
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

    const filteredTracks = tracks.filter((t) => t !== null);
    console.log(`Found ${filteredTracks.length} Archive tracks`);

    return filteredTracks;
  } catch (error) {
    console.log("Archive search error:", error.message);
    return [];
  }
}

// ========== MAIN SEARCH ROUTE ==========
router.get("/search", async (req, res) => {
  const { q, source, debug } = req.query;

  console.log(`\n🌐 NEW SEARCH REQUEST:`);
  console.log(`Query: "${q}"`);
  console.log(`Source: ${source || "both"}`);
  console.log(`API Key exists: ${!!YOUTUBE_API_KEY}`);
  console.log(
    `API Key sample: ${YOUTUBE_API_KEY ? YOUTUBE_API_KEY.substring(0, 10) + "..." : "none"}`,
  );

  if (!q || !q.trim()) {
    return res.status(400).json({
      success: false,
      message: "Search query required",
      example: "http://localhost:3000/api/search?q=tamil+songs",
      debug: "Add &debug=true to see detailed logs",
    });
  }

  try {
    // Test YouTube API if requested
    if (debug === "true") {
      console.log("\n🔧 DEBUG MODE ENABLED");
      await testYouTubeAPI();
    }

    let tracks = [];
    const sourcesUsed = [];
    const errors = [];

    // Search YouTube
    if (!source || source === "both" || source === "youtube") {
      console.log("\n📺 SEARCHING YOUTUBE...");
      const youtubeStart = Date.now();
      const youtubeTracks = await searchYouTube(q);
      const youtubeTime = Date.now() - youtubeStart;

      console.log(`YouTube search took ${youtubeTime}ms`);

      if (youtubeTracks.length > 0) {
        tracks.push(...youtubeTracks);
        sourcesUsed.push("YouTube");
      } else {
        errors.push("YouTube returned 0 results (check API key/quotas)");
      }
    }

    // Search Internet Archive
    if (!source || source === "both" || source === "archive") {
      console.log("\n🏛️ SEARCHING INTERNET ARCHIVE...");
      const archiveStart = Date.now();
      const archiveTracks = await searchInternetArchive(q);
      const archiveTime = Date.now() - archiveStart;

      console.log(`Archive search took ${archiveTime}ms`);

      if (archiveTracks.length > 0) {
        tracks.push(...archiveTracks);
        sourcesUsed.push("Internet Archive");
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

    // Build response
    const response = {
      success: true,
      query: q,
      total: uniqueTracks.length,
      sources: sourcesUsed,
      timestamp: new Date().toISOString(),
      tracks: uniqueTracks,
      apiInfo: {
        youtubeConfigured:
          !!YOUTUBE_API_KEY && YOUTUBE_API_KEY !== "YOUR_YOUTUBE_API_KEY_HERE",
        youtubeKeyPreview: YOUTUBE_API_KEY
          ? YOUTUBE_API_KEY.substring(0, 10) + "..."
          : "not set",
      },
    };

    // Add errors if any
    if (errors.length > 0) {
      response.errors = errors;
    }

    // Add debug info if requested
    if (debug === "true") {
      response.debug = {
        youtubeApiKeyExists: !!YOUTUBE_API_KEY,
        youtubeApiKeyPreview: YOUTUBE_API_KEY
          ? YOUTUBE_API_KEY.substring(0, 15) + "..."
          : "none",
      };
    }

    console.log(`\n✅ SEARCH COMPLETE:`);
    console.log(`Total tracks: ${uniqueTracks.length}`);
    console.log(`Sources used: ${sourcesUsed.join(", ")}`);
    console.log(`First track: ${uniqueTracks[0]?.title || "none"}`);

    res.json(response);
  } catch (error) {
    console.error("❌ Search route error:", error);

    const errorResponse = {
      success: false,
      message: "Search failed",
      query: q,
      timestamp: new Date().toISOString(),
      debugInfo: {
        youtubeApiKey: YOUTUBE_API_KEY
          ? "Set (partial): " + YOUTUBE_API_KEY.substring(0, 10) + "..."
          : "Not set",
        error: error.message,
        errorType: error.name,
      },
    };

    // Add more details in development
    if (process.env.NODE_ENV === "development") {
      errorResponse.stack = error.stack;
      errorResponse.fullError = error.toString();
    }

    res.status(500).json(errorResponse);
  }
});

// ========== TEST ENDPOINTS ==========
router.get("/test/youtube", async (req, res) => {
  try {
    const isWorking = await testYouTubeAPI();

    res.json({
      test: "YouTube API Connection",
      timestamp: new Date().toISOString(),
      success: isWorking,
      apiKeyConfigured:
        !!YOUTUBE_API_KEY && YOUTUBE_API_KEY !== "YOUR_YOUTUBE_API_KEY_HERE",
      apiKeyPreview: YOUTUBE_API_KEY
        ? YOUTUBE_API_KEY.substring(0, 10) + "..."
        : "not set",
      stepsToFix: !isWorking
        ? [
            "1. Go to https://console.cloud.google.com/",
            "2. Create a new project or select existing",
            "3. Enable 'YouTube Data API v3'",
            "4. Create credentials > API Key",
            "5. Copy key and set as YOUTUBE_API_KEY in .env file",
            "6. Remove any IP/HTTP restrictions on the key initially",
          ]
        : null,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.response?.data || "No additional details",
    });
  }
});

router.get("/test/search", async (req, res) => {
  const testQueries = ["tamil songs", "ar rahman", "instrumental"];
  const results = {};

  for (const query of testQueries) {
    const youtubeResults = await searchYouTube(query);
    const archiveResults = await searchInternetArchive(query);

    results[query] = {
      youtube: youtubeResults.length,
      archive: archiveResults.length,
      youtubeTitles: youtubeResults.slice(0, 2).map((t) => t.title),
      archiveTitles: archiveResults.slice(0, 2).map((t) => t.title),
    };
  }

  res.json({
    test: "Multi-query Search Test",
    results: results,
    summary: {
      totalYouTube: Object.values(results).reduce(
        (sum, r) => sum + r.youtube,
        0,
      ),
      totalArchive: Object.values(results).reduce(
        (sum, r) => sum + r.archive,
        0,
      ),
    },
  });
});

// ========== GET YOUTUBE API STATUS ==========
router.get("/status", (req, res) => {
  res.json({
    service: "Music Search API",
    status: "running",
    youtube: {
      configured:
        !!YOUTUBE_API_KEY &&
        YOUTUBE_API_KEY !== "AIzaSyBmaAJIeWtYUGZBnNIeoVRyLQ6xLh9t0ys",
      keyExists: !!YOUTUBE_API_KEY,
      keyPreview: YOUTUBE_API_KEY
        ? YOUTUBE_API_KEY.substring(0, 8) + "..."
        : "none",
      testUrl: "/api/test/youtube",
    },
    archive: {
      configured: true,
      testUrl: "/api/search?q=test&source=archive",
    },
    endpoints: {
      search: "/api/search?q=QUERY",
      youtubeOnly: "/api/search?q=QUERY&source=youtube",
      archiveOnly: "/api/search?q=QUERY&source=archive",
      test: "/api/test/youtube",
    },
  });
});

export default router;
