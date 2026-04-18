import { api } from './axios';

export interface UploadProgress {
  setUploadProgress: (progress: number) => void;
}

export const uploadFileInChunks = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = crypto.randomUUID();
  let finalPath = "";

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("upload_id", uploadId);
    formData.append("chunk_index", i.toString());
    formData.append("total_chunks", totalChunks.toString());
    formData.append("file_name", file.name);
    formData.append("chunk", chunk);

    const res = await api.post("/media/upload-chunk", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const chunkProgress = progressEvent.loaded / (progressEvent.total || 1);
          const overallProgress = ((i + chunkProgress) / totalChunks) * 100;
          onProgress(Math.round(overallProgress));
        }
      }
    });

    if (res.data.file_path !== "CHUNKING") {
      finalPath = res.data.file_path;
    }
  }

  return finalPath;
};
