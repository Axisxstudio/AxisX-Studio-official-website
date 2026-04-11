"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Edit,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
  Layout,
  Tag,
  User,
  ExternalLink,
  Cpu,
  Monitor,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { Project } from "@/types";
import { supabase } from "@/lib/supabase";
import { deleteFilesByUrl, uploadFilesToStorage, validateFiles } from "@/lib/media";
import { selectClause, toDatabaseField, toDatabasePayload } from "@/lib/supabase-api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type ProjectForm = {
  title: string;
  slug: string;
  category: string;
  clientName: string;
  description: string;
  technologies: string;
  isPublished: boolean;
};

const emptyForm: ProjectForm = {
  title: "",
  slug: "",
  category: "",
  clientName: "",
  description: "",
  technologies: "",
  isPublished: false,
};

function getProjectSaveErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Failed to save project.";
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
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

  const [formData, setFormData] = useState<ProjectForm>(emptyForm);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isFormOpen || !!viewingProject || confirmData.isOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFormOpen, viewingProject, confirmData.isOpen]);

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select(selectClause("projects"))
          .order(toDatabaseField("projects", "createdAt"), { ascending: false });
        if (error) throw error;
        setProjects((data ?? []) as unknown as Project[]);
      } catch {
        toast.error("Failed to fetch projects.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const activeEditingProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? null,
    [projects, editingProjectId],
  );

  const resetForm = () => {
    setFormData(emptyForm);
    setCoverImage(null);
    setGalleryImages([]);
    setVideoFiles([]);
    setEditingProjectId(null);
    setIsFormOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProjectId(project.id ?? null);
    setFormData({
      title: project.title,
      slug: project.slug,
      category: project.category,
      clientName: project.clientName,
      description: project.description,
      technologies: project.technologies.join(", "),
      isPublished: project.isPublished,
    });
    setCoverImage(null);
    setGalleryImages([]);
    setVideoFiles([]);
    setIsFormOpen(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setFormData((current) => ({ ...current, [name]: (event.target as HTMLInputElement).checked }));
      return;
    }

    setFormData((current) => {
      if (name === "title") {
        return {
          ...current,
          title: value,
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  const persistProject = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.slug.trim() || !formData.category.trim() || !formData.description.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }

    setSubmitLoading(true);

    try {
      const projectPath = `projects/${formData.slug}-${Date.now()}`;
      const [galleryImageUrls, projectVideoUrls] = await Promise.all([
        uploadFilesToStorage(galleryImages, projectPath, "image"),
        uploadFilesToStorage(videoFiles, projectPath, "video"),
      ]);

      let coverImageUrl = "";
      if (coverImage) {
        const uploaded = await uploadFilesToStorage([coverImage], `${projectPath}/cover`, "image");
        coverImageUrl = uploaded[0] ?? "";
      }

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        category: formData.category.trim(),
        clientName: formData.clientName.trim(),
        description: formData.description.trim(),
        technologies: formData.technologies
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean),
        isPublished: formData.isPublished,
      };

      if (editingProjectId && activeEditingProject) {
        const { error } = await supabase
          .from("projects")
          .update(toDatabasePayload("projects", {
            ...payload,
            coverImageUrl: coverImageUrl || activeEditingProject.coverImageUrl,
            galleryImageUrls: [...(activeEditingProject.galleryImageUrls ?? []), ...galleryImageUrls],
            videoUrls: [...(activeEditingProject.videoUrls ?? []), ...projectVideoUrls],
            updatedAt: new Date().toISOString(),
          }))
          .eq("id", editingProjectId);

        if (error) throw error;

        setProjects((current) =>
          current.map((project) =>
            project.id === editingProjectId
              ? {
                ...project,
                ...payload,
                coverImageUrl: coverImageUrl || project.coverImageUrl,
                galleryImageUrls: [...(project.galleryImageUrls ?? []), ...galleryImageUrls],
                videoUrls: [...(project.videoUrls ?? []), ...projectVideoUrls],
              }
              : project,
          ),
        );

        toast.success("Project updated.");
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert([toDatabasePayload("projects", {
            ...payload,
            coverImageUrl,
            galleryImageUrls,
            videoUrls: projectVideoUrls,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })])
          .select(selectClause("projects"))
          .single();

        if (error) throw error;
        const inserted = data as unknown as Project;

        setProjects((current) => [
          {
            ...inserted,
            ...payload,
            coverImageUrl,
            galleryImageUrls,
            videoUrls: projectVideoUrls,
          },
          ...current,
        ]);

        toast.success("Project created.");
      }

      resetForm();
    } catch (error) {
      toast.error(getProjectSaveErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  const removeProject = async (project: Project) => {
    if (!project.id) return;
    
    triggerConfirm(
      "Decommission Asset",
      `Are you certain you wish to purge \"${project.title}\" and all associated cloud-hosted media from the primary cluster?`,
      async () => {
        try {
          await Promise.all([
            deleteFilesByUrl(project.coverImageUrl ? [project.coverImageUrl] : []),
            deleteFilesByUrl(project.galleryImageUrls ?? []),
            deleteFilesByUrl(project.videoUrls ?? []),
          ]);

          const { error } = await supabase.from("projects").delete().eq("id", project.id);
          if (error) throw error;
          setProjects((current) => current.filter((item) => item.id !== project.id));
          toast.success("Project deleted.");
        } catch {
          toast.error("Failed to delete project.");
        }
      },
      true
    );
  };

  const togglePublish = async (project: Project) => {
    if (!project.id) return;
    try {
      const next = !project.isPublished;
      const { error } = await supabase
        .from("projects")
        .update(toDatabasePayload("projects", { isPublished: next, updatedAt: new Date().toISOString() }))
        .eq("id", project.id);
      if (error) throw error;
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, isPublished: next } : item)),
      );
      toast.success(next ? "Project published." : "Project unpublished.");
    } catch {
      toast.error("Failed to update publish state.");
    }
  };

  const inputCls = "w-full rounded-xl border border-[#3B82F6]/15 bg-[#0B0F14] px-4 py-3 text-[#F8FAFC] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/30 outline-none transition-all placeholder:text-[#4A5568] text-sm";
  const btnPrimary = "inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-6 py-3 text-[#0B0F14] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50";

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#3B82F6]/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
              <Layout size={20} />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-[#F8FAFC]">Catalog Engineering</h1>
          </div>
          <p className="text-[#94A3B8]">Deploy and manage technical case studies to your public portal.</p>
        </div>

        <button
          onClick={isFormOpen ? resetForm : openCreate}
          className={btnPrimary}
        >
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? "Terminate Form" : "Initialize Project"}
        </button>
      </header>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={persistProject}
            className="glass-strong rounded-[32px] border border-[#3B82F6]/15 p-8 md:p-10 space-y-8 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/10">
                {editingProjectId ? <Edit size={16} /> : <Plus size={16} />}
              </div>
              <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">
                {editingProjectId ? "Update Infrastructure" : "New Asset Initialization"}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Project Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} className={inputCls} placeholder="e.g. AxisX Cloud Gateway" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Live Site URL *</label>
                <input name="slug" value={formData.slug} onChange={handleChange} className={inputCls} placeholder="https://..." type="url" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">System Category *</label>
                <input name="category" value={formData.category} onChange={handleChange} className={inputCls} placeholder="e.g. Backend Infrastructure" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Client Organization</label>
                <input name="clientName" value={formData.clientName} onChange={handleChange} className={inputCls} placeholder="Client Entity Name" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Technical Abstract *</label>
              <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Describe the engineering challenges and solutions..." />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Tech Stack (CSV)</label>
              <input name="technologies" value={formData.technologies} onChange={handleChange} className={inputCls} placeholder="Next.js, Supabase, Rust, WASM" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="group rounded-2xl border-2 border-dashed border-[#3B82F6]/10 bg-[#0B0F14]/50 p-6 text-center cursor-pointer hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 transition-all">
                <UploadCloud className="mx-auto mb-3 text-[#3B82F6] group-hover:scale-110 transition-transform" size={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568]">Cover Identity</p>
                <p className="text-[11px] text-[#94A3B8] mt-1 truncate">{coverImage?.name ?? "No file selected"}</p>
                <input hidden type="file" accept="image/*" onChange={(event) => setCoverImage(event.target.files?.[0] ?? null)} />
              </label>

              <label className="group rounded-2xl border-2 border-dashed border-[#3B82F6]/10 bg-[#0B0F14]/50 p-6 text-center cursor-pointer hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 transition-all">
                <Layout className="mx-auto mb-3 text-[#3B82F6] group-hover:scale-110 transition-transform" size={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568]">Asset Gallery</p>
                <p className="text-[11px] text-[#94A3B8] mt-1 truncate">{galleryImages.length} items staged</p>
                <input hidden type="file" accept="image/*" multiple onChange={(event) => setGalleryImages(Array.from(event.target.files ?? []))} />
              </label>

              <label className="group rounded-2xl border-2 border-dashed border-[#3B82F6]/10 bg-[#0B0F14]/50 p-6 text-center cursor-pointer hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 transition-all">
                <Monitor className="mx-auto mb-3 text-[#3B82F6] group-hover:scale-110 transition-transform" size={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568]">Motion Media</p>
                <p className="text-[11px] text-[#94A3B8] mt-1 truncate">{videoFiles.length} files staged</p>
                <input hidden type="file" accept="video/*" multiple onChange={(event) => setVideoFiles(Array.from(event.target.files ?? []))} />
              </label>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
              <label className="inline-flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#111827] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#94A3B8]">Public Deployment</span>
              </label>

              <button type="submit" disabled={submitLoading} className={`${btnPrimary} min-w-[200px]`}>
                <Save size={16} /> {submitLoading ? "Processing..." : editingProjectId ? "Sync Update" : "Deploy Asset"}
              </button>
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/5 rounded-full blur-[100px] -z-10" />
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(n => <div key={n} className="h-72 rounded-[32px] bg-[#111827]/40 border border-[#3B82F6]/10 animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-[32px] border border-[#3B82F6]/10 py-32 text-center glass-strong">
          <Briefcase size={48} className="mx-auto text-[#4A5568] mb-6" />
          <p className="text-[#F8FAFC] font-bold text-xl font-outfit">Inventory Empty</p>
          <p className="text-[#94A3B8] text-sm mt-1">Initialize your first strategic project asset above.</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <motion.article
              layout
              key={project.id}
              onClick={() => setViewingProject(project)}
              className="group glass-strong rounded-3xl border border-[#3B82F6]/10 overflow-hidden hover:border-[#3B82F6]/30 transition-all duration-300 relative cursor-pointer"
            >
              <div className="relative h-48 bg-[#0B0F14] overflow-hidden">
                {project.coverImageUrl ? (
                  <Image
                    src={project.coverImageUrl}
                    alt={project.title}
                    fill
                    unoptimized
                    sizes="(max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[#4A5568]">Abstract Pending</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] to-transparent opacity-60" />

                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePublish(project); }}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all backdrop-blur-md ${project.isPublished
                      ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#3B82F6]'
                      : 'bg-[#0B0F14]/60 border border-[#ef4444]/20 text-[#ef4444]'
                      }`}
                  >
                    {project.isPublished ? <CheckCircle2 size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-7 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#3B82F6]">
                    <Cpu size={12} />
                    {project.category}
                  </div>
                  <h3 className="font-bold text-xl text-[#F8FAFC] truncate font-outfit group-hover:text-[#3B82F6] transition-colors">{project.title}</h3>
                </div>

                <p className="text-sm text-[#94A3B8] line-clamp-2 leading-relaxed">
                  {project.slug && project.slug.startsWith("http") && <Globe className="inline-block mr-1.5 -mt-0.5" size={12} />}
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(project.technologies ?? []).slice(0, 3).map((tech) => (
                    <span key={tech} className="px-2 py-1 rounded-md bg-[#111827] border border-[#3B82F6]/10 text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      {tech}
                    </span>
                  ))}
                  {(project.technologies ?? []).length > 3 && (
                    <span className="text-[9px] font-bold text-[#4A5568] self-center">+{(project.technologies ?? []).length - 3}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] group-hover:text-[#3B82F6] transition-all flex items-center gap-1.5 font-outfit">
                    <Monitor size={12} /> Inspect Asset
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0B0F14] border border-white/5 hover:border-[#3B82F6]/20 text-[#4A5568] hover:text-[#3B82F6] transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeProject(project); }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0B0F14] border border-white/5 hover:border-[#ef4444]/20 text-[#4A5568] hover:text-[#ef4444] transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Project Detail View Modal */}
      <AnimatePresence>
        {viewingProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setViewingProject(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl glass-strong border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <button 
                onClick={() => setViewingProject(null)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors border border-white/10"
              >
                <X size={20} />
              </button>

              <div className="grid lg:grid-cols-2 gap-12">
                {/* Media Section */}
                <div className="space-y-6">
                  <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-[#0B0F14]">
                    {viewingProject.coverImageUrl ? (
                      <Image src={viewingProject.coverImageUrl} alt={viewingProject.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A5568]">No Identity Asset</div>
                    )}
                  </div>
                  
                  {viewingProject.galleryImageUrls && viewingProject.galleryImageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {viewingProject.galleryImageUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/5">
                           <Image src={url} alt="Gallery" fill className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  )}

                  {viewingProject.videoUrls && viewingProject.videoUrls.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#3B82F6]/5 border border-[#3B82F6]/10">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] mb-2">Linked Motion Assets</p>
                       <p className="text-xs text-[#94A3B8] italic">{viewingProject.videoUrls.length} Engineering walkthroughs available.</p>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div>
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                       <span className="px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] font-bold text-[10px] uppercase tracking-widest border border-[#3B82F6]/20">
                        {viewingProject.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest border ${
                        viewingProject.isPublished ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {viewingProject.isPublished ? 'Live' : 'Staged'}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold font-outfit text-white mb-2">{viewingProject.title}</h2>
                    <p className="text-[#3B82F6] text-sm font-semibold mb-6 flex items-center gap-2">
                      <User size={14} /> Client: {viewingProject.clientName || 'Private AxisX Integration'}
                    </p>
                    
                    <div className="p-5 rounded-3xl bg-[#0B0F14]/50 border border-white/5">
                       <h4 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em] mb-3">Project Abstract</h4>
                       <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">{viewingProject.description}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em] mb-4">System Core Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingProject.technologies.map(tech => (
                          <span key={tech} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs font-medium text-[#F8FAFC]">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {viewingProject.slug && (
                      <div>
                        <h4 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em] mb-3">Deployment Endpoint</h4>
                        <a 
                          href={viewingProject.slug} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#3B82F6] hover:underline flex items-center gap-2 font-medium"
                        >
                          <ExternalLink size={14} /> {viewingProject.slug}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 flex gap-4 pt-8 border-t border-white/5">
                    <button
                      onClick={() => {
                        setViewingProject(null);
                        openEdit(viewingProject);
                      }}
                      className="flex-1 py-4 rounded-2xl bg-[#3B82F6] text-[#0B0F14] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-blue-500/10"
                    >
                      Initialize Edit
                    </button>
                    <button
                      onClick={() => setViewingProject(null)}
                      className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                    >
                      Defocus
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Confirmation Modal */}
      <AnimatePresence>
        {confirmData.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-[#0B0F14]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-md glass-strong border ${confirmData.isDanger ? 'border-red-500/20' : 'border-[#3B82F6]/20'
                } rounded-[32px] p-8 shadow-2xl overflow-hidden`}
            >
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${confirmData.isDanger ? 'bg-red-500/10 text-red-500' : 'bg-[#3B82F6]/10 text-[#3B82F6]'
                  }`}>
                  {confirmData.isDanger ? <Trash2 size={24} /> : <Save size={24} />}
                </div>
                <h3 className="text-xl font-bold text-[#F8FAFC] font-outfit mb-3">{confirmData.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed mb-8">{confirmData.message}</p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-[#F8FAFC] font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await confirmData.onAction();
                      setConfirmData(prev => ({ ...prev, isOpen: false }));
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${confirmData.isDanger
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-[#3B82F6] text-[#0B0F14] hover:bg-white'
                      }`}
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
              {confirmData.isDanger && <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500" />}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
