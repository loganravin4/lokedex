/**
 * Shared Spotify access-token handling.
 *
 * Previously now-playing.ts and stats.ts each ran their own refresh_token
 * exchange on every single request, and logged any failure as a generic
 * "Spotify token error", which made a revoked refresh token look identical to
 * a transient network blip.
 */

export type TokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: 'not_configured' | 'reauth_required' | 'error'; detail?: string };

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

// Module-level cache. On Vercel this persists for the life of a warm instance,
// so a page that polls now-playing no longer mints a token every few seconds.
let cached: CachedToken | null = null;

// A revoked token fails identically forever; log it once per instance rather
// than once per poll.
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

    // invalid_grant means the refresh token is dead for good. No amount of
    // retrying fixes it — it has to be re-minted through the OAuth flow.
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

  // Spotify normally reuses the refresh token, but it is allowed to rotate it.
  // If that ever happens the stored one is now stale, so say so loudly.
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

/** Endpoints return `null` on any failure so the widget shows its fallback. */
export const emptyJson = () =>
  new Response(JSON.stringify(null), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
