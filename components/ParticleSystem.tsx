'use client';

import { useEffect, useRef } from 'react';
import { EXPERIENCE_CONFIG } from '@/config/experience';
import { initializeParticles, updatePhysics, type PhysicsState } from '@/lib/particlePhysics';

interface ParticleSystemProps {
  particleData: Array<{
    x: number;
    y: number;
    z: number;
    r: number;
    g: number;
    b: number;
    brightness: number;
    size: number;
    importance: number;
  }>;
  formationProgress: number;
  isForming: boolean;
  isComplete: boolean;
}

export function ParticleSystem({
  particleData,
  formationProgress,
  isForming,
  isComplete,
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const physicsRef = useRef<PhysicsState | null>(null);
  const formationRef = useRef(formationProgress);
  const formingRef = useRef(isForming);
  const completeRef = useRef(isComplete);

  useEffect(() => {
    formationRef.current = formationProgress;
  }, [formationProgress]);

  useEffect(() => {
    formingRef.current = isForming;
  }, [isForming]);

  useEffect(() => {
    completeRef.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    if (!particleData.length) return;

    physicsRef.current = {
      particles: initializeParticles(particleData, window.innerWidth, window.innerHeight),
      time: 0,
      formationProgress: formationRef.current,
      isForming: formingRef.current,
      isComplete: completeRef.current,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }, [particleData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const currentFormationProgress = formationRef.current;
      const currentIsForming = formingRef.current;
      const currentIsComplete = completeRef.current;

      if (!physicsRef.current) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = EXPERIENCE_CONFIG.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, width, height);
        rafId = window.requestAnimationFrame(render);
        return;
      }

      const nextState = updatePhysics(
        {
          ...physicsRef.current,
          formationProgress: currentFormationProgress,
          isForming: currentIsForming,
          isComplete: currentIsComplete,
          viewportWidth: width,
          viewportHeight: height,
        },
        1 / 60
      );

      physicsRef.current = nextState;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = EXPERIENCE_CONFIG.BACKGROUND_COLOR;
      ctx.fillRect(0, 0, width, height);

      nextState.particles.forEach((particle) => {
        const [x, y] = particle.position;
        const [r, g, b] = particle.color;
        const intensity = 0.42 + currentFormationProgress * 0.58;
        const alpha = Math.min(0.95, intensity * (currentIsComplete ? 0.96 : 1));
        const radius = Math.max(0.5, particle.size * (0.34 + currentFormationProgress * 0.82));

        ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        background: EXPERIENCE_CONFIG.BACKGROUND_COLOR,
      }}
    />
  );
}
