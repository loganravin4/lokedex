import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { SpotifyTrack, SpotifyStats } from '../../lib/spotify';

export default function SpotifyWidget() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SpotifyTrack | null>(null);
  const [stats, setStats] = useState<SpotifyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSpotifyData() {
      try {
        setLoading(true);
        // Try to get currently playing first
        const playing = await fetch('/api/spotify/now-playing').then(res => 
          res.ok ? res.json() : null
        ).catch(() => null);
        
        setCurrentlyPlaying(playing);

        // Get stats
        const statsData = await fetch('/api/spotify/stats').then(res =>
          res.ok ? res.json() : null
        ).catch(() => null);
        
        setStats(statsData);
        setError(false);
      } catch (err) {
        console.error('Error fetching Spotify data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSpotifyData();
  }, []); // Only run once on mount

  // Smart refresh: only update when song changes or when current song should end
  useEffect(() => {
    if (!currentlyPlaying?.isPlaying || document.hidden) {
      return;
    }

    const progressMs = currentlyPlaying.progressMs || 0;
    const durationMs = currentlyPlaying.durationMs || 0;
    
    // Calculate when to refresh:
    // 1. When the current song should end (duration - progress + small buffer)
    // 2. Or check every 30 seconds as a fallback to catch song changes
    const timeRemaining = durationMs > 0 ? durationMs - progressMs : 30000;
    const refreshDelay = Math.min(timeRemaining + 2000, 30000); // Add 2s buffer, max 30s

    const timeout = setTimeout(() => {
      if (document.hidden) return;
      
      fetch('/api/spotify/now-playing')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.isPlaying) {
            // Always update so the effect reschedules the next poll (same-track
            // refreshes used to no-op and stop polling after the first timeout)
            setCurrentlyPlaying(data);
          } else {
            setCurrentlyPlaying(null);
          }
        })
        .catch(() => {});
    }, refreshDelay);

    return () => clearTimeout(timeout);
  }, [currentlyPlaying?.id, currentlyPlaying?.isPlaying, currentlyPlaying?.progressMs, currentlyPlaying?.durationMs]);

  // When nothing is playing, poll for new playback and refresh recent tracks
  useEffect(() => {
    if (currentlyPlaying?.isPlaying || document.hidden) {
      return;
    }

    const refreshIdle = () => {
      if (document.hidden) return;

      fetch('/api/spotify/now-playing')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.isPlaying) {
            setCurrentlyPlaying(data);
          }
        })
        .catch(() => {});

      fetch('/api/spotify/stats')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setStats(data);
        })
        .catch(() => {});
    };

    const interval = setInterval(refreshIdle, 60_000);
    return () => clearInterval(interval);
  }, [currentlyPlaying?.isPlaying]);

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
              className="block font-body font-bold text-base sm:text-lg leading-snug text-ink hover:text-dex-blue break-words"
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
