import { useCallback, useEffect, useRef, useState } from 'react';
import TypeChip from '../ui/TypeChip';
import { categoryHex } from '../../lib/pokeTypes';

/**
 * Flippable project entry with pointer-tracked tilt.
 * Tilt adapted from 21st.dev "Tilt Flip Card" (@dudadecesaro).
 */

interface Project {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  types: string[];
  techs: string[];
  link?: string;
  github?: string;
}

interface PokedexCardProps {
  project: Project;
  index: number;
}

const mapRange = (v: number, a1: number, a2: number, b1: number, b2: number) =>
  b1 + ((v - a1) * (b2 - b1)) / (a2 - a1);

// React 18 has no typed `inert` prop; browsers read the bare attribute
const inertIf = (hidden: boolean) => (hidden ? ({ inert: '' } as Record<string, string>) : {});

export default function PokedexCard({ project, index }: PokedexCardProps) {
  const [flipped, setFlipped] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const inside = useRef(false);

  const accent = categoryHex(project.types[0]);
  const entryNo = String(index + 1).padStart(3, '0');

  const resetTilt = useCallback(() => {
    if (frontRef.current) frontRef.current.style.transform = '';
    if (backRef.current) backRef.current.style.transform = 'rotateY(180deg)';
  }, []);

  const applyTilt = useCallback((clientX: number, clientY: number, isFlipped: boolean) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = cardRef.current;
    const face = isFlipped ? backRef.current : frontRef.current;
    if (!card || !face) return;

    const r = card.getBoundingClientRect();
    const ry = mapRange(clientX - r.left, 0, r.width, -9, 9);
    const rx = mapRange(clientY - r.top, 0, r.height, 9, -9);

    face.style.transform = isFlipped
      ? `rotateY(180deg) rotateX(${rx}deg) rotateY(${ry}deg)`
      : `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, []);

  // Re-seat the tilt on whichever face is now facing the viewer
  useEffect(() => {
    if (!inside.current || !pointer.current) {
      resetTilt();
      return;
    }
    const { x, y } = pointer.current;
    const id = requestAnimationFrame(() => applyTilt(x, y, flipped));
    return () => cancelAnimationFrame(id);
  }, [flipped, applyTilt, resetTilt]);

  // Flip on a click anywhere; the button is the visible, focusable control
  const toggle = () => setFlipped((f) => !f);
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  const track = (x: number, y: number) => {
    pointer.current = { x, y };
    inside.current = true;
  };

  const faceBase =
    'absolute inset-0 flex flex-col bg-paper border-[3px] border-ink [backface-visibility:hidden] transition-transform duration-[250ms] ease-out';

  const header = (right: React.ReactNode) => (
    <div className="border-b-[3px] border-ink">
      <div className="h-2" style={{ background: accent }} aria-hidden="true" />
      <div className="flex items-center gap-2 px-3 py-2 bg-ink">
        <span className="font-data text-xs font-semibold text-paper tabular-nums">
          No. {entryNo}
        </span>
        <span className="ml-auto flex flex-wrap gap-1.5 justify-end">{right}</span>
      </div>
    </div>
  );

  return (
    <div className="reveal-band">
      <div
        ref={cardRef}
        className="group relative h-[23rem] sm:h-[22rem] [perspective:1200px] cursor-pointer"
        onClick={toggle}
        onMouseEnter={(e) => {
          track(e.clientX, e.clientY);
          applyTilt(e.clientX, e.clientY, flipped);
        }}
        onMouseMove={(e) => {
          track(e.clientX, e.clientY);
          applyTilt(e.clientX, e.clientY, flipped);
        }}
        onMouseLeave={() => {
          inside.current = false;
          pointer.current = null;
          resetTilt();
        }}
      >
        <div
          className="relative h-full w-full [transform-style:preserve-3d] card-flip"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* ---------- FRONT ---------- */}
          <div
            ref={frontRef}
            className={faceBase}
            aria-hidden={flipped}
            {...inertIf(flipped)}
          >
            {/* scan tell: sweeps on hover, before you commit to the flip */}
            <div
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:hidden"
              aria-hidden="true"
            >
              <div
                className="absolute inset-x-0 h-16 animate-scan-sweep"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${accent}38, transparent)`,
                }}
              />
            </div>

            {header(project.types.map((t) => <TypeChip key={t} type={t} compact />))}

            <div className="flex flex-col flex-1 p-4 min-h-0">
              <h3 className="font-display text-sm sm:text-base text-ink leading-[1.35] mb-3">
                {project.name}
              </h3>

              <p className="text-sm text-ink-soft leading-relaxed mb-4 overflow-hidden">
                {project.shortDescription ?? project.description}
              </p>

              <div className="mt-auto">
                <p className="font-display text-[0.5rem] tracking-[0.2em] text-ink-soft mb-2">
                  TECH
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.techs.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="font-data text-[0.7rem] px-2 py-1 bg-paper-2 border-2 border-ink text-ink"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techs.length > 4 && (
                    <span className="font-data text-[0.7rem] px-2 py-1 bg-paper-2 border-2 border-ink text-ink">
                      +{project.techs.length - 4}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    toggle();
                  }}
                  aria-expanded={flipped}
                  className="w-full flex items-center justify-center gap-2 font-display text-[0.6rem] tracking-wider px-4 py-3 bg-dex-yellow text-ink border-[3px] border-ink hover:bg-dex-yellow-deep cursor-pointer"
                >
                  INSPECT ENTRY
                  <span aria-hidden="true">&#9656;</span>
                </button>
              </div>
            </div>
          </div>

          {/* ---------- BACK ---------- */}
          <div
            ref={backRef}
            className={`${faceBase} [transform:rotateY(180deg)]`}
            aria-hidden={!flipped}
            {...inertIf(!flipped)}
          >
            {header(
              <span className="font-display text-[0.55rem] tracking-[0.18em] text-paper">
                TECH STACK
              </span>
            )}

            <div className="flex flex-col flex-1 p-4 min-h-0">
              <div className="flex flex-wrap gap-1.5 mb-4 overflow-y-auto">
                {project.techs.map((tech) => (
                  <span
                    key={tech}
                    className="font-data text-[0.7rem] px-2 py-1 bg-paper-2 border-2 border-ink text-ink"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-2">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track-project={project.name}
                    data-track-action="github"
                    onClick={stop}
                    className="text-center font-display text-[0.6rem] tracking-wider px-4 py-3 bg-paper-2 border-[3px] border-ink text-ink hover:bg-paper-3"
                  >
                    GITHUB
                  </a>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track-project={project.name}
                    data-track-action="demo"
                    onClick={stop}
                    className="text-center font-display text-[0.6rem] tracking-wider px-4 py-3 bg-dex-red border-[3px] border-ink text-paper hover:bg-dex-red-deep"
                  >
                    LIVE DEMO
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    toggle();
                  }}
                  className="w-full flex items-center justify-center gap-2 font-display text-[0.6rem] tracking-wider px-4 py-3 bg-ink text-paper border-[3px] border-ink hover:bg-dex-blue cursor-pointer"
                >
                  <span aria-hidden="true">&#9662;</span>
                  CLOSE ENTRY
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
