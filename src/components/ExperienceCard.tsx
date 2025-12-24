import { motion } from 'framer-motion';
import { useState } from 'react';
import { urlForImage } from '../lib/fetchExperiences';

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

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const dateRange = `${formatDate(startDate)} - ${current ? 'Present' : endDate ? formatDate(endDate) : 'Present'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-poke-blue/20 to-poke-psychic/20 rounded-2xl p-6 border-4 border-poke-yellow/30 relative"
    >
      {/* Company Logo - Top Right */}
      {companyLogo && (
        <div className="absolute top-6 right-6">
          <img
            src={urlForImage(companyLogo).width(60).height(60).url()}
            alt={`${company} logo`}
            className="w-12 h-12 md:w-14 md:h-14 object-contain bg-white rounded-full p-2"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-5 pr-16">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
          {title}
        </h3>
        {companyWebsite ? (
          <a
            href={companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-poke-yellow hover:text-poke-yellow/80 transition-colors inline-block mb-1"
          >
            {company} →
          </a>
        ) : (
          <p className="text-lg text-poke-yellow mb-1">{company}</p>
        )}
        <div className="flex flex-col sm:flex-row sm:gap-3 text-sm text-white/70">
          <p>{location}</p>
          <p className="hidden sm:block">•</p>
          <p>{dateRange}</p>
        </div>
      </div>

      {/* Description bullets */}
      <div className="mb-5">
        <ul className="space-y-2">
          {description.map((bullet, i) => (
            <li key={i} className="text-sm text-white/90 flex">
              <span className="text-poke-yellow mr-2 mt-1">▸</span>
              <span className="leading-relaxed">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects - Collapsible */}
      {projects && projects.length > 0 && (
        <div className="mt-5 pt-5 border-t-2 border-white/10">
          <button
            onClick={() => setShowProjects(!showProjects)}
            className="flex items-center justify-between w-full text-left group"
          >
            <h4 className="text-base font-bold text-poke-yellow group-hover:text-poke-yellow/80 transition-colors">
              Key Projects ({projects.length})
            </h4>
            <span className="text-poke-yellow text-xl">
              {showProjects ? '−' : '+'}
            </span>
          </button>
          
          {showProjects && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {projects.map((project, i) => (
                <div key={i} className="bg-black/20 rounded-lg p-4">
                  <h5 className="font-bold text-white text-sm mb-2">{project.name}</h5>
                  <p className="text-white/80 text-xs mb-3 leading-relaxed">{project.description}</p>
                  
                  {/* Tech stack */}
                  {project.techs && project.techs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.techs.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/80"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  {(project.github || project.link) && (
                    <div className="flex gap-2">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-black/40 hover:bg-black/60 transition-colors px-3 py-1.5 rounded text-white"
                        >
                          GitHub →
                        </a>
                      )}
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-poke-yellow hover:bg-poke-yellow/80 transition-colors px-3 py-1.5 rounded text-poke-black font-semibold"
                        >
                          Live Demo →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}