import { useState } from "react";
import api from "../services/api";
import TrackCard from "../components/TrackCard";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchTracks = async () => {
    setLoading(true);
    const res = await api.get(`/search/search?q=${query}`);
    setTracks(res.data);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search song, artist, album"
        className="w-full p-3 bg-zinc-800 rounded"
      />

      <button
        onClick={searchTracks}
        className="w-full bg-orange-500 p-2 rounded"
      >
        Search
      </button>

      {loading && <p>Searching...</p>}

      {tracks.map((track, i) => (
        <TrackCard key={i} track={track} />
      ))}
    </div>
  );
};

export default SearchPage;
