import { useEffect, useState } from 'react';
import type { SpotifyTrack, SpotifyStats } from '../../lib/spotify';

export default function SpotifyWidget() {
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
  }, []); // Only run once on mount

  // Smart refresh: only update when song changes or when current song should end
  useEffect(() => {
    if (!currentlyPlaying?.isPlaying || document.hidden) {
      return;
    }

    const progressMs = currentlyPlaying.progressMs || 0;
    const durationMs = currentlyPlaying.durationMs || 0;
    
    // Calculate when to refresh:
    // 1. When the current song should end (duration - progress + small buffer)
    // 2. Or check every 30 seconds as a fallback to catch song changes
    const timeRemaining = durationMs > 0 ? durationMs - progressMs : 30000;
    const refreshDelay = Math.min(timeRemaining + 2000, 30000); // Add 2s buffer, max 30s

    const timeout = setTimeout(() => {
      if (document.hidden) return;
      
      fetch('/api/spotify/now-playing')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.isPlaying) {
            // Always update so the effect reschedules the next poll (same-track
            // refreshes used to no-op and stop polling after the first timeout)
            setCurrentlyPlaying(data);
          } else {
            setCurrentlyPlaying(null);
          }
        })
        .catch(() => {});
    }, refreshDelay);

    return () => clearTimeout(timeout);
  }, [currentlyPlaying?.id, currentlyPlaying?.isPlaying, currentlyPlaying?.progressMs, currentlyPlaying?.durationMs]);

  // When nothing is playing, poll for new playback and refresh recent tracks
  useEffect(() => {
    if (currentlyPlaying?.isPlaying || document.hidden) {
      return;
    }

    const refreshIdle = () => {
      if (document.hidden) return;

      fetch('/api/spotify/now-playing')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.isPlaying) {
            setCurrentlyPlaying(data);
          }
        })
        .catch(() => {});

      fetch('/api/spotify/stats')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setStats(data);
        })
        .catch(() => {});
    };

    const interval = setInterval(refreshIdle, 60_000);
    return () => clearInterval(interval);
  }, [currentlyPlaying?.isPlaying]);

  if (loading) {
    return (
      <div className="bg-paper-2 border-[3px] border-ink p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-paper-3 animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-paper-3 w-24 sm:w-32 mb-2 animate-pulse"></div>
            <div className="h-3 bg-paper-3 w-20 sm:w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentlyPlaying && !stats) {
    // Fallback: show generic message
    return (
      <div className="bg-paper-2 border-[3px] border-ink p-4 md:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="shrink-0"><svg className="w-6 h-6 sm:w-7 sm:h-7 text-ink" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg></div>
          <div>
            <p className="text-ink font-bold text-base sm:text-lg">
              Spotify listening stats
            </p>
            <p className="text-ink-soft text-xs sm:text-sm">(will almost ALWAYS be The Weeknd)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper-2 border-[3px] border-ink p-4 md:p-6">
      {currentlyPlaying && currentlyPlaying.isPlaying ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-screen-0 rounded-full animate-pulse"></div>
            <span className="text-screen-0 text-xs md:text-sm font-bold">NOW PLAYING</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start">
            {/* Spinning Vinyl Record - Responsive Size */}
            {currentlyPlaying.albumArt && (
              <div className="relative flex-shrink-0">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40">
                  {/* Vinyl Record */}
                  <div className="absolute inset-0 rounded-full bg-ink border-4 border-ink animate-spin-slow" style={{ animationDuration: '3s' }}>
                    {/* Vinyl Grooves */}
                    <div className="absolute inset-2 rounded-full border-2 border-gray-700/50"></div>
                    <div className="absolute inset-4 rounded-full border border-gray-700/30"></div>
                    <div className="absolute inset-6 rounded-full border border-gray-700/20"></div>
                    <div className="absolute inset-8 rounded-full border border-gray-700/10"></div>
                    <div className="absolute inset-10 rounded-full border border-gray-700/5"></div>
                    
                    {/* Album Art in Center */}
                    <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-gray-800">
                      <img
                        src={currentlyPlaying.albumArt}
                        alt={currentlyPlaying.album}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Center Hole */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-black border border-gray-900 shadow-inner"></div>
                    
                    {/* Reflection Effect */}
                    <div className="absolute top-3 left-1/4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 blur-sm"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Track Info */}
            <div className="flex-1 min-w-0 w-full md:w-auto space-y-3 md:space-y-4 text-center md:text-left">
              <div>
                <a
                  href={currentlyPlaying.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink font-bold text-lg sm:text-xl hover:text-dex-blue transition-colors block break-words"
                >
                  {currentlyPlaying.name}
                </a>
                <p className="text-ink-soft text-sm sm:text-base break-words mt-1">{currentlyPlaying.artist}</p>
                <p className="text-ink-soft text-xs sm:text-sm break-words mt-1">{currentlyPlaying.album}</p>
                {currentlyPlaying.releaseDate && (
                  <p className="text-ink-soft text-xs mt-2">
                    Released: {new Date(currentlyPlaying.releaseDate).getFullYear()}
                  </p>
                )}
              </div>
              
              {/* Visual Equalizer - Responsive Size */}
              <div className="flex items-end gap-1 sm:gap-1.5 h-8 sm:h-10 md:h-12 mt-2 md:mt-4">
                {[...Array(16)].map((_, i) => {
                  const baseHeight = 25 + Math.sin(i * 0.4) * 20;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-screen-0 equalizer-bar"
                      style={{
                        height: `${baseHeight}%`,
                        animation: `equalizer ${0.5 + i * 0.08}s ease-in-out infinite`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    ></div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="shrink-0"><svg className="w-6 h-6 sm:w-7 sm:h-7 text-ink" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg></div>
            <div>
              <p className="text-ink font-bold text-base sm:text-lg">
                Spotify listening stats
              </p>
              {stats?.topArtists && stats.topArtists.length > 0 && (
                <p className="text-ink-soft text-xs sm:text-sm mt-1">
                  Top artist: <span className="font-bold text-screen-0">{stats.topArtists[0].name}</span>
                </p>
              )}
            </div>
          </div>

          {stats?.recentTracks && stats.recentTracks.length > 0 && (
            <div className="pt-4 border-t-[3px] border-ink">
              <p className="text-ink-soft text-xs sm:text-sm mb-2 font-bold">Recently played:</p>
              <div className="space-y-2">
                {stats.recentTracks.slice(0, 3).map((track, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-screen-0">▶</span>
                    <span className="text-ink-soft break-words">
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