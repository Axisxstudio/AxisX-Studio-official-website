export type AppTimestamp = string | number | Date | { seconds?: number; toDate?: () => Date } | null;

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "unread" | "read";
  createdAt: AppTimestamp;
}

export interface Feedback {
  [key: string]: unknown;
  id?: string;
  clientName: string;
  companyName?: string;
  email?: string;
  rating: number;
  projectName: string;
  message: string;
  imageUrls: string[];
  videoUrls: string[];
  consentToPublish: boolean;
  createdAt: AppTimestamp;
  updatedAt?: AppTimestamp;
}

export interface Project {
  id?: string;
  title: string;
  slug: string;
  category: string;
  clientName: string;
  description: string;
  technologies: string[];
  coverImageUrl: string;
  galleryImageUrls: string[];
  videoUrls: string[];
  isPublished: boolean;
  createdAt: AppTimestamp;
  updatedAt?: AppTimestamp;
}

export interface SiteSettings extends Record<string, unknown> {
  id?: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt?: AppTimestamp;
}

export interface PricingPackage {
  id?: string;
  category: 'WebsitePackages' | 'eCommercePackages' | string;
  title: string;
  slug: string;
  hasPlus: boolean;
  rawPrice: number;
  isPopular: boolean;
  badge?: string;
  bestFor: string;
  features: string[];
  contactSubject: string;
  enabled: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

