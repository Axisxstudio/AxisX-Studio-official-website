import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { appConfig } from "@/lib/env";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];

export type MediaKind = "image" | "video";

type ValidateFileOptions = {
  maxMb?: number;
};

type UploadFileOptions = {
  appendKindFolder?: boolean;
};

export function validateFiles(
  files: File[],
  kind: MediaKind,
  options: ValidateFileOptions = {},
): { valid: boolean; error?: string } {
  const maxMb = options.maxMb ?? (kind === "image" ? appConfig.maxImageMb : appConfig.maxVideoMb);
  const allowed = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;

  for (const file of files) {
    if (!allowed.includes(file.type)) {
      return {
        valid: false,
        error: `${file.name} is not a supported ${kind} format.`,
      };
    }

    const fileMb = file.size / (1024 * 1024);
    if (fileMb > maxMb) {
      return {
        valid: false,
        error: `${file.name} exceeds ${maxMb}MB size limit.`,
      };
    }
  }

  return { valid: true };
}

function sanitizeFilename(filename: string): string {
  return filename.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");
}

export async function uploadFilesToStorage(
  files: File[],
  basePath: string,
  kind: MediaKind,
  options: UploadFileOptions = {},
): Promise<string[]> {
  if (files.length === 0) return [];

  const uploadedUrls: string[] = [];

  try {
    for (const file of files) {
      const extensionSafe = sanitizeFilename(file.name);
      const uniqueName = `${Date.now()}-${uuidv4()}-${extensionSafe}`;
      const directory = options.appendKindFolder === false ? basePath : `${basePath}/${kind}s`;
      let path = `${directory}/${uniqueName}`;
      
      // Clean up double slashes if any
      path = path.replace(/\/\//g, '/');
      if (path.startsWith('/')) path = path.substring(1);

      const { error } = await supabase.storage.from('media').upload(path, file, {
        contentType: file.type,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(path);
      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  } catch (error) {
    if (uploadedUrls.length > 0) {
      await deleteFilesByUrl(uploadedUrls);
    }
    throw error;
  }
}

export async function deleteFilesByUrl(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;

  const pathsToDelete = urls.map(url => {
    // Extract the path from the Supabase public URL
    // e.g. https://[proj].supabase.co/storage/v1/object/public/media/path/to/file.jpg
    const parts = url.split('/public/media/');
    if (parts.length > 1) {
      return parts[1];
    }
    return null;
  }).filter(Boolean) as string[];

  if (pathsToDelete.length > 0) {
    await supabase.storage.from('media').remove(pathsToDelete);
  }
}
