import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { BaseImage } from '../types';

interface BaseImageGalleryProps {
  images: BaseImage[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  onDeleteImage: (id: string) => void;
  onAddImage: () => void;
  maxImages?: number;
}

export const BaseImageGallery: React.FC<BaseImageGalleryProps> = ({
  images,
  selectedImageId,
  onSelectImage,
  onDeleteImage,
  onAddImage,
  maxImages = 5
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Base Images</h3>
        <span className="text-sm text-gray-500">{images.length}/{maxImages}</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer transition-all duration-200 ${
              selectedImageId === image.id
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:shadow-lg'
            }`}
            onClick={() => onSelectImage(image.id)}
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteImage(image.id);
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            >
              <Trash2 size={12} />
            </button>
            
            <p className="mt-2 text-xs text-gray-600 truncate">{image.name}</p>
          </div>
        ))}
        
        {images.length < maxImages && (
          <button
            onClick={onAddImage}
            className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
          >
            <Plus size={24} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};