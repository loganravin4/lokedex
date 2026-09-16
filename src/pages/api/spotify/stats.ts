import type { APIRoute } from 'astro';
import { getSpotifyAccessToken, emptyJson } from '../../../lib/spotifyAuth';

export const GET: APIRoute = async () => {

  try {
    const token = await getSpotifyAccessToken();
    if (!token.ok) return emptyJson();
    const access_token = token.accessToken;

    // Get recent tracks
    const recentTracksResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const recentTracksData = recentTracksResponse.ok ? await recentTracksResponse.json() : null;
    
    // Get top artists
    const topArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const topArtistsData = topArtistsResponse.ok ? await topArtistsResponse.json() : null;

    const recentTracks = recentTracksData?.items?.map((item: any) => ({
      name: item.track.name,
      artist: item.track.artists.map((a: any) => a.name).join(', '),
      album: item.track.album.name,
      albumArt: item.track.album.images[0]?.url || '',
      url: item.track.external_urls.spotify,
      isPlaying: false,
    })) || [];

    const stats = {
      topArtists: topArtistsData?.items?.map((artist: any) => ({
        name: artist.name,
      })) || [],
      recentTracks,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Spotify API error:', error);
    // Return null instead of error so widget can show fallback
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

