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

    const currentTrackId = currentlyPlaying.id;
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
          if (data) {
            // Only update if the track actually changed
            if (data.id !== currentTrackId) {
              setCurrentlyPlaying(data);
            } else if (!data.isPlaying) {
              // Song stopped playing
              setCurrentlyPlaying(null);
            }
          } else {
            // API returned null (no song playing)
            setCurrentlyPlaying(null);
          }
        })
        .catch(() => {});
    }, refreshDelay);

    return () => clearTimeout(timeout);
  }, [currentlyPlaying?.id, currentlyPlaying?.isPlaying, currentlyPlaying?.progressMs, currentlyPlaying?.durationMs]);

  // When nothing is playing, check periodically for when music starts
  useEffect(() => {
    if (currentlyPlaying?.isPlaying || document.hidden) {
      return; // Don't check if something is already playing
    }

    // Check every 60 seconds when nothing is playing (less frequent since we're just waiting)
    const interval = setInterval(() => {
      if (document.hidden) return;
      
      fetch('/api/spotify/now-playing')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.isPlaying) {
            // Music started! Update the widget
            setCurrentlyPlaying(data);
          }
        })
        .catch(() => {});
    }, 60000); // Check every 60 seconds

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
    // Fallback: show generic message
    return (
      <div className="bg-gradient-to-r from-poke-grass/20 to-poke-electric/20 rounded-2xl p-6 border-4 border-poke-grass/40">
        <div className="flex items-center gap-4">
          <div className="text-3xl">🎵</div>
          <div>
            <p className="text-white/90 font-bold text-lg">
              Spotify listening stats
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
          
          <div className="flex gap-6 items-center">
            {/* Spinning Vinyl Record - Made Bigger */}
            {currentlyPlaying.albumArt && (
              <div className="relative flex-shrink-0">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  {/* Vinyl Record */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl border-4 border-gray-700 animate-spin-slow" style={{ animationDuration: '3s' }}>
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
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-black border border-gray-900 shadow-inner"></div>
                    
                    {/* Reflection Effect */}
                    <div className="absolute top-3 left-1/4 w-10 h-10 rounded-full bg-white/10 blur-sm"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Track Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <a
                  href={currentlyPlaying.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold text-xl hover:text-poke-grass transition-colors block truncate"
                >
                  {currentlyPlaying.name}
                </a>
                <p className="text-white/80 text-base truncate mt-1">{currentlyPlaying.artist}</p>
                <p className="text-white/60 text-sm truncate mt-1">{currentlyPlaying.album}</p>
                {currentlyPlaying.releaseDate && (
                  <p className="text-white/50 text-xs mt-2">
                    Released: {new Date(currentlyPlaying.releaseDate).getFullYear()}
                  </p>
                )}
              </div>
              
              {/* Visual Equalizer - Made Bigger */}
              <div className="flex items-end gap-1.5 h-12 mt-4">
                {[...Array(16)].map((_, i) => {
                  const baseHeight = 25 + Math.sin(i * 0.4) * 20;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-poke-grass rounded-t equalizer-bar"
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
          <div className="flex items-center gap-4">
            <div className="text-3xl">🎵</div>
            <div>
              <p className="text-white/90 font-bold text-lg">
                Spotify listening stats
              </p>
              {stats?.topArtists && stats.topArtists.length > 0 && (
                <p className="text-white/70 text-sm mt-1">
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

