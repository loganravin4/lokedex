import type { APIRoute } from 'astro';

/**
 * Spotify OAuth Authorization Endpoint
 * 
 * Visit this endpoint to start the OAuth flow and get your refresh token
 * After authorizing, you'll be redirected to /api/spotify/callback
 */
export const GET: APIRoute = async ({ url }) => {
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  
  // Spotify requires explicit IP addresses for localhost, not "localhost"
  let redirectUri = url.origin + '/api/spotify/callback';
  if (redirectUri.includes('localhost')) {
    redirectUri = redirectUri.replace('localhost', '127.0.0.1');
  }
  
  if (!clientId) {
    return new Response(
      'SPOTIFY_CLIENT_ID not found in environment variables. Please add it to your .env file.',
      { status: 500 }
    );
  }

  const scopes = [
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
  ].join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('show_dialog', 'false');

  return Response.redirect(authUrl.toString(), 302);
};

