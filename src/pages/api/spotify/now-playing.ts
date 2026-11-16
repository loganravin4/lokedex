import type { APIRoute } from 'astro';
import { getSpotifyAccessToken, emptyJson } from '../../../lib/spotifyAuth';

export const GET: APIRoute = async () => {

  try {
    const token = await getSpotifyAccessToken();
    if (!token.ok) return emptyJson();
    const access_token = token.accessToken;

    const nowPlayingResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (nowPlayingResponse.status === 204 || !nowPlayingResponse.ok) {
      // 204 is Spotify's "nothing playing"; errors fall back the same way
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await nowPlayingResponse.json();
    
    if (!data.item) {
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const track = {
      // Lets the widget detect song changes
      id: data.item.id,
      name: data.item.name,
      artist: data.item.artists.map((a: any) => a.name).join(', '),
      album: data.item.album.name,
      albumArt: data.item.album.images[0]?.url || '',
      url: data.item.external_urls.spotify,
      isPlaying: data.is_playing,
      progressMs: data.progress_ms || 0,
      durationMs: data.item.duration_ms || 0,
      releaseDate: data.item.album.release_date || '',
    };

    return new Response(JSON.stringify(track), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        // Short enough to catch song changes, long enough to spare the Spotify API
        'Cache-Control': 'public, max-age=5',
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

