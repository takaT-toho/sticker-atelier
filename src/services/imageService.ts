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

interface GenerateImageParams {
  prompt: string;
  baseImage?: ImageInput;
  poseImage?: ImageInput;
}

interface GeneratedImage {
  url?: string;
  base64Data?: string;
  error?: string;
}

export const generateImage = async ({ prompt, baseImage, poseImage }: GenerateImageParams): Promise<GeneratedImage> => {
  if (!prompt) {
    return { error: "Prompt is required" };
  }

  try {
    // contents 配列を動的に構築
    const contents: ContentPart[] = [{ text: prompt }]; // まずテキストプロンプトを追加

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

    // Attempting to use the structure from the user's sample: ai.models.generateContent
    // This is the most uncertain part, as `ai.models` might not exist on GoogleGenAI instance
    // or `generateContent` might have a different signature or not exist there.
    const result = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: { // As per user's JavaScript sample, and correcting based on error
        responseModalities: [Modality.IMAGE, Modality.TEXT], // Model expects IMAGE and TEXT
      },
    });

    // Assuming `result` has a structure similar to GenerateContentResponse
    // (e.g., result.candidates)
    if (result && result.candidates && result.candidates.length > 0) {
      for (const candidate of result.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Check for inlineData and then safely access mimeType
            if (part.inlineData && typeof part.inlineData.mimeType === 'string' && part.inlineData.mimeType.startsWith("image/")) {
              return { base64Data: part.inlineData.data };
            }
          }
        }
      }
    }
    
    console.log("Full API Response (no image data found):", JSON.stringify(result, null, 2));
    return { error: "No image data found in API response." };

  } catch (error: unknown) { // Catch error as unknown for type safety
    console.error("Error generating image:", error);
    let errorMessage = "Unknown error occurred";
    let apiErrorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for common error structures from SDKs more safely
      if (typeof error === 'object' && error !== null) {
        const errObj = error as { response?: { data?: unknown }, details?: unknown, cause?: unknown };
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
            apiErrorDetails = JSON.stringify(error);
        } catch {
            apiErrorDetails = String(error);
        }
    }
    if (apiErrorDetails) {
        console.error("Error Details:", apiErrorDetails);
    }
    return { error: `Failed to generate image: ${errorMessage}${apiErrorDetails ? `. Details: ${apiErrorDetails}` : ''}` };
  }
};
