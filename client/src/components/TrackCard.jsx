export default function TrackCard({ track }) {
  if (!track.url) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center bg-zinc-900 p-4 rounded space-y-4 sm:space-y-0 sm:space-x-4 w-full">
      {/* Track Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-white">{track.title}</h3>
        <p className="text-sm text-zinc-400">{track.artist}</p>
      </div>

      {/* Audio Player */}
      <audio
        src={track.url}
        controls
        preload="none" // <-- important, only download when clicked
        className="w-full sm:w-60 mt-2 sm:mt-0"
      />
    </div>
  );
}
