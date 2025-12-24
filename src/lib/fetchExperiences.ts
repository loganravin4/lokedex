import { client } from './sanity';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(client);

export function urlForImage(source: any) {
  return builder.image(source);
}

export interface ExperienceProject {
  name: string;
  description: string;
  techs: string[];
  link?: string;
  github?: string;
}

export interface Experience {
  _id: string;
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
  order: number;
}

export async function fetchExperiences(): Promise<Experience[]> {
  const query = `*[_type == "experience"] | order(order asc) {
    _id,
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
    order
  }`;

  return await client.fetch(query);
}