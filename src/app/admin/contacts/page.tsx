"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "@/lib/supabase-api";
import { db } from "@/lib/supabase-api";
import { ContactMessage } from "@/types";
import { MailOpen, Mail, Phone, MessageCircle, Trash2, CheckCircle2, User, Calendar, Tag, Eye, EyeOff, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatTimestamp } from "@/lib/date";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminContacts() {
   const [messages, setMessages] = useState<ContactMessage[]>([]);
   const [loading, setLoading] = useState(true);
   const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);
   const [confirmData, setConfirmData] = useState<{ isOpen: boolean; title: string; message: string; onAction: () => void | Promise<void>; isDanger?: boolean }>({
      isOpen: false,
      title: "",
      message: "",
      onAction: () => { },
      isDanger: false
   });

   const triggerConfirm = (title: string, message: string, onAction: () => void | Promise<void>, isDanger = false) => {
      setConfirmData({ isOpen: true, title, message, onAction, isDanger });
   };

   // Prevent background scroll when any modal is open
   useEffect(() => {
      const isAnyModalOpen = !!viewingMessage || confirmData.isOpen;
      if (isAnyModalOpen) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = 'unset';
      }
      return () => { document.body.style.overflow = 'unset'; };
   }, [viewingMessage, confirmData.isOpen]);

   const fetchMessages = async () => {
      try {
         const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
         const snap = await getDocs(q);
         const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContactMessage[];
         setMessages(data);
      } catch {
         toast.error("Error fetching messages");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchMessages();
   }, []);

   const toggleStatus = async (id: string, currentStatus: "read" | "unread") => {
      const newStatus = currentStatus === "read" ? "unread" : "read";
      try {
         await updateDoc(doc(db, "contacts", id), { status: newStatus });
         setMessages((current) =>
            current.map((message) => (message.id === id ? { ...message, status: newStatus } : message)),
         );
         toast.success(`Marked as ${newStatus}`);
      } catch {
         toast.error("Failed to update status");
      }
   };

   const deleteMessage = async (id: string) => {
      triggerConfirm(
         "Terminate Lead",
         "Are you absolute in your intention to purge this client inquiry from the primary queue? Associated metadata will be permanently lost.",
         async () => {
            try {
               await deleteDoc(doc(db, "contacts", id));
               setMessages((current) => current.filter((message) => message.id !== id));
               toast.success("Message deleted");
            } catch {
               toast.error("Error deleting message");
             }
         },
         true
      );
   };

   return (
      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#3B82F6]/10">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/20">
                     <Mail size={20} />
                  </div>
                  <h1 className="text-3xl font-bold font-outfit text-[#F8FAFC]">Inbox & Leads</h1>
               </div>
               <p className="text-[#94A3B8]">Professional management of client inquiries and data captures.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 rounded-xl bg-[#0B0F14] border border-[#3B82F6]/10 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
                  {messages.filter(m => m.status === 'unread').length} Unread
               </div>
            </div>
         </header>

         {loading ? (
            <div className="grid grid-cols-1 gap-4">
               {[1, 2, 3].map(n => (
                  <div key={n} className="h-32 bg-[#111827]/40 rounded-2xl border border-[#3B82F6]/10 animate-pulse"></div>
               ))}
            </div>
         ) : messages.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="text-center py-32 glass-strong rounded-[32px] border border-[#3B82F6]/10"
            >
               <div className="w-20 h-20 bg-[#0B0F14] rounded-3xl mx-auto mb-6 flex items-center justify-center border border-[#3B82F6]/20 shadow-inner">
                  <MailOpen size={40} className="text-[#3B82F6]/40" />
               </div>
               <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2 font-outfit">Perfect Quiet</h3>
               <p className="text-[#94A3B8] max-w-sm mx-auto">No new inquiries yet. All communications are up to date.</p>
            </motion.div>
         ) : (
            <div className="grid grid-cols-1 gap-6">
               <AnimatePresence mode="popLayout">
                  {messages.map(msg => (
                     <motion.div 
                        layout
                        key={msg.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => setViewingMessage(msg)}
                        className={`group relative glass-strong rounded-[24px] border transition-all duration-300 cursor-pointer ${
                           msg.status === 'unread' 
                               ? 'border-[#3B82F6]/30 shadow-[0_0_30px_rgba(59,130,246,0.05)]' 
                               : 'border-[#3B82F6]/10 opacity-80 hover:opacity-100 hover:border-[#3B82F6]/20'
                        }`}
                     >
                        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[#3B82F6]/10">
                           {/* Content Section */}
                           <div className="flex-1 p-6 lg:p-8">
                              <div className="flex flex-wrap items-center gap-3 mb-5">
                                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B0F14] border border-[#3B82F6]/10 text-xs font-medium text-[#F8FAFC]">
                                    <User size={12} className="text-[#3B82F6]" />
                                    {msg.name}
                                 </div>
                                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B0F14] border border-[#3B82F6]/10 text-xs font-medium text-[#94A3B8]">
                                    <Tag size={12} />
                                    {msg.subject || "No Subject"}
                                 </div>
                                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B0F14] border border-[#3B82F6]/10 text-xs font-medium text-[#4A5568]">
                                    <Calendar size={12} />
                                    {formatTimestamp(msg.createdAt)}
                                 </div>
                                 {msg.status === 'unread' && (
                                    <span className="ml-auto flex h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse shadow-[0_0_10px_#3B82F6]" />
                                 )}
                              </div>
                                 <div 
                                    className="relative p-4 rounded-2xl bg-[#3B82F6]/5 border border-[#3B82F6]/10 group-hover:bg-[#3B82F6]/10 transition-all"
                                 >
                                    <p className={`text-sm leading-relaxed font-medium break-words ${msg.status === 'unread' ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                                       {msg.message}
                                    </p>
                                    <div className="absolute right-4 bottom-2 opacity-0 group-hover:opacity-100 text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest transition-opacity flex items-center gap-1">
                                      <Eye size={10} /> Read Thread
                                    </div>
                                 </div>
                           </div>

                           {/* Metadata & Actions Section */}
                           <div className="lg:w-80 p-6 lg:p-8 bg-[#0B0F14]/20 flex flex-col justify-between gap-6">
                              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                 <a 
                                    href={`mailto:${msg.email}`} 
                                    className="flex items-center gap-3 text-[10px] font-bold text-[#94A3B8] hover:text-[#3B82F6] transition-all py-2.5 px-4 rounded-xl bg-[#0B0F14] border border-[#3B82F6]/10 hover:border-[#3B82F6]/30 uppercase tracking-wider overflow-hidden group/mail"
                                    title={msg.email}
                                 >
                                    <Mail size={14} className="flex-shrink-0" /> 
                                    <span className="truncate">{msg.email}</span>
                                 </a>
                                 {msg.phone && (
                                    <div className="flex gap-2">
                                       <a 
                                          href={`tel:${msg.phone}`} 
                                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0B0F14] border border-[#3B82F6]/10 text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
                                       >
                                          <Phone size={14} />
                                       </a>
                                       <a 
                                          href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0B0F14] border border-green-500/20 text-[#94A3B8] hover:text-green-500 transition-all hover:bg-green-500/5"
                                        >
                                          <MessageCircle size={14} />
                                       </a>
                                    </div>
                                 )}
                              </div>

                                 <div className="flex items-center justify-between pt-4 border-t border-[#3B82F6]/10" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex gap-2">
                                       <button
                                          onClick={() => toggleStatus(msg.id!, msg.status)}
                                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${
                                             msg.status === 'read' 
                                                ? 'bg-[#0B0F14] border-[#3B82F6]/10 text-[#4A5568] hover:text-[#3B82F6]' 
                                                : 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-[#0B0F14]'
                                          }`}
                                          title={msg.status === 'read' ? 'Mark as Unread' : 'Mark as Read'}
                                       >
                                          {msg.status === 'read' ? <EyeOff size={18} /> : <Eye size={18} />}
                                       </button>
                                       <button
                                          onClick={() => toggleStatus(msg.id!, msg.status)}
                                          className={`flex items-center gap-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-[#0B0F14] border border-[#3B82F6]/10 ${
                                             msg.status === 'read' ? 'text-[#4A5568] hover:text-[#3B82F6]' : 'text-[#3B82F6] hover:border-[#3B82F6]/30'
                                          }`}
                                       >
                                          <CheckCircle2 size={16} />
                                          {msg.status === 'read' ? 'Archived' : 'Resolve'}
                                       </button>
                                    </div>
                                    <button
                                       onClick={() => deleteMessage(msg.id!)}
                                       className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0B0F14] text-[#4A5568] hover:text-[#ef4444] border border-[#ef4444]/10 hover:bg-[#ef4444]/5 transition-all"
                                       title="Delete permanently"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         )}

         {/* Full Message View Modal */}
         <AnimatePresence>
            {viewingMessage && (
               <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                     onClick={() => setViewingMessage(null)}
                  />
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0, y: 30 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.9, opacity: 0, y: 30 }}
                     className="relative w-full max-w-2xl glass-strong border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                  >
                     <button 
                        onClick={() => setViewingMessage(null)}
                        className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors border border-white/10"
                     >
                        <X size={24} />
                     </button>

                     <div className="mb-10">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] font-bold text-2xl font-outfit">
                              {viewingMessage.name.charAt(0)}
                           </div>
                           <div>
                              <h2 className="text-2xl font-bold font-outfit text-white">{viewingMessage.name}</h2>
                              <p className="text-[#3B82F6] text-xs font-bold uppercase tracking-widest mt-1">Inquiry Asset: {viewingMessage.subject || "General Request"}</p>
                           </div>
                        </div>
                        
                        <div className="p-8 rounded-[32px] bg-[#0B0F14] border border-white/5 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5">
                              <MessageCircle size={100} />
                           </div>
                           <p className="text-lg text-[#CBD5E1] leading-relaxed relative z-10 whitespace-pre-wrap">
                              {viewingMessage.message}
                           </p>
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-6 mb-12">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em]">Contact Channels</h4>
                           <div className="space-y-2">
                              <a href={`mailto:${viewingMessage.email}`} className="flex items-center gap-3 text-sm text-[#F8FAFC] hover:text-[#3B82F6] transition-colors bg-white/5 p-3 rounded-xl border border-white/5">
                                 <Mail size={16} className="text-[#3B82F6]" /> {viewingMessage.email}
                              </a>
                              {viewingMessage.phone && (
                                 <a href={`tel:${viewingMessage.phone}`} className="flex items-center gap-3 text-sm text-[#F8FAFC] hover:text-[#3B82F6] transition-colors bg-white/5 p-3 rounded-xl border border-white/5">
                                    <Phone size={16} className="text-[#3B82F6]" /> {viewingMessage.phone}
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em]">Lead Meta</h4>
                           <div className="space-y-2">
                              <div className="flex items-center gap-3 text-sm text-[#94A3B8] bg-white/5 p-3 rounded-xl border border-white/5">
                                 <Calendar size={16} className="text-[#3B82F6]" /> {formatTimestamp(viewingMessage.createdAt)}
                              </div>
                              <div className={`flex items-center gap-3 text-sm p-3 rounded-xl border ${viewingMessage.status === 'unread' ? 'bg-[#3B82F6]/5 text-[#3B82F6] border-[#3B82F6]/10' : 'bg-white/5 text-[#4A5568] border-white/5'}`}>
                                 <CheckCircle2 size={16} /> 
                                 <span className="font-bold uppercase tracking-widest text-[10px]">
                                    {viewingMessage.status === 'unread' ? 'Awaiting Response' : 'Inquiry Resolved'}
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button
                          onClick={() => {
                            toggleStatus(viewingMessage.id!, viewingMessage.status);
                            setViewingMessage(null);
                          }}
                          className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                            viewingMessage.status === 'unread' 
                              ? 'bg-[#3B82F6] text-[#0B0F14] hover:bg-white' 
                              : 'bg-white/5 text-[#94A3B8] border border-white/5'
                          }`}
                        >
                           {viewingMessage.status === 'unread' ? 'Mark Resolved' : 'Re-open Lead'}
                        </button>
                        <button
                          onClick={() => setViewingMessage(null)}
                          className="flex-1 py-4 rounded-2xl bg-white/5 text-[#94A3B8] font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                        >
                          Return to Inbox
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}

