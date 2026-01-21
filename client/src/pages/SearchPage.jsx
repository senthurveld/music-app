/* eslint-disable react-hooks/exhaustive-deps */
// frontend/pages/SearchPage.jsx - UPDATED ERROR HANDLING
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import TrackCard from "../components/TrackCard";
import ErrorDisplay from "../components/ErrorDisplay";
import { Home, Search, Youtube, Globe, Music, RefreshCw, YoutubeIcon, VideoIcon } from "lucide-react";

const SearchPage = () => {
  const [params] = useSearchParams();
  const initialQuery = params.get("q") || "";
  const navigate = useNavigate();

  const [query, setQuery] = useState(initialQuery);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchSource, setSearchSource] = useState("both");
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({ youtube: true, archive: true });
  const [debugInfo, setDebugInfo] = useState(null);

  const goToHome = () => navigate("/");

  const searchTracks = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);
    setTracks([]);

    try {
      const url = `/api/search?q=${encodeURIComponent(query)}${searchSource !== "both" ? `&source=${searchSource}` : ""}&debug=true`;
      console.log("🔍 Search URL:", url);

      const res = await api.get(url);
      console.log("📦 Response:", res.data);

      if (res.data.success === false) {
        setError(res.data.message || "Search failed");
        setDebugInfo(res.data.debugInfo);
        return;
      }

      setTracks(res.data.tracks || []);
      setApiStatus({
        youtube: res.data.sources?.includes("YouTube") ?? true,
        archive: res.data.sources?.includes("Internet Archive") ?? true,
      });

      if (res.data.tracks?.length === 0) {
        setError("No tracks found. Try different keywords or check source.");
      }

      if (res.data.errors) {
        console.log("API Errors:", res.data.errors);
      }
    } catch (err) {
      console.error("❌ Search error details:", err);
      setError(err.response?.data?.message || err.message || "Search failed");
      setDebugInfo(err.response?.data?.debugInfo);
    } finally {
      setLoading(false);
    }
  };

  const testYouTubeAPI = async () => {
    try {
      const res = await api.get("/api/test/youtube");
      console.log("YouTube API Test:", res.data);
      alert(
        `YouTube API: ${res.data.success ? "WORKING ✅" : "FAILED ❌"}\nCheck console for details.`,
      );
    } catch (err) {
      console.error("Test failed:", err);
      alert("Test failed. Check server console.");
    }
  };

  useEffect(() => {
    if (initialQuery) {
      searchTracks();
    }
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-950 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={goToHome}
              className="p-2 hover:bg-zinc-800 rounded-lg mr-4"
            >
              <Home size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">MusicSearch</h1>
              <p className="text-sm text-zinc-400">
                YouTube + Internet Archive
              </p>
            </div>
          </div>

          <button
            onClick={testYouTubeAPI}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            Test YouTube API
          </button>
        </div>

        {/* Error Display */}
        <ErrorDisplay
          error={error}
          apiStatus={apiStatus}
          onRetry={searchTracks}
        />

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-zinc-900/30 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-2 text-yellow-300">
              Debug Information:
            </h4>
            <pre className="text-sm text-zinc-400 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-zinc-900/50 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400"
                size={22}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTracks()}
                placeholder="Search songs, artists, albums..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-red-500 focus:outline-none text-lg"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none"
              >
                <option value="both">All Sources</option>
                <option value="youtube">YouTube Only</option>
                <option value="archive">Archive Only</option>
              </select>

              <button
                onClick={searchTracks}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-semibold flex items-center gap-3 min-w-35 justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={22} />
                    <span>Searching</span>
                  </>
                ) : (
                  <>
                    <Search size={22} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex flex-wrap gap-3">
            {[
              "tamil songs",
              "ar rahman",
              "yuvan",
              "instrumental",
              "classical",
            ].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  setTimeout(searchTracks, 100);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {tracks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Found {tracks.length} track{tracks.length !== 1 ? "s" : ""}
              </h2>
              <div className="text-sm text-zinc-400">
                {apiStatus.youtube && (
                  <span className="flex items-center gap-2">
                    <VideoIcon size={16} className="text-red-400" />
                    YouTube:{" "}
                    {tracks.filter((t) => t.source === "YouTube").length}
                  </span>
                )}
                {apiStatus.archive && (
                  <span className="flex items-center gap-2 ml-4">
                    <Globe size={16} className="text-green-400" />
                    Archive:{" "}
                    {
                      tracks.filter((t) => t.source === "Internet Archive")
                        .length
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {tracks.map((track, index) => (
                <TrackCard key={`${track.source}-${index}`} track={track} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !query && (
          <div className="text-center py-16">
            <Music size={128} className="mx-auto mb-8 text-zinc-700" />
            <h2 className="text-3xl font-bold mb-4">Start Searching</h2>
            <p className="text-zinc-400 text-lg mb-8">
              Search for music from YouTube and Internet Archive
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
