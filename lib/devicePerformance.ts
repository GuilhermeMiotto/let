import { EXPERIENCE_CONFIG } from '@/config/experience';

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  pixelRatio: number;
  estimatedMemory: number;
  estimatedCores: number;
  particleCount: number;
  qualityLevel: 'low' | 'medium' | 'high';
}

/**
 * Detects device capabilities and returns appropriate settings
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    // Return default values for server-side rendering
    return {
      isMobile: false,
      isTablet: false,
      pixelRatio: 1,
      estimatedMemory: 4,
      estimatedCores: 4,
      particleCount: EXPERIENCE_CONFIG.PARTICLE_COUNT_DESKTOP,
      qualityLevel: 'medium',
    };
  }
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  
  // Estimate memory (rough approximation)
  const navWithMemory = navigator as Navigator & { deviceMemory?: number };
  const estimatedMemory = navWithMemory.deviceMemory ?? 4;

  // Estimate CPU cores
  const estimatedCores = navigator.hardwareConcurrency || 4;
  
  // Calculate quality level
  const qualityLevel = calculateQualityLevel(
    isMobile,
    isTablet,
    estimatedMemory,
    estimatedCores
  );
  
  // Determine particle count
  const particleCount = calculateParticleCount(
    isMobile,
    isTablet,
    qualityLevel
  );
  
  return {
    isMobile,
    isTablet,
    pixelRatio,
    estimatedMemory,
    estimatedCores,
    particleCount,
    qualityLevel,
  };
}

/**
 * Calculates quality level based on device specs
 */
function calculateQualityLevel(
  isMobile: boolean,
  isTablet: boolean,
  memory: number,
  cores: number
): 'low' | 'medium' | 'high' {
  if (isMobile && !isTablet) {
    // Mobile devices
    if (memory < 4 || cores < 4) {
      return 'low';
    } else if (memory < 6 || cores < 6) {
      return 'medium';
    } else {
      return 'high';
    }
  } else {
    // Desktop/tablet devices
    if (memory < 4 || cores < 4) {
      return 'low';
    } else if (memory < 8 || cores < 8) {
      return 'medium';
    } else {
      return 'high';
    }
  }
}

/**
 * Calculates optimal particle count based on device
 */
function calculateParticleCount(
  isMobile: boolean,
  isTablet: boolean,
  qualityLevel: 'low' | 'medium' | 'high'
): number {
  const baseCount = isMobile && !isTablet
    ? EXPERIENCE_CONFIG.PARTICLE_COUNT_MOBILE
    : EXPERIENCE_CONFIG.PARTICLE_COUNT_DESKTOP;
  
  const qualityMultiplier = {
    low: 0.5,
    medium: 0.75,
    high: 1.0,
  };
  
  return Math.floor(baseCount * qualityMultiplier[qualityLevel]);
}

/**
 * Adjusts canvas resolution based on device capabilities
 */
export function getCanvasResolution(
  capabilities: DeviceCapabilities
): { width: number; height: number; pixelRatio: number } {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
  
  let pixelRatio = capabilities.pixelRatio;
  
  // Reduce pixel ratio for low-end devices
  if (capabilities.qualityLevel === 'low') {
    pixelRatio = Math.min(pixelRatio, 1);
  } else if (capabilities.qualityLevel === 'medium') {
    pixelRatio = Math.min(pixelRatio, 1.5);
  }
  
  return {
    width,
    height,
    pixelRatio,
  };
}

/**
 * Monitors FPS and adjusts quality if needed
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private readonly targetFPS = EXPERIENCE_CONFIG.TARGET_FPS;
  private readonly minFPS = EXPERIENCE_CONFIG.MIN_FPS;
  private adjustmentCallbacks: ((quality: 'low' | 'medium' | 'high') => void)[] = [];
  
  /**
   * Should be called every frame
   */
  tick(): void {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      this.checkPerformance();
    }
  }
  
  /**
   * Checks if performance needs adjustment
   */
  private checkPerformance(): void {
    // If FPS is consistently low, suggest quality reduction
    if (this.fps < this.minFPS) {
      this.adjustmentCallbacks.forEach(callback => callback('low'));
    }
  }
  
  /**
   * Registers a callback for quality adjustments
   */
  onQualityAdjust(callback: (quality: 'low' | 'medium' | 'high') => void): void {
    this.adjustmentCallbacks.push(callback);
  }
  
  /**
   * Gets current FPS
   */
  getFPS(): number {
    return this.fps;
  }
}
