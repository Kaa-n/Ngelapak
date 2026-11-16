const allowedExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function getUploadPath(file: File, mimeTypes: string[], directory?: string) {
  const extension = allowedExtensions[file.type];
  if (!extension || !mimeTypes.includes(file.type)) throw new Error("Format berkas tidak didukung.");
  if (file.size === 0 || file.size > 6 * 1024 * 1024) {
    throw new Error("Ukuran berkas harus lebih dari 0 dan maksimal 6 MB.");
  }
  const filename = `${crypto.randomUUID()}.${extension}`;
  return directory ? `${directory}/${filename}` : filename;
}

export const proofMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
