import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { selectClause, toDatabaseField } from "@/lib/supabase-api";
import { Project } from "@/types";
import ProjectContent from "./ProjectContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(selectClause("projects"))
      .eq(toDatabaseField("projects", "slug"), slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as Project;
  } catch (err) {
    console.error("Error fetching project:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {
      title: "Project Not Found | AxisX Studio",
    };
  }

  const title = `${project.title} | AxisX Studio`;
  const description = project.description?.substring(0, 160) || "Explore our technical engineering and digital design work at AxisX Studio.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: project.coverImageUrl || "/og-image.png",
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [project.coverImageUrl || "/og-image.png"],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return <ProjectContent project={project} />;
}
