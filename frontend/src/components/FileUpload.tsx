import { Upload, FileText, X } from 'lucide-react';
import { useState, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (files.length > 0 && validTypes.includes(files[0].type)) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-3">
        {!selectedFile ? (
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group ${
            isDragging 
                ? 'border-gold bg-gold/5 shadow-[0_0_20px_rgba(201,168,76,0.2)]' 
                : 'border-gold/30 bg-surface/50 hover:border-gold/80 hover:bg-gold/5'
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileSelect(e.target.files?.[0] || null)} className="hidden" />
          <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-gold/20 text-gold drop-shadow-[0_0_8px_rgba(201,168,76,0.6)]' : 'bg-surface text-muted group-hover:text-gold group-hover:bg-gold/10 group-hover:shadow-[0_0_15px_rgba(201,168,76,0.3)]'}`}>
            <Upload size={28} />
          </div>
          <p className="font-heading text-sm text-ivory font-bold tracking-wide mb-2 group-hover:text-gold transition-colors">Drop resume or click to browse</p>
          <p className="font-heading text-xs text-[#7A6A53] uppercase tracking-widest">Supported: PDF, JPG, PNG</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 glass-panel glow-panel rounded-xl group transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gold/10 text-gold shadow-[0_0_10px_rgba(201,168,76,0.2)]">
                <FileText size={24} />
            </div>
            <div>
              <p className="font-heading text-sm font-bold tracking-wide text-ivory">{selectedFile.name}</p>
              <p className="font-heading text-xs text-[#7A6A53] tracking-widest uppercase mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onFileSelect(null); }} 
            className="p-2 hover:bg-status-red/10 rounded-lg transition-colors text-muted hover:text-status-red border border-transparent hover:border-status-red/30"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}