export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  url: string;
  isPlaying: boolean;
}

export interface SpotifyStats {
  totalMinutes: number;
  topArtists: Array<{ name: string; count: number }>;
  recentTracks: SpotifyTrack[];
}

/**
 * Get currently playing track from Spotify
 */
export async function getCurrentlyPlaying(): Promise<SpotifyTrack | null> {
  try {
    const response = await fetch('/api/spotify/now-playing');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching currently playing:', error);
    return null;
  }
}

/**
 * Get Spotify stats (top artists, recent tracks, etc.)
 */
export async function getSpotifyStats(): Promise<SpotifyStats | null> {
  try {
    const response = await fetch('/api/spotify/stats');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching Spotify stats:', error);
    return null;
  }
}

