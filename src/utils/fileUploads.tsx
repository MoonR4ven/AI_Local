import React, { useRef, useState } from 'react';
import { Upload, X, FileText, File, Image, Code } from 'lucide-react';
import { ChatFile } from '../types';
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FileUploadProps {
  onFilesUpload: (files: ChatFile[]) => void;
  existingFiles: ChatFile[];
  onFileRemove: (fileId: string) => void;
  maxFileSize?: number; // in bytes (default: 10MB)
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUpload,
  existingFiles,
  onFileRemove,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('image')) return <Image className="w-4 h-4" />;
    if (type.includes('code') || type.includes('text')) return <Code className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: ChatFile[] = [];
    setIsProcessing(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB.`);
        continue;
      }

      // Check if file type is supported
      const supportedTypes = [
        'text/plain', 'application/pdf', 'text/markdown', 'text/csv', 'application/json',
        'text/html', 'text/css', 'application/javascript', 'text/x-python', 'text/x-java',
        'text/x-c', 'text/x-c++', 'text/x-php', 'text/x-ruby', 'text/x-go'
      ];

      if (!supportedTypes.some(type => file.type.includes(type)) && 
          !file.name.match(/\.(txt|pdf|md|csv|json|html|css|js|py|java|c|cpp|php|rb|go)$/i)) {
        alert(`Unsupported file type: ${file.type}. Please upload text-based files.`);
        continue;
      }

      try {
        const content = await readFileContent(file);
        newFiles.push({
          id: Date.now().toString() + i,
          name: file.name,
          content,
          type: file.type,
          size: file.size,
        });
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Error reading file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (newFiles.length > 0) {
      onFilesUpload(newFiles);
    }
    
    setIsProcessing(false);
  };

  const readFileContent = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      return readPDFContent(file);
    } else {
      return readTextFile(file);
    }
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const readPDFContent = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      let text = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }

      return text;
    } catch (error) {
      console.error('Error reading PDF:', error);
      throw new Error('Could not read PDF file. It may be encrypted or corrupted.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="mb-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
        
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag & drop files here or click to upload
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Supports text files, PDFs, code files (max {maxFileSize / 1024 / 1024}MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".txt,.pdf,.md,.csv,.json,.html,.css,.js,.py,.java,.c,.cpp,.php,.rb,.go"
          disabled={isProcessing}
        />
      </div>

      {existingFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Uploaded Files:
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-gray-400 mr-2">
                    {getFileIcon(file.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.type} • {(file.size / 1024).toFixed(1)}KB • {file.content.length} characters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onFileRemove(file.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};