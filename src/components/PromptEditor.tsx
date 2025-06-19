import React from 'react';
import { Edit3 } from 'lucide-react';

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  onPromptChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Edit3 size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Text Prompt</h3>
      </div>
      
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe the style and characteristics you want to incorporate from the pose image..."
          className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {prompt.length} characters
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {[
          'Professional portrait style',
          'Natural lighting',
          'High detail and clarity',
          'Artistic composition',
          'Vibrant colors'
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              const newPrompt = prompt ? `${prompt}, ${suggestion}` : suggestion;
              onPromptChange(newPrompt);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};