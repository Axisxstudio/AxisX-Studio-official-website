"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "@/lib/supabase-api";
import { db } from "@/lib/supabase-api";
import { ContactMessage } from "@/types";
import { MailOpen, Mail, Phone, MessageCircle, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatTimestamp } from "@/lib/date";

export default function AdminContacts() {
   const [messages, setMessages] = useState<ContactMessage[]>([]);
   const [loading, setLoading] = useState(true);

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
      if (!confirm("Delete this message permanently?")) return;
      try {
         await deleteDoc(doc(db, "contacts", id));
         setMessages((current) => current.filter((message) => message.id !== id));
         toast.success("Message deleted");
      } catch {
         toast.error("Error deleting message");
      }
   };

   return (
      <div className="space-y-8 animate-fade-in-up">
         <header>
            <h1 className="text-3xl font-bold font-outfit text-[#f9f5f8] mb-2">Inbox & Leads</h1>
            <p className="text-[#adaaad]">Manage contact form submissions and client inquiries.</p>
         </header>

         {loading ? (
            <div className="space-y-4">
               {[1, 2, 3].map(n => <div key={n} className="h-24 bg-[#19191c]/50 rounded-xl animate-pulse"></div>)}
            </div>
         ) : messages.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl border border-[#a3a6ff]/10">
               <Mail size={48} className="mx-auto text-[#adaaad] mb-4" />
               <p className="text-xl text-[#f9f5f8] font-bold">Inbox is empty</p>
            </div>
         ) : (
            <div className="glass flex flex-col rounded-2xl border border-[#a3a6ff]/10 overflow-hidden divide-y divide-[#a3a6ff]/10">
               {messages.map(msg => (
                  <div key={msg.id} className={`p-6 transition-colors ${msg.status === 'unread' ? 'bg-[#19191c]/80 border-l-4 border-l-[#a3a6ff]' : 'bg-transparent border-l-4 border-l-transparent'}`}>
                     <div className="flex flex-col xl:flex-row justify-between gap-6">

                        <div className="flex-1">
                           <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className={`text-lg font-bold ${msg.status === 'unread' ? 'text-[#f9f5f8]' : 'text-[#adaaad]'}`}>{msg.name}</h3>
                              {msg.status === 'unread' && <span className="bg-[#a3a6ff] text-[#0e0e10] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">New</span>}
                              <span className="text-xs text-[#adaaad] bg-[#0e0e10] px-2 py-1 rounded-md border border-[#a3a6ff]/20">Sub: {msg.subject}</span>
                              <span className="text-xs text-[#adaaad]">{formatTimestamp(msg.createdAt)}</span>
                           </div>
                           <p className={`text-sm mb-4 leading-relaxed ${msg.status === 'unread' ? 'text-[#f9f5f8]' : 'text-[#adaaad]'}`}>
                              {msg.message}
                           </p>
                        </div>

                        <div className="flex flex-col gap-4 shrink-0 xl:w-64 border-l border-[#a3a6ff]/10 pl-0 xl:pl-6">
                           {/* Quick Actions */}
                           <div className="flex flex-col gap-2">
                              <a href={`mailto:${msg.email}`} className="flex items-center gap-3 text-sm text-[#adaaad] hover:text-[#a3a6ff] transition-colors p-2 rounded-lg bg-[#0e0e10] border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/30">
                                 <Mail size={16} /> <span>{msg.email}</span>
                              </a>
                              {msg.phone && (
                                 <>
                                    <a href={`tel:${msg.phone}`} className="flex items-center gap-3 text-sm text-[#adaaad] hover:text-[#c180ff] transition-colors p-2 rounded-lg bg-[#0e0e10] border border-[#c180ff]/10 hover:border-[#c180ff]/30">
                                       <Phone size={16} /> <span>{msg.phone}</span>
                                    </a>
                                    <a href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-[#adaaad] hover:text-green-400 transition-colors p-2 rounded-lg bg-[#0e0e10] border border-green-400/10 hover:border-green-400/30">
                                       <MessageCircle size={16} /> <span>WhatsApp</span>
                                    </a>
                                 </>
                              )}
                           </div>

                           {/* Management */}
                           <div className="flex items-center justify-between pt-4 border-t border-[#a3a6ff]/10">
                              <button
                                 onClick={() => toggleStatus(msg.id!, msg.status)}
                                 className="flex items-center gap-2 text-xs font-medium text-[#adaaad] hover:text-[#f9f5f8] transition-colors p-2"
                                 title={msg.status === 'read' ? 'Mark unread' : 'Mark read'}
                              >
                                 {msg.status === 'read' ? <MailOpen size={16} /> : <CheckCircle2 size={16} />}
                                 {msg.status === 'read' ? 'Mark Unread' : 'Mark Read'}
                              </button>
                              <button
                                 onClick={() => deleteMessage(msg.id!)}
                                 className="p-2 text-[#adaaad] hover:text-[#ff6e84] bg-[#0e0e10] rounded-lg border border-transparent hover:border-[#ff6e84]/20 transition-all"
                                 title="Delete permanently"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </div>

                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
