"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, CheckCircle, Check, ArrowLeft, Image as ImageIcon, Video, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MediaKind, uploadFilesToStorage, validateFiles } from "@/lib/media";
import { toDatabasePayload } from "@/lib/supabase-api";
import toast from "react-hot-toast";
import { appConfig } from "@/lib/env";
import { deleteFilesByUrl } from "@/lib/media";
import { motion, AnimatePresence } from "framer-motion";
import { TypingText } from "@/components/TypingText";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { getRootProps: getImageProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: acceptedFiles => {
      setImages(prev => [...prev, ...acceptedFiles].slice(0, appConfig.maxFeedbackImages));
      if (errors.media) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.media;
          return newErrors;
        });
      }
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
    // Clear error when user changes value
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => {
    setErrors({});
    
    if (step === 1) {
      const newErrors: Record<string, string> = {};
      if (!formData.clientName.trim()) newErrors.clientName = "Client name is required";
      if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    
    if (step === 2 && !formData.message.trim()) {
      setErrors({ message: "Feedback message is required" });
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handlePrev = () => setStep(prev => Math.max(1, prev - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check: only allow submission on the final step
    if (step < 3) return;

    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!formData.clientName.trim()) newErrors.clientName = "Client name is required";
    if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";
    if (!formData.message.trim()) newErrors.message = "Feedback message is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please complete all required fields.");
      return;
    }

    if (images.length === 0) {
      setErrors({ media: "Please upload at least one image of your project." });
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

  const FieldError = ({ error }: { error?: string }) => (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
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
              Share your experience working with <TypingText text="AxisX Studio" className="font-bold" />. Your insights are invaluable to our continuous improvement.
            </motion.p>
          </div>
        </section>

        <section className="pb-32">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="feedback-form"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="glass p-6 md:p-10 rounded-3xl border border-[#a3a6ff]/20"
                >
                  {/* Professional Step Indicator */}
                  <div className="flex justify-center mb-12">
                    <div className="flex items-center w-full max-w-md">
                      {[
                        { id: 1, label: "Client" },
                        { id: 2, label: "Feedback" },
                        { id: 3, label: "Media" }
                      ].map((s, i) => (
                        <div key={s.id} className="flex-1 flex items-center relative">
                          <div className="flex flex-col items-center relative z-10 w-full">
                            <motion.div
                              className="relative"
                              animate={{
                                scale: step === s.id ? [1, 1.05, 1] : 1,
                              }}
                              transition={{ repeat: Infinity, duration: 2.5 }}
                            >
                              {/* Rotating Border for Active Step */}
                              {step === s.id && (
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                  className="absolute inset-[-4px] rounded-full border border-dashed border-[#a3a6ff]/40"
                                />
                              )}
                              
                              <div
                                className={`
                                  relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500
                                  ${step === s.id 
                                    ? 'bg-[#a3a6ff] border-[#a3a6ff] text-[#0e0e10] shadow-[0_0_25px_rgba(163,166,255,0.4)]' 
                                    : step > s.id 
                                      ? 'bg-[#a3a6ff]/20 border-[#a3a6ff] text-[#a3a6ff]' 
                                      : 'bg-[#19191c] border-white/10 text-[#adaaad]'
                                  }
                                `}
                              >
                                {step > s.id ? <CheckCircle size={18} /> : s.id}
                              </div>
                            </motion.div>
                            <span className={`text-[11px] font-bold uppercase tracking-widest mt-3 transition-colors duration-500 ${step >= s.id ? 'text-[#a3a6ff]' : 'text-[#4a4a5a]'}`}>
                              {s.label}
                            </span>
                          </div>
                          
                          {/* Connector Line */}
                          {i < 2 && (
                            <div className="absolute top-5 left-1/2 w-full h-[1px] bg-white/5 -z-0">
                              <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: step > s.id ? "100%" : "0%" }}
                                className="h-full bg-gradient-to-r from-[#a3a6ff] to-[#c180ff]"
                              />
                            </div>
                          )}
                        </div>
                      ))}
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
                            <input 
                              suppressHydrationWarning 
                              required 
                              type="text" 
                              name="clientName" 
                              value={formData.clientName} 
                              onChange={handleChange} 
                              className={`w-full bg-[#0e0e10] border ${errors.clientName ? 'border-[#ff6e84]/50 focus:border-[#ff6e84]' : 'border-[#a3a6ff]/20 focus:border-[#a3a6ff]/60'} rounded-xl px-4 py-3 text-[#f9f5f8] transition-all hover:bg-[#15151a]`} 
                              placeholder="AxisX Studio"
                            />
                            <FieldError error={errors.clientName} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#adaaad] mb-2">Project Name <span className="text-[#ff6e84]">*</span></label>
                            <input 
                              suppressHydrationWarning 
                              required 
                              type="text" 
                              name="projectName" 
                              value={formData.projectName} 
                              onChange={handleChange} 
                              className={`w-full bg-[#0e0e10] border ${errors.projectName ? 'border-[#ff6e84]/50 focus:border-[#ff6e84]' : 'border-[#a3a6ff]/20 focus:border-[#a3a6ff]/60'} rounded-xl px-4 py-3 text-[#f9f5f8] transition-all hover:bg-[#15151a]`} 
                              placeholder="Mobile App MVP"
                            />
                            <FieldError error={errors.projectName} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#adaaad] mb-2">Company / Project Link</label>
                            <input suppressHydrationWarning type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 transition-all hover:bg-[#15151a]" placeholder="https://axisxstudio.com or AxisX Studio" />
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
                            <div className="flex flex-col items-center gap-5 w-full">
                              <div className="flex gap-2.5" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={32}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => setFormData(p => ({ ...p, rating: star }))}
                                    fill={(hoverRating || formData.rating) >= star ? "#a3a6ff" : "transparent"}
                                    stroke={(hoverRating || formData.rating) >= star ? "#a3a6ff" : "#4a4a5a"}
                                    className="cursor-pointer transition-colors duration-200 flex-shrink-0"
                                  />
                                ))}
                              </div>
                              <div className="h-8 flex items-center justify-center">
                                <span className="text-[13px] font-bold text-[#a3a6ff] bg-[#a3a6ff]/10 px-4 py-1.5 rounded-full border border-[#a3a6ff]/10 transition-all duration-300">
                                  {ratingSuggestions[hoverRating || formData.rating]}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#adaaad] mb-2">Your Feedback <span className="text-[#ff6e84]">*</span></label>
                          <textarea 
                            required 
                            name="message" 
                            rows={4} 
                            value={formData.message} 
                            onChange={handleChange} 
                            className={`w-full bg-[#0e0e10] border ${errors.message ? 'border-[#ff6e84]/50 focus:border-[#ff6e84]' : 'border-[#a3a6ff]/20 focus:border-[#a3a6ff]/60'} rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 resize-none transition-all hover:bg-[#15151a]`} 
                            placeholder="We'd love to hear your thoughts..."
                          ></textarea>
                          <FieldError error={errors.message} />
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
                            <div className="space-y-4">
                              <div 
                                {...getImageProps()} 
                                className={`
                                  border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                                  ${isImageDragActive 
                                    ? 'border-[#a3a6ff] bg-[#a3a6ff]/5' 
                                    : errors.media 
                                      ? 'border-[#ff6e84]/40 bg-[#ff6e84]/5' 
                                      : 'border-white/10 hover:border-[#a3a6ff]/40 bg-[#111827]/50'
                                  }
                                `}
                              >
                                <input {...getImageInputProps()} />
                                <div className="w-12 h-12 bg-[#a3a6ff]/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#a3a6ff]/20">
                                  <UploadCloud className="text-[#a3a6ff]" size={24} />
                                </div>
                                <p className="text-sm text-[#f9f5f8] font-bold mb-1">Upload Images <span className="text-[#ff6e84]">*</span></p>
                                <p className="text-[11px] text-[#adaaad]/60 font-medium">Max {appConfig.maxFeedbackImages} images, {feedbackImageMaxMb}MB each</p>
                              </div>
                              
                              {images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                  {images.map((file, idx) => (
                                    <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0e0e10]">
                                      <Image 
                                        src={URL.createObjectURL(file)} 
                                        alt="preview" 
                                        fill 
                                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                          type="button" 
                                          onClick={() => removeImage(idx)} 
                                          className="w-7 h-7 bg-[#ff6e84] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div 
                                {...getVideoProps()} 
                                className={`
                                  border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                                  ${isVideoDragActive 
                                    ? 'border-[#c180ff] bg-[#c180ff]/5' 
                                    : 'border-white/10 hover:border-[#c180ff]/40 bg-[#111827]/50'
                                  }
                                `}
                              >
                                <input {...getVideoInputProps()} />
                                <div className="w-12 h-12 bg-[#c180ff]/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#c180ff]/20">
                                  <UploadCloud className="text-[#c180ff]" size={24} />
                                </div>
                                <p className="text-sm text-[#f9f5f8] font-bold mb-1">Upload Videos</p>
                                <p className="text-[11px] text-[#adaaad]/60 font-medium">Max {appConfig.maxFeedbackVideos} videos, {feedbackVideoMaxMb}MB each</p>
                              </div>

                              {videos.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                  {videos.map((file, idx) => (
                                    <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0e0e10] flex flex-col items-center justify-center p-2 text-center">
                                      <Video size={18} className="text-[#c180ff] mb-1" />
                                      <span className="text-[10px] text-[#adaaad] font-medium truncate w-full px-1">{file.name}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => removeVideo(idx)} 
                                        className="absolute top-1 right-1 w-5 h-5 bg-[#ff6e84] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <FieldError error={errors.media} />
                        </div>

                        <div className="pt-4 border-t border-white/5">
                          <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                name="consentToPublish"
                                checked={formData.consentToPublish}
                                onChange={handleChange}
                                className="peer sr-only"
                              />
                              <div className={`
                                w-5 h-5 rounded-md border transition-all duration-300 flex items-center justify-center
                                ${formData.consentToPublish 
                                  ? 'bg-[#3B82F6] border-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.3)]' 
                                  : 'bg-[#0e0e10] border-white/10 group-hover:border-[#3B82F6]/50'}
                              `}>
                                <Check 
                                  size={14} 
                                  className={`text-[#0e0e10] transition-all duration-300 ${formData.consentToPublish ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} 
                                  strokeWidth={4}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-[#adaaad] group-hover:text-[#f9f5f8] transition-colors">
                              I consent to AxisX Studio publicly displaying this feedback in their portfolio.
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
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      transition: { staggerChildren: 0.2, duration: 0.5 } 
                    }
                  }}
                  className="max-w-md mx-auto py-12 px-8 glass-strong border border-[#a3a6ff]/20 rounded-3xl text-center shadow-2xl shadow-[#a3a6ff]/5"
                >
                  <motion.div 
                    variants={{
                      hidden: { scale: 0, rotate: -45 },
                      visible: { scale: 1, rotate: 0 }
                    }}
                    className="w-16 h-16 bg-[#a3a6ff]/10 border border-[#a3a6ff]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#a3a6ff] relative"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute inset-0 bg-[#a3a6ff] rounded-full blur-xl"
                    />
                    <CheckCircle size={32} className="relative z-10" />
                  </motion.div>

                  <motion.h2 
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    className="text-3xl font-bold font-outfit mb-3 text-[#f9f5f8]"
                  >
                    Thank You!
                  </motion.h2>

                  <motion.p 
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    className="text-[#adaaad] mb-8 text-base leading-relaxed max-w-xs mx-auto"
                  >
                    Your feedback has been successfully submitted. We appreciate you taking the time to share your experience with <TypingText text="AxisX Studio" className="gradient-text font-bold" />.
                  </motion.p>
                  
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    className="flex flex-col gap-4 justify-center"
                  >
                    <Link href="/#feedback" className="btn-ltr-white relative inline-flex items-center justify-center border border-[#3B82F6]/25 px-8 py-4 rounded-full text-[15px] font-bold text-[#0e0e10] w-full transform hover:scale-[1.02] transition-transform">
                      View Library
                    </Link>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/5 bg-[#111827]/50 px-8 py-3.5 text-sm font-bold text-[#94A3B8] transition-all hover:text-[#F8FAFC] hover:bg-white/10 w-full"
                    >
                      <ArrowLeft size={16} /> Submit Another
                    </button>
                  </motion.div>
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
