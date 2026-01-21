import { useState } from "react";
import api from "../services/api";
import { Loader2, Play } from "lucide-react";

export default function TrackCard({ track }) {
  const [embed, setEmbed] = useState(null);
  const [loading, setLoading] = useState(false);

  const play = async () => {
    if (embed) return;

    try {
      setLoading(true);
      const res = await api.get(
        `/soundcloud/embed?url=${encodeURIComponent(track.link)}`,
      );
      setEmbed(res.data);
    } catch {
      alert("Unable to play this track");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 hover:bg-zinc-800 transition rounded-xl p-4 flex flex-col">
      {/* Artwork */}
      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-zinc-800">
        <img
          src={embed?.thumbnail || "/music.png"}
          alt={track.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <h3 className="font-semibold truncate">{track.title}</h3>
      <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{track.snippet}</p>

      {/* Controls */}
      {!embed && (
        <button
          onClick={play}
          disabled={loading}
          className="mt-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 transition py-2 rounded-lg font-medium"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Play size={18} />
          )}
          Play
        </button>
      )}

      {/* Player */}
      {embed && (
        <div
          className="mt-3 rounded overflow-hidden"
          dangerouslySetInnerHTML={{ __html: embed.html }}
        />
      )}
    </div>
  );
}
