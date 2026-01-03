import type { APIRoute } from 'astro';

/**
 * Spotify OAuth Callback Endpoint
 * 
 * This endpoint receives the authorization code from Spotify
 * and exchanges it for an access token and refresh token
 */
export const GET: APIRoute = async (context) => {
  // Try accessing URL from context
  const url = context.url;
  const request = context.request;
  
  // Debug: Check what we're getting
  console.log('Callback Debug:');
  console.log('  context.url:', url);
  console.log('  context.url.href:', url.href);
  console.log('  context.url.search:', url.search);
  console.log('  context.url.searchParams.size:', url.searchParams.size);
  console.log('  request.url:', request.url);
  
  // Parse query parameters
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  // Get all URL params for debugging
  const allParams: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    allParams[key] = value;
  }
  
  console.log('  Parsed code:', code);
  console.log('  allParams:', allParams);
  
  const codeToUse = code;
  
  // Spotify requires explicit IP addresses for localhost, not "localhost"
  let redirectUri = url.origin + '/api/spotify/callback';
  if (redirectUri.includes('localhost')) {
    redirectUri = redirectUri.replace('localhost', '127.0.0.1');
  }

  if (error) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Authorization Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #1a1a1a;
              color: #fff;
            }
            .error {
              background: #ff6b6b;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info {
              background: #2a2a2a;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            code {
              background: #1a1a1a;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: monospace;
            }
            pre {
              background: #1a1a1a;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Spotify Authorization Error</h1>
            <p><strong>Error:</strong> ${error}</p>
            ${errorDescription ? `<p><strong>Description:</strong> ${errorDescription}</p>` : ''}
          </div>
          <div class="info">
            <h3>Common Issues:</h3>
            <ul>
              <li><strong>Redirect URI mismatch:</strong> Make sure your Spotify dashboard has exactly: <code>${redirectUri}</code></li>
              <li><strong>User cancelled:</strong> If you clicked "Cancel" on Spotify, try again</li>
            </ul>
            <p><a href="/api/spotify/auth" style="color: #1db954;">Try again</a></p>
          </div>
        </body>
      </html>
      `,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!codeToUse) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Authorization - No Code</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #1a1a1a;
              color: #fff;
            }
            .warning {
              background: #ffa94d;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info {
              background: #2a2a2a;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            code {
              background: #1a1a1a;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: monospace;
            }
            pre {
              background: #1a1a1a;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              background: #1db954;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin: 10px 5px;
              transition: background 0.2s;
            }
            .button:hover {
              background: #1ed760;
            }
            ul {
              margin-left: 20px;
            }
          </style>
        </head>
        <body>
          <div class="warning">
            <h1>⚠️ No Authorization Code Received</h1>
            <p>Spotify redirected here but didn't include an authorization code. This can happen if:</p>
            <ul style="margin-top: 10px;">
              <li>You accessed this URL directly (you need to start from the auth endpoint)</li>
              <li>You didn't click "Agree" on the Spotify authorization page</li>
              <li>The redirect URI in your Spotify dashboard doesn't match exactly</li>
            </ul>
          </div>
          
          <div class="info">
            <h3>Debug Info:</h3>
            <p><strong>Request URL:</strong> <code>${request.url || url.href}</code></p>
            <p><strong>Expected Redirect URI:</strong> <code>${redirectUri}</code></p>
            <p><strong>All URL Parameters:</strong></p>
            <pre>${JSON.stringify(allParams, null, 2)}</pre>
            ${Object.keys(allParams).length === 0 ? '<p style="color: #ffa94d; margin-top: 10px;"><strong>⚠️ No parameters at all!</strong> This usually means you accessed the callback URL directly, or Spotify redirected without parameters.</p>' : ''}
          </div>
          
          <div class="info">
            <h3>How to Fix:</h3>
            <ol>
              <li><strong>Start the OAuth flow properly:</strong> 
                <br>Don't access the callback URL directly. Instead, click this button:
                <br><a href="/api/spotify/auth" class="button" style="display: inline-block; margin-top: 10px; background: #1db954; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">🚀 Start Authorization</a>
              </li>
              <li><strong>On the Spotify page:</strong> Make sure you click "Agree" or "Authorize" (don't click Cancel)</li>
              <li><strong>Verify your Spotify Dashboard:</strong>
                <ul style="margin-top: 10px;">
                  <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: #1db954;">Spotify Developer Dashboard</a></li>
                  <li>Click on your app</li>
                  <li>In "Redirect URIs", make sure you have EXACTLY:</li>
                  <pre style="margin: 10px 0;">${redirectUri}</pre>
                  <li>Click "Save" if you made any changes</li>
                </ul>
              </li>
            </ol>
          </div>
        </body>
      </html>
      `,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

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
        code: codeToUse,
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

