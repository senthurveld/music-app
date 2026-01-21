// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";

const HomePage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const goToSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <button onClick={() => setMenuOpen(true)} className="text-2xl mr-4">
            ☰
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Musix</h1>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Discover music you love 🎧
            </h2>
            <p className="text-zinc-400 max-w-lg">
              Search millions of tracks from SoundCloud. Play instantly, no
              downloads.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs, artists, albums"
                className="flex-1 p-3 rounded-lg bg-zinc-800 focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={goToSearch}
                className="bg-orange-500 px-6 py-3 rounded-lg font-semibold"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right Visual (Desktop Only) */}
          <div className="hidden lg:block">
            <img
              src="/radio1.gif"
              alt="Hero Image"
              className="w-full max-w-md ml-auto"
            />
          </div>
        </div>
      </main>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default HomePage;
