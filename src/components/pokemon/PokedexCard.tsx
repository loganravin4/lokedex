import { motion } from 'framer-motion';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  types: string[];
  techs: string[];
  link?: string;
  github?: string;
}

interface PokedexCardProps {
  project: Project;
  index: number;
}

export default function PokedexCard({ project, index }: PokedexCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

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
      transition={{ delay: index * 0.1 }}
      className="perspective-1000"
    >
      <motion.div
        className="relative w-full h-96 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        whileHover={{ scale: 1.02 }}
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Front of card */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientClass} rounded-2xl p-6 shadow-2xl border-4 border-poke-yellow`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col h-full">
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
            
            <h3 className="text-2xl font-pokemon text-white mb-4 uppercase">
              {project.name}
            </h3>
            
            <p className="text-sm text-white/90 mb-4 flex-grow">
              {project.shortDescription}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {project.techs.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 bg-black/30 rounded text-xs text-white/80"
                >
                  {tech}
                </span>
              ))}
              {project.techs.length > 4 && (
                <span className="px-2 py-1 bg-black/30 rounded text-xs text-white/80">
                  +{project.techs.length - 4} more
                </span>
              )}
            </div>
            
            <div className="text-center text-xs text-white/60 font-pokemon">
              Click to flip →
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientClass} rounded-2xl p-6 shadow-2xl border-4 border-poke-yellow`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex flex-col h-full">
            <h4 className="text-xl font-pokemon text-poke-yellow mb-4 uppercase">
              Tech Stack
            </h4>
            
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
            
            <div className="flex gap-4 mt-auto">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-black/40 hover:bg-black/60 transition-colors px-4 py-3 rounded-lg text-center font-bold text-white text-sm"
                  onClick={(e) => e.stopPropagation()}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  Live Demo →
                </a>
              )}
            </div>
            
            <div className="text-center text-xs text-white/60 font-pokemon mt-4">
              ← Click to flip back
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}