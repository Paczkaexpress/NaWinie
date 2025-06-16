import { useState, useCallback, useEffect } from 'react';
import type { ImagePreview } from '../types';

interface UseImageUploadReturn {
  imagePreview: ImagePreview | null;
  uploadError: string | null;
  isUploading: boolean;
  selectImage: (file: File) => void;
  removeImage: () => void;
  clearError: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Dozwolone formaty: JPEG, PNG, WebP';
    }

    // Check file size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB in bytes
    if (file.size > maxSize) {
      return 'Plik jest za duży (max 1MB)';
    }

    // Basic validation only - async validation will be done in selectImage
    return null;
  }, []);

  const selectImage = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      // Additional async validation if needed
      const asyncValidation = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          
          // Check image dimensions if needed
          const maxWidth = 2048;
          const maxHeight = 2048;
          
          if (img.width > maxWidth || img.height > maxHeight) {
            resolve(`Obraz jest za duży (max ${maxWidth}x${maxHeight}px)`);
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          resolve('Nie udało się wczytać obrazu');
        };
        img.src = URL.createObjectURL(file);
      });

      if (asyncValidation) {
        setUploadError(asyncValidation);
        return;
      }

      // Clear any existing preview
      if (imagePreview?.url) {
        URL.revokeObjectURL(imagePreview.url);
      }

      // Create new preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview({
        file,
        url: previewUrl,
      });

    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError('Wystąpił błąd podczas przetwarzania obrazu');
    } finally {
      setIsUploading(false);
    }
  }, [imagePreview, validateFile]);

  const removeImage = useCallback(() => {
    if (imagePreview?.url) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
    setUploadError(null);
  }, [imagePreview]);

  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview?.url) {
        URL.revokeObjectURL(imagePreview.url);
      }
    };
  }, [imagePreview]);

  return {
    imagePreview,
    uploadError,
    isUploading,
    selectImage,
    removeImage,
    clearError,
  };
}; 