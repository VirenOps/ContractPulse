import React, { useState, useRef } from 'react';

export default function ContractUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF document.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    // 🚀 Grab the active token from localStorage
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/contracts/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // 🔑 Attach token here (Do NOT include Content-Type!)
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload pipeline rejected the file stream.');
      }

      const newContract = await response.json();
      
      if (onUploadSuccess) {
        onUploadSuccess(newContract);
      }
    } catch (err) {
      console.error("Upload failure:", err);
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  // Drag and drop event traps
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleUpload(file);
  };

  return (
    <div 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
        isDragging 
          ? 'border-indigo-600 bg-indigo-50/50' 
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={(e) => handleUpload(e.target.files[0])}
        accept=".pdf"
        className="hidden" 
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-slate-600">Streaming document buffer to cloud storage...</span>
        </div>
      ) : (
        <div>
          <div className="mx-auto h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-2">↑</div>
          <p className="text-sm font-semibold text-slate-700">Click to upload or drag & drop</p>
          <p className="text-xs text-slate-400 mt-1">PDF file formats up to 25MB supported</p>
        </div>
      )}
    </div>
  );
}