import type { APIRoute } from 'astro';

/**
 * Spotify Now Playing API Endpoint
 */
export const GET: APIRoute = async () => {
  const spotifyClientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const spotifyRefreshToken = import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!spotifyClientId || !spotifyClientSecret || !spotifyRefreshToken) {
    // Return null instead of error so widget can show fallback
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: spotifyRefreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Spotify token error:', errorData);
      // Return null instead of error so widget can show fallback
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { access_token } = await tokenResponse.json();

    // Get currently playing track
    const nowPlayingResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (nowPlayingResponse.status === 204 || !nowPlayingResponse.ok) {
      // No track currently playing
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
      id: data.item.id, // Track ID to detect song changes
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
        'Cache-Control': 'public, max-age=5', // Cache for 5 seconds to balance freshness and API calls
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

