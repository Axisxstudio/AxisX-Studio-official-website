"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CONTACT_INFO } from "@/lib/contact-info";

export default function TermsAndConditions() {
  const lastUpdated = "April 13, 2026";

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
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-outfit gradient-text-alt uppercase">Terms & Conditions</h1>
              <p className="text-[#94A3B8] text-sm">Last updated: {lastUpdated}</p>
            </header>

            <div className="space-y-10 text-[#94A3B8] leading-relaxed">
              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Introduction</h2>
                <p>
                  Welcome to AxisX Studio. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully before using our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Services Provided</h2>
                <p>
                  AxisX Studio provides professional digital services, including but not limited to Web Development, UI/UX Design, E-commerce Solutions, and Custom Web Applications. The scope of work for each project will be defined in a separate agreement or proposal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Payment Terms</h2>
                <p className="mb-4">
                  Our payment terms are as follows:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payments must be made according to the schedule agreed upon in the project proposal.</li>
                  <li>We use secure third-party payment gateways for all transactions.</li>
                  <li>AxisX Studio reserves the right to suspend work if payments are not made on time.</li>
                  <li>All prices are subject to change with notice, except for projects already under contract.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">User Responsibilities</h2>
                <p>
                  Users are responsible for providing accurate information and materials required for project completion. You agree not to use our services for any illegal activities or to infringe upon the intellectual property rights of others.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Limitation of Liability</h2>
                <p>
                  AxisX Studio shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services, even if we have been advised of the possibility of such damages.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms and conditions at any time. Any changes will be posted on this page with an updated revision date. Your continued use of our services after such changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Contact Information</h2>
                <p className="mb-2">
                  If you have any questions regarding these Terms & Conditions, please reach out to us:
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
