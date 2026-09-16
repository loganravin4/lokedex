import { useCallback, useState } from 'react';
import TypingTitle from './TypingTitle';

interface DexEntryProps {
  titles: string[];
}

/** Trainer-card rows. Values are spelled out — no abbreviations. */
const STATS: Array<[string, string]> = [
  ['NAME', 'Logan Ravinuthala'],
  ['SCHOOL', 'Northeastern University'],
  ['MAJOR', 'Computer Engineering & Computer Science'],
  ['GRADUATION', 'May 2027'],
  ['GPA', '3.9 / 4.0'],
  ['LEVEL', '100'],
];

/** Sections the D-pad steps through, in page order. */
const SECTIONS = ['skills', 'projects', 'about'];

const NAV_OFFSET = 96;

export default function DexEntry({ titles }: DexEntryProps) {
  const [jump, setJump] = useState(0);
  const [scanning, setScanning] = useState(true);

  const goSection = useCallback((dir: 1 | -1) => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!els.length) return;

    const tops = els.map((el) => el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET);
    const here = window.scrollY;

    let target: number;
    if (dir === 1) {
      target = tops.find((t) => t > here + 8) ?? tops[tops.length - 1];
    } else {
      const prev = [...tops].reverse().find((t) => t < here - 8);
      target = prev ?? 0;
    }
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, []);

  const dpadBtn =
    'hw-btn flex items-center justify-center bg-ink text-paper hover:bg-dex-red cursor-pointer text-[0.7rem] leading-none';

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
              className={`block w-2 h-4 border-2 border-paper/80 ${i < 3 ? 'bg-dex-yellow' : ''}`}
            />
          ))}
        </span>
      </div>

      <div className="grid gap-6 p-5 md:p-7 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-8">
        {/* LCD + working hardware controls */}
        <div className="flex flex-col gap-4">
          <div className="bg-ink p-2 lcd-on">
            <div className="relative aspect-square w-full bg-screen-0 overflow-hidden">
              {/* Clear photo sits underneath; the scan layer is what retracts. */}
              <img
                src="/headshot.png"
                alt="Logan Ravinuthala"
                width={512}
                height={512}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  el.src = '/favicon.svg';
                }}
              />

              {/* Scan layer: LCD tint + scanlines. Wipes upward off the top. */}
              <div
                data-scan-layer
                // opaque green base: mix-blend-luminosity must blend against the LCD
                // colour, not against the clear photo now sitting underneath
                className="absolute inset-0 crt bg-screen-0 transition-[clip-path] duration-700 ease-out"
                style={{ clipPath: scanning ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)' }}
                aria-hidden="true"
              >
                <img
                  src="/headshot.png"
                  alt=""
                  width={512}
                  height={512}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-90"
                />
                <div className="absolute inset-0 bg-screen-0/40" />
                <div
                  className="absolute inset-x-0 h-10 z-[2] animate-scan-sweep pointer-events-none motion-reduce:hidden"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent, rgba(155,188,15,0.22), transparent)',
                  }}
                />
              </div>

              {/* The bar rides the wipe boundary, so the photo develops behind it. */}
              <div
                className="absolute inset-x-0 z-[3] h-[3px] bg-screen-3 pointer-events-none"
                style={{
                  top: scanning ? '0%' : '100%',
                  opacity: scanning ? 1 : 0,
                  boxShadow: '0 0 12px 2px rgba(155,188,15,0.65)',
                  // fade out only once the wipe has finished, but fade back in
                  // immediately when the scan resumes
                  transition: scanning
                    ? 'top 700ms ease-out, opacity 150ms ease-out'
                    : 'top 700ms ease-out, opacity 220ms ease-out 600ms',
                }}
                aria-hidden="true"
              />

              <span
                className={`absolute left-2 top-2 z-[4] font-display text-[0.5rem] tracking-[0.2em] ${
                  scanning ? 'text-screen-3' : 'text-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                }`}
              >
                {scanning ? 'SCANNING' : 'PHOTO'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setScanning((v) => !v)}
            aria-pressed={!scanning}
            className="hw-btn w-full flex items-center justify-center gap-2.5 min-h-11 px-4 font-display text-[0.6rem] tracking-wider border-[3px] border-ink bg-paper-2 text-ink hover:bg-dex-yellow cursor-pointer"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border-2 border-ink shrink-0 ${
                scanning ? 'bg-lamp-green animate-lamp-blink' : 'bg-paper-3'
              }`}
              aria-hidden="true"
            />
            {scanning ? 'SHOW PHOTO' : 'RESUME SCAN'}
          </button>

          <div className="flex items-start justify-between gap-3">
            {/* D-pad: up/down step sections, left/right cycle the title */}
            <div className="shrink-0">
              <div className="grid grid-cols-3 grid-rows-3 w-36 h-36 sm:w-32 sm:h-32">
                <span />
                <button
                  type="button"
                  onClick={() => goSection(-1)}
                  className={dpadBtn}
                  aria-label="Jump to previous section"
                  title="Previous section"
                >
                  &#9650;
                </button>
                <span />
                <button
                  type="button"
                  onClick={() => setJump((j) => j - 1)}
                  className={dpadBtn}
                  aria-label="Show previous title"
                  title="Previous title"
                >
                  &#9664;
                </button>
                <span className="bg-ink flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-paper-3" aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={() => setJump((j) => j + 1)}
                  className={dpadBtn}
                  aria-label="Show next title"
                  title="Next title"
                >
                  &#9654;
                </button>
                <span />
                <button
                  type="button"
                  onClick={() => goSection(1)}
                  className={dpadBtn}
                  aria-label="Jump to next section"
                  title="Next section"
                >
                  &#9660;
                </button>
                <span />
              </div>
            </div>

            {/* A / B jump to the two pages you'd actually want next */}
            <div className="flex gap-3 items-start pt-1">
              <a
                href="/projects"
                className="hw-btn flex flex-col items-center gap-1.5 group"
                aria-label="A button: go to Projects"
                title="Projects"
              >
                <span className="w-11 h-11 rounded-full bg-dex-red border-[3px] border-ink flex items-center justify-center font-display text-xs text-paper">
                  A
                </span>
                <span className="font-display text-[0.55rem] tracking-[0.15em] text-ink-soft">
                  PROJECTS
                </span>
              </a>
              <a
                href="/contact"
                className="hw-btn flex flex-col items-center gap-1.5 group"
                aria-label="B button: go to Contact"
                title="Contact"
              >
                <span className="w-11 h-11 rounded-full bg-dex-blue border-[3px] border-ink flex items-center justify-center font-display text-xs text-paper">
                  B
                </span>
                <span className="font-display text-[0.55rem] tracking-[0.15em] text-ink-soft">
                  CONTACT
                </span>
              </a>
            </div>
          </div>

          <p className="font-data text-[0.7rem] text-ink-soft leading-snug">
            The D-pad works: up and down step through sections, left and right cycle the title.
          </p>
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
            <p
              data-title-lcd
              className="bg-screen-0 px-3 py-2.5 font-data text-sm sm:text-base text-screen-3 min-h-[2.75rem] flex items-center"
            >
              <span className="text-screen-2 mr-2 shrink-0" aria-hidden="true">
                &#9656;
              </span>
              <TypingTitle
                titles={titles}
                baseText=""
                typingSpeed={100}
                deletingSpeed={50}
                pauseDuration={2000}
                jump={jump}
              />
            </p>
          </div>

          {/* Trainer card */}
          <div className="border-[3px] border-ink mb-5">
            <div className="bg-dex-yellow border-b-[3px] border-ink px-3 py-2">
              <p className="font-display text-[0.6rem] tracking-[0.18em] text-ink">TRAINER CARD</p>
            </div>
            <dl className="bg-dex-yellow/25">
              {STATS.map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-2 ${
                    i < STATS.length - 1 ? 'border-b-2 border-ink/20' : ''
                  }`}
                >
                  <dt className="font-display text-[0.5rem] tracking-[0.15em] text-ink-soft w-24 shrink-0">
                    {k}
                  </dt>
                  <dd className="font-data text-sm text-ink min-w-0">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Actions span the column so the entry closes on a full-width edge. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="#projects"
              data-track-cta="View Favorites"
              className="text-center font-display text-[0.7rem] tracking-wider px-5 py-3.5 pixel-box pixel-press bg-dex-red text-paper hover:bg-dex-red-deep"
            >
              VIEW FAVORITES
            </a>
            <a
              href="#about"
              data-track-cta="About Trainer"
              className="text-center font-display text-[0.7rem] tracking-wider px-5 py-3.5 pixel-box pixel-press bg-dex-yellow text-ink hover:bg-dex-yellow-deep"
            >
              ABOUT TRAINER
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
