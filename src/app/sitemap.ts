import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { selectClause, toDatabaseField } from '@/lib/supabase-api';
import { Project } from '@/types';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://axisxstudio.com';

  // Base routes
  const routes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ];

  try {
    // Fetch dynamic project slugs
    const { data: projects } = await supabase
      .from('projects')
      .select(selectClause('projects'))
      .eq(toDatabaseField('projects', 'isPublished'), true);

    if (projects && (projects as unknown as Project[]).length > 0) {
      const projectRoutes = (projects as unknown as Project[]).map((project) => ({
        url: `${baseUrl}/projects/${project.slug}`,
        lastModified: project.updatedAt ? new Date(project.updatedAt as string) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
      return [...routes, ...projectRoutes];
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error);
  }

  return routes;
}
