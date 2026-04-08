"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, CheckCircle, ArrowLeft, Image as ImageIcon, Video, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MediaKind, uploadFilesToStorage, validateFiles } from "@/lib/media";
import { toDatabasePayload } from "@/lib/supabase-api";
import toast from "react-hot-toast";
import { appConfig } from "@/lib/env";
import { deleteFilesByUrl } from "@/lib/media";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const feedbackImageMaxMb = Math.min(appConfig.maxImageMb, 5);
const feedbackVideoMaxMb = Math.min(appConfig.maxVideoMb, 50);

function getFeedbackSubmissionErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
  const message =
    typeof error === "object" && error && "message" in error ? String(error.message).toLowerCase() : "";

  switch (code) {
    case "permission-denied":
      return "Feedback could not be saved due to a database permission issue.";
    case "storage/unauthorized":
    case "storage/unauthenticated":
      return "Feedback media could not be uploaded with the current storage permissions.";
    case "storage/canceled":
      return "The media upload was canceled before it finished.";
    case "storage/retry-limit-exceeded":
      return "The upload took too long. Please try again with smaller media files.";
    default:
      if (status === 401 || status === 403 || message.includes("row-level security")) {
        return "Feedback could not be saved with the current Supabase permissions.";
      }

      return "Failed to submit feedback. Try again.";
  }
}

