// server/routes/search.js
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const router = express.Router();

// ========== MASSTAMILAN.SBS DUAL-STRATEGY ==========

// STRATEGY 1: SEARCH FOR SONGS (Returns list of songs)
async function searchMasstamilan(query) {
  try {
    console.log(`Searching Masstamilan for: "${query}"`);

    // Use the search endpoint that returns HTML list
    const searchUrl = `https://masstamilan.sbs/search/list`;

    const response = await axios.get(searchUrl, {
      params: {
        q: query,
        search: "song",
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        Referer: "https://masstamilan.sbs/",
        "Cache-Control": "max-age=0",
      },
      timeout: 15000,
    });

    console.log(`Search response status: ${response.status}`);

    const $ = cheerio.load(response.data);
    const searchResults = [];

    // STEP 1: Parse search results page
    // Look for song items in search results
    $(".song-item, article, .post, .item, div[class*='song']").each(
      (i, element) => {
        // Find the song title and link
        const titleElem = $(element).find(
          "h2 a, h3 a, .title a, a[href*='/music/']",
        );
        const title = titleElem.text().trim();
        const detailPath = titleElem.attr("href");

        if (title && detailPath && detailPath.includes("/music/")) {
          // Try to extract artist
          let artist = "Unknown Artist";

          // Method 1: Look for artist in the same container
          const artistElem = $(element).find(
            ".artist, .singer, .music-director, span[class*='artist']",
          );
          if (artistElem.length) {
            artist = artistElem.text().trim();
          }
          // Method 2: Try to extract from title (common pattern: "Song - Artist")
          else if (title.includes("-")) {
            const parts = title.split("-");
            if (parts.length > 1) {
              artist = parts[parts.length - 1].trim();
            }
          }

          // Clean title
          const cleanTitle = title.split("-")[0].trim();

          searchResults.push({
            title: cleanTitle,
            artist: artist,
            detailUrl: detailPath.startsWith("http")
              ? detailPath
              : `https://masstamilan.sbs${detailPath}`,
            source: "Masstamilan",
          });
        }
      },
    );

    // Alternative: Look for all /music/ links if specific selectors fail
    if (searchResults.length === 0) {
      $("a[href*='/music/']").each((i, element) => {
        const title = $(element).text().trim();
        const detailPath = $(element).attr("href");

        if (title && title.length > 2 && !title.includes("#")) {
          searchResults.push({
            title: title,
            artist: "Various Artists",
            detailUrl: detailPath.startsWith("http")
              ? detailPath
              : `https://masstamilan.sbs${detailPath}`,
            source: "Masstamilan",
          });
        }
      });
    }

    console.log(`Found ${searchResults.length} songs in search results`);

    // STEP 2: Get MP3 links from individual song pages
    const tracksWithMP3 = await getMP3FromSongPages(searchResults.slice(0, 8));

    return tracksWithMP3;
  } catch (error) {
    console.log("Masstamilan search error:", error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
    }
    return [];
  }
}

