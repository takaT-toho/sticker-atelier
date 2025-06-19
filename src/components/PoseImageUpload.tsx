import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { PoseImage } from '../types';
import { useImageUpload } from '../hooks/useImageUpload';

interface PoseImageUploadProps {
  poseImage: PoseImage | null;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
}

export const PoseImageUpload: React.FC<PoseImageUploadProps> = ({
  poseImage,
  onImageUpload,
  onRemoveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dragOver, uploading, handleDragOver, handleDragLeave, handleDrop, handleFileSelect } = useImageUpload();

  const handleUpload = (files: File[]) => {
    if (files.length > 0) {
      onImageUpload(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Pose Image</h3>
      
      {poseImage ? (
        <div className="relative group">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={poseImage.url}
              alt="Pose reference"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={onRemoveImage}
            className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, handleUpload)}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files, handleUpload)}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-gray-100 rounded-full">
                <ImageIcon size={32} className="text-gray-600" />
              </div>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-700">Upload Pose Image</p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop an image here, or click to select
              </p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Select Image'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};