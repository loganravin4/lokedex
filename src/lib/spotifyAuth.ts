/**
 * Spotify Access Token Helper
 * Shared by the now-playing and stats endpoints. Caches the token until it
 * expires and reports a revoked refresh token separately from other failures.
 */

export type TokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: 'not_configured' | 'reauth_required' | 'error'; detail?: string };

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

// Persists for the life of a warm serverless instance
let cached: CachedToken | null = null;

// A revoked token fails the same way forever, so only warn once
let warnedReauth = false;

const REFRESH_MARGIN_MS = 60_000;

export async function getSpotifyAccessToken(): Promise<TokenResult> {
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, reason: 'not_configured' };
  }

  if (cached && Date.now() < cached.expiresAt - REFRESH_MARGIN_MS) {
    return { ok: true, accessToken: cached.accessToken };
  }

  let response: Response;
  try {
    response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
  } catch (err) {
    return { ok: false, reason: 'error', detail: String(err) };
  }

  const raw = await response.text();

  if (!response.ok) {
    let parsed: { error?: string; error_description?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      /* non-JSON error body */
    }

    // invalid_grant is permanent; the token must be re-minted via OAuth
    if (parsed.error === 'invalid_grant') {
      cached = null;
      if (!warnedReauth) {
        warnedReauth = true;
        console.error(
          [
            '',
            '  Spotify refresh token is revoked — the widget will stay empty until it is replaced.',
            `  Spotify said: ${parsed.error_description ?? 'invalid_grant'}`,
            '',
            '  This cannot be fixed in code; OAuth needs an interactive login.',
            '    1. open /api/spotify/auth and authorize',
            '    2. copy the SPOTIFY_REFRESH_TOKEN the callback prints',
            '    3. update .env and the Vercel env var, then redeploy',
            '',
          ].join('\n')
        );
      }
      return { ok: false, reason: 'reauth_required', detail: parsed.error_description };
    }

    return { ok: false, reason: 'error', detail: raw.slice(0, 200) };
  }

  const data = JSON.parse(raw) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  // Spotify may rotate the refresh token, leaving the stored one stale
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    console.warn(
      'Spotify returned a NEW refresh token. Update SPOTIFY_REFRESH_TOKEN or ' +
        'the current one will stop working:\n' +
        data.refresh_token
    );
  }

  cached = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  warnedReauth = false;

  return { ok: true, accessToken: data.access_token };
}

/** Empty response so the widget shows its fallback instead of erroring. */
export const emptyJson = () =>
  new Response(JSON.stringify(null), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
