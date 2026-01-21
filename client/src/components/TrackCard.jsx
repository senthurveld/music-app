import { useState } from "react";

export default function TrackCard({ track }) {
  // eslint-disable-next-line no-unused-vars
  const [playing, setPlaying] = useState(false);

  return (
    <div className="bg-zinc-900 p-4 rounded space-y-2">
      <h3 className="font-semibold text-white">{track.title}</h3>
      <p className="text-sm text-zinc-400">{track.artist}</p>

      <audio
        src={track.url}
        controls
        className="w-full mt-2 rounded"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
