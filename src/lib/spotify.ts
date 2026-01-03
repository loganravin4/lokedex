export interface SpotifyTrack {
  id?: string; // Track ID to detect song changes
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  url: string;
  isPlaying: boolean;
  progressMs?: number;
  durationMs?: number;
  releaseDate?: string;
}

export interface SpotifyStats {
  topArtists: Array<{ name: string }>;
  recentTracks: SpotifyTrack[];
}

