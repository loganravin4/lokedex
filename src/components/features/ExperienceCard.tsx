import { useState } from 'react';
import { urlForImage } from '../../lib/fetchExperiences';

interface ExperienceProject {
  name: string;
  description: string;
  techs: string[];
  link?: string;
  github?: string;
}

interface ExperienceCardProps {
  title: string;
  company: string;
  companyLogo?: any;
  companyWebsite?: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string[];
  projects?: ExperienceProject[];
  index: number;
}

export default function ExperienceCard({
  title,
  company,
  companyLogo,
  companyWebsite,
  location,
  startDate,
  endDate,
  current,
  description,
  projects,
  index,
}: ExperienceCardProps) {
  const [showProjects, setShowProjects] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const dateRange = `${formatDate(startDate)} — ${
    current ? 'Present' : endDate ? formatDate(endDate) : 'Present'
  }`;

  const badgeNo = String(index + 1).padStart(2, '0');

  return (
    <div className="reveal-band">
      <article className="bg-paper pixel-lift">
      {/* badge plate */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-ink border-b-[3px] border-ink">
        <span className="font-display text-[0.55rem] tracking-[0.18em] text-dex-yellow">
          BADGE {badgeNo}
        </span>
        <span className="font-data text-xs text-paper/85 ml-auto">{dateRange}</span>
        {current && (
          <span className="font-display text-[0.5rem] tracking-[0.15em] px-2 py-1 bg-dex-yellow text-ink">
            CURRENT
          </span>
        )}
      </div>

      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm sm:text-base text-ink leading-[1.35] mb-2">
              {title}
            </h3>
            {companyWebsite ? (
              <a
                href={companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="font-data text-base text-dex-blue underline underline-offset-2 decoration-2 hover:bg-dex-blue hover:text-paper inline-flex items-center min-h-11 py-1"
              >
                {company} &#8599;
              </a>
            ) : (
              <p className="font-data text-base text-ink">{company}</p>
            )}
            <p className="font-data text-sm text-ink-soft mt-1">{location}</p>
          </div>

          {companyLogo && (
            <img
              src={urlForImage(companyLogo).width(96).height(96).url()}
              alt={`${company} logo`}
              className="w-14 h-14 object-contain bg-paper border-[3px] border-ink p-1.5 shrink-0"
            />
          )}
        </div>

        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
          {description.map((bullet, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-ink leading-relaxed">
              <span className="text-dex-red shrink-0 mt-0.5" aria-hidden="true">
                &#9656;
              </span>
              <span className="min-w-0">{bullet}</span>
            </li>
          ))}
        </ul>

        {projects && projects.length > 0 && (
          <div className="mt-5 pt-5 border-t-[3px] border-ink">
            <button
              type="button"
              onClick={() => setShowProjects(!showProjects)}
              aria-expanded={showProjects}
              className="w-full flex items-center gap-3 px-3 py-2.5 border-[3px] border-ink bg-paper-2 hover:bg-dex-yellow cursor-pointer hw-btn"
            >
              <span aria-hidden="true" className="font-data text-sm">
                {showProjects ? '▾' : '▸'}
              </span>
              <span className="font-display text-[0.6rem] tracking-[0.15em] text-ink">
                KEY PROJECTS
              </span>
              <span className="ml-auto font-data text-xs text-ink-soft">{projects.length}</span>
            </button>

            {showProjects && (
              <div className="mt-3 flex flex-col gap-3">
                {projects.map((project, i) => (
                  <div key={i} className="bg-paper-2 border-[3px] border-ink p-4">
                    <h4 className="font-display text-[0.65rem] tracking-wider text-ink mb-2">
                      {project.name}
                    </h4>
                    <p className="text-sm text-ink-soft leading-relaxed mb-3">
                      {project.description}
                    </p>

                    {project.techs && project.techs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.techs.map((tech) => (
                          <span
                            key={tech}
                            className="font-data text-[0.7rem] px-2 py-1 bg-paper border-2 border-ink text-ink"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {(project.github || project.link) && (
                      <div className="flex flex-wrap gap-2">
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-display text-[0.55rem] tracking-wider px-3 py-2 bg-paper border-2 border-ink text-ink hover:bg-paper-3"
                          >
                            GITHUB
                          </a>
                        )}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-display text-[0.55rem] tracking-wider px-3 py-2 bg-dex-red border-2 border-ink text-paper hover:bg-dex-red-deep"
                          >
                            LIVE DEMO
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </article>
    </div>
  );
}