// STRATEGY 2: EXTRACT MP3 FROM INDIVIDUAL SONG PAGES
async function getMP3FromSongPages(songResults) {
  const tracks = [];

  // Process songs in parallel with delays
  const promises = songResults.map(async (song, index) => {
    try {
      // Add delay to avoid overwhelming server
      await new Promise((resolve) => setTimeout(resolve, index * 500));

      console.log(`Fetching song page: ${song.detailUrl}`);
      const response = await axios.get(song.detailUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      const $$ = cheerio.load(response.data);
      let mp3Url = null;

      // METHOD 1: Check for audio player with direct MP3
      const audioPlayer = $$("audio").first();
      if (audioPlayer.length) {
        const source =
          audioPlayer.attr("src") || audioPlayer.find("source").attr("src");
        if (source && source.includes(".mp3")) {
          mp3Url = source.startsWith("http") ? source : `https:${source}`;
        }
      }

      // METHOD 2: Look for download buttons
      if (!mp3Url) {
        $$("a").each((i, el) => {
          const href = $$(el).attr("href");
          const text = $$(el).text().toLowerCase();

          if (href && (href.includes(".mp3") || href.includes("download"))) {
            if (
              text.includes("download") ||
              text.includes("mp3") ||
              href.includes(".mp3")
            ) {
              mp3Url = href.startsWith("http")
                ? href
                : `https://masstamilan.sbs${href}`;
              return false; // Break loop
            }
          }
        });
      }

      // METHOD 3: Look for iframes that might contain audio
      if (!mp3Url) {
        $$("iframe").each((i, el) => {
          const src = $$(el).attr("src");
          if (src && (src.includes("audio") || src.includes("player"))) {
            // Try to fetch the iframe content
            mp3Url = src;
            return false;
          }
        });
      }

      // METHOD 4: Search in page HTML for MP3 links
      if (!mp3Url) {
        const html = response.data;
        const mp3Regex = /(https?:\/\/[^\s"']+\.mp3)/i;
        const match = html.match(mp3Regex);
        if (match) {
          mp3Url = match[1];
        }
      }

      // METHOD 5: Check for data attributes that might contain MP3 URL
      if (!mp3Url) {
        const dataAudio = $$("[data-audio], [data-src], [data-url]").first();
        if (dataAudio.length) {
          const dataUrl =
            dataAudio.attr("data-audio") ||
            dataAudio.attr("data-src") ||
            dataAudio.attr("data-url");
          if (dataUrl && dataUrl.includes(".mp3")) {
            mp3Url = dataUrl.startsWith("http") ? dataUrl : `https:${dataUrl}`;
          }
        }
      }

      if (mp3Url) {
        // Try to get better title/artist from song page
        let finalTitle = song.title;
        let finalArtist = song.artist;

        const pageTitle = $$("h1").text().trim() || $$("title").text().trim();
        if (pageTitle) {
          const cleanTitle = pageTitle.replace(/-\s*Masstamilan.*/i, "").trim();
          finalTitle = cleanTitle || finalTitle;
        }

        // Look for artist in meta tags or content
        const artistMeta = $$(
          'meta[name="artist"], meta[property="music:musician"]',
        ).attr("content");
        if (artistMeta) {
          finalArtist = artistMeta;
        } else {
          // Try to extract from page content
          $$("p, div").each((i, el) => {
            const text = $$(el).text();
            if (text.includes("Artist:") || text.includes("Singer:")) {
              const match =
                text.match(/Artist:\s*(.+?)(?:\n|$)/i) ||
                text.match(/Singer:\s*(.+?)(?:\n|$)/i);
              if (match) {
                finalArtist = match[1].trim();
                return false;
              }
            }
          });
        }

        return {
          title: finalTitle.substring(0, 100),
          artist: finalArtist,
          url: mp3Url,
          source: "Masstamilan",
          detailUrl: song.detailUrl,
        };
      }
    } catch (error) {
      console.log(`Failed to fetch ${song.title}:`, error.message);
    }
    return null;
  });

  const results = await Promise.all(promises);
  return results.filter((track) => track !== null);
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
      docs.slice(0, 6).map(async (item) => {
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

// ========== DIRECT SONG URL FETCH ==========
// If user provides direct masstamilan song URL
async function fetchDirectSong(url) {
  try {
    console.log(`Fetching direct song from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract MP3 using same methods as above
    let mp3Url = null;

    // Try audio element first
    const audioPlayer = $("audio").first();
    if (audioPlayer.length) {
      const source =
        audioPlayer.attr("src") || audioPlayer.find("source").attr("src");
      if (source && source.includes(".mp3")) {
        mp3Url = source.startsWith("http") ? source : `https:${source}`;
      }
    }

    // Try download links
    if (!mp3Url) {
      $("a").each((i, el) => {
        const href = $(el).attr("href");
        if (href && href.includes(".mp3")) {
          mp3Url = href.startsWith("http")
            ? href
            : `https://masstamilan.sbs${href}`;
          return false;
        }
      });
    }

    // Extract title and artist
    const title =
      $("h1").text().trim() ||
      $("title")
        .text()
        .replace(/-\s*Masstamilan.*/i, "")
        .trim() ||
      "Unknown Song";

    let artist = "Unknown Artist";
    const artistMeta = $('meta[name="artist"]').attr("content");
    if (artistMeta) {
      artist = artistMeta;
    }

    if (mp3Url) {
      return [
        {
          title: title,
          artist: artist,
          url: mp3Url,
          source: "Masstamilan (Direct)",
          directUrl: url,
        },
      ];
    }

    return [];
  } catch (error) {
    console.log("Direct song fetch failed:", error.message);
    return [];
  }
}

// ========== MAIN SEARCH ROUTE ==========
router.get("/search", async (req, res) => {
  const { q, source, url } = req.query;

  // Handle direct URL requests
  if (url && url.includes("masstamilan.sbs/music/")) {
    try {
      const tracks = await fetchDirectSong(url);
      return res.json({
        query: "Direct URL",
        total: tracks.length,
        sources: ["Masstamilan Direct"],
        timestamp: new Date().toISOString(),
        tracks: tracks,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch direct URL" });
    }
  }

  if (!q || !q.trim()) {
    return res.status(400).json({
      message: "Search query required",
      example: "/search?q=yuvan",
      available_sources: ["both", "masstamilan", "archive"],
      direct_url: "/search?url=https://masstamilan.sbs/music/nallaru-po#/",
    });
  }

  try {
    console.log(`\n=== SEARCH START: "${q}" ===`);

    let tracks = [];
    const sourcesUsed = [];
    const searchSource = source || "both";

    // Search Masstamilan
    if (searchSource === "both" || searchSource === "masstamilan") {
      console.log("Searching Masstamilan...");
      const masstamilanTracks = await searchMasstamilan(q);
      if (masstamilanTracks.length > 0) {
        tracks.push(...masstamilanTracks);
        sourcesUsed.push("Masstamilan");
        console.log(`Masstamilan results: ${masstamilanTracks.length}`);
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

// ========== TEST ENDPOINTS ==========
router.get("/test/masstamilan", async (req, res) => {
  try {
    // Test search
    const searchResults = await searchMasstamilan("yuvan");

    // Test direct song fetch
    const directSong = await fetchDirectSong(
      "https://masstamilan.sbs/music/nallaru-po#/",
    );

    res.json({
      search_test: {
        query: "yuvan",
        results: searchResults.length,
        tracks: searchResults.slice(0, 2),
      },
      direct_test: {
        url: "https://masstamilan.sbs/music/nallaru-po#/",
        results: directSong.length,
        track: directSong[0] || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== DEBUG SEARCH PAGE ==========
router.get("/debug/search-page", async (req, res) => {
  const { q } = req.query;

  try {
    const response = await axios.get("https://masstamilan.sbs/search/list", {
      params: { q: q || "tamil", search: "song" },
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(response.data);

    // Extract all useful information
    const pageInfo = {
      title: $("title").text(),
      h1: $("h1").text(),
      totalLinks: $("a").length,
      musicLinks: [],
      structure: [],
    };

    // Get all /music/ links
    $("a[href*='/music/']").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (text && text.length > 2) {
        pageInfo.musicLinks.push({ text: text.substring(0, 50), href: href });
      }
    });

    // Analyze structure
    $("body > *").each((i, el) => {
      const tag = $(el).prop("tagName");
      const className = $(el).attr("class");
      const id = $(el).attr("id");
      if (tag && (className || id)) {
        pageInfo.structure.push(`${tag}.${className || ""}#${id || ""}`);
      }
    });

    res.json(pageInfo);
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default router;
