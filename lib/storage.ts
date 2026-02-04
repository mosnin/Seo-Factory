import { put, del, list, head } from "@vercel/blob";

// ── File Storage using Vercel Blob ─────────────────────────────────────────────
// This provides a simple interface for file uploads, replacing AWS S3.
// Vercel Blob is integrated with Railway via Vercel's infrastructure.
//
// For Railway deployments without Vercel:
// Consider using Railway Volumes for persistent storage, or
// use an S3-compatible service like Cloudflare R2 or Backblaze B2.

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export interface FileMetadata {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  file: File | Blob,
  options: {
    pathname: string;
    contentType?: string;
    access?: "public";
  }
): Promise<UploadResult> {
  const blob = await put(options.pathname, file, {
    access: options.access ?? "public",
    contentType: options.contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: file.size,
  };
}

/**
 * Upload a buffer to Vercel Blob storage
 */
export async function uploadBuffer(
  buffer: Buffer | ArrayBuffer,
  options: {
    pathname: string;
    contentType: string;
    access?: "public";
  }
): Promise<UploadResult> {
  const blob = await put(options.pathname, buffer, {
    access: options.access ?? "public",
    contentType: options.contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: buffer.byteLength,
  };
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * Delete multiple files from Vercel Blob storage
 */
export async function deleteFiles(urls: string[]): Promise<void> {
  await del(urls);
}

/**
 * Get metadata for a file in Vercel Blob storage
 */
export async function getFileMetadata(
  url: string
): Promise<FileMetadata | null> {
  try {
    const blob = await head(url);
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    };
  } catch {
    return null;
  }
}

/**
 * List files in Vercel Blob storage
 */
export async function listFiles(options?: {
  prefix?: string;
  limit?: number;
  cursor?: string;
}): Promise<{
  files: FileMetadata[];
  cursor?: string;
  hasMore: boolean;
}> {
  const result = await list({
    prefix: options?.prefix,
    limit: options?.limit ?? 100,
    cursor: options?.cursor,
  });

  return {
    files: result.blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      contentType: "application/octet-stream", // List doesn't return contentType
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    })),
    cursor: result.cursor,
    hasMore: result.hasMore,
  };
}

/**
 * Generate a unique pathname for a file upload
 */
export function generatePathname(
  userId: string,
  folder: "articles" | "exports" | "uploads",
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${folder}/${userId}/${timestamp}-${sanitizedFilename}`;
}
