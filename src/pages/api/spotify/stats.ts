import type { APIRoute } from 'astro';

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
        'Cache-Control': 'public, max-age=600', // Cache for 10 minutes to reduce API calls
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

