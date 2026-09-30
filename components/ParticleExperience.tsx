'use client';

import { useEffect, useRef, useState } from 'react';
import { ParticleSystem } from './ParticleSystem';
import { EXPERIENCE_CONFIG } from '@/config/experience';
import { imageToParticles } from '@/lib/imageToParticles';
import { detectDeviceCapabilities } from '@/lib/devicePerformance';
import { TimelineController } from '@/lib/timeline';
import type { ParticleData } from '@/lib/imageToParticles';

export function ParticleExperience() {
  const [particleData, setParticleData] = useState<ParticleData[]>([]);
  const [formationProgress, setFormationProgress] = useState(0);
  const [isForming, setIsForming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const timelineRef = useRef<TimelineController | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const capabilitiesRef = useRef(detectDeviceCapabilities());

  useEffect(() => {
    capabilitiesRef.current = detectDeviceCapabilities();
    const timeline = new TimelineController();
    timeline.start();
    timelineRef.current = timeline;

    const animate = () => {
      const state = timeline.getState();
      setFormationProgress(state.formationProgress);
      setIsForming(timeline.isInFormation());
      setIsComplete(timeline.isComplete());

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      timeline.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const targetWidth = capabilitiesRef.current.isMobile
          ? viewportWidth * 0.98
          : viewportWidth * 0.8;

        const finalParticleCount = Math.max(
          12000,
          Math.min(capabilitiesRef.current.particleCount, 22000)
        );

        const result = await imageToParticles(
          EXPERIENCE_CONFIG.PHOTO_PATH,
          finalParticleCount,
          targetWidth,
          viewportWidth,
          viewportHeight
        );

        setParticleData(result.particles);
      } catch (error) {
        console.error('[ParticleExperience] Failed to generate particle targets:', error);
      }
    };

    loadImage();
  }, []);

  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0" style={{ backgroundColor: EXPERIENCE_CONFIG.BACKGROUND_COLOR }}>
      <ParticleSystem
        particleData={particleData}
        formationProgress={formationProgress}
        isForming={isForming}
        isComplete={isComplete}
      />
    </div>
  );
}
