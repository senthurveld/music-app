// server/routes/search.js
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const router = express.Router();

// ========== MASSTAMILAN.SBS SCRAPER ==========
async function searchMasstamilan(query) {
  try {
    console.log(`Searching Masstamilan.sbs for: ${query}`);

    // Search endpoint for masstamilan.sbs
    const searchUrl = `https://masstamilan.sbs/search`;

    const response = await axios.get(searchUrl, {
      params: {
        q: query,
        type: "music",
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://masstamilan.sbs/",
        "Accept-Encoding": "gzip, deflate, br",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const tracks = [];

    // Extract search results - based on masstamilan.sbs structure
    $("article, .music-item, .post").each((i, element) => {
      const titleElem = $(element).find("h2 a, h3 a, .title a");
      const title = titleElem.first().text().trim();
      const detailPath = titleElem.first().attr("href");

      if (title && detailPath) {
        // Extract artist from title or metadata
        let artist = "Unknown Artist";
        const artistMatch = title.match(/-(.*)/);
        if (artistMatch) {
          artist = artistMatch[1].trim();
        } else {
          const artistElem = $(element).find(".artist, .singer, .composer");
          if (artistElem.length) {
            artist = artistElem.text().trim();
          }
        }

        // Clean title (remove artist name if included)
        const cleanTitle = title.split("-")[0].trim();

        tracks.push({
          title: cleanTitle,
          artist: artist,
          detailUrl: detailPath.startsWith("http")
            ? detailPath
            : `https://masstamilan.sbs${detailPath}`,
          source: "Masstamilan",
        });
      }
    });

    // Get direct MP3 links for first 5 results
    const detailedTracks = [];
    for (const track of tracks.slice(0, 5)) {
      try {
        // Add delay to be respectful to the server
        await new Promise((resolve) => setTimeout(resolve, 800));

        const detailRes = await axios.get(track.detailUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 10000,
        });

        const $$ = cheerio.load(detailRes.data);
        let mp3Url = null;

        // Strategy 1: Look for direct audio player sources
        const audioPlayer = $$("audio").first();
        if (audioPlayer.length) {
          const source = audioPlayer.find("source").attr("src");
          if (source && (source.includes(".mp3") || source.includes(".m4a"))) {
            mp3Url = source.startsWith("http") ? source : `https:${source}`;
          }
        }

        // Strategy 2: Look for download buttons with MP3 links
        if (!mp3Url) {
          $$("a").each((i, el) => {
            const href = $$(el).attr("href");
            const text = $$(el).text().toLowerCase();

            if (href && (href.includes(".mp3") || href.includes(".m4a"))) {
              // Check if it's likely a download link
              if (
                text.includes("download") ||
                text.includes("play") ||
                text.includes("mp3") ||
                href.includes("/download/")
              ) {
                mp3Url = href.startsWith("http")
                  ? href
                  : `https://masstamilan.sbs${href}`;
                return false; // Break the loop
              }
            }
          });
        }

        // Strategy 3: Look for script tags with audio URLs
        if (!mp3Url) {
          const scripts = $$("script");
          for (let i = 0; i < scripts.length; i++) {
            const scriptContent = $$(scripts[i]).html();
            if (scriptContent) {
              const urlMatch = scriptContent.match(
                /(https?:\/\/[^\s"']+\.mp3)/i,
              );
              if (urlMatch) {
                mp3Url = urlMatch[1];
                break;
              }
            }
          }
        }

        // Strategy 4: Look for iframes with audio sources
        if (!mp3Url) {
          $$("iframe").each((i, el) => {
            const src = $$(el).attr("src");
            if ((src && src.includes("audio")) || src.includes("player")) {
              // This might need additional iframe parsing
              mp3Url = src;
              return false;
            }
          });
        }

        if (mp3Url) {
          detailedTracks.push({
            title: track.title,
            artist: track.artist,
            url: mp3Url,
            source: track.source,
          });
          console.log(
            `Found MP3 for "${track.title}": ${mp3Url.substring(0, 60)}...`,
          );
        }
      } catch (err) {
        console.log(
          `Failed to fetch details for "${track.title}":`,
          err.message,
        );
      }
    }

    return detailedTracks;
  } catch (error) {
    console.log("Masstamilan search failed:", error.message);
    // Check if it's a 404 or different error
    if (error.response?.status === 404) {
      console.log(
        "Masstamilan search endpoint not found, trying homepage scraping...",
      );
      return await fallbackMasstamilanScrape(query);
    }
    return [];
  }
}

// Fallback: Direct homepage scraping if search endpoint fails
async function fallbackMasstamilanScrape(query) {
  try {
    const response = await axios.get("https://masstamilan.sbs", {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const tracks = [];

    // Look for music links on homepage
    $("a").each((i, element) => {
      const href = $(element).attr("href");
      const text = $(element).text();

      if (
        href &&
        href.includes("/music/") &&
        text.toLowerCase().includes(query.toLowerCase())
      ) {
        tracks.push({
          title: text.trim(),
          artist: "Various Artists",
          detailUrl: href.startsWith("http")
            ? href
            : `https://masstamilan.sbs${href}`,
          source: "Masstamilan",
        });
      }
    });

    return await fetchMP3FromDetails(tracks.slice(0, 3));
  } catch (error) {
    console.log("Fallback scraping failed:", error.message);
    return [];
  }
}

async function fetchMP3FromDetails(tracks) {
  const results = [];
  for (const track of tracks) {
    try {
      const detailRes = await axios.get(track.detailUrl, { timeout: 8000 });
      const $$ = cheerio.load(detailRes.data);

      // Look for any MP3 links in the detail page
      $$("a[href*='.mp3'], a[href*='.m4a']").each((i, el) => {
        const href = $$(el).attr("href");
        if (href && !href.includes("advertisement")) {
          results.push({
            title: track.title,
            artist: track.artist,
            url: href.startsWith("http")
              ? href
              : `https://masstamilan.sbs${href}`,
            source: "Masstamilan",
          });
          return false; // Stop after first find
        }
      });
    } catch (err) {
      continue;
    }
  }
  return results;
}

// ========== INTERNET ARCHIVE SEARCH ==========
async function searchInternetArchive(query) {
  try {
    console.log(`Searching Internet Archive for: ${query}`);

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
      timeout: 12000,
    });

    const docs = response.data.response?.docs || [];

    const tracks = await Promise.all(
      docs.slice(0, 8).map(async (item) => {
        try {
          const metadataUrl = `https://archive.org/metadata/${item.identifier}`;
          const metaResponse = await axios.get(metadataUrl, { timeout: 8000 });
          const files = metaResponse.data.files || [];

          // Find playable audio files (prioritize MP3)
          const audioFile = files.find(
            (f) =>
              f.name &&
              (f.name.endsWith(".mp3") ||
                f.name.endsWith(".ogg") ||
                (f.format && f.format.includes("MP3"))),
          );

          if (!audioFile) return null;

          return {
            title: item.title || `Track ${item.identifier}`,
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
  const { q, source, limit } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({
      message: "Search query required",
      example: "/search?q=thalaivar",
      available_sources: ["both", "masstamilan", "archive"],
    });
  }

  try {
    console.log(`\n=== New search request: "${q}" ===`);

    let tracks = [];
    let sourcesUsed = [];
    const maxResults = parseInt(limit) || 15;

    // Determine which sources to use
    const useMasstamilan =
      !source || source === "both" || source === "masstamilan";
    const useArchive = !source || source === "both" || source === "archive";

    // Search both sources in parallel for better performance
    const searchPromises = [];

    if (useMasstamilan) {
      searchPromises.push(
        searchMasstamilan(q).then((results) => {
          if (results.length > 0) sourcesUsed.push("Masstamilan");
          return results;
        }),
      );
    }

    if (useArchive) {
      searchPromises.push(
        searchInternetArchive(q).then((results) => {
          if (results.length > 0) sourcesUsed.push("Internet Archive");
          return results;
        }),
      );
    }

    // Wait for all searches to complete
    const allResults = await Promise.allSettled(searchPromises);

    // Combine results
    allResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        tracks = [...tracks, ...result.value];
      }
    });

    // Remove duplicates by URL
    const uniqueTracks = [];
    const seenUrls = new Set();

    tracks.forEach((track) => {
      if (track.url && !seenUrls.has(track.url)) {
        seenUrls.add(track.url);
        uniqueTracks.push(track);
      }
    });

    // Limit results
    const finalTracks = uniqueTracks.slice(0, maxResults);

    // Build response
    const response = {
      query: q,
      total: finalTracks.length,
      sources: sourcesUsed,
      timestamp: new Date().toISOString(),
      tracks: finalTracks.map((track) => ({
        title: track.title.substring(0, 100),
        artist: track.artist,
        url: track.url,
        source: track.source,
        // Additional metadata for frontend if needed
        ...(track.year && { year: track.year }),
        ...(track.format && { format: track.format }),
      })),
    };

    console.log(
      `=== Search completed: ${finalTracks.length} tracks from ${sourcesUsed.join(", ")} ===\n`,
    );

    // Handle no results
    if (finalTracks.length === 0) {
      return res.status(200).json({
        ...response,
        message: "No tracks found. Try different keywords.",
        suggestions: [
          "Try English transliteration of Tamil words (e.g., 'thalaivar' instead of 'தலைவர்')",
          "Search for movie names instead of specific songs",
          "Try simpler, more common terms",
        ],
      });
    }

    res.json(response);
  } catch (error) {
    console.error("Search route error:", error.message);

    const statusCode = error.response?.status || 500;
    const errorMessage =
      error.code === "ECONNABORTED"
        ? "Request timeout - try again"
        : "Search service error";

    res.status(statusCode).json({
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      suggestion: "Try again in a few moments or use a simpler query",
    });
  }
});

// ========== HEALTH CHECK & TEST ENDPOINTS ==========
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      masstamilan: "enabled",
      internetArchive: "enabled",
    },
    endpoints: {
      search: "/search?q=YOUR_QUERY",
      test: "/test",
    },
  });
});

router.get("/test", async (req, res) => {
  try {
    // Test both sources with a known query
    const testQuery = "tamil songs";

    const [masstamilanResults, archiveResults] = await Promise.all([
      searchMasstamilan(testQuery),
      searchInternetArchive(testQuery),
    ]);

    res.json({
      test: "completed",
      query: testQuery,
      results: {
        masstamilan: {
          count: masstamilanResults.length,
          sample: masstamilanResults.slice(0, 2).map((t) => ({
            title: t.title,
            hasUrl: !!t.url,
          })),
        },
        internetArchive: {
          count: archiveResults.length,
          sample: archiveResults.slice(0, 2).map((t) => ({
            title: t.title,
            hasUrl: !!t.url,
          })),
        },
      },
      status: "All systems operational",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      status: "Test failed",
    });
  }
});

export default router;
