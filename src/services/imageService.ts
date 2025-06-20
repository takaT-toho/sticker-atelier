import { GoogleGenAI, Modality } from "@google/genai"; // Re-import Modality
// import 'dotenv/config'; // Removed for Vite environment

// Vite uses import.meta.env for environment variables, prefixed with VITE_
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!API_KEY) {
  console.error("VITE_GEMINI_API_KEY is not defined in your .env file. Make sure it's prefixed with VITE_ and the .env file is in the project root.");
  throw new Error("VITE_GEMINI_API_KEY is not defined. Please check your .env file.");
}

// Initialize GoogleGenAI with apiKey object
const ai = new GoogleGenAI({ apiKey: API_KEY });

const modelName = "gemini-2.0-flash-preview-image-generation"; // User-specified model name

// Define types for content parts
interface TextPart {
  text: string;
}

interface InlineData {
  mimeType: string;
  data: string;
}

interface InlineDataPart {
  inlineData: InlineData;
}

type ContentPart = TextPart | InlineDataPart;

export interface ImageInput { // Added export
  mimeType: string; // 例: "image/png", "image/jpeg"
  data: string;     // base64エンコードされた画像データ
}

// This interface remains for the structure of individual image results/errors
export interface GeneratedImage { // Added export
  url?: string;
  base64Data?: string;
  error?: string;
}

// Original params for a single image, kept for potential internal use or other functions if any
interface GenerateImageParams {
  prompt: string;
  baseImage?: ImageInput;
  poseImage?: ImageInput;
}

// New interface for parameters including the callback
interface GenerateImageParamsWithCallback extends GenerateImageParams {
  onImageGenerated: (image: GeneratedImage, index: number) => void;
}

export const generateImage = async ({ 
  prompt, 
  baseImage, 
  poseImage, 
  onImageGenerated 
}: GenerateImageParamsWithCallback): Promise<void> => {
  const numberOfImagesToGenerate = 10;

  if (!prompt) {
    const errorResult: GeneratedImage = { error: "Prompt is required" };
    for (let i = 0; i < numberOfImagesToGenerate; i++) {
      try {
        onImageGenerated(errorResult, i);
      } catch (cbError) {
        console.error(`Error in onImageGenerated callback for prompt error at index ${i}:`, cbError);
      }
    }
    return; 
  }

  // Prepare contents array once, as it's the same for all 10 images
  const contents: ContentPart[] = [{ text: prompt }];
  if (baseImage && baseImage.data) {
    contents.push({
      inlineData: {
        mimeType: baseImage.mimeType,
        data: baseImage.data,
      },
    });
  }
  if (poseImage && poseImage.data) {
    contents.push({
      inlineData: {
        mimeType: poseImage.mimeType,
        data: poseImage.data,
      },
    });
  }

  for (let i = 0; i < numberOfImagesToGenerate; i++) {
    let currentImageResult: GeneratedImage = {}; // Initialize currentImageResult
    try {
      console.log(`Generating image ${i + 1} of ${numberOfImagesToGenerate}...`);
      const result = await ai.models.generateContent({
        model: modelName,
        contents: contents, // Use the pre-built contents
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      let imageFoundThisIteration = false;
      if (result && result.candidates && result.candidates.length > 0) {
        for (const candidate of result.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && typeof part.inlineData.mimeType === 'string' && part.inlineData.mimeType.startsWith("image/")) {
                currentImageResult = { base64Data: part.inlineData.data };
                imageFoundThisIteration = true;
                break; 
              }
            }
          }
          if (imageFoundThisIteration) break;
        }
      }
      
      if (!imageFoundThisIteration) {
        // Log the full response for this specific iteration if no image is found
        console.log(`Full API Response for image ${i + 1} (no image data found):`, JSON.stringify(result, null, 2));
        currentImageResult = { error: `No image data found in API response for image ${i + 1}.` };
      }

    } catch (e: unknown) { // Changed variable name to 'e' to avoid conflict if original error was named 'error'
      console.error(`Error generating image ${i + 1}:`, e);
      let errorMessage = "Unknown error occurred";
      let apiErrorDetails = "";

      if (e instanceof Error) {
        errorMessage = e.message;
        if (typeof e === 'object' && e !== null) {
          const errObj = e as { response?: { data?: unknown }, details?: unknown, cause?: unknown };
          if (errObj.response && typeof errObj.response === 'object' && errObj.response.data) {
            try {
              apiErrorDetails = JSON.stringify(errObj.response.data);
            } catch {
              apiErrorDetails = String(errObj.response.data);
            }
          } else if (typeof errObj.details === 'string') {
            apiErrorDetails = errObj.details;
          } else if (errObj.cause !== undefined) {
            apiErrorDetails = String(errObj.cause);
          }
        }
      } else {
          try {
              apiErrorDetails = JSON.stringify(e);
          } catch {
              apiErrorDetails = String(e);
          }
      }
      if (apiErrorDetails) {
          console.error(`Error Details for image ${i + 1}:`, apiErrorDetails);
      }
      currentImageResult = { error: `Failed to generate image ${i + 1}: ${errorMessage}${apiErrorDetails ? `. Details: ${apiErrorDetails}` : ''}` };
    }
    
    // Call the callback with the result of the current image generation attempt
    try {
      // Ensure currentImageResult is always assigned.
      // If it was not assigned in try/catch (e.g. an unexpected path), assign an error.
      if (Object.keys(currentImageResult).length === 0) {
          currentImageResult = { error: `An unexpected issue occurred processing image ${i + 1}.` };
      }
      onImageGenerated(currentImageResult, i);
    } catch (cbError) {
      console.error(`Error in onImageGenerated callback at index ${i}:`, cbError);
    }
  }
};
// Removed duplicated closing block from here
