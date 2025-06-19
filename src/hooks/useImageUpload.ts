import { useState, useCallback } from 'react';

export const useImageUpload = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (
    e: React.DragEvent,
    onUpload: (files: File[]) => void
  ) => {
    e.preventDefault();
    setDragOver(false);
    setUploading(true);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    onUpload(files);
    setUploading(false);
  }, []);

  const handleFileSelect = useCallback(async (
    files: FileList | null,
    onUpload: (files: File[]) => void
  ) => {
    if (!files) return;
    
    setUploading(true);
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/')
    );
    
    onUpload(imageFiles);
    setUploading(false);
  }, []);

  return {
    dragOver,
    uploading,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect
  };
};