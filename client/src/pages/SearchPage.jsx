// frontend/pages/SearchPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import TrackCard from "../components/TrackCard";

const SearchPage = () => {
  const [params] = useSearchParams();
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchTracks = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/search/search?q=${q}`);
      setTracks(res.data.tracks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) searchTracks(initialQuery);
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchTracks(query)}
          placeholder="Search music..."
          className="w-full p-3 rounded-lg bg-zinc-800 text-white"
        />

        {loading && <p className="text-center">Searching…</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tracks.map((track, i) => (
            <TrackCard key={i} track={track} />
          ))}
        </div>

        {!loading && tracks.length === 0 && (
          <p className="text-center text-zinc-400 mt-10">No results found</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
