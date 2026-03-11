'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { uploadImageToStorage } from '@/lib/firebase-storage';
import { cn } from '@/lib/utils';

interface ImageFieldProps {
  /** Label text shown above the field */
  label?: string;
  /** Current image URL value */
  value: string;
  /** Called with the new URL when URL is typed or file is uploaded */
  onChange: (url: string) => void;
  /** Firebase Storage folder to upload into e.g. "images/services" */
  folder: string;
  /** Placeholder text for the URL input */
  placeholder?: string;
  /** Whether inputs are disabled */
  disabled?: boolean;
  /** Optional extra className on the container */
  className?: string;
  /** Whether to show the image preview below the input */
  showPreview?: boolean;
  /** Id attribute for the URL input */
  inputId?: string;
}

const UPLOAD_ERROR_PREFIX = 'Upload failed';

export const ImageField: React.FC<ImageFieldProps> = ({
  label,
  value,
  onChange,
  folder,
  placeholder = 'https://example.com/image.jpg',
  disabled = false,
  className,
  showPreview = true,
  inputId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected if needed
    e.target.value = '';

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setUploadError('Image must be smaller than 5 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(0);

    try {
      const downloadUrl = await uploadImageToStorage(file, folder, setProgress);
      onChange(downloadUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadError(message.startsWith(UPLOAD_ERROR_PREFIX) ? message : `${UPLOAD_ERROR_PREFIX}: ${message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={inputId} className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-400" />
          {label}
        </Label>
      )}

      {/* URL input + Upload button row */}
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          value={value}
          onChange={(e) => {
            setUploadError(null);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled || uploading}
          className="flex-1"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 gap-2"
          title="Upload image to Firebase Storage"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress > 0 ? `${progress}%` : 'Uploading…'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload
            </>
          )}
        </Button>

        {/* Clear button */}
        {value && !disabled && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="shrink-0 text-gray-400 hover:text-red-500 px-2"
            title="Clear image"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload error */}
      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      {/* Image preview */}
      {showPreview && value && !uploading && (
        <div className="mt-2">
          <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.display = 'block';
              }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Paste a URL or click <strong>Upload</strong> to store an image in Firebase Storage (max 5 MB).
      </p>
    </div>
  );
};

export default ImageField;
