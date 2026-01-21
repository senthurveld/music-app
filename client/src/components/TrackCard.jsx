export default function TrackCard({ track }) {
  if (!track.url) return null; // skip if no playable file

  return (
    <div className="bg-zinc-900 p-4 rounded space-y-2">
      <h3 className="font-semibold text-white">{track.title}</h3>
      <p className="text-sm text-zinc-400">{track.artist}</p>

      <audio src={track.url} controls className="w-full mt-2 rounded" />
    </div>
  );
}
