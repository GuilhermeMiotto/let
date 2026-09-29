import { createNoise3D } from 'simplex-noise';
import { EXPERIENCE_CONFIG } from '@/config/experience';

export interface ParticleState {
  position: [number, number, number];
  velocity: [number, number, number];
  targetPosition: [number, number, number];
  color: [number, number, number];
  size: number;
  brightness: number;
  phase: number;
  seed: number;
  importance: number;
  revealPriority: number;
}

export interface PhysicsState {
  particles: ParticleState[];
  time: number;
  formationProgress: number;
  isForming: boolean;
  isComplete: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
}

const noise3D = createNoise3D();

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getTargetInfluence(formationProgress: number, importance = 0.5): number {
  const revealStart = 0.14;
  const revealEnd = 0.7;
  const revealProgress = clamp((formationProgress - revealStart) / (revealEnd - revealStart), 0, 1);
  const revealCurve = Math.pow(easeInOutCubic(revealProgress), 1.65);
  return clamp(revealCurve * (0.42 + importance * 0.86), 0, 1);
}

export function initializeParticles(
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
    revealPriority?: number;
  }>,
  viewportWidth = 1440,
  viewportHeight = 900
): ParticleState[] {
  return particleData.map((particle, index) => {
    const angle = (index * 0.71 + particle.importance * 17.3) % (Math.PI * 2);
    const spreadBase = Math.max(viewportWidth, viewportHeight) * 1.2;
    const spread = spreadBase * (0.55 + (index % 15) / 15) + 400;
    const offsetX = Math.cos(angle) * spread + (Math.random() - 0.5) * 500;
    const offsetY = Math.sin(angle) * spread * 1.1 + (Math.random() - 0.5) * 500;
    const offsetZ = Math.sin((index + 3) * 1.9) * 120 + (Math.random() - 0.5) * 80;

    const spawnX = clamp(particle.x + offsetX, 0, viewportWidth);
    const spawnY = clamp(particle.y + offsetY, 0, viewportHeight);

    return {
      position: [spawnX, spawnY, particle.z + offsetZ],
      velocity: [0, 0, 0],
      targetPosition: [particle.x, particle.y, particle.z],
      color: [particle.r, particle.g, particle.b],
      size: particle.size,
      brightness: particle.brightness,
      phase: Math.random() * Math.PI * 2,
      seed: Math.random() * 1000,
      importance: particle.importance,
      revealPriority: particle.revealPriority ?? particle.importance,
    };
  });
}

export function updatePhysics(
  state: PhysicsState,
  deltaTime: number
): PhysicsState {
  const {
    particles,
    time,
    formationProgress,
    isForming,
    isComplete,
    viewportWidth = 1440,
    viewportHeight = 900,
  } = state;

  const stageA = clamp(formationProgress / 0.22, 0, 1);
  const stageB = clamp((formationProgress - 0.22) / 0.42, 0, 1);
  const stageC = clamp((formationProgress - 0.7) / 0.2, 0, 1);

  const centerX = viewportWidth * 0.5;
  const centerY = viewportHeight * 0.5;

  const updatedParticles = particles.map((particle) => {
    const priority = Math.max(particle.importance, particle.revealPriority ?? particle.importance);
    const revealAmount = getTargetInfluence(formationProgress, priority);
    const hushAmount = 1 - revealAmount;
    const [px, py, pz] = particle.position;
    const [tx, ty, tz] = particle.targetPosition;

    const noiseA = noise3D(
      (tx + particle.seed) * EXPERIENCE_CONFIG.NOISE_SCALE,
      (ty + particle.phase) * EXPERIENCE_CONFIG.NOISE_SCALE,
      time * 0.9
    );
    const noiseB = noise3D(
      (ty + particle.seed) * EXPERIENCE_CONFIG.NOISE_SCALE,
      (tx + particle.phase) * EXPERIENCE_CONFIG.NOISE_SCALE,
      time * 0.9 + 24
    );

    const dx = tx - px;
    const dy = ty - py;
    const dz = tz - pz;

    const orbitAngle = Math.atan2(ty - centerY, tx - centerX) + particle.seed * 2.6;
    const orbitRadius = Math.hypot(tx - centerX, ty - centerY);

    const galaxyX =
      centerX +
      Math.cos(orbitAngle + time * 0.6 + particle.seed) * (180 + orbitRadius * 0.35) * (1 - stageA) +
      noiseA * 220 * (1 - stageA);
    const galaxyY =
      centerY +
      Math.sin(orbitAngle * 1.4 + time * 0.7 + particle.phase) * (140 + orbitRadius * 0.25) * (1 - stageA) +
      noiseB * 220 * (1 - stageA);

    const hiddenWaveX =
      Math.sin((ty * 0.035) + time * (0.8 + particle.importance) + particle.seed) *
      (52 + particle.importance * 110) *
      (1 - stageB);
    const hiddenWaveY =
      Math.cos((tx * 0.04) + time * (0.9 + particle.importance) + particle.phase) *
      (45 + particle.importance * 95) *
      (1 - stageB);

    const driftX =
      Math.cos((tx + particle.seed) * 0.08 + time * 0.9 + particle.phase) *
      (30 + particle.importance * 90) *
      (1 - revealAmount);
    const driftY =
      Math.sin((ty + particle.phase) * 0.08 + time * 0.8 + particle.seed) *
      (28 + particle.importance * 84) *
      (1 - revealAmount);

    const emergenceX = tx + hiddenWaveX + driftX + Math.cos(orbitAngle + time * 0.5) * 90 * (1 - stageC);
    const emergenceY = ty + hiddenWaveY + driftY + Math.sin(orbitAngle * 1.3 + time * 0.6) * 82 * (1 - stageC);

    const fieldTargetX = lerp(galaxyX, emergenceX, stageB);
    const fieldTargetY = lerp(galaxyY, emergenceY, stageB);
    const revealBlend = clamp(revealAmount * (0.18 + priority * 0.45), 0, 1);
    const finalTargetX = lerp(fieldTargetX, tx, revealBlend * 0.46);
    const finalTargetY = lerp(fieldTargetY, ty, revealBlend * 0.46);

    const attractionX = isComplete ? tx : finalTargetX;
    const attractionY = isComplete ? ty : finalTargetY;

    let vx =
      particle.velocity[0] * EXPERIENCE_CONFIG.DAMPING +
      (attractionX - px) * (0.003 + stageB * 0.012 + revealAmount * 0.25 + priority * 0.05);
    let vy =
      particle.velocity[1] * EXPERIENCE_CONFIG.DAMPING +
      (attractionY - py) * (0.003 + stageB * 0.012 + revealAmount * 0.25 + priority * 0.05);
    let vz = particle.velocity[2] * EXPERIENCE_CONFIG.DAMPING + dz * 0.06;

    if (isForming && !isComplete) {
      const noiseIntensity = (1 - revealBlend) * (0.8 + hushAmount * 2.1);
      vx += noiseA * noiseIntensity * 2.8;
      vy += noiseB * noiseIntensity * 2.8;
      vx += Math.sin(time * 0.9 + particle.seed) * (1 - stageC) * 1.6;
      vy += Math.cos(time * 0.8 + particle.phase) * (1 - stageC) * 1.6;
    }

    if (hushAmount > 0.45) {
      const repel = 0.05 + hushAmount * 0.22;
      vx += (px - tx) * repel;
      vy += (py - ty) * repel;
    }

    if (isComplete) {
      vx = dx * 0.12;
      vy = dy * 0.12;
      vz = dz * 0.1;
    }

    const maxVelocity = isComplete ? 1.1 : 3.1;
    const speed = Math.hypot(vx, vy, vz);
    if (speed > maxVelocity) {
      const scale = maxVelocity / speed;
      vx *= scale;
      vy *= scale;
      vz *= scale;
    }

    const frameScale = deltaTime * 60;
    let nextX = px + vx * frameScale;
    let nextY = py + vy * frameScale;
    let nextZ = pz + vz * frameScale;

    if (nextX < 0 || nextX > viewportWidth) {
      nextX = clamp(nextX, 0, viewportWidth);
      vx *= -0.22;
    }

    if (nextY < 0 || nextY > viewportHeight) {
      nextY = clamp(nextY, 0, viewportHeight);
      vy *= -0.22;
    }

    const easing = easeInOutCubic(clamp(revealBlend, 0, 1));
    const finalX = isComplete ? tx : nextX + (attractionX - nextX) * (0.08 + easing * 0.82);
    const finalY = isComplete ? ty : nextY + (attractionY - nextY) * (0.08 + easing * 0.82);
    const finalZ = isComplete ? tz : nextZ + (tz - nextZ) * (0.08 + easing * 0.6);

    return {
      ...particle,
      position: [finalX, finalY, finalZ] as [number, number, number],
      velocity: [vx, vy, vz] as [number, number, number],
    };
  });

  return {
    particles: updatedParticles,
    time: time + deltaTime,
    formationProgress,
    isForming,
    isComplete,
    viewportWidth,
    viewportHeight,
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (start: number, end: number, amount: number): number =>
  start + (end - start) * amount;
