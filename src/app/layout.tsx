import { Inter, Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import PageProgressBar from "@/components/PageProgressBar";
import SiteMaintenanceGate from "@/components/SiteMaintenanceGate";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "AxisX Studio | Web Development Company",
  description: "AxisX Studio specializes in high-performance web application development, modern UI/UX design, and scalable software solutions tailored for businesses and startups.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} antialiased bg-[#0B0F14] text-[#F8FAFC] min-h-screen flex flex-col`}>
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
