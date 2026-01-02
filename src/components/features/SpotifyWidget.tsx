import { useEffect, useState } from 'react';
import type { SpotifyTrack, SpotifyStats } from '../../lib/spotify';

interface SpotifyWidgetProps {
  totalMinutes?: number;
}

export default function SpotifyWidget({ totalMinutes = 76533 }: SpotifyWidgetProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SpotifyTrack | null>(null);
  const [stats, setStats] = useState<SpotifyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSpotifyData() {
      try {
        setLoading(true);
        // Try to get currently playing first
        const playing = await fetch('/api/spotify/now-playing').then(res => 
          res.ok ? res.json() : null
        ).catch(() => null);
        
        setCurrentlyPlaying(playing);

        // Get stats
        const statsData = await fetch('/api/spotify/stats').then(res =>
          res.ok ? res.json() : null
        ).catch(() => null);
        
        setStats(statsData);
        setError(false);
      } catch (err) {
        console.error('Error fetching Spotify data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSpotifyData();
    
    // Refresh every 30 seconds if there's a currently playing track
    const interval = setInterval(() => {
      if (currentlyPlaying?.isPlaying) {
        fetch('/api/spotify/now-playing')
          .then(res => res.ok ? res.json() : null)
          .then(data => data && setCurrentlyPlaying(data))
          .catch(() => {});
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentlyPlaying?.isPlaying]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-poke-grass/20 to-poke-electric/20 rounded-2xl p-6 border-4 border-poke-grass/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-poke-grass/20 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-poke-grass/20 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-3 bg-poke-grass/20 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentlyPlaying && !stats) {
    // Fallback: just show the minutes stat
    return (
      <div className="bg-gradient-to-r from-poke-grass/20 to-poke-electric/20 rounded-2xl p-6 border-4 border-poke-grass/40">
        <div className="flex items-center gap-4">
          <div className="text-3xl">🎵</div>
          <div>
            <p className="text-white/90 font-bold text-lg">
              {totalMinutes.toLocaleString()} minutes on Spotify
            </p>
            <p className="text-white/70 text-sm">(will almost ALWAYS be The Weeknd)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-poke-grass/20 to-poke-electric/20 rounded-2xl p-6 border-4 border-poke-grass/40">
      {currentlyPlaying && currentlyPlaying.isPlaying ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-poke-grass rounded-full animate-pulse"></div>
            <span className="text-poke-grass text-sm font-bold">NOW PLAYING</span>
          </div>
          
          <div className="flex gap-4">
            {currentlyPlaying.albumArt && (
              <img
                src={currentlyPlaying.albumArt}
                alt={currentlyPlaying.album}
                className="w-16 h-16 rounded-lg object-cover border-2 border-poke-grass/50"
              />
            )}
            <div className="flex-1 min-w-0">
              <a
                href={currentlyPlaying.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-bold text-lg hover:text-poke-grass transition-colors block truncate"
              >
                {currentlyPlaying.name}
              </a>
              <p className="text-white/80 text-sm truncate">{currentlyPlaying.artist}</p>
              <p className="text-white/60 text-xs truncate">{currentlyPlaying.album}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🎵</div>
            <div>
              <p className="text-white/90 font-bold text-lg">
                {totalMinutes.toLocaleString()} minutes on Spotify
              </p>
              {stats?.topArtists && stats.topArtists.length > 0 && (
                <p className="text-white/70 text-sm">
                  Top artist: <span className="font-bold text-poke-grass">{stats.topArtists[0].name}</span>
                </p>
              )}
            </div>
          </div>

          {stats?.recentTracks && stats.recentTracks.length > 0 && (
            <div className="pt-4 border-t border-poke-grass/20">
              <p className="text-white/70 text-sm mb-2 font-bold">Recently played:</p>
              <div className="space-y-2">
                {stats.recentTracks.slice(0, 3).map((track, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-poke-grass">▶</span>
                    <span className="text-white/80 truncate">
                      {track.name} - {track.artist}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

