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
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://axisxstudio.com",
    title: "AxisX Studio | Engineering Digital Excellence",
    description: "High-performance web applications and digital experiences tailored for modern brands.",
    siteName: "AxisX Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "AxisX Studio",
    description: "High-performance web applications and digital experiences.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} antialiased bg-[#0B0F14] text-[#F8FAFC] min-h-screen flex flex-col`}>
        <Script id="schema-org" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "AxisX Studio",
            "image": "https://axisxstudio.com/logo.png",
            "url": "https://axisxstudio.com",
            "telephone": "+94771234567",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Galle",
              "addressCountry": "LK"
            },
            "description": "High-performance web application development, modern UI/UX design, and scalable software solutions.",
            "priceRange": "$$$$"
          })}
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
