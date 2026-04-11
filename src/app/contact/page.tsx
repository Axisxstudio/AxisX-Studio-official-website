"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toDatabasePayload } from "@/lib/supabase-api";
import { CONTACT_INFO } from "@/lib/contact-info";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    const newErrors: Record<string, string> = {};
    if (!payload.name) newErrors.name = "Name is required";
    if (!payload.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!payload.subject) newErrors.subject = "Subject is required";
    if (!payload.message) newErrors.message = "Message is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("contacts")
        .insert([toDatabasePayload("contacts", {
          ...payload,
          status: "unread",
          createdAt: new Date().toISOString(),
        })]);
      if (error) throw error;
      toast.success("Message sent successfully!");
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setFormData({ ...formData, [name]: value });
  };

  const FieldError = ({ error }: { error?: string }) => (
    <AnimatePresence shadow-sm>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-[#ff6e84] text-xs font-medium mt-1.5 ml-1"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Navigation />
      
      <main className="flex-grow pt-28">
        <section className="py-20 relative overflow-hidden text-center">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1.5 }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c180ff]/10 rounded-full blur-[100px] z-0"
             />
             
             <div className="container mx-auto px-6 max-w-4xl relative z-10">
                 <motion.h1 
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-5xl md:text-6xl font-bold font-outfit mb-6"
                 >
                    Let&apos;s <span className="gradient-text-alt">Connect</span>
                 </motion.h1>
                 <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="text-xl text-[#adaaad] max-w-2xl mx-auto"
                 >
                    Tell us about your next project, idea, or technical challenge. We&apos;re ready to engineer the solution.
                 </motion.p>
             </div>
        </section>
        
        <section className="pb-32">
          <div className="container mx-auto px-6 max-w-6xl">
             <AnimatePresence mode="wait">
               {!submitted ? (
                 <motion.div 
                   key="contact-form"
                   variants={containerVariants}
                   initial="hidden"
                   animate="visible"
                   exit={{ opacity: 0, y: -20 }}
                   className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                 >
                    {/* Contact Info */}
                    <motion.div variants={itemVariants} className="glass-strong rounded-3xl p-10 md:p-14 border border-[#a3a6ff]/20 flex flex-col justify-between group h-full">
                       <div>
                          <h3 className="text-3xl font-bold font-outfit mb-8">Reach Out</h3>
                          <p className="text-[#adaaad] mb-12 text-lg">
                             Whether it&apos;s a technical query, project request, or you just want to talk code, our inbox is open.
                          </p>
                          
                          <div className="space-y-8">
                             {[
                               {
                                 color: "text-[#a3a6ff]",
                                 href: `mailto:${CONTACT_INFO.email}`,
                                 icon: <Mail size={24} />,
                                 label: "Email",
                                 rel: undefined,
                                 target: undefined,
                                 val: CONTACT_INFO.email,
                               },
                               {
                                 color: "text-[#c180ff]",
                                 href: CONTACT_INFO.phone.href,
                                 icon: <Phone size={24} />,
                                 label: "Phone",
                                 rel: undefined,
                                 target: undefined,
                                 val: CONTACT_INFO.phone.display,
                               },
                               {
                                 color: "text-[#a3a6ff]",
                                 href: CONTACT_INFO.location.href,
                                 icon: <MapPin size={24} />,
                                 label: "HQ",
                                 rel: "noopener noreferrer",
                                 target: "_blank",
                                 val: CONTACT_INFO.location.label,
                               }
                             ].map((item, idx) => (
                               <motion.div key={idx} className="flex items-start gap-4">
                                  <div className={`p-3 bg-[#19191c] rounded-xl border border-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                                     {item.icon}
                                  </div>
                                  <div>
                                     <h4 className="text-[#f9f5f8] font-bold mb-1">{item.label}</h4>
                                     <a
                                       className="text-[#adaaad] transition-colors hover:text-[#f9f5f8]"
                                       href={item.href}
                                       rel={item.rel}
                                       target={item.target}
                                     >
                                       {item.val}
                                     </a>
                                  </div>
                               </motion.div>
                             ))}
                          </div>
                       </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div variants={itemVariants} className="glass p-10 md:p-14 rounded-3xl border border-[#a3a6ff]/10">
                       <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                 <label htmlFor="name" className="block text-sm font-medium text-[#adaaad] mb-2">Name</label>
                                 <input 
                                   type="text" 
                                   id="name" 
                                   name="name" 
                                   required
                                   value={formData.name}
                                   onChange={handleChange}
                                   className={`w-full bg-[#0e0e10] border ${errors.name ? 'border-[#ff6e84]/50 focus:border-[#ff6e84]' : 'border-[#a3a6ff]/20 focus:border-[#a3a6ff]/60'} rounded-xl px-4 py-3 text-[#f9f5f8] transition-colors`} 
                                   placeholder="Nuwan Perera"
                                 />
                                 <FieldError error={errors.name} />
                              </div>
                              <div>
                                 <label htmlFor="email" className="block text-sm font-medium text-[#adaaad] mb-2">Email</label>
                                 <input 
                                   type="email" 
                                   id="email" 
                                   name="email" 
                                   required
                                   value={formData.email}
                                   onChange={handleChange}
                                   className={`w-full bg-[#0e0e10] border ${errors.email ? 'border-[#ff6e84]/50 focus:border-[#ff6e84]' : 'border-[#a3a6ff]/20 focus:border-[#a3a6ff]/60'} rounded-xl px-4 py-3 text-[#f9f5f8] transition-colors`} 
                                   placeholder="hello@example.com"
                                 />
                                 <FieldError error={errors.email} />
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                 <label htmlFor="phone" className="block text-sm font-medium text-[#adaaad] mb-2">Phone (Optional)</label>
                                 <input 
                                   type="text" 
                                   id="phone" 
                                   name="phone" 
                                   value={formData.phone}
                                   onChange={handleChange}
                                   className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 transition-colors" 
                                   placeholder="+94 77 123 4567"
                                 />
                              </div>
                              <div>
                                 <label htmlFor="subject" className="block text-sm font-medium text-[#adaaad] mb-2">Subject</label>
                                 <input 
                                   type="text" 
                                   id="subject" 
                                   name="subject" 
                                   required
                                   value={formData.subject}
                                   onChange={handleChange}
                                   className={`w-full bg-[#0e0e10] border ${errors.subject ? 'border-[#ff6e84]/50 focus:border-[#ff6e84]' : 'border-[#a3a6ff]/20 focus:border-[#a3a6ff]/60'} rounded-xl px-4 py-3 text-[#f9f5f8] transition-colors`} 
                                   placeholder="Project inquiry"
                                 />
                                 <FieldError error={errors.subject} />
                              </div>
                          </div>

                          <div>
                             <label htmlFor="message" className="block text-sm font-medium text-[#adaaad] mb-2">Message</label>
                             <textarea 
                               id="message" 
                               name="message" 
                               required
                               rows={5}
                               value={formData.message}
                               onChange={handleChange}
                               className={`w-full bg-[#0e0e10] border ${errors.message ? 'border-[#ff6e84]/50 focus:border-[#ff6e84]' : 'border-[#a3a6ff]/20 focus:border-[#a3a6ff]/60'} rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 transition-colors resize-none`} 
                               placeholder="Tell us about your project..."
                             ></textarea>
                             <FieldError error={errors.message} />
                          </div>

                          <motion.button 
                             whileHover={{ scale: 1.02 }}
                             whileTap={{ scale: 0.98 }}
                             type="submit" 
                             disabled={loading}
                             className="w-full py-4 rounded-full bg-gradient-to-r from-[#a3a6ff] to-[#c180ff] text-[#0e0e10] font-bold text-lg hover:shadow-[0_0_30px_rgba(163,166,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                          >
                             {loading ? "Sending..." : "Send Message"}
                             {!loading && <Send size={20} />}
                          </motion.button>
                       </form>
                    </motion.div>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="contact-success"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="max-w-xl mx-auto py-20 px-10 glass-strong border border-[#a3a6ff]/20 rounded-3xl text-center"
                 >
                    <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-green-400">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold font-outfit mb-4 text-[#f9f5f8]">Message Sent!</h2>
                    <p className="text-[#adaaad] mb-10 text-lg">
                       Thank you for reaching out. A specialist from our team will review your inquiry and get back to you within 24 hours.
                    </p>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSubmitted(false)}
                      className="px-8 py-3 rounded-xl bg-[#19191c] border border-[#a3a6ff]/20 hover:border-[#a3a6ff]/50 text-sm font-semibold transition-all inline-flex items-center gap-2"
                    >
                       <ArrowLeft size={16} /> Send Another Message
                    </motion.button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
