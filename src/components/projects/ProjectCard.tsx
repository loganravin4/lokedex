import TypeChip from '../ui/TypeChip';
import { categoryHex } from '../../lib/pokeTypes';

interface Project {
  id: string;
  name: string;
  description: string;
  types: string[];
  techs: string[];
  link?: string;
  github?: string;
}

interface ProjectCardProps {
  project: Project;
  index: number;
}

/**
 * Full dex entry — the complete list page shows everything at once, so unlike
 * PokedexCard on the home page there is nothing to flip for.
 */
export default function ProjectCard({ project, index }: ProjectCardProps) {
  const accent = categoryHex(project.types[0]);
  const entryNo = String(index + 1).padStart(3, '0');

  return (
    <div className="reveal-band h-full">
      <article className="flex flex-col h-full bg-paper pixel-lift">
      <div className="border-b-[3px] border-ink">
        <div className="h-2" style={{ background: accent }} aria-hidden="true" />
        <div className="flex items-center gap-2 px-3 py-2 bg-ink">
          <span className="font-data text-xs font-semibold text-paper tabular-nums">
            No. {entryNo}
          </span>
          <span className="ml-auto flex flex-wrap gap-1.5 justify-end">
            {project.types.map((t) => (
              <TypeChip key={t} type={t} compact />
            ))}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-display text-sm sm:text-base text-ink leading-[1.35] mb-3">
          {project.name}
        </h3>

        <p className="text-sm text-ink-soft leading-relaxed mb-5">{project.description}</p>

        <div className="mb-5">
          <p className="font-display text-[0.5rem] tracking-[0.2em] text-ink-soft mb-2">TECH</p>
          <div className="flex flex-wrap gap-1.5">
            {project.techs.map((tech) => (
              <span
                key={tech}
                className="font-data text-[0.7rem] px-2 py-1 bg-paper-2 border-2 border-ink text-ink"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {(project.github || project.link) && (
          <div className="mt-auto flex flex-wrap gap-2">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                data-track-project={project.name}
                data-track-action="github"
                className="flex-1 text-center font-display text-[0.6rem] tracking-wider px-4 py-3 bg-paper-2 border-[3px] border-ink text-ink hover:bg-paper-3"
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
                className="flex-1 text-center font-display text-[0.6rem] tracking-wider px-4 py-3 bg-dex-red border-[3px] border-ink text-paper hover:bg-dex-red-deep"
              >
                LIVE DEMO
              </a>
            )}
          </div>
        )}
      </div>
      </article>
    </div>
  );
}
