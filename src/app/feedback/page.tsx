"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { selectClause, toDatabaseField } from "@/lib/supabase-api";
import { Feedback } from "@/types";
import { MessageSquarePlus, Maximize2, X, Play } from "lucide-react";
import { formatTimestamp } from "@/lib/date";

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lightbox state
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const { data, error } = await supabase
          .from("feedback")
          .select(selectClause("feedback"))
          .order(toDatabaseField("feedback", "createdAt"), { ascending: false });
        if (error) throw error;
        setFeedbacks((data ?? []) as unknown as Feedback[]);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  return (
    <>
      <Navigation />
      
      {/* Lightbox Modal */}
      {selectedMedia && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0e0e10]/95 backdrop-blur-xl">
            <button 
               onClick={() => setSelectedMedia(null)}
               className="absolute top-6 right-6 p-2 rounded-full bg-[#19191c] text-[#f9f5f8] hover:bg-[#ff6e84] hover:text-white transition-colors"
            >
               <X size={24} />
            </button>
            <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center">
               {selectedMedia.type === 'image' ? (
                  <Image
                    src={selectedMedia.url}
                    alt="Feedback media"
                    width={1600}
                    height={900}
                    unoptimized
                    className="max-w-full max-h-[90vh] h-auto w-auto object-contain rounded-lg border border-[#a3a6ff]/20 shadow-2xl"
                  />
               ) : (
                  <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg border border-[#c180ff]/20 shadow-2xl" />
               )}
            </div>
         </div>
      )}

      <main className="flex-grow pt-28">
         <section className="py-20 text-center relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#a3a6ff]/5 rounded-[100%] blur-[100px] z-0 pointer-events-none"></div>
             
             <div className="container mx-auto px-6 max-w-4xl relative z-10">
                 <h1 className="text-5xl md:text-6xl font-bold font-outfit mb-6 animate-fade-in-up">
                    Client <span className="gradient-text">Voices</span>
                 </h1>
                 <p className="text-xl text-[#adaaad] max-w-2xl mx-auto animate-fade-in-up delay-100 mb-10">
                    Discover what other teams and visionaries have to say about partnering with AxisX.
                 </p>
                 <Link href="/feedback/new" className="relative z-10 inline-flex cursor-pointer px-8 py-4 rounded-full glass font-semibold hover:bg-[#19191c] transition-all border border-[#a3a6ff]/30 text-[#f9f5f8] items-center gap-2 group animate-fade-in-up delay-200">
                    <MessageSquarePlus size={18} className="group-hover:text-[#a3a6ff] transition-colors" />
                    Submit Your Review
                 </Link>
             </div>
         </section>

         <section className="pb-32">
            <div className="container mx-auto px-6 max-w-7xl">
               {loading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {[1, 2, 3].map((n) => (
                        <div key={n} className="glass rounded-3xl h-64 animate-pulse bg-[#19191c]/50"></div>
                     ))}
                  </div>
               ) : feedbacks.length === 0 ? (
                  <div className="text-center py-20">
                     <p className="text-[#adaaad] text-lg">No public testimonials yet. Be the first to leave one!</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     {feedbacks.map((fb, idx) => (
                        <div key={fb.id} className="glass-strong rounded-3xl p-8 md:p-10 border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/30 transition-all group animate-fade-in-up relative overflow-hidden text-left" style={{ animationDelay: `${idx * 100}ms` }}>
                            {/* Decorative quotes abstract */}
                            <div className="absolute -top-10 -right-10 text-[150px] font-serif text-[#a3a6ff]/5 leading-none pointer-events-none group-hover:text-[#a3a6ff]/10 transition-colors">”</div>
                            
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10 h-full">
                               <div className="flex-1 flex flex-col justify-between">
                                  <div>
                                     <p className="text-[#f9f5f8] text-lg md:text-xl leading-relaxed mb-8 font-light italic border-l-2 border-[#a3a6ff]/30 pl-6">
                                        &ldquo;{fb.message}&rdquo;
                                     </p>
                                  </div>
                                  <div>
                                     <h4 className="text-lg font-bold font-outfit text-[#a3a6ff]">{fb.clientName}</h4>
                                     <div className="text-sm text-[#adaaad] space-x-2 flex items-center divide-x divide-[#a3a6ff]/20 mt-1">
                                        {fb.companyName && <span>{fb.companyName}</span>}
                                        <span className={fb.companyName ? 'pl-2' : ''}>Project: {fb.projectName}</span>
                                     </div>
                                     <p className="text-xs text-[#adaaad] mt-2">Submitted: {formatTimestamp(fb.createdAt)}</p>
                                  </div>
                               </div>

                               {/* Media Gallery */}
                               {(fb.imageUrls?.length > 0 || fb.videoUrls?.length > 0) && (
                                  <div className="md:w-48 xl:w-56 shrink-0 flex flex-nowrap md:flex-wrap gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                                     {fb.imageUrls?.slice(0, 3).map((url, i) => (
                                        <div key={i} className="relative w-24 h-24 md:w-[calc(50%-6px)] md:h-24 rounded-xl overflow-hidden cursor-pointer group/img border border-[#a3a6ff]/20 shrink-0" onClick={() => setSelectedMedia({url, type: 'image'})}>
                                           <Image src={url} alt="Feedback Image" fill className="object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                           <div className="absolute inset-0 bg-[#0e0e10]/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                              <Maximize2 size={16} className="text-white drop-shadow-md" />
                                           </div>
                                        </div>
                                     ))}
                                     {fb.videoUrls?.slice(0, 2).map((url, i) => (
                                        <div key={i} className="relative w-24 h-24 md:w-[calc(50%-6px)] md:h-24 rounded-xl overflow-hidden cursor-pointer group/vid border border-[#c180ff]/20 shrink-0" onClick={() => setSelectedMedia({url, type: 'video'})}>
                                           <video src={url} className="w-full h-full object-cover" />
                                           <div className="absolute inset-0 bg-[#0e0e10]/40 flex items-center justify-center backdrop-blur-[2px]">
                                              <div className="w-8 h-8 rounded-full bg-[#c180ff] flex items-center justify-center group-hover/vid:scale-110 transition-transform">
                                                 <Play size={14} className="text-[#0e0e10] ml-0.5" />
                                              </div>
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               )}
                            </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </section>
      </main>
      
      <Footer />
    </>
  );
}
