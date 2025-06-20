export interface BaseImage {
  id: string;
  name: string;
  url: string;
  file: File;
  uploadedAt: Date;
}

export interface PoseImage {
  id: string;
  file: File;
  url: string;
  uploadedAt: Date;
}

export interface GeneratedImage {
  id: string;
  url?: string; // Made url optional
  prompt: string;
  baseImageId: string;
  poseImageId: string;
  generatedAt: Date;
}

export interface GenerationRequest {
  baseImageId: string;
  poseImage: File;
  prompt: string;
}