export default function NewFeedback() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    rating: 5,
    projectName: "",
    message: "",
    consentToPublish: true,
  });

  const [hoverRating, setHoverRating] = useState(0);

  const ratingSuggestions: Record<number, string> = {
    1: "Poor experience",
    2: "Could be better",
    3: "Good, meeting expectations",
    4: "Great experience",
    5: "Excellent, highly recommended!"
  };

  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { getRootProps: getImageProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: acceptedFiles => {
      setImages(prev => [...prev, ...acceptedFiles].slice(0, appConfig.maxFeedbackImages));
    }
  });

  const { getRootProps: getVideoProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    accept: { 'video/*': [] },
    onDrop: acceptedFiles => {
      setVideos(prev => [...prev, ...acceptedFiles].slice(0, appConfig.maxFeedbackVideos));
    }
  });

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));
  const removeVideo = (index: number) => setVideos(videos.filter((_, i) => i !== index));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => {
    if (step === 1 && (!formData.clientName.trim() || !formData.projectName.trim())) {
      toast.error("Please provide your name and project name.");
      return;
    }
    if (step === 2 && !formData.message.trim()) {
      toast.error("Please provide your feedback message.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => setStep(prev => Math.max(1, prev - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check: only allow submission on the final step
    if (step < 3) return;

    if (!formData.clientName.trim() || !formData.projectName.trim() || !formData.message.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image of your project.");
      return;
    }

    const imageValidation = validateFiles(images, "image" as MediaKind, { maxMb: feedbackImageMaxMb });
    if (!imageValidation.valid) {
      toast.error(imageValidation.error ?? "Invalid image files.");
      return;
    }

    const videoValidation = validateFiles(videos, "video" as MediaKind, { maxMb: feedbackVideoMaxMb });
    if (!videoValidation.valid) {
      toast.error(videoValidation.error ?? "Invalid video files.");
      return;
    }

    setLoading(true);
    
    // Premium loading feel
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      let imageUrls: string[] = [];
      let videoUrls: string[] = [];
      let mediaWarning: string | null = null;

      try {
        imageUrls = await uploadFilesToStorage(images, "feedback_images", "image" as MediaKind);
        videoUrls = await uploadFilesToStorage(videos, "feedback_videos", "video" as MediaKind);
      } catch (mediaError) {
        console.error("Feedback media upload failed:", mediaError);
        mediaWarning = getFeedbackSubmissionErrorMessage(mediaError);
        imageUrls = [];
        videoUrls = [];
      }

      try {
        const { error } = await supabase
          .from("feedback")
          .insert([toDatabasePayload("feedback", {
            clientName: formData.clientName.trim(),
            companyName: formData.companyName.trim(),
            rating: formData.rating,
            projectName: formData.projectName.trim(),
            message: formData.message.trim(),
            consentToPublish: formData.consentToPublish,
            imageUrls,
            videoUrls,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })]);

        if (error) throw error;
      } catch (saveError) {
        await deleteFilesByUrl([...imageUrls, ...videoUrls]);
        throw saveError;
      }

      toast.success(mediaWarning ? "Feedback submitted. Media files were skipped." : "Feedback submitted successfully!");
      setSubmitted(true);
      setStep(1);
      setFormData({
        clientName: "",
        companyName: "",
        rating: 5,
        projectName: "",
        message: "",
        consentToPublish: true,
      });
      setImages([]);
      setVideos([]);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(getFeedbackSubmissionErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      <main className="flex-grow pt-28 overflow-x-hidden">
        <section className="py-20 text-center relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#a3a6ff]/5 rounded-full blur-[120px] pointer-events-none"
          />
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold font-outfit mb-6"
            >
              Leave <span className="gradient-text">Feedback</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[#adaaad] max-w-2xl mx-auto"
            >
              Share your experience working with AxisX. Your insights are invaluable to our continuous improvement.
            </motion.p>
          </div>
        </section>

        <section className="pb-32">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="feedback-form"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="glass p-5 md:p-12 rounded-3xl border border-[#a3a6ff]/20"
                >
                  <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-[#a3a6ff]' : 'bg-white/10'}`} />
                      <div className={`h-1.5 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-[#a3a6ff]' : 'bg-white/10'}`} />
                      <div className={`h-1.5 w-16 rounded-full transition-colors ${step >= 3 ? 'bg-[#a3a6ff]' : 'bg-white/10'}`} />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-[#adaaad] mb-2">Client Name <span className="text-[#ff6e84]">*</span></label>
                            <input suppressHydrationWarning required type="text" name="clientName" value={formData.clientName} onChange={handleChange} className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 transition-all hover:bg-[#15151a]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#adaaad] mb-2">Project Name <span className="text-[#ff6e84]">*</span></label>
                            <input suppressHydrationWarning required type="text" name="projectName" value={formData.projectName} onChange={handleChange} className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 transition-all hover:bg-[#15151a]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#adaaad] mb-2">Company / Project Link</label>
                            <input suppressHydrationWarning type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 transition-all hover:bg-[#15151a]" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-[#adaaad] mb-3 text-center">Overall Rating <span className="text-[#ff6e84]">*</span></label>
                          <div className="flex flex-col items-center justify-center w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-5 transition-all hover:bg-[#15151a]">
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <div className="flex gap-1.5" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={30}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => setFormData(p => ({ ...p, rating: star }))}
                                    fill={(hoverRating || formData.rating) >= star ? "#a3a6ff" : "transparent"}
                                    stroke={(hoverRating || formData.rating) >= star ? "#a3a6ff" : "#4a4a5a"}
                                    className="cursor-pointer transition-all hover:scale-110"
                                  />
                                ))}
                              </div>
                              <span className="text-[13px] font-bold text-[#a3a6ff] bg-[#a3a6ff]/10 px-3 py-1 rounded-full mt-2 sm:mt-0">
                                {ratingSuggestions[hoverRating || formData.rating]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#adaaad] mb-2">Your Feedback <span className="text-[#ff6e84]">*</span></label>
                          <textarea required name="message" rows={4} value={formData.message} onChange={handleChange} className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 resize-none transition-all hover:bg-[#15151a]" placeholder="We'd love to hear your thoughts..."></textarea>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-6">
                          <h3 className="text-xl font-bold font-outfit text-[#f9f5f8]">Attach Media (Optional)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div {...getImageProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isImageDragActive ? 'drag-over' : 'border-white/10 hover:border-[#a3a6ff]/40 bg-[#19191c]/50'}`}>
                                <input {...getImageInputProps()} />
                                <UploadCloud className="mx-auto text-[#a3a6ff] mb-3" size={32} />
                                <p className="text-sm text-[#adaaad] font-medium mb-1">Upload Images</p>
                                <p className="text-xs text-[#adaaad]/60">Max {appConfig.maxFeedbackImages} images, {feedbackImageMaxMb}MB each</p>
                              </div>
                              {images.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  {images.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-[#0e0e10] rounded-lg border border-[#a3a6ff]/10">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <ImageIcon size={14} className="text-[#a3a6ff] shrink-0" />
                                        <span className="text-xs text-[#adaaad] truncate">{file.name}</span>
                                      </div>
                                      <button type="button" onClick={() => removeImage(idx)} className="text-[#ff6e84] hover:text-red-400 p-1"><X size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div {...getVideoProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isVideoDragActive ? 'drag-over border-[#c180ff]' : 'border-white/10 hover:border-[#c180ff]/40 bg-[#19191c]/50'}`}>
                                <input {...getVideoInputProps()} />
                                <UploadCloud className="mx-auto text-[#c180ff] mb-3" size={32} />
                                <p className="text-sm text-[#adaaad] font-medium mb-1">Upload Videos</p>
                                <p className="text-xs text-[#adaaad]/60">Max {appConfig.maxFeedbackVideos} videos, {feedbackVideoMaxMb}MB each</p>
                              </div>
                              {videos.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  {videos.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-[#0e0e10] rounded-lg border border-[#c180ff]/10">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <Video size={14} className="text-[#c180ff] shrink-0" />
                                        <span className="text-xs text-[#adaaad] truncate">{file.name}</span>
                                      </div>
                                      <button type="button" onClick={() => removeVideo(idx)} className="text-[#ff6e84] hover:text-red-400 p-1"><X size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative pt-1">
                              <input
                                type="checkbox"
                                name="consentToPublish"
                                checked={formData.consentToPublish}
                                onChange={handleChange}
                                className="w-5 h-5 accent-[#a3a6ff] rounded border-[#a3a6ff]/20 cursor-pointer"
                              />
                            </div>
                            <span className="text-sm text-[#adaaad] leading-relaxed group-hover:text-[#f9f5f8] transition-colors">
                              I consent to AxisX publicly displaying this feedback, including my name, company, and project details across their portfolio. (Uncheck to keep private)
                            </span>
                          </label>
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-6 border-t border-[#a3a6ff]/10 flex items-center justify-between gap-4">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="px-6 py-4 rounded-full bg-[#19191c] border border-white/5 text-sm font-semibold hover:border-[#a3a6ff]/30 transition-all flex items-center gap-2"
                        >
                          <ArrowLeft size={16} /> Back
                        </button>
                      ) : <div></div>}

                      {step < 3 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="btn-ltr-white relative inline-flex items-center justify-center border border-[#3B82F6]/25 px-8 py-3.5 rounded-full text-[15px] font-bold text-[#0e0e10] w-full sm:w-auto ml-auto"
                        >
                          Next <span className="hidden sm:inline ml-1">Step</span>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loading}
                          style={{ 
                            backgroundPosition: loading ? '0 0' : '',
                            transitionDuration: loading ? '1000ms' : ''
                          }}
                          className={`btn-ltr-white relative inline-flex items-center justify-center gap-2 border border-[#3B82F6]/25 px-8 py-3.5 rounded-full text-[15px] font-bold text-[#0e0e10] disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto ml-auto transition-all ${loading ? 'text-[#0B0F14]' : ''}`}
                        >
                          {loading ? (
                             <div className="h-4 w-4 border-2 border-[#0e0e10]/30 border-t-[#0e0e10] rounded-full animate-spin" />
                          ) : <CheckCircle size={18} />}
                          {loading ? "Submitting..." : <div className="flex items-center gap-2">Submit <span className="hidden sm:inline">Feedback</span></div>}
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="feedback-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xl mx-auto py-20 px-10 glass-strong border border-[#a3a6ff]/20 rounded-3xl text-center"
                >
                  <div className="w-20 h-20 bg-[#a3a6ff]/10 border border-[#a3a6ff]/20 rounded-full flex items-center justify-center mx-auto mb-8 text-[#a3a6ff]">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-3xl font-bold font-outfit mb-4 text-[#f9f5f8]">Thank You!</h2>
                  <p className="text-[#adaaad] mb-10 text-lg leading-relaxed">
                    Your feedback has been successfully submitted. We appreciate you taking the time to share your experience with AxisX.
                  </p>
                  <div className="flex flex-col gap-3 justify-center">
                    <Link href="/#feedback" className="btn-ltr-white relative inline-flex items-center justify-center border border-[#3B82F6]/25 px-8 py-3.5 rounded-full text-[15px] font-bold text-[#0e0e10] w-full">
                      View Library
                    </Link>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/5 bg-transparent px-8 py-3.5 text-sm font-bold text-[#94A3B8] transition-all hover:text-[#F8FAFC] hover:bg-white/5 w-full"
                    >
                      <ArrowLeft size={16} /> Submit Another
                    </button>
                  </div>
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
