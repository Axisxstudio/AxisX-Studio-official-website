import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Protect admin and API routes from crawling
    },
    sitemap: 'https://www.axisxstudio.com/sitemap.xml',
  };
}
