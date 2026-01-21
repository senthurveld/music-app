// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const goToSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="flex items-center p-4 border-b border-zinc-800">
        <button onClick={() => setMenuOpen(true)} className="text-xl">
          ☰
        </button>
        <h1 className="ml-4 text-lg font-bold">Music</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search song, artist, album"
          className="w-full p-3 bg-zinc-800 rounded"
        />

        <button
          onClick={goToSearch}
          className="w-full bg-orange-500 p-3 rounded"
        >
          Search
        </button>

        <p className="text-sm text-zinc-400">Discover music from SoundCloud</p>
      </div>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};
export default HomePage;
