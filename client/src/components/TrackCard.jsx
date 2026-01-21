// frontend/components/TrackCard.jsx
import { useState } from "react";
import { Play, Pause, ExternalLink, Music, Globe } from "lucide-react";

export default function TrackCard({ track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerKey, setPlayerKey] = useState(getDate());

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const getDate = () => {
    return Date.now();
  };
  const getSourceIcon = (source) => {
    switch (source) {
      case "YouTube":
        return (
          <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
            <Play size={12} className="text-white" />
          </div>
        );
      case "Internet Archive":
        return <Globe size={20} className="text-green-500" />;
      default:
        return <Music size={20} />;
    }
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setPlayerKey(Date.now()); // Force re-render of iframe
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-4 hover:bg-zinc-800 transition-colors">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Thumbnail */}
        {track.thumbnail && (
          <div className="relative md:w-48 md:h-32 w-full h-48 shrink-0">
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-full h-full object-cover rounded-lg"
            />
            {track.source === "YouTube" && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                YouTube
              </div>
            )}
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg mb-1 truncate">
                {track.title}
              </h3>
              <p className="text-zinc-400 mb-2">{track.artist}</p>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {getSourceIcon(track.source)}
                  <span className="text-sm text-zinc-400">{track.source}</span>
                </div>

                {track.duration && (
                  <span className="text-sm text-zinc-500">
                    {formatDuration(track.duration)}
                  </span>
                )}

                {track.year && (
                  <span className="text-sm text-zinc-500">• {track.year}</span>
                )}
              </div>
            </div>

            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Open original"
            >
              <ExternalLink size={20} className="text-zinc-400" />
            </a>
          </div>

          {/* Player */}
          {track.source === "YouTube" && track.videoId ? (
            <div className="mt-3">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handlePlay}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={18} />
                      Pause YouTube Player
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Play on YouTube
                    </>
                  )}
                </button>

                <span className="text-sm text-zinc-400">
                  {isPlaying
                    ? "Playing in embed below"
                    : "Click to load player"}
                </span>
              </div>

              {isPlaying && (
                <div key={playerKey} className="mt-2">
                  <div className="relative pt-[56.25%] h-0 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${track.videoId}?autoplay=1&modestbranding=1&rel=0`}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`YouTube player: ${track.title}`}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Note: Audio plays through YouTube's official player
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Audio player for Internet Archive
            <div className="mt-3">
              <audio
                src={track.url}
                controls
                preload="none"
                className="w-full"
                onError={(e) => {
                  console.error(`Failed to load audio: ${track.url}`);
                  e.target.parentElement.innerHTML = `<p class="text-red-400 text-sm">Audio unavailable</p>`;
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
