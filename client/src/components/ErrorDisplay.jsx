
import { AlertCircle, Youtube, Globe } from "lucide-react";

const ErrorDisplay = ({ error, apiStatus, onRetry }) => {
  if (!error) return null;

  return (
    <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="text-red-400 mt-1 shrink-0" size={24} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Search Error
          </h3>
          <p className="text-red-200 mb-4">{error}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Youtube
                  size={20}
                  className={
                    apiStatus?.youtube ? "text-green-400" : "text-red-400"
                  }
                />
                <span className="font-medium">YouTube API</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${apiStatus?.youtube ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
                >
                  {apiStatus?.youtube ? "Connected" : "Not Connected"}
                </span>
              </div>
              {!apiStatus?.youtube && (
                <p className="text-sm text-zinc-400">
                  YouTube API key not configured. Get a free key from Google
                  Cloud.
                </p>
              )}
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe
                  size={20}
                  className={
                    apiStatus?.archive ? "text-green-400" : "text-red-400"
                  }
                />
                <span className="font-medium">Internet Archive</span>
                <span className="px-2 py-1 text-xs bg-green-900/30 text-green-400 rounded-full">
                  Always Available
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Free public domain music and audio.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Troubleshooting Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-300">
              <li>Check if YouTube API key is configured on server</li>
              <li>Try searching with "Internet Archive Only" source</li>
              <li>Check server console for detailed error logs</li>
              <li>
                Test API connection at: http://localhost:3000/api/test/youtube
              </li>
            </ol>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium"
            >
              Retry Search
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
