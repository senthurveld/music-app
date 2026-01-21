// frontend/components/TrackCard.jsx
export default function TrackCard({ track }) {
  if (!track.url) return null;

  const getSourceBadge = (source) => {
    const colors = {
      Masstamilan: "bg-blue-500",
      "Internet Archive": "bg-green-500",
      default: "bg-gray-500",
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${colors[source] || colors.default}`}
      >
        {source}
      </span>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900 p-4 rounded-lg space-y-3 sm:space-y-0">
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-white truncate">{track.title}</h3>
          {getSourceBadge(track.source)}
        </div>
        <p className="text-sm text-zinc-400 truncate">{track.artist}</p>
        {track.year && (
          <p className="text-xs text-zinc-500 mt-1">{track.year}</p>
        )}
      </div>

      {/* Audio Player */}
      <div className="w-full sm:w-64 mt-2 sm:mt-0">
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
        <p className="text-xs text-zinc-500 mt-1 truncate">
          {track.url.replace(/https?:\/\//, "").substring(0, 40)}...
        </p>
      </div>
    </div>
  );
}
