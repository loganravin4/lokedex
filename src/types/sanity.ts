export interface Project {
    _id: string;
    name: string;
    slug: {
      current: string;
    };
    description: string;
    shortDescription: string;
    types: string[];
    techs: string[];
    github?: string;
    link?: string;
    featured: boolean;
    order: number;
  }