export type ParticleColorMode = 'original' | 'monochrome' | 'warm' | 'cool';

export const EXPERIENCE_CONFIG = {
  DEBUG: false,
  DEBUG_TARGETS: false,
  DEBUG_INITIAL_PARTICLES: false,
  DEBUG_FORMATION: false,

  STATIC_TEST_MODE: false,
  STATIC_TEST_DURATION: 30,

  PHOTO_PATH: '/photo.jpg',

  PARTICLE_COUNT_DESKTOP: 18000,
  PARTICLE_COUNT_MOBILE: 12000,

  TIMELINE: {
    INTRO_1_START: 0,
    INTRO_1_END: 8,
    INTRO_2_START: 8,
    INTRO_2_END: 20,
    INTRO_3_START: 20,
    INTRO_3_END: 35,
    FORMATION_START: 35,
    FORMATION_END: 62,
    FINAL_1_START: 62,
    FINAL_1_END: 74,
    FINAL_2_START: 74,
    FINAL_2_END: 90,
  },

  TEXTS: {
    INTRO_1: 'fica só mais um pouquinho.',
    INTRO_2: 'não precisa entender.',
    INTRO_3: 'só olha.',
    FINAL_1: 'acho que você já percebeu.',
    FINAL_2: 'era você.',
  },

  PARTICLE_SIZE: 1.2,
  PARTICLE_MIN_SIZE: 0.8,
  PARTICLE_MAX_SIZE: 1.8,
  PARTICLE_COLOR_MODE: 'original' as ParticleColorMode,

  BACKGROUND_COLOR: '#050508',

  MUSIC_PATH: '/music.mp3',
  ENABLE_AUDIO: false,

  NOISE_SCALE: 0.0016,
  NOISE_SPEED: 0.0009,
  ATTRACTION_STRENGTH: 0.12,
  DAMPING: 0.86,
  TURBULENCE: 0.08,

  FORMATION_EASING: 'easeInOutCubic' as const,
  PARTICLE_DELAY_RANGE: 14,

  MOUSE_INFLUENCE_RADIUS: 120,
  MOUSE_FORCE: 0.8,

  ENABLE_BLOOM: false,
  ENABLE_VIGNETTE: false,
  ENABLE_FILM_GRAIN: false,

  PARTICLE_DEPTH_RANGE: 140,
  CAMERA_DISTANCE: 1200,

  TARGET_FPS: 60,
  MIN_FPS: 30,

  DESKTOP_IMAGE_SCALE: 0.74,
  MOBILE_IMAGE_SCALE: 0.8,

  SAMPLE_DENSITY: 2,
  BRIGHTNESS_THRESHOLD: 12,
  CONTRAST_BOOST: 1.35,
} as const;

export type ExperienceConfig = typeof EXPERIENCE_CONFIG;
