// frontend/pages/SearchPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import TrackCard from "../components/TrackCard";
import { Home, Search, Youtube, Globe, Music } from "lucide-react";

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

  const searchTracks = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setTracks([]);

    try {
      const url = `/search/search?q=${encodeURIComponent(query)}${
        searchSource !== "both" ? `&source=${searchSource}` : ""
      }`;

      const res = await api.get(url);
      setTracks(res.data.tracks || []);

      setApiStatus({
        youtube: res.data.sources?.includes("YouTube") ?? true,
        archive: res.data.sources?.includes("Internet Archive") ?? true,
      });
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) searchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg hover:bg-surface transition"
            >
              <Home className="text-foreground" />
            </button>

            <div>
              <h1 className="text-2xl font-bold">Musix | VibeSpot</h1>
              <p className="text-sm text-muted">Free legal audio streaming</p>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <span
              className={`flex items-center gap-2 ${
                apiStatus.youtube ? "text-brand" : "text-muted"
              }`}
            >
              <Youtube size={18} /> YouTube
            </span>
            <span
              className={`flex items-center gap-2 ${
                apiStatus.archive ? "text-brand" : "text-muted"
              }`}
            >
              <Globe size={18} /> Archive
            </span>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-surface rounded-2xl p-6 border border-border">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTracks()}
                placeholder="Search songs, artists, albums"
                className="
                  w-full pl-12 pr-4 py-4 rounded-xl
                  bg-background text-foreground
                  border border-border
                  focus:ring-2 focus:ring-brand
                  outline-none
                "
              />
            </div>

            <select
              value={searchSource}
              onChange={(e) => setSearchSource(e.target.value)}
              className="
                bg-background border border-border
                rounded-xl px-4 py-4
                text-foreground
              "
            >
              <option value="both">All Sources</option>
              <option value="youtube">YouTube Only</option>
              <option value="archive">Archive Only</option>
            </select>

            <button
              onClick={searchTracks}
              disabled={loading}
              className="
                bg-brand hover:bg-brand-hover
                text-white px-8 py-4
                rounded-xl font-semibold
                transition
              "
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        {!loading && tracks.length > 0 && (
          <div className="space-y-4">
            {tracks.map((track, i) => (
              <TrackCard key={`${track.source}-${i}`} track={track} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && query && tracks.length === 0 && (
          <div className="text-center py-16 text-muted">
            <Music size={96} className="mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground">
              No tracks found
            </h3>
            <p>Try different keywords or sources</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
