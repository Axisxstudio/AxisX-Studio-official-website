"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CONTACT_INFO } from "@/lib/contact-info";

export default function ReturnPolicy() {
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-outfit gradient-text-alt uppercase">Return & Refund Policy</h1>
              <p className="text-[#94A3B8] text-sm">Last updated: {lastUpdated}</p>
            </header>

            <div className="space-y-10 text-[#94A3B8] leading-relaxed">
              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Introduction</h2>
                <p>
                  AxisX Studio strives to provide high-quality digital services. This policy outlines our procedures regarding returns and refunds for the services we offer.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Nature of Digital Services</h2>
                <p>
                  Please note that AxisX Studio provides digital services (software development, design, consulting). Unlike physical goods, digital services are intangible and often customized to specific client needs. Once work has commenced or been delivered, it cannot be "returned" in the traditional sense.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Refund Eligibility</h2>
                <p className="mb-4">
                  Refunds may be considered under the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>If a project is cancelled by the client before any work has commenced.</li>
                  <li>If AxisX Studio is unable to fulfill the project requirements as specified in the agreed proposal.</li>
                  <li>In case of overpayment or duplicate billing.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Non-refundable Conditions</h2>
                <p className="mb-4">
                  Refunds will generally not be provided in the following cases:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Work that has already been completed and delivered to the client.</li>
                  <li>Strategic consulting or planning sessions that have already occurred.</li>
                  <li>Third-party costs (e.g., hosting, domain registration, software licenses) incurred on behalf of the client.</li>
                  <li>Change of mind or project direction after work has started.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Dispute Resolution</h2>
                <p>
                  We value our clients and aim to resolve any issues amicably. If you are dissatisfied with our service, please contact us immediately to discuss a resolution. We will make every effort to address your concerns and complete the project to your satisfaction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-4 font-outfit">Contact Information</h2>
                <p className="mb-2">
                  For any questions or concerns regarding our Refund Policy, please contact us:
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
