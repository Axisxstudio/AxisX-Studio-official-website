import { Inter, Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import PageProgressBar from "@/components/PageProgressBar";
import SiteMaintenanceGate from "@/components/SiteMaintenanceGate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "AxisX | Premium Web Development Services",
  description: "Modern web development and technical solutions for modern businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} antialiased bg-[#0e0e10] text-[#f9f5f8] min-h-screen flex flex-col`}>
        <Suspense fallback={null}>
          <PageProgressBar />
        </Suspense>
        <AuthProvider>
          <SiteMaintenanceGate>{children}</SiteMaintenanceGate>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#19191c',
                color: '#f9f5f8',
                border: '1px solid rgba(163, 166, 255, 0.12)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
