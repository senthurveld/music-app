// frontend/pages/SearchPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import TrackCard from "../components/TrackCard";
import { Home, Search, Youtube, Globe, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SearchPage = () => {
  const [params] = useSearchParams();
  const initialQuery = params.get("q") || "";
  const navigate = useNavigate();

  const [query, setQuery] = useState(initialQuery);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchSource, setSearchSource] = useState("both");
  const [apiStatus, setApiStatus] = useState({
    youtube: true,
    archive: true,
  });

  const goToHome = () => {
    navigate("/");
  };

  const searchTracks = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setTracks([]);

    try {
      const url = `/search/search?q=${encodeURIComponent(query)}${searchSource !== "both" ? `&source=${searchSource}` : ""}`;
      console.log("Searching:", url);

      const res = await api.get(url);
      setTracks(res.data.tracks || []);

      // Update API status based on results
      setApiStatus({
        youtube: res.data.sources?.includes("YouTube") ?? true,
        archive: res.data.sources?.includes("Internet Archive") ?? true,
      });
    } catch (error) {
      console.error("Search error:", error);
      setTracks([]);

      // Check if YouTube API might be down
      if (error.response?.status === 500) {
        setApiStatus((prev) => ({ ...prev, youtube: false }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      searchTracks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-950 to-background text-foreground p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={goToHome}
              className="p-2 hover:bg-zinc-800 rounded-lg mr-4 transition-colors"
              aria-label="Go home"
            >
              <Home size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">MusicStream</h1>
              <p className="text-sm text-zinc-400">
                Free legal audio streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${apiStatus.youtube ? "text-green-400" : "text-red-400"}`}
            >
              <Youtube size={20} />
              <span className="text-sm">
                YouTube {apiStatus.youtube ? "✓" : "✗"}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 ${apiStatus.archive ? "text-green-400" : "text-red-400"}`}
            >
              <Globe size={20} />
              <span className="text-sm">
                Archive {apiStatus.archive ? "✓" : "✗"}
              </span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800">
          <div className="flex flex-col lg:flex-row gap-4">
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
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-800/50 text-white border border-zinc-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-lg"
                aria-label="Search music"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value)}
                className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="both">All Sources</option>
                <option value="youtube">YouTube Only</option>
                <option value="archive">Archive Only</option>
              </select>

              <button
                onClick={searchTracks}
                disabled={loading || !query.trim()}
                className="bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-zinc-700 disabled:to-zinc-800 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all min-w-35 justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
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

          {/* Search Tips */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Youtube className="text-red-400" size={22} />
                </div>
                <div>
                  <h3 className="font-medium">YouTube</h3>
                  <p className="text-sm text-zinc-400">
                    Official audio streaming
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-300">
                Legal, high-quality audio with full metadata
              </p>
            </div>

            <div className="bg-zinc-800/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="text-green-400" size={22} />
                </div>
                <div>
                  <h3 className="font-medium">Internet Archive</h3>
                  <p className="text-sm text-zinc-400">Public domain music</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300">
                Free downloads & streaming of classic recordings
              </p>
            </div>

            <div className="bg-zinc-800/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Music className="text-blue-400" size={22} />
                </div>
                <div>
                  <h3 className="font-medium">No Restrictions</h3>
                  <p className="text-sm text-zinc-400">100% legal streaming</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300">
                No copyright issues or blocked content
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-2">
              Searching for "{query}"
            </h3>
            <p className="text-zinc-400">
              Scanning YouTube and Internet Archive...
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && tracks.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Found {tracks.length} track{tracks.length !== 1 ? "s" : ""}
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-zinc-400">
                    YouTube (
                    {tracks.filter((t) => t.source === "YouTube").length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-zinc-400">
                    Archive (
                    {
                      tracks.filter((t) => t.source === "Internet Archive")
                        .length
                    }
                    )
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {tracks.map((track, i) => (
                <TrackCard
                  key={`${track.source}-${track.videoId || track.url}-${i}`}
                  track={track}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && query && tracks.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-zinc-600">
              <Music size={96} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No tracks found</h3>
            <p className="text-zinc-400 max-w-lg mx-auto mb-8">
              No results found for "{query}". Try different keywords or check
              your search source.
            </p>

            <div className="max-w-md mx-auto bg-zinc-900/50 rounded-xl p-6">
              <h4 className="font-semibold mb-4 text-lg">Search tips:</h4>
              <ul className="text-left space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-1 shrink-0">
                    <span className="text-red-400 text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Use English transliteration</p>
                    <p className="text-sm text-zinc-400">
                      "ar rahman" instead of "ஏ.ஆர்.ரகுமான்"
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-1 shrink-0">
                    <span className="text-red-400 text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Add "song" or "audio"</p>
                    <p className="text-sm text-zinc-400">
                      "thalaivar audio" or "tamil songs"
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-1 shrink-0">
                    <span className="text-red-400 text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Try specific sources</p>
                    <p className="text-sm text-zinc-400">
                      Use "YouTube Only" for latest songs
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setSearchSource("youtube")}
              className="mt-8 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Youtube size={20} />
              Try YouTube Only Search
            </button>
          </div>
        )}

        {/* Initial State */}
        {!loading && !query && (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-8 text-zinc-700">
              <Music size={128} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Discover Free Music</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-lg mb-10">
              Search millions of songs from YouTube and Internet Archive. Stream
              legally with no downloads required.
            </p>

            <div className="inline-flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => {
                  setQuery("tamil songs");
                  searchTracks();
                }}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium"
              >
                Tamil Songs
              </button>
              <button
                onClick={() => {
                  setQuery("ar rahman");
                  searchTracks();
                }}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium"
              >
                AR Rahman
              </button>
              <button
                onClick={() => {
                  setQuery("yuvan shankar raja");
                  searchTracks();
                }}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium"
              >
                Yuvan Shankar Raja
              </button>
              <button
                onClick={() => {
                  setQuery("classical music");
                  searchTracks();
                }}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium"
              >
                Classical Music
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
