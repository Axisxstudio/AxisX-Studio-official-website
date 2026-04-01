"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "@/lib/supabase-api";
import toast from "react-hot-toast";
import {
  Edit,
  Eye,
  EyeOff,
  Image as ImageIcon,
  MessageSquare,
  Save,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { db } from "@/lib/supabase-api";
import { formatTimestamp } from "@/lib/date";
import { deleteFilesByUrl } from "@/lib/media";
import { Feedback } from "@/types";

type EditState = {
  clientName: string;
  projectName: string;
  message: string;
  consentToPublish: boolean;
};

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditState | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ urls: string[]; type: "image" | "video" } | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const mapped = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) as Feedback[];
        setFeedbacks(mapped);
      } catch {
        toast.error("Unable to load feedback entries.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return feedbacks;

    return feedbacks.filter((item) => {
      return (
        item.clientName.toLowerCase().includes(term) ||
        item.projectName.toLowerCase().includes(term) ||
        (item.companyName ?? "").toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term)
      );
    });
  }, [feedbacks, searchTerm]);

  const startEdit = (item: Feedback) => {
    setEditingId(item.id ?? null);
    setEditData({
      clientName: item.clientName,
      projectName: item.projectName,
      message: item.message,
      consentToPublish: item.consentToPublish,
    });
  };

  const saveEdit = async (id: string) => {
    if (!editData) return;

    if (!editData.clientName.trim() || !editData.projectName.trim() || !editData.message.trim()) {
      toast.error("Client name, project name, and message are required.");
      return;
    }

    try {
      const nextData = {
        ...editData,
        clientName: editData.clientName.trim(),
        projectName: editData.projectName.trim(),
        message: editData.message.trim(),
      };

      await updateDoc(doc(db, "feedback", id), {
        ...nextData,
        updatedAt: serverTimestamp(),
      });

      setFeedbacks((current) =>
        current.map((item) => (item.id === id ? { ...item, ...nextData } : item)),
      );
      setEditingId(null);
      setEditData(null);
      toast.success("Feedback updated.");
    } catch {
      toast.error("Failed to update feedback.");
    }
  };

  const deleteFeedback = async (item: Feedback) => {
    if (!item.id) return;
    if (!confirm("Delete this feedback entry and its uploaded media?")) return;

    try {
      await Promise.all([
        deleteFilesByUrl(item.imageUrls ?? []),
        deleteFilesByUrl(item.videoUrls ?? []),
      ]);

      await deleteDoc(doc(db, "feedback", item.id));
      setFeedbacks((current) => current.filter((entry) => entry.id !== item.id));
      toast.success("Feedback deleted.");
    } catch {
      toast.error("Failed to delete feedback.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-[#f9f5f8] mb-2">Feedback Management</h1>
          <p className="text-[#adaaad]">Review and maintain all public testimonials.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adaaad]" size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl bg-[#19191c] border border-[#a3a6ff]/20 pl-10 pr-4 py-2.5 text-sm"
            placeholder="Search feedback"
          />
        </div>
      </header>

      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 rounded-full bg-[#19191c] p-2 text-white hover:bg-[#ff6e84]"
          >
            <X size={22} />
          </button>
          <div className="w-full max-w-6xl max-h-[84vh] flex overflow-x-auto gap-4 snap-x snap-mandatory">
            {selectedMedia.urls.map((url) => (
              <div key={url} className="min-w-full snap-center flex items-center justify-center">
                {selectedMedia.type === "image" ? (
                  <Image
                    src={url}
                    alt="Feedback media"
                    width={1600}
                    height={900}
                    unoptimized
                    className="max-h-[84vh] w-auto rounded-xl border border-[#a3a6ff]/20"
                  />
                ) : (
                  <video src={url} controls className="max-h-[84vh] rounded-xl border border-[#c180ff]/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 rounded-xl bg-[#19191c] animate-pulse" />
          <div className="h-20 rounded-xl bg-[#19191c] animate-pulse" />
          <div className="h-20 rounded-xl bg-[#19191c] animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#a3a6ff]/10 glass py-16 text-center">
          <MessageSquare size={40} className="mx-auto text-[#adaaad] mb-3" />
          <p className="text-[#f9f5f8] font-semibold">No feedback entries found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#a3a6ff]/10 overflow-hidden divide-y divide-[#a3a6ff]/10 glass">
          {filtered.map((item) => (
            <div key={item.id} className="p-6 hover:bg-[#19191c]/50 transition-colors">
              {editingId === item.id && editData ? (
                <div className="space-y-4 rounded-xl border border-[#a3a6ff]/20 bg-[#19191c] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={editData.clientName}
                      onChange={(event) =>
                        setEditData((current) => current ? { ...current, clientName: event.target.value } : null)
                      }
                      className="rounded-lg border border-[#a3a6ff]/20 bg-[#0e0e10] px-3 py-2 text-sm"
                      placeholder="Client name"
                    />
                    <input
                      value={editData.projectName}
                      onChange={(event) =>
                        setEditData((current) => current ? { ...current, projectName: event.target.value } : null)
                      }
                      className="rounded-lg border border-[#a3a6ff]/20 bg-[#0e0e10] px-3 py-2 text-sm"
                      placeholder="Project name"
                    />
                  </div>

                  <textarea
                    rows={4}
                    value={editData.message}
                    onChange={(event) =>
                      setEditData((current) => current ? { ...current, message: event.target.value } : null)
                    }
                    className="w-full rounded-lg border border-[#a3a6ff]/20 bg-[#0e0e10] px-3 py-2 text-sm"
                  />

                  <label className="flex items-center gap-2 text-sm text-[#adaaad]">
                    <input
                      type="checkbox"
                      checked={editData.consentToPublish}
                      onChange={(event) =>
                        setEditData((current) =>
                          current ? { ...current, consentToPublish: event.target.checked } : null,
                        )
                      }
                      className="accent-[#a3a6ff]"
                    />
                    Consent to publish on public page
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(item.id ?? "")}
                      className="rounded-lg bg-[#a3a6ff] px-4 py-2 text-[#0e0e10] text-sm font-semibold inline-flex items-center gap-2"
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditData(null);
                      }}
                      className="rounded-lg bg-[#1f1f22] px-4 py-2 text-sm inline-flex items-center gap-2"
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-[#f9f5f8]">{item.clientName}</h3>
                      <span className="rounded-full border border-[#a3a6ff]/20 bg-[#19191c] px-2 py-0.5 text-xs text-[#adaaad]">
                        {item.projectName}
                      </span>
                      {item.consentToPublish ? (
                        <span className="text-xs inline-flex items-center gap-1 text-green-400">
                          <Eye size={12} /> Public
                        </span>
                      ) : (
                        <span className="text-xs inline-flex items-center gap-1 text-[#ff6e84]">
                          <EyeOff size={12} /> Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#adaaad] mb-3">{item.email} | {formatTimestamp(item.createdAt)}</p>
                    <p className="border-l-2 border-[#a3a6ff]/30 pl-4 text-sm italic text-[#f9f5f8]">
                      &ldquo;{item.message}&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      {!!item.imageUrls?.length && (
                        <button
                          onClick={() => setSelectedMedia({ urls: item.imageUrls, type: "image" })}
                          className="rounded-lg border border-[#a3a6ff]/20 bg-[#19191c] px-3 py-1.5 text-xs inline-flex items-center gap-2 text-[#a3a6ff]"
                        >
                          <ImageIcon size={14} /> Images ({item.imageUrls.length})
                        </button>
                      )}
                      {!!item.videoUrls?.length && (
                        <button
                          onClick={() => setSelectedMedia({ urls: item.videoUrls, type: "video" })}
                          className="rounded-lg border border-[#c180ff]/20 bg-[#19191c] px-3 py-1.5 text-xs inline-flex items-center gap-2 text-[#c180ff]"
                        >
                          <Video size={14} /> Videos ({item.videoUrls.length})
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-[#a3a6ff]/20 bg-[#19191c] p-2 text-[#adaaad] hover:text-[#a3a6ff]"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteFeedback(item)}
                        className="rounded-lg border border-[#ff6e84]/20 bg-[#19191c] p-2 text-[#adaaad] hover:text-[#ff6e84]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
