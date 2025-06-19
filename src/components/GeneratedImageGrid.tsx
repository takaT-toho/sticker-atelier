import React from 'react';
import { Download, Maximize2 } from 'lucide-react';
import { GeneratedImage } from '../types';

interface GeneratedImageGridProps {
  images: GeneratedImage[];
  loading: boolean;
}

export const GeneratedImageGrid: React.FC<GeneratedImageGridProps> = ({
  images,
  loading
}) => {
  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `generated-image-${image.id}.jpg`;
    link.click();
  };

  const handlePreview = (image: GeneratedImage) => {
    window.open(image.url, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Generating Images...</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="aspect-square bg-gray-100 rounded-lg animate-pulse">
              <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <span className="ml-2">Generating your images...</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Maximize2 size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-500">Generated images will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Generated Images</h3>
        <span className="text-sm text-gray-500">{images.length} images</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div key={image.id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image.url}
                alt={`Generated image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg">
              <div className="absolute top-2 right-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handlePreview(image)}
                  className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => handleDownload(image)}
                  className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};