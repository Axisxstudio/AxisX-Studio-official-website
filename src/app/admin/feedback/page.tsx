"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  MessageSquare,
  Star,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Building,
  Calendar,
  Image as ImageIcon,
  Play,
  X,
  Plus
} from "lucide-react";
import { Feedback } from "@/types";
import { db, collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "@/lib/supabase-api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatTimestamp } from "@/lib/date";

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  const fetchFeedback = async () => {
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snap = await getDocs<Feedback>(q);
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setFeedback(data);
    } catch (err) {
      console.error(err);
      toast.error("Cloud Retrieval Failed: Database Handshake Timeout.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const next = !currentStatus;
      await updateDoc(doc(db, "feedback", id), { consentToPublish: next });
      setFeedback((current) =>
        current.map((item) => (item.id === id ? { ...item, consentToPublish: next } : item)),
      );
      toast.success(next ? "FEEDBACK DEPLOYED" : "FEEDBACK STASHED");
    } catch {
      toast.error("Operational Error: Push State Synchronization Failed.");
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Wipe this record from the central cluster?")) return;
    try {
      await deleteDoc(doc(db, "feedback", id));
      setFeedback((current) => current.filter((item) => item.id !== id));
      toast.success("RECORD TERMINATED");
    } catch {
      toast.error("Operation Error: Record Persistence Failure.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#3B82F6]/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
              <MessageSquare size={20} />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-[#F8FAFC]">Client Echo</h1>
          </div>
          <p className="text-[#94A3B8]">Curate and moderate verified project testimonials from the centralized hub.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 rounded-xl bg-[#0B0F14] border border-[#3B82F6]/10 text-xs font-bold text-[#3B82F6] uppercase tracking-[0.2em] shadow-inner">
             {feedback.length} Clusters Stored
           </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-64 rounded-[32px] bg-[#111827]/40 border border-[#3B82F6]/10 animate-pulse" />)}
        </div>
      ) : feedback.length === 0 ? (
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
           className="text-center py-32 glass-strong rounded-[32px] border border-[#3B82F6]/10"
        >
          <div className="w-20 h-20 bg-[#0B0F14] rounded-3xl mx-auto mb-6 flex items-center justify-center border border-[#3B82F6]/20 shadow-inner">
             <MessageSquare size={40} className="text-[#4A5568]/40" />
          </div>
          <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2 font-outfit uppercase tracking-widest">Archive Empty</h3>
          <p className="text-[#94A3B8] max-w-sm mx-auto text-sm">Waiting for client transmissions to populate primary storage.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {feedback.map((item) => (
              <motion.article 
                layout
                key={item.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group glass-strong rounded-[32px] border overflow-hidden transition-all duration-300 ${
                  item.consentToPublish 
                    ? 'border-[#3B82F6]/20 bg-[#0B0F14]/40 shadow-[0_0_40px_rgba(59,130,246,0.03)]' 
                    : 'border-[#3B82F6]/5 bg-[#0B0F14]/20 opacity-80'
                }`}
              >
                <div className="p-8 space-y-6">
                  {/* Header: User Information */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#0B0F14] border border-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] shadow-inner font-bold text-xl font-outfit">
                        {item.clientName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#F8FAFC] text-lg font-outfit uppercase tracking-wider">{item.clientName}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#4A5568] uppercase tracking-[0.2em] mt-0.5">
                          <Building size={12} className="text-[#3B82F6]" />
                          <span>{item.companyName || "Proprietary Organization"} &bull; {item.projectName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-[#0B0F14] rounded-xl border border-[#3B82F6]/5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className={star <= 5 ? "text-[#3B82F6] fill-[#3B82F6]" : "text-[#4A5568]"} />
                      ))}
                    </div>
                  </div>

                  {/* Body: Testimonial Message */}
                  <blockquote className="text-sm border-l-4 border-[#3B82F6] pl-6 py-2 italic leading-relaxed text-[#94A3B8] font-medium bg-[#3B82F6]/5 rounded-r-2xl">
                    &ldquo;{item.message}&rdquo;
                  </blockquote>

                  {/* Media Gallery */}
                  {((item.imageUrls?.length ?? 0) > 0 || (item.videoUrls?.length ?? 0) > 0) && (
                    <div className="flex flex-wrap gap-4 px-1">
                      {item.imageUrls?.map((url, i) => (
                        <button key={i} onClick={() => setSelectedMedia(url)} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#3B82F6]/10 hover:border-[#3B82F6]/40 transition-all group/media shadow-lg">
                           <Image src={url} alt="" fill className="object-cover group-hover/media:scale-110 transition-transform duration-500" unoptimized />
                           <div className="absolute inset-0 bg-black/40 group-hover/media:bg-transparent transition-all" />
                        </button>
                      ))}
                      {item.videoUrls?.map((url, i) => (
                         <button key={i} onClick={() => setSelectedMedia(url)} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#3B82F6]/10 hover:border-[#3B82F6]/40 transition-all bg-[#0B0F14] group/media flex items-center justify-center shadow-lg">
                            <Play size={20} className="text-[#3B82F6] group-hover/media:scale-125 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 group-hover/media:bg-transparent transition-all" />
                         </button>
                      ))}
                    </div>
                  )}

                  {/* Footer: Meta & Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#3B82F6]/10">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em]">
                       <Calendar size={12} className="text-[#3B82F6]" />
                       {formatTimestamp(item.createdAt)}
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleApproval(item.id!, item.consentToPublish)} 
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          item.consentToPublish 
                            ? 'bg-[#0B0F14] border border-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/10 shadow-lg' 
                            : 'bg-[#3B82F6] border border-[#3B82F6]/20 text-[#0B0F14] hover:bg-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        }`}
                      >
                        {item.consentToPublish ? <EyeOff size={14} /> : <Eye size={14} />}
                        {item.consentToPublish ? 'STASH ECHO' : 'BROADCAST'}
                      </button>
                      <button 
                         onClick={() => deleteFeedback(item.id!)}
                         className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#0B0F14] text-[#4A5568] hover:text-[#ef4444] border border-[#ef4444]/10 hover:bg-[#ef4444]/5 transition-all shadow-lg"
                      >
                         <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Media Overlay */}
      <AnimatePresence>
         {selectedMedia && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMedia(null)} className="absolute inset-0 bg-[#0B0F14]/95 backdrop-blur-3xl" />
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative max-w-5xl max-h-[85vh] w-full aspect-video rounded-[40px] overflow-hidden glass-strong border border-[#3B82F6]/20 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                  {selectedMedia.includes('.mp4') || selectedMedia.includes('.mov') ? (
                     <video src={selectedMedia} controls autoPlay className="w-full h-full object-contain" />
                  ) : (
                     <Image src={selectedMedia} alt="Preview" fill className="object-contain" unoptimized />
                  )}
                  <button onClick={() => setSelectedMedia(null)} className="absolute top-8 right-8 w-14 h-14 rounded-2xl bg-[#0B0F14]/80 backdrop-blur-md border border-[#3B82F6]/20 flex items-center justify-center text-white hover:text-red-500 transition-all shadow-2xl"><X size={28} /></button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
