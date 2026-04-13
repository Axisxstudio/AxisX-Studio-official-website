"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CONTACT_INFO } from "@/lib/contact-info";

export default function PrivacyPolicy() {
  const lastUpdated = "April 13, 2026"; // Current date

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3B82F6]/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3B82F6]/5 blur-[120px] rounded-full" />
        </div>

        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <header className="mb-12 border-b border-[#3B82F6]/10 pb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-outfit gradient-text-alt uppercase">Privacy Policy</h1>
              <p className="text-[#94A3B8] text-sm">Last updated: {lastUpdated}</p>
            </header>

            <div className="space-y-10 text-[#94A3B8] leading-relaxed">
              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Introduction</h2>
                <p>
                  At AxisX Studio, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and safeguard the data you provide to us through our website and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Information We Collect</h2>
                <p className="mb-4">
                  We may collect various types of information, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Personal identification information (Name, email address, phone number, etc.)</li>
                  <li>Professional details related to your inquiry or project requirements.</li>
                  <li>Usage data such as IP addresses, browser type, and pages visited on our site.</li>
                  <li>Cookies and tracking technologies to enhance user experience.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">How We Use Information</h2>
                <p className="mb-4">
                  The information we collect is used for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To provide and maintain our services effectively.</li>
                  <li>To communicate with you regarding your projects, inquiries, or updates.</li>
                  <li>To improve our website functionality and user experience.</li>
                  <li>To process payments and maintain financial records.</li>
                  <li>To comply with legal obligations and prevent fraudulent activities.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Data Protection</h2>
                <p>
                  We implement a variety of security measures to maintain the safety of your personal information. Your data is stored in secure networks and is only accessible by a limited number of persons who have special access rights to such systems and are required to keep the information confidential.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Third-Party Services</h2>
                <p>
                  We may use third-party service providers to facilitate our business operations. For payment processing, we use secure payment gateways such as <strong>PayHere</strong>. These third parties have access to your personal information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Contact Information</h2>
                <p className="mb-2">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <ul className="space-y-1">
                  <li>Email: {CONTACT_INFO.email}</li>
                  <li>Phone: {CONTACT_INFO.phone.display}</li>
                  <li>Address: {CONTACT_INFO.location.label}</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
