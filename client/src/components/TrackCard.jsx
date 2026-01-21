import { useState } from "react";
import api from "../services/api";

export default function TrackCard({ track }) {
  const [embed, setEmbed] = useState(null);

  const play = async () => {
    const res = await api.get(
      `/soundcloud/embed?url=${encodeURIComponent(track.link)}`,
    );
    setEmbed(res.data);
  };

  return (
    <div className="bg-zinc-900 p-4 rounded space-y-2">
      <h3 className="font-semibold">{track.title}</h3>
      <p className="text-sm text-zinc-400">{track.snippet}</p>

      {!embed && (
        <button onClick={play} className="text-orange-400">
          ▶ Play
        </button>
      )}

      {embed && <div dangerouslySetInnerHTML={{ __html: embed.html }} />}
    </div>
  );
}
