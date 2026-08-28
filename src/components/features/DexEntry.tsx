import TypingTitle from './TypingTitle';

interface DexEntryProps {
  titles: string[];
}

const STATS: Array<[string, string]> = [
  ['LV', '100'],
  ['MAJOR', 'CmpE + CS'],
  ['GPA', '3.9 / 4.0'],
  ['DEX', 'NEU 2027'],
];

/**
 * The signature element: the hero rendered as a live Pokédex entry.
 * The boot sequence is pure CSS (see .boot-seq / .lcd-on), so the entry is
 * legible with no JS, no animation support, or reduced motion. Only the
 * typed job title needs hydration.
 */
export default function DexEntry({ titles }: DexEntryProps) {
  return (
    <div className="pixel-lift bg-paper">
      {/* header plate */}
      <div className="flex items-center gap-3 px-4 py-3 bg-dex-red text-paper border-b-[3px] border-ink">
        <span className="font-display text-[0.6rem] tracking-[0.2em] opacity-80" aria-hidden="true">
          &#9622;&#9622;
        </span>
        <h1 className="font-display text-xs sm:text-sm tracking-[0.12em]">DEX ENTRY</h1>
        <span className="font-data text-xs sm:text-sm ml-auto tabular-nums">No. 001</span>
        <span className="hidden sm:flex gap-1 ml-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`block w-2 h-4 border-2 border-paper/80 ${i < 3 ? 'bg-paper/90' : ''}`}
            />
          ))}
        </span>
      </div>

      <div className="grid gap-6 p-5 md:p-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8">
        {/* LCD: the portrait lives inside the screen */}
        <div className="flex flex-col gap-4">
          <div className="bg-ink p-2 lcd-on">
            <div className="relative aspect-square w-full bg-screen-0 overflow-hidden crt">
              <img
                src="/headshot.png"
                alt="Logan Ravinuthala"
                width={512}
                height={512}
                className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-90"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  el.src = '/favicon.svg';
                }}
              />
              <div className="absolute inset-0 bg-screen-0/40" aria-hidden="true" />
              <div
                className="absolute inset-x-0 h-10 z-[2] animate-scan-sweep pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, rgba(155,188,15,0.22), transparent)',
                }}
                aria-hidden="true"
              />
              <span className="absolute left-2 top-2 z-[4] font-display text-[0.5rem] tracking-[0.2em] text-screen-3">
                SCANNING
              </span>
            </div>
          </div>

          {/* D-pad + action buttons: device chrome, not controls */}
          <div className="flex items-center justify-between px-1" aria-hidden="true">
            <div className="relative w-16 h-16 shrink-0">
              <span className="absolute left-1/3 top-0 w-1/3 h-full bg-ink" />
              <span className="absolute top-1/3 left-0 h-1/3 w-full bg-ink" />
              <span className="absolute left-[40%] top-[40%] w-[20%] h-[20%] rounded-full bg-paper-3" />
            </div>
            <div className="flex gap-3 items-end">
              <span className="flex flex-col items-center gap-1.5">
                <span className="w-9 h-9 rounded-full bg-dex-red border-[3px] border-ink" />
                <span className="font-display text-[0.55rem] text-ink-soft">A</span>
              </span>
              <span className="flex flex-col items-center gap-1.5">
                <span className="w-9 h-9 rounded-full bg-dex-blue border-[3px] border-ink" />
                <span className="font-display text-[0.55rem] text-ink-soft">B</span>
              </span>
            </div>
          </div>
        </div>

        {/* Entry text — powers on line by line via CSS */}
        <div className="min-w-0 boot-seq">
          <p className="font-display text-[0.6rem] tracking-[0.25em] text-ink-soft mb-2">TRAINER</p>

          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl tracking-[0.02em] text-ink mb-4 leading-[1.25]">
            LOGAN
            <br />
            RAVINUTHALA
          </h2>

          <div className="bg-ink p-2 mb-5">
            <p className="bg-screen-0 px-3 py-2.5 font-data text-sm sm:text-base text-screen-3 min-h-[2.75rem] flex items-center">
              <span className="text-screen-2 mr-2 shrink-0" aria-hidden="true">
                &#9656;
              </span>
              <TypingTitle
                titles={titles}
                baseText=""
                typingSpeed={100}
                deletingSpeed={50}
                pauseDuration={2000}
              />
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5">
            {STATS.map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2 border-b-2 border-paper-3 pb-1.5">
                <dt className="font-display text-[0.55rem] tracking-[0.15em] text-ink-soft shrink-0">
                  {k}
                </dt>
                <dd className="font-data text-sm text-ink ml-auto text-right">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="text-sm text-ink-soft leading-relaxed mb-3">
            Honors Computer Engineering &amp; Computer Science @ Northeastern University.
          </p>

          <p className="text-sm text-ink leading-relaxed mb-6">
            Exploring New Grad software engineering (or related) opportunities for when I graduate
            in{' '}
            <span data-graduation-countdown className="font-data font-semibold text-dex-red">
              &hellip;
            </span>{' '}
            (
            <span data-graduation-days className="font-data font-semibold text-dex-red">
              --
            </span>{' '}
            days).{' '}
            <a
              href="#new-grad"
              className="text-dex-blue underline underline-offset-2 decoration-2 hover:bg-dex-blue hover:text-paper whitespace-nowrap"
            >
              Full timeline
            </a>
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#projects"
              data-track-cta="View Favorites"
              className="font-display text-[0.7rem] tracking-wider px-5 py-3.5 pixel-box pixel-press bg-dex-red text-paper hover:bg-dex-red-deep"
            >
              VIEW FAVORITES
            </a>
            <a
              href="#about"
              data-track-cta="About Trainer"
              className="font-display text-[0.7rem] tracking-wider px-5 py-3.5 pixel-box pixel-press bg-paper text-ink hover:bg-paper-3"
            >
              ABOUT TRAINER
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
