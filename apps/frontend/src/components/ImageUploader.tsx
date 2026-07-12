import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, Trash2 } from 'lucide-react';

interface ImageUploaderProps {
  onUploadSuccess: (mediaAssetId: string, fileUrl: string) => void;
  onClear?: () => void;
  currentImageUrl?: string;
  maxSizeMB?: number;
  label?: string;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  onClear,
  currentImageUrl,
  maxSizeMB = 5,
  label = 'Pilih Berkas atau Seret ke Sini',
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUploadFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Format berkas harus berupa gambar (JPEG, PNG, dll).');
      return;
    }

    // Validate size (maxSizeMB in MB)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran berkas terlalu besar. Maksimal ${maxSizeMB}MB.`);
      return;
    }

    try {
      setIsUploading(true);
      const res = await api.media.upload(file);
      if (res.success && res.data?.media_asset) {
        onUploadSuccess(res.data.media_asset.id, res.data.media_asset.file_url);
      } else {
        setError(res.error?.message || 'Gagal mengunggah gambar. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Terjadi kesalahan jaringan saat mengunggah.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Current Preview or Drag & Drop zone */}
      {currentImageUrl ? (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-video group">
          <img
            src={currentImageUrl}
            alt="Preview"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onButtonClick}
              disabled={isUploading}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> Ganti Foto
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                disabled={isUploading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-300">Mengunggah...</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-green-600 bg-green-50/40 scale-[0.99]'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={isUploading}
          />
          
          <div className="space-y-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-colors ${
              dragActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            
            <div className="text-xs text-slate-500 space-y-1 select-none">
              <p className="font-bold text-slate-700">{isUploading ? 'Sedang mengunggah...' : label}</p>
              <p className="text-[10px]">Format: JPG, PNG, GIF (Maksimal {maxSizeMB}MB)</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold p-2.5 bg-red-50 rounded-lg animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
