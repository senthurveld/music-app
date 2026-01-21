// frontend/pages/SearchPage.jsx - Updated to handle both search types
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import TrackCard from "../components/TrackCard";
import { Home, Search, Link as LinkIcon, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SearchPage = () => {
  const [params] = useSearchParams();
  const initialQuery = params.get("q") || "";
  const initialUrl = params.get("url") || "";
  const navigate = useNavigate();

  const [query, setQuery] = useState(initialQuery);
  const [directUrl, setDirectUrl] = useState(initialUrl);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(
    initialUrl ? "direct" : "search",
  );
  const [searchSource, setSearchSource] = useState("both");

  const goToHome = () => {
    navigate("/");
  };

  const searchTracks = async () => {
    if (searchMode === "direct" && directUrl.trim()) {
      await searchDirectUrl();
    } else if (query.trim()) {
      await searchByQuery();
    }
  };

  const searchByQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const url = `/search/search?q=${encodeURIComponent(query)}${searchSource !== "both" ? `&source=${searchSource}` : ""}`;
      console.log("Searching:", url);

      const res = await api.get(url);
      setTracks(res.data.tracks || []);
    } catch (error) {
      console.error("Search error:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const searchDirectUrl = async () => {
    if (!directUrl.trim() || !directUrl.includes("masstamilan.sbs/music/")) {
      alert("Please enter a valid Masstamilan song URL");
      return;
    }

    setLoading(true);
    try {
      const url = `/search/search?url=${encodeURIComponent(directUrl)}`;
      console.log("Fetching direct URL:", url);

      const res = await api.get(url);
      setTracks(res.data.tracks || []);
    } catch (error) {
      console.error("Direct URL error:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchMode("search");
      searchByQuery();
    } else if (initialUrl) {
      setSearchMode("direct");
      searchDirectUrl();
    }
  }, [initialQuery, initialUrl]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={goToHome}
            className="p-2 hover:bg-zinc-800 rounded-lg mr-4"
          >
            <Home size={24} />
          </button>
          <h1 className="text-2xl font-bold">Music Search</h1>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-zinc-700">
          <button
            onClick={() => setSearchMode("search")}
            className={`px-4 py-2 font-medium ${searchMode === "search" ? "border-b-2 border-green-500 text-green-500" : "text-zinc-400"}`}
          >
            <Search size={16} className="inline mr-2" />
            Search Songs
          </button>
          <button
            onClick={() => setSearchMode("direct")}
            className={`px-4 py-2 font-medium ${searchMode === "direct" ? "border-b-2 border-blue-500 text-blue-500" : "text-zinc-400"}`}
          >
            <LinkIcon size={16} className="inline mr-2" />
            Direct Song URL
          </button>
        </div>

        {/* Search Input based on Mode */}
        {searchMode === "search" ? (
          <div className="bg-zinc-900 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                  size={20}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchTracks()}
                  placeholder="Search songs, artists, albums..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={searchSource}
                  onChange={(e) => setSearchSource(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-white"
                >
                  <option value="both">All Sources</option>
                  <option value="masstamilan">Masstamilan Only</option>
                  <option value="archive">Archive Only</option>
                </select>

                <button
                  onClick={searchTracks}
                  disabled={loading || !query.trim()}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-zinc-400">
              <p>Examples: "yuvan", "ar rahman", "thalaivar", "tamil songs"</p>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <LinkIcon
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                  size={20}
                />
                <input
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchTracks()}
                  placeholder="https://masstamilan.sbs/music/song-name#/"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                onClick={searchTracks}
                disabled={loading || !directUrl.trim()}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Fetching...
                  </>
                ) : (
                  <>
                    <Music size={20} />
                    Get Song
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 text-sm text-zinc-400">
              <p>Enter a direct Masstamilan song URL to fetch audio</p>
              <p className="mt-1">
                Example: https://masstamilan.sbs/music/nallaru-po#/
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && tracks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Found {tracks.length} track{tracks.length !== 1 ? "s" : ""}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {tracks.map((track, i) => (
                <TrackCard key={`${track.source}-${i}`} track={track} />
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">
              {searchMode === "direct"
                ? "Fetching song from URL..."
                : `Searching for "${query}"...`}
            </p>
          </div>
        )}

        {/* No Results */}
        {!loading &&
          ((searchMode === "search" && query && tracks.length === 0) ||
            (searchMode === "direct" && directUrl && tracks.length === 0)) && (
            <div className="text-center py-10">
              <p className="text-zinc-400">
                No tracks found. Try different keywords or check the URL format.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default SearchPage;
