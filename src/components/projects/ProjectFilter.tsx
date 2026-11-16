import { useState } from 'react';
import ProjectCard from './ProjectCard';
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

interface ProjectFilterProps {
  projects: Project[];
}

export default function ProjectFilter({ projects }: ProjectFilterProps) {
  const [selectedType, setSelectedType] = useState<string>('all');

  const allTypes = [...new Set(projects.flatMap((p) => p.types))].sort();

  const filtered =
    selectedType === 'all' ? projects : projects.filter((p) => p.types.includes(selectedType));

  const tab = (active: boolean) =>
    [
      'font-display text-[0.6rem] tracking-wider px-4 py-3 border-[3px] border-ink cursor-pointer',
      'flex items-center gap-2 hw-btn',
      active ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-dex-yellow',
    ].join(' ');

  return (
    <div>
      {/* Filter row styled as a game menu; the active option carries a cursor */}
      <div role="group" aria-label="Filter projects by type" className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setSelectedType('all')}
          aria-pressed={selectedType === 'all'}
          className={tab(selectedType === 'all')}
        >
          {selectedType === 'all' && (
            <span aria-hidden="true" className="text-dex-yellow">
              &#9656;
            </span>
          )}
          ALL
          <span className="font-data text-[0.7rem] opacity-70">{projects.length}</span>
        </button>

        {allTypes.map((type) => {
          const count = projects.filter((p) => p.types.includes(type)).length;
          const active = selectedType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              aria-pressed={active}
              className={tab(active)}
            >
              {active && (
                <span aria-hidden="true" className="text-dex-yellow">
                  &#9656;
                </span>
              )}
              <span
                className="w-3 h-3 border-2 border-ink shrink-0"
                style={{ background: categoryHex(type) }}
                aria-hidden="true"
              />
              {type.toUpperCase()}
              <span className="font-data text-[0.7rem] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-ink p-2">
          <p className="bg-screen-0 px-4 py-6 text-center font-data text-sm text-screen-3">
            <span className="text-screen-2" aria-hidden="true">
              &gt;
            </span>{' '}
            No entries of that type yet.
          </p>
        </div>
      )}
    </div>
  );
}
