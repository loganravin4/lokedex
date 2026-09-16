import { chip } from '../../lib/pokeTypes';

interface TypeChipProps {
  type: string;
  tech?: string;
  compact?: boolean;
}

export default function TypeChip({ type, tech, compact = false }: TypeChipProps) {
  const { bg, fg, label } = chip(type);

  if (compact) {
    return (
      <span
        className="inline-block font-display text-[0.6rem] tracking-wider px-2.5 py-1.5 border-[3px] border-ink"
        style={{ background: bg, color: fg }}
      >
        {label}
      </span>
    );
  }

  return (
    <span className="flex flex-col h-full w-full border-[3px] border-ink" style={{ background: bg }}>
      <span className="font-display text-[0.7rem] tracking-wider px-3 pt-2 pb-1.5" style={{ color: fg }}>
        {tech ?? label}
      </span>
      {tech && (
        <span
          className="font-display text-[0.5rem] tracking-[0.18em] px-3 pb-1.5 pt-1 border-t-2 border-ink/25"
          style={{ color: fg }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
