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
    <div className="min-h-screen flex flex-col bg-background  text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-2xl mr-4 text-foreground"
          >
            ☰
          </button>
          <div>
            <h1 className="text-2xl font-bold">Musix | VibeSpot</h1>
            <p className="text-sm text-muted">Free legal audio streaming</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Discover music you love 🎧
            </h2>

            <p className="text-muted max-w-lg">
              Search millions of tracks from Youtube API and Internet Archive.
              Play instantly, no downloads.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs, artists, albums"
                className="
                  flex-1 p-3 rounded-lg
                  bg-surface text-foreground
                  border border-border
                  focus:outline-none
                  focus:ring-2 focus:ring-brand
                "
              />

              <button
                onClick={goToSearch}
                className="
                  bg-brand bg-orange-500 hover:bg-brand-hover
                  text-white
                  px-6 py-3 rounded-lg font-semibold
                  transition
                "
              >
                Search
              </button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden lg:block">
            <img
              src="/radio1.gif"
              alt="Hero Image"
              className="w-full max-w-md ml-auto"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto text-sm text-center text-muted py-4">
        <hr className="w-11/12 mx-auto mb-3 border-border" />
        Made 🤍 with{" "}
        <a
          href="https://github.com/senthurveld"
          className="hover:text-green-400 transition"
        >
          Senthurvel
        </a>
      </footer>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default HomePage;
