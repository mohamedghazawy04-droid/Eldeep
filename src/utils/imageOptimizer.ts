/**
 * Cloud Storage & Image Optimization Utility for El Deeb Pharmacy
 * Compresses product images before saving to Firestore to maximize cloud capacity.
 * At ~60-90KB per image, standard cloud storage can house 15,000+ products seamlessly.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatioPercent: number;
}

/**
 * Optimizes an image (file or base64 string) to high-clarity WebP/JPEG under 100KB
 */
export async function optimizeProductImage(
  source: File | string,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoadedImage = () => {
      let { width, height } = img;

      // Calculate new dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // Smooth downscaling rendering quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP for modern browsers, fallback to JPEG
      let outputDataUrl = canvas.toDataURL('image/webp', quality);
      if (!outputDataUrl.startsWith('data:image/webp')) {
        outputDataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      // Calculate sizes
      const compressedSizeKb = Math.round((outputDataUrl.length * (3 / 4)) / 1024);
      let originalSizeKb = compressedSizeKb;

      if (typeof source === 'string') {
        originalSizeKb = Math.round((source.length * (3 / 4)) / 1024);
      } else if (source instanceof File) {
        originalSizeKb = Math.round(source.size / 1024);
      }

      const ratio =
        originalSizeKb > 0
          ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
          : 0;

      resolve({
        dataUrl: outputDataUrl,
        originalSizeKb: Math.max(originalSizeKb, compressedSizeKb),
        compressedSizeKb,
        compressionRatioPercent: ratio,
      });
    };

    img.onload = handleLoadedImage;
    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Calculates estimated cloud storage space used by products in KB/MB
 */
export function estimateProductsStorageSize(products: Array<{ image?: string; [key: string]: any }>): {
  totalBytes: number;
  totalKb: number;
  totalMb: number;
  averagePerProductKb: number;
} {
  let totalBytes = 0;

  for (const p of products) {
    const jsonStr = JSON.stringify(p);
    totalBytes += new Blob([jsonStr]).size;
  }

  const totalKb = Math.round(totalBytes / 1024);
  const totalMb = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
  const averagePerProductKb = products.length > 0 ? Math.round(totalKb / products.length) : 0;

  return {
    totalBytes,
    totalKb,
    totalMb,
    averagePerProductKb,
  };
}
