import React, { useState, useRef } from 'react';
import { Sparkles, Play } from 'lucide-react'; // Removed unused Upload icon
import { BaseImage, PoseImage, GeneratedImage } from './types';
import { BaseImageGallery } from './components/BaseImageGallery';
import { PoseImageUpload } from './components/PoseImageUpload';
import { PromptEditor } from './components/PromptEditor';
import { GeneratedImageGrid } from './components/GeneratedImageGrid';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useLocalStorage } from './hooks/useLocalStorage';
// import { ImageService } from './services/imageService'; // Replaced with direct import
import { generateImage as callGenerateImageApi, ImageInput } from './services/imageService'; // Import our service function and ImageInput type

function App() {
  const [baseImages, setBaseImages] = useLocalStorage<BaseImage[]>('base-images', []);
  const [selectedBaseImageId, setSelectedBaseImageId] = useState<string | null>(null);
  const [poseImage, setPoseImage] = useState<PoseImage | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null); // For displaying errors
  
  const baseImageInputRef = useRef<HTMLInputElement>(null);
  // const imageService = ImageService.getInstance(); // Removed

  const createImageFromFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleAddBaseImage = () => {
    baseImageInputRef.current?.click();
  };

  const handleBaseImageUpload = async (files: FileList | null) => {
    if (!files) return;

    const newImages: BaseImage[] = [];
    const remainingSlots = 5 - baseImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        const url = await createImageFromFile(file);
        const newImage: BaseImage = {
          id: `base-${Date.now()}-${Math.random()}`,
          name: file.name,
          url,
          file,
          uploadedAt: new Date()
        };
        newImages.push(newImage);
      }
    }

    setBaseImages(prev => [...prev, ...newImages]);
    
    if (!selectedBaseImageId && newImages.length > 0) {
      setSelectedBaseImageId(newImages[0].id);
    }
  };

  const handleDeleteBaseImage = (id: string) => {
    setBaseImages(prev => prev.filter(img => img.id !== id));
    if (selectedBaseImageId === id) {
      setSelectedBaseImageId(null);
    }
  };

  const handlePoseImageUpload = async (file: File) => {
    const url = await createImageFromFile(file);
    const newPoseImage: PoseImage = {
      id: `pose-${Date.now()}`,
      file,
      url,
      uploadedAt: new Date()
    };
    setPoseImage(newPoseImage);
  };

  const handleRemovePoseImage = () => {
    setPoseImage(null);
  };

  const handleGenerate = async () => {
    if (!selectedBaseImageId || !poseImage || !prompt.trim()) {
      alert("Please select a base image, upload a pose image, and enter a prompt.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]); // Clear previous images
    setGenerationError(null); // Clear previous errors

    try {
      const selectedBase = baseImages.find(img => img.id === selectedBaseImageId);

      if (!selectedBase || !selectedBase.file) {
        setGenerationError("Selected base image file is missing.");
        setIsGenerating(false);
        return;
      }
      if (!poseImage || !poseImage.file) {
        setGenerationError("Pose image file is missing.");
        setIsGenerating(false);
        return;
      }

      // Helper to convert File to ImageInput
      const fileToImageInput = async (file: File): Promise<ImageInput> => {
        const base64Data = await createImageFromFile(file);
        return {
          mimeType: file.type,
          data: base64Data.split(',')[1], // Remove the "data:mime/type;base64," prefix
        };
      };

      const baseImageInput = await fileToImageInput(selectedBase.file);
      const poseImageInput = await fileToImageInput(poseImage.file);

      // Call our new service function
      const result = await callGenerateImageApi({
        prompt: prompt.trim(),
        baseImage: baseImageInput,
        poseImage: poseImageInput,
      });

      if (result.base64Data) {
        const newGeneratedImage: GeneratedImage = {
          id: `gen-${Date.now()}`,
          url: `data:image/png;base64,${result.base64Data}`, // Assuming PNG, adjust if mimeType is available from API
          prompt: prompt.trim(),
          baseImageId: selectedBaseImageId || "N/A", // Use selected or a placeholder
          poseImageId: poseImage?.id || "N/A",   // Use selected or a placeholder
          generatedAt: new Date(),
        };
        setGeneratedImages([newGeneratedImage]); // Display the new image
      } else if (result.error) {
        console.error('Generation failed:', result.error);
        setGenerationError(result.error);
        alert(`Image generation failed: ${result.error}`);
      } else {
        console.error('Generation failed: Unknown error from service');
        setGenerationError('Unknown error occurred during image generation.');
        alert('Image generation failed: Unknown error.');
      }
    } catch (error) {
      console.error('Generation failed unexpectedly:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setGenerationError(`An unexpected error occurred: ${errorMessage}`);
      alert(`Image generation failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = selectedBaseImageId && poseImage && prompt.trim() && !isGenerating;


  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-stone-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Image Generator
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Transform your ideas into stunning visuals by combining base images with pose references and creative prompts
          </p>
        </header>

        {/* Hidden file input for base images */}
        <input
          ref={baseImageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleBaseImageUpload(e.target.files)}
          className="hidden"
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Base Images */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <BaseImageGallery
                images={baseImages}
                selectedImageId={selectedBaseImageId}
                onSelectImage={setSelectedBaseImageId}
                onDeleteImage={handleDeleteBaseImage}
                onAddImage={handleAddBaseImage}
              />
            </div>

            {/* Pose Image Upload */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <PoseImageUpload
                poseImage={poseImage}
                onImageUpload={handlePoseImageUpload}
                onRemoveImage={handleRemovePoseImage}
              />
            </div>

            {/* Prompt Editor */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <PromptEditor
                prompt={prompt}
                onPromptChange={setPrompt}
              />
            </div>
          </div>

          {/* Right Column - Controls and Results */}
          <div className="space-y-8">
            {/* Generate Button */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                  canGenerate
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  {isGenerating ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <Play size={20} />
                  )}
                  <span>
                    {isGenerating ? 'Generating...' : 'Generate Images'}
                  </span>
                </div>
              </button>
              
              {!canGenerate && !isGenerating && (
                <div className="mt-3 text-sm text-gray-500 space-y-1">
                  <p>To generate images, you need:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {!selectedBaseImageId && <li>Select a base image</li>}
                    {!poseImage && <li>Upload a pose image</li>}
                    {!prompt.trim() && <li>Enter a text prompt</li>}
                  </ul>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Session Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{baseImages.length}</div>
                  <div className="text-sm text-gray-500">Base Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{generatedImages.length}</div>
                  <div className="text-sm text-gray-500">Generated</div>
                </div>
              </div>
            </div>
            {generationError && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {generationError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Generated Images */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <GeneratedImageGrid
            images={generatedImages}
            loading={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
