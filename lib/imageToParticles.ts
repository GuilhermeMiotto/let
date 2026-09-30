import { EXPERIENCE_CONFIG } from '@/config/experience';

export interface ParticleData {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  brightness: number;
  size: number;
  importance: number;
  revealPriority: number;
}

export interface ImageAnalysisResult {
  particles: ParticleData[];
  width: number;
  height: number;
  aspectRatio: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function scorePixelImportance(
  luminance: number,
  localContrast: number,
  edgeWeight: number,
  saturation: number
): number {
  return clamp(
    luminance * 0.2 +
      (localContrast / 255) * 0.52 +
      edgeWeight * 0.9 +
      saturation * 0.28,
    0,
    1
  );
}

export async function imageToParticles(
  imagePath: string,
  maxParticles: number,
  targetWidth: number,
  viewportWidth = 1440,
  viewportHeight = 900
): Promise<ImageAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const result = processImage(img, maxParticles, targetWidth, viewportWidth, viewportHeight);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imagePath;
  });
}

function processImage(
  img: HTMLImageElement,
  maxParticles: number,
  targetWidth: number,
  viewportWidth: number,
  viewportHeight: number
): ImageAnalysisResult {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const sourceAspect = img.width / img.height;
  const finalTargetWidth = clamp(Math.round(targetWidth), 900, 1800);
  const finalTargetHeight = Math.round(finalTargetWidth / sourceAspect);

  canvas.width = finalTargetWidth;
  canvas.height = finalTargetHeight;
  ctx.clearRect(0, 0, finalTargetWidth, finalTargetHeight);
  ctx.drawImage(img, 0, 0, finalTargetWidth, finalTargetHeight);

  const imageData = ctx.getImageData(0, 0, finalTargetWidth, finalTargetHeight);
  const pixels = imageData.data;

  const sampleDensity = Math.max(2, Math.min(5, Math.round((finalTargetWidth * finalTargetHeight) / 170000)));
  const validPixels: Array<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    brightness: number;
    importance: number;
    revealPriority: number;
    identityBoost: number;
  }> = [];

  for (let y = 0; y < finalTargetHeight; y += sampleDensity) {
    for (let x = 0; x < finalTargetWidth; x += sampleDensity) {
      const idx = (y * finalTargetWidth + x) * 4;
      const alpha = pixels[idx + 3] / 255;

      if (alpha < 0.02) continue;

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      const luminance = brightness / 255;
      const maxChannel = Math.max(r, g, b);
      const minChannel = Math.min(r, g, b);
      const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;

      let contrast = 0;
      let edgeMagnitude = 0;
      let sampleCount = 0;
      const radius = 2;

      for (let yy = -radius; yy <= radius; yy++) {
        for (let xx = -radius; xx <= radius; xx++) {
          const nx = x + xx;
          const ny = y + yy;
          if (nx < 0 || ny < 0 || nx >= finalTargetWidth || ny >= finalTargetHeight) continue;

          const neighborIndex = (ny * finalTargetWidth + nx) * 4;
          const nr = pixels[neighborIndex];
          const ng = pixels[neighborIndex + 1];
          const nb = pixels[neighborIndex + 2];
          const neighborBrightness = nr * 0.299 + ng * 0.587 + nb * 0.114;
          contrast += Math.abs(brightness - neighborBrightness);
          sampleCount++;

          if (Math.abs(xx) + Math.abs(yy) <= 1) {
            const nextIndex = ((y + yy) * finalTargetWidth + (x + xx)) * 4;
            const mr = pixels[nextIndex];
            const mg = pixels[nextIndex + 1];
            const mb = pixels[nextIndex + 2];
            const neighborLuma = mr * 0.299 + mg * 0.587 + mb * 0.114;
            edgeMagnitude += Math.abs(brightness - neighborLuma);
          }
        }
      }

      const localContrast = sampleCount > 0 ? contrast / sampleCount : 0;
      const edgeWeight = edgeMagnitude / Math.max(1, sampleCount * 255);
      const importance = scorePixelImportance(luminance, localContrast, edgeWeight, saturation);
      const revealPriority = clamp(importance + edgeWeight * 0.55 + saturation * 0.2, 0, 1);

      const faceBias = clamp(
        (1 - Math.abs(y / finalTargetHeight - 0.52)) * 0.24 +
          (1 - Math.abs(x / finalTargetWidth - 0.5)) * 0.12 +
          (luminance > 0.2 ? 0.2 : 0.05),
        0,
        1
      );
      const identityBoost = clamp(importance * 0.72 + revealPriority * 0.28 + faceBias * 0.7, 0, 1);

      if (importance < 0.01 && luminance < 0.08 && localContrast < 12) continue;

      validPixels.push({
        x,
        y,
        r: r / 255,
        g: g / 255,
        b: b / 255,
        brightness: brightness / 255,
        importance,
        revealPriority,
        identityBoost,
      });
    }
  }

  const coverScale = Math.max(viewportWidth / finalTargetWidth, viewportHeight / finalTargetHeight);
  const renderWidth = finalTargetWidth * coverScale;
  const renderHeight = finalTargetHeight * coverScale;
  const offsetX = (viewportWidth - renderWidth) / 2;
  const offsetY = (viewportHeight - renderHeight) / 2;

  const mapped = validPixels
    .map((pixel) => {
      const x = offsetX + (pixel.x / finalTargetWidth) * renderWidth;
      const y = offsetY + (pixel.y / finalTargetHeight) * renderHeight;
      return { ...pixel, x, y };
    })
    .filter((pixel) => pixel.x >= 0 && pixel.x <= viewportWidth && pixel.y >= 0 && pixel.y <= viewportHeight);

  const targetCount = Math.min(maxParticles, mapped.length);
  const primaryCount = Math.max(Math.floor(targetCount * 0.9), targetCount - 200);
  const haloCount = Math.max(0, targetCount - primaryCount);

  const ranked = mapped.sort((a, b) => b.identityBoost - a.identityBoost || b.importance - a.importance);
  const primary = ranked.slice(0, primaryCount);
  const halo = ranked
    .slice(primaryCount)
    .sort((a, b) => b.revealPriority - a.revealPriority)
    .slice(0, haloCount);
  const selected = [...primary, ...halo].sort(() => Math.random() - 0.5);

  const particles: ParticleData[] = selected.map((pixel) => ({
    x: pixel.x + (Math.random() - 0.5) * 1.2,
    y: pixel.y + (Math.random() - 0.5) * 1.2,
    z: (Math.random() - 0.5) * EXPERIENCE_CONFIG.PARTICLE_DEPTH_RANGE * 0.42,
    r: pixel.r,
    g: pixel.g,
    b: pixel.b,
    brightness: pixel.brightness,
    size:
      EXPERIENCE_CONFIG.PARTICLE_MIN_SIZE +
      (EXPERIENCE_CONFIG.PARTICLE_MAX_SIZE - EXPERIENCE_CONFIG.PARTICLE_MIN_SIZE) *
        clamp(PixelImportance(pixel.importance, pixel.revealPriority) * 0.9 + pixel.identityBoost * 0.25, 0, 1),
    importance: pixel.importance,
    revealPriority: pixel.revealPriority,
  }));

  return {
    particles,
    width: viewportWidth,
    height: viewportHeight,
    aspectRatio: viewportWidth / viewportHeight,
  };
}

function PixelImportance(importance: number, revealPriority: number): number {
  return clamp(Math.max(importance, revealPriority * 0.86), 0, 1);
}

export function calculateOptimalParticleCount(
  imageWidth: number,
  imageHeight: number,
  maxParticles: number
): number {
  const totalPixels = imageWidth * imageHeight;
  const complexity = totalPixels / (1920 * 1080);
  const adjustedCount = Math.floor(maxParticles * Math.min(complexity, 1.5));
  return Math.max(800, Math.min(adjustedCount, maxParticles));
}
