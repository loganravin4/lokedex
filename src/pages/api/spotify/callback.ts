import type { APIRoute } from 'astro';

/**
 * Spotify OAuth Callback Endpoint
 * 
 * This endpoint receives the authorization code from Spotify
 * and exchanges it for an access token and refresh token
 */
export const GET: APIRoute = async ({ url, request }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(
      `Spotify authorization error: ${error}. Please try again.`,
      { status: 400 }
    );
  }

  if (!code) {
    return new Response(
      'No authorization code received. Please try the authorization flow again.',
      { status: 400 }
    );
  }

  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = url.origin + '/api/spotify/callback';

  if (!clientId || !clientSecret) {
    return new Response(
      'SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not found. Please add them to your .env file.',
      { status: 500 }
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(
        `Failed to exchange code for tokens: ${errorText}`,
        { status: 500 }
      );
    }

    const tokens = await tokenResponse.json();

    // Display the refresh token to the user
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify OAuth Success</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #1a1a1a;
              color: #fff;
            }
            .success {
              background: #1db954;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .token-box {
              background: #2a2a2a;
              padding: 15px;
              border-radius: 8px;
              border: 2px solid #1db954;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
            }
            .instructions {
              background: #2a2a2a;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            code {
              background: #1a1a1a;
              padding: 2px 6px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>Spotify Authorization Successful!</h1>
          </div>
          
          <h2>Your Refresh Token:</h2>
          <div class="token-box">
            ${tokens.refresh_token}
          </div>
          
          <div class="instructions">
            <h3>Next Steps:</h3>
            <ol>
              <li>Copy the refresh token above</li>
              <li>Add it to your <code>.env</code> file:</li>
              <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; margin: 10px 0;">
SPOTIFY_CLIENT_ID=${clientId}
SPOTIFY_CLIENT_SECRET=${clientSecret}
SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}
              </pre>
              <li>Restart your dev server</li>
              <li>Visit your homepage to see the Spotify widget in action!</li>
            </ol>
          </div>
          
          <p style="margin-top: 20px; color: #888;">
            <strong>Note:</strong> Keep your refresh token secret! Don't commit it to version control.
          </p>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Spotify callback error:', error);
    return new Response(
      `Error processing authorization: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
};

