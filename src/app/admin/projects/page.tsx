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

  const [formData, setFormData] = useState<ProjectForm>(emptyForm);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

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
    if (!confirm(`Delete project \"${project.title}\" and all its media?`)) return;

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
              className="group glass-strong rounded-3xl border border-[#3B82F6]/10 overflow-hidden hover:border-[#3B82F6]/30 transition-all duration-300 relative"
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
                    onClick={() => togglePublish(project)}
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
                  <h3 className="font-bold text-xl text-[#F8FAFC] truncate font-outfit">{project.title}</h3>
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
                  <button
                    onClick={() => openEdit(project)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => removeProject(project)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0B0F14] border border-white/5 hover:border-[#ef4444]/20 text-[#4A5568] hover:text-[#ef4444] transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
