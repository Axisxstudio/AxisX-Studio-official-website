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
} from "lucide-react";
import { Project } from "@/types";
import { supabase } from "@/lib/supabase";
import { deleteFilesByUrl, uploadFilesToStorage, validateFiles } from "@/lib/media";
import { selectClause, toDatabaseField, toDatabasePayload } from "@/lib/supabase-api";
import toast from "react-hot-toast";

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
        const nextSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

        return {
          ...current,
          title: value,
          slug: current.slug || nextSlug,
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

    if (coverImage) {
      const coverValid = validateFiles([coverImage], "image");
      if (!coverValid.valid) {
        toast.error(coverValid.error ?? "Invalid cover image.");
        return;
      }
    }

    const galleryValid = validateFiles(galleryImages, "image");
    if (!galleryValid.valid) {
      toast.error(galleryValid.error ?? "Invalid gallery images.");
      return;
    }

    const videoValid = validateFiles(videoFiles, "video");
    if (!videoValid.valid) {
      toast.error(videoValid.error ?? "Invalid project videos.");
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
            id: inserted.id,
            ...payload,
            coverImageUrl,
            galleryImageUrls,
            videoUrls: projectVideoUrls,
            createdAt: inserted.createdAt,
            updatedAt: inserted.updatedAt,
          },
          ...current,
        ]);

        toast.success("Project created.");
      }

      resetForm();
    } catch (error) {
      console.error("Failed to save project:", error);
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

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-[#f9f5f8] mb-2">Project Management</h1>
          <p className="text-[#adaaad]">Create and maintain your portfolio catalog.</p>
        </div>

        <button
          onClick={isFormOpen ? resetForm : openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a3a6ff] to-[#c180ff] px-5 py-3 text-[#0e0e10] font-semibold"
        >
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? "Close Form" : "New Project"}
        </button>
      </header>

      {isFormOpen && (
        <form onSubmit={persistProject} className="glass-strong rounded-3xl border border-[#a3a6ff]/20 p-6 md:p-8 space-y-5">
          <h2 className="text-xl font-semibold text-[#f9f5f8]">{editingProjectId ? "Edit Project" : "Create Project"}</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-[#adaaad] mb-2 block">Project title *</label>
              <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-[#adaaad] mb-2 block">Slug *</label>
              <input name="slug" value={formData.slug} onChange={handleChange} className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-[#adaaad] mb-2 block">Category *</label>
              <input name="category" value={formData.category} onChange={handleChange} className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-[#adaaad] mb-2 block">Client name</label>
              <input name="clientName" value={formData.clientName} onChange={handleChange} className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3" />
            </div>
          </div>

          <div>
            <label className="text-sm text-[#adaaad] mb-2 block">Description *</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3" />
          </div>

          <div>
            <label className="text-sm text-[#adaaad] mb-2 block">Technologies (comma separated)</label>
            <input name="technologies" value={formData.technologies} onChange={handleChange} className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="rounded-xl border border-dashed border-[#a3a6ff]/30 bg-[#0e0e10] p-4 text-center cursor-pointer">
              <UploadCloud className="mx-auto mb-2 text-[#a3a6ff]" size={20} />
              <p className="text-xs text-[#adaaad]">Upload cover image</p>
              <p className="text-xs text-[#f9f5f8] mt-1 truncate">{coverImage?.name ?? "No file selected"}</p>
              <input hidden type="file" accept="image/*" onChange={(event) => setCoverImage(event.target.files?.[0] ?? null)} />
            </label>

            <label className="rounded-xl border border-dashed border-[#a3a6ff]/30 bg-[#0e0e10] p-4 text-center cursor-pointer">
              <UploadCloud className="mx-auto mb-2 text-[#a3a6ff]" size={20} />
              <p className="text-xs text-[#adaaad]">Upload gallery images</p>
              <p className="text-xs text-[#f9f5f8] mt-1 truncate">{galleryImages.length} selected</p>
              <input hidden type="file" accept="image/*" multiple onChange={(event) => setGalleryImages(Array.from(event.target.files ?? []))} />
            </label>

            <label className="rounded-xl border border-dashed border-[#c180ff]/30 bg-[#0e0e10] p-4 text-center cursor-pointer">
              <UploadCloud className="mx-auto mb-2 text-[#c180ff]" size={20} />
              <p className="text-xs text-[#adaaad]">Upload project videos</p>
              <p className="text-xs text-[#f9f5f8] mt-1 truncate">{videoFiles.length} selected</p>
              <input hidden type="file" accept="video/*" multiple onChange={(event) => setVideoFiles(Array.from(event.target.files ?? []))} />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[#adaaad]">
            <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="accent-[#a3a6ff]" />
            Publish this project publicly
          </label>

          <button type="submit" disabled={submitLoading} className="inline-flex items-center gap-2 rounded-xl bg-[#a3a6ff] px-5 py-3 text-[#0e0e10] font-semibold disabled:opacity-60">
            <Save size={16} /> {submitLoading ? "Saving..." : editingProjectId ? "Update Project" : "Create Project"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-64 rounded-2xl bg-[#19191c] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#19191c] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#19191c] animate-pulse" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-[#a3a6ff]/10 py-16 text-center glass">
          <Briefcase size={42} className="mx-auto text-[#adaaad] mb-2" />
          <p className="text-[#f9f5f8] font-semibold">No projects found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="glass-strong rounded-2xl border border-[#a3a6ff]/10 overflow-hidden">
              <div className="relative h-44 bg-[#0e0e10]">
                {project.coverImageUrl ? (
                  <Image
                    src={project.coverImageUrl}
                    alt={project.title}
                    fill
                    unoptimized
                    sizes="(max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-[#adaaad]">No cover image</div>
                )}
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-lg text-[#f9f5f8] truncate">{project.title}</h3>
                  <button onClick={() => togglePublish(project)} className="rounded-lg border border-[#a3a6ff]/20 bg-[#19191c] p-1.5 text-[#adaaad] hover:text-[#a3a6ff]">
                    {project.isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>

                <p className="text-xs uppercase tracking-wider text-[#a3a6ff]">{project.category}</p>
                <p className="text-sm text-[#adaaad] line-clamp-2">{project.description}</p>

                <div className="flex flex-wrap gap-2">
                  {(project.technologies ?? []).slice(0, 4).map((tech) => (
                    <span key={tech} className="rounded-full border border-[#a3a6ff]/20 px-2 py-0.5 text-[10px] text-[#adaaad]">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => openEdit(project)} className="inline-flex items-center gap-1 text-sm text-[#a3a6ff]">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => removeProject(project)} className="rounded-lg border border-[#ff6e84]/20 bg-[#19191c] p-1.5 text-[#adaaad] hover:text-[#ff6e84]">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
