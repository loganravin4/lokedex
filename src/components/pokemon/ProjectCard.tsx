import { motion } from 'framer-motion';

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

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const typeColors: Record<string, string> = {
    frontend: 'from-poke-fire to-poke-electric',
    backend: 'from-poke-water to-poke-ice',
    fullstack: 'from-poke-psychic to-poke-fairy',
    ml: 'from-poke-dragon to-poke-ghost',
    embedded: 'from-poke-steel to-poke-rock',
  };

  const gradientClass = typeColors[project.types[0]?.toLowerCase()] || 'from-poke-normal to-slate-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-6 shadow-2xl border-4 border-poke-yellow flex flex-col`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-poke-yellow font-pokemon text-xs">
          #{String(index + 1).padStart(3, '0')}
        </span>
        <div className="flex gap-2">
          {project.types.map((type) => (
            <span
              key={type}
              className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-pokemon text-white mb-4 uppercase">
        {project.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-white/90 mb-6 leading-relaxed flex-grow">
        {project.description}
      </p>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-2 mb-6">
        {project.techs.map((tech) => (
          <span
            key={tech}
            className="px-3 py-2 bg-white/20 rounded-lg text-sm text-white font-semibold"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Links */}
      {(project.github || project.link) && (
        <div className="flex gap-4 mt-auto">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-black/40 hover:bg-black/60 transition-colors px-4 py-3 rounded-lg text-center font-bold text-white text-sm"
            >
              GitHub →
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-poke-yellow hover:bg-poke-yellow/80 transition-colors px-4 py-3 rounded-lg text-center font-bold text-poke-black text-sm"
            >
              Live Demo →
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}