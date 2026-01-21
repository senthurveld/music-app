import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import TrackCard from "../components/TrackCard";

const SearchPage = () => {
  const [params] = useSearchParams();
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search function
  const searchTracks = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/search/search?q=${encodeURIComponent(q)}`);
      setTracks(res.data.tracks || res.data || []);
    } catch (err) {
      console.error(err);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  // Run search on initial query
  useEffect(() => {
    if (initialQuery) searchTracks(initialQuery);
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-20 bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchTracks(query)}
            placeholder="Search music, artist, album..."
            className="flex-1 p-3 rounded-lg bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          />
          <button
            onClick={() => searchTracks(query)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {loading && (
          <p className="text-center text-zinc-400 animate-pulse">Searching…</p>
        )}

        {!loading && tracks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tracks.map((track, i) => (
              <TrackCard key={i} track={track} />
            ))}
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <p className="text-center text-zinc-400 mt-10">
            No results found. Try another search.
          </p>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
