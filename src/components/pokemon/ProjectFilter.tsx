import { useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';

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

  // Get unique types
  const allTypes = [...new Set(projects.flatMap(p => p.types))];

  // Filter projects
  const filteredProjects = selectedType === 'all' 
    ? projects 
    : projects.filter(p => p.types.includes(selectedType));

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-6 py-2 rounded-lg font-bold transition-colors ${
            selectedType === 'all'
              ? 'bg-poke-yellow text-poke-black'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          All ({projects.length})
        </button>
        {allTypes.sort().map((type) => {
          const count = projects.filter(p => p.types.includes(type)).length;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors capitalize ${
                selectedType === type
                  ? 'bg-poke-yellow text-poke-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Projects grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {filteredProjects.map((project, index) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            index={index}
          />
        ))}
      </motion.div>

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/60 text-xl">No projects found for this type.</p>
        </div>
      )}
    </div>
  );
}