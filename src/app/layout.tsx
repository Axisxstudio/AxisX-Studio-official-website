import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import PageProgressBar from "@/components/PageProgressBar";
import SiteMaintenanceGate from "@/components/SiteMaintenanceGate";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Preloader from "@/components/Preloader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: {
    default: "AxisX Studio | High-Performance Web Development Company",
    template: "%s | AxisX Studio"
  },
  description: "AxisX Studio specializes in high-performance web application development, modern UI/UX design, and scalable software solutions tailored for businesses and startups.",
  keywords: [
    "Web Development company", "UI/UX Design", "Software Agency", 
    "Next.js Development", "React Agency", "Tech Startup", 
    "Custom Web Applications", "Front-end Development"
  ],
  authors: [{ name: "AxisX Studio" }],
  creator: "AxisX Studio",
  metadataBase: new URL('https://axisxstudio.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://axisxstudio.com",
    title: "AxisX Studio | Engineering Digital Excellence",
    description: "High-performance web applications and digital experiences tailored for modern brands.",
    siteName: "AxisX Studio",
    images: [
      {
        url: '/og-image.png', // Fallback to provided branding image if exists
        width: 1200,
        height: 630,
        alt: 'AxisX Studio - Project Engineering',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AxisX Studio | Modern Software Agency",
    description: "High-performance web applications and digital experiences.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  verification: {
    google: "CCzHTDFAa3_oyPo3Od67DGlkUG8LAFHs2HV9iUxE8MA",
  },
};

export const viewport = {
  themeColor: '#0B0F14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} antialiased bg-[#0B0F14] text-[#F8FAFC] min-h-screen flex flex-col`}>
        <Script id="schema-org" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "AxisX Studio",
              "url": "https://axisxstudio.com",
              "logo": "https://axisxstudio.com/icon.png",
              "sameAs": [
                "https://github.com/axisxstudio",
                "https://linkedin.com/company/axisxstudio",
                "https://twitter.com/axisxstudio"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+94771234567",
                "contactType": "customer service",
                "availableLanguage": "English"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://axisxstudio.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://axisxstudio.com/projects?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "AxisX Studio",
              "image": "https://axisxstudio.com/og-image.png",
              "url": "https://axisxstudio.com",
              "telephone": "+94771234567",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Main Street",
                "addressLocality": "Galle",
                "addressRegion": "Southern",
                "postalCode": "80000",
                "addressCountry": "LK"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 6.0535,
                "longitude": 80.2210
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday"
                ],
                "opens": "09:00",
                "closes": "18:00"
              },
              "description": "Premium software engineering and digital transformation agency.",
              "priceRange": "$$$"
            }
          ])}
        </Script>
        <Preloader />
        <Suspense fallback={null}>
          <PageProgressBar />
        </Suspense>
        <AuthProvider>
          <SiteMaintenanceGate>{children}</SiteMaintenanceGate>
          <WhatsAppFloat />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#111827',
                color: '#F8FAFC',
                border: '1px solid rgba(163, 166, 255, 0.12)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
