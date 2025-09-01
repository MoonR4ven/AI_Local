// utils/fileUpload.tsx
import React from 'react';

export const handleFileUpload = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
};

// Component for file upload
export const FileUploadButton: React.FC<{
  onFileUpload: (content: string, fileName: string) => void;
}> = ({ onFileUpload }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const content = await handleFileUpload(file);
        onFileUpload(content, file.name);
      } catch (error) {
        console.error('File upload error:', error);
      }
    }
  };

  return (
    <label className="cursor-pointer">
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.pdf,.doc,.docx,.md,.json,.csv"
      />
      <span className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Upload File
      </span>
    </label>
  );
};