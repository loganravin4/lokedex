import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { SpotifyTrack, SpotifyStats } from '../../lib/spotify';

const IDLE_POLL_MS = 60_000;
const MAX_PLAYING_POLL_MS = 30_000;
const END_BUFFER_MS = 2_000;
const RETRY_MS = 5_000;

// Resolves undefined on a failed request, so it can't be mistaken for the
// API's null "nothing playing". no-store so a browser-cached response can't
// hand back the same snapshot.
const getJson = <T,>(url: string): Promise<T | null | undefined> =>
  fetch(url, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : undefined))
    .catch(() => undefined);

export default function SpotifyWidget() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SpotifyTrack | null>(null);
  const [stats, setStats] = useState<SpotifyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // One self-scheduling loop. Every poll books the next one whatever the
  // outcome, so a failed fetch, a repeated snapshot or a hidden tab can't
  // stall it. Hidden tabs pause, then poll at once on return.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let lastStatsAt = 0;

    const schedule = (track: SpotifyTrack | null) => {
      clearTimeout(timer);
      if (cancelled || document.hidden) return;
      let delay = IDLE_POLL_MS;
      if (track) {
        const remaining = (track.durationMs ?? 0) - (track.progressMs ?? 0);
        delay = remaining > 0 ? Math.min(remaining + END_BUFFER_MS, MAX_PLAYING_POLL_MS) : END_BUFFER_MS;
      }
      timer = setTimeout(poll, delay);
    };

    const retry = () => {
      clearTimeout(timer);
      if (!cancelled) timer = setTimeout(poll, RETRY_MS);
    };

    const poll = async () => {
      clearTimeout(timer);
      if (document.hidden) return;

      const playing = await getJson<SpotifyTrack>('/api/spotify/now-playing');
      if (cancelled) return;
      // A failed request keeps the current track on screen and retries soon
      if (playing === undefined && lastStatsAt !== 0) return retry();
      const track = playing?.isPlaying ? playing : null;

      // Stats on first load, then at most once a minute while idle
      let freshStats: SpotifyStats | null | undefined = null;
      const statsDue = lastStatsAt === 0 || (!track && Date.now() - lastStatsAt >= IDLE_POLL_MS);
      if (statsDue) {
        lastStatsAt = Date.now();
        freshStats = await getJson<SpotifyStats>('/api/spotify/stats');
      }

      if (cancelled) return;
      setCurrentlyPlaying(track);
      if (freshStats) setStats(freshStats);
      // Nothing playing and no stats means the API is down or unconfigured
      if (statsDue) setError(!track && !freshStats);
      setLoading(false);
      if (playing === undefined) retry();
      else schedule(track);
    };

    const onVisible = () => {
      if (!document.hidden) poll();
    };

    poll();
    document.addEventListener('visibilitychange', onVisible);
    // iOS restores pages from bfcache without a visibilitychange
    window.addEventListener('pageshow', onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, []);

  // Tick the track clock locally between polls
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (!currentlyPlaying?.isPlaying) return;
    const start = Date.now();
    const base = currentlyPlaying.progressMs ?? 0;
    const cap = currentlyPlaying.durationMs ?? base;
    setElapsedMs(base);
    const id = setInterval(() => setElapsedMs(Math.min(base + Date.now() - start, cap)), 1000);
    return () => clearInterval(id);
  }, [currentlyPlaying?.id, currentlyPlaying?.isPlaying, currentlyPlaying?.progressMs, currentlyPlaying?.durationMs]);

  if (loading) {
    return (
      <Plate lamp="off" title="SPOTIFY" aside="LOADING">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-paper-3 animate-lamp-blink" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-paper-3 w-32" />
            <div className="h-3 bg-paper-3 w-24" />
          </div>
        </div>
      </Plate>
    );
  }

  if (error && !currentlyPlaying && !stats) {
    return (
      <Plate lamp="off" title="SPOTIFY" aside="OFFLINE">
        <p className="font-body font-bold text-ink">Spotify listening stats</p>
        <p className="font-data text-xs sm:text-sm text-ink-soft mt-1">(will almost ALWAYS be The Weeknd)</p>
      </Plate>
    );
  }

  if (currentlyPlaying?.isPlaying) {
    const t = currentlyPlaying;
    const year = t.releaseDate ? new Date(t.releaseDate).getFullYear() : null;
    const duration = t.durationMs ?? 0;
    const filled = duration > 0 ? Math.round((elapsedMs / duration) * SEGMENTS) : 0;

    return (
      <Plate lamp="on" title="NOW PLAYING" aside="SPOTIFY">
        <div className="flex gap-4 sm:gap-5 items-start">
          {t.albumArt && (
            <div className="shrink-0 bg-ink p-1.5">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 bg-screen-0 overflow-hidden">
                <img
                  src={t.albumArt}
                  alt={`${t.album} cover`}
                  width={112}
                  height={112}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <a
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              // Padding offset by negative margin: a 44px tap target, same layout
              className="block -my-[11px] py-[11px] font-body font-bold text-base sm:text-lg leading-snug text-ink hover:text-dex-blue break-words"
            >
              {t.name}
            </a>
            <p className="font-body text-sm sm:text-base text-ink-soft break-words mt-0.5">{t.artist}</p>
            <p className="font-data text-xs text-ink-soft break-words mt-1">
              {t.album}
              {year && <> &middot; {year}</>}
            </p>
          </div>
        </div>

        {/* LCD readout: equalizer over a segmented track clock */}
        <div className="mt-4 bg-ink p-1.5">
          <div className="crt bg-screen-0 px-3 pt-3 pb-2.5">
            <div className="flex items-end gap-[3px] h-10 sm:h-12" aria-hidden="true">
              {EQ_BARS.map(([peak, dur, delay], i) => (
                <span
                  key={i}
                  className="eq-bar flex-1 h-full bg-screen-3"
                  style={{ '--eq-peak': peak, '--eq-dur': `${dur}s`, '--eq-delay': `${delay}s` } as CSSProperties}
                />
              ))}
            </div>

            {duration > 0 && (
              <div className="mt-2.5 flex items-center gap-2 font-data text-[0.7rem] text-screen-3 tabular-nums">
                <span>{formatTime(elapsedMs)}</span>
                <div
                  className="flex-1 flex gap-[2px] h-2"
                  role="progressbar"
                  aria-label="Track progress"
                  aria-valuemin={0}
                  aria-valuemax={Math.round(duration / 1000)}
                  aria-valuenow={Math.round(elapsedMs / 1000)}
                >
                  {Array.from({ length: SEGMENTS }, (_, i) => (
                    <span key={i} className={`flex-1 ${i < filled ? 'bg-screen-3' : 'bg-screen-1'}`} />
                  ))}
                </div>
                <span className="text-screen-2">{formatTime(duration)}</span>
              </div>
            )}
          </div>
        </div>
      </Plate>
    );
  }

  const topArtist = stats?.topArtists?.[0]?.name;
  const recent = stats?.recentTracks?.slice(0, 3) ?? [];

  return (
    <Plate lamp="off" title="LISTENING LOG" aside="SPOTIFY">
      <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
        <span className="font-display text-[0.55rem] tracking-[0.15em] text-ink-soft">TOP ARTIST</span>
        <span className="font-body font-bold text-ink">{topArtist ?? 'The Weeknd, probably'}</span>
      </div>

      {recent.length > 0 && (
        <div className="mt-4 bg-ink p-1.5">
          <div className="crt bg-screen-0 px-3 py-2.5">
            <p className="font-display text-[0.55rem] tracking-[0.15em] text-screen-2 mb-1.5">RECENTLY PLAYED</p>
            <ol className="font-data text-xs sm:text-sm text-screen-3 space-y-1">
              {recent.map((track, idx) => (
                <li key={idx} className="flex gap-2 min-w-0">
                  <span className={`shrink-0 ${idx === 0 ? '' : 'invisible'}`} aria-hidden="true">▶</span>
                  <span className="break-words min-w-0">
                    {track.name} <span className="text-screen-2">&mdash; {track.artist}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Plate>
  );
}

const SEGMENTS = 20;

/** [peak scale, period in s, delay in s]. Negative delays desync the bars on first paint. */
const EQ_BARS: Array<[number, number, number]> = Array.from({ length: 16 }, (_, i) => [
  0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + 0.4)),
  0.7 + ((i * 37) % 5) * 0.12,
  -((i * 53) % 9) * 0.11,
]);

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Device plate: ink header strip with a status lamp over a recessed body. */
function Plate({ lamp, title, aside, children }: { lamp: 'on' | 'off'; title: string; aside: string; children: ReactNode }) {
  return (
    <div className="bg-paper-2 border-[3px] border-ink" data-spotify-widget>
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-ink text-paper">
        <span
          className={`w-2.5 h-2.5 rounded-full border-2 border-paper/70 shrink-0 ${
            lamp === 'on' ? 'bg-lamp-green animate-lamp-blink' : 'bg-paper-3'
          }`}
          aria-hidden="true"
        />
        <span className="font-display text-[0.6rem] sm:text-xs tracking-[0.18em]">{title}</span>
        <span className="ml-auto font-data text-[0.65rem] tracking-wide opacity-80">{aside}</span>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}
