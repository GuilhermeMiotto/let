# Cinematic Particle Experience

A beautiful, cinematic web experience that reveals an image through particles using Three.js, React Three Fiber, and GSAP.

## Features

- **Particle-based image reconstruction**: The photo is reconstructed entirely from particles, not displayed as a static image
- **Organic movement**: Particles use simplex noise for natural, flowing motion
- **Phase-based animation**: Smooth transition from chaos to organized formation
- **Cinematic effects**: Bloom, vignette, and film grain for a premium aesthetic
- **Performance optimization**: Adaptive particle count based on device capabilities
- **Responsive design**: Works on desktop and mobile devices
- **Mouse/touch interaction**: Particles subtly respond to user input
- **Customizable**: All settings are configurable via a single config file

## Project Structure

```
le/
├── app/
│   ├── page.tsx              # Main page component
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── ParticleExperience.tsx # Main experience component
│   ├── ParticleSystem.tsx     # Three.js particle system
│   └── AudioControl.tsx       # Audio control component
├── lib/
│   ├── imageToParticles.ts    # Image processing and particle generation
│   ├── particlePhysics.ts     # Particle physics and animation logic
│   └── devicePerformance.ts   # Device capability detection
├── config/
│   └── experience.ts          # All configuration settings
└── public/
    ├── photo.jpg              # Your image (replace with your photo)
    └── music.mp3              # Optional background music
```

## Customization

All settings are in `config/experience.ts`. Key parameters you can customize:

### Image
- `PHOTO_PATH`: Path to your image file
- `PARTICLE_COUNT_DESKTOP`: Max particles on desktop (default: 50,000)
- `PARTICLE_COUNT_MOBILE`: Max particles on mobile (default: 15,000)

### Timing
- `INTRO_TEXT_DURATION`: How long the intro text shows (default: 3s)
- `CHAOS_DURATION`: How long particles float randomly (default: 4s)
- `FORMATION_DURATION`: How long the image formation takes (default: 12s)

### Text
- `INTRO_TEXT`: Opening message
- `FINAL_TEXT_PRIMARY`: First message after formation
- `FINAL_TEXT_SECONDARY`: Second message (optional)

### Visual Effects
- `ENABLE_BLOOM`: Enable/disable bloom effect
- `BLOOM_STRENGTH`: Bloom intensity (0-1)
- `ENABLE_VIGNETTE`: Enable/disable vignette
- `ENABLE_FILM_GRAIN`: Enable/disable film grain
- `PARTICLE_COLOR_MODE`: 'original', 'monochrome', 'warm', or 'cool'

### Physics
- `ATTRACTION_STRENGTH`: How strongly particles move to their targets
- `DAMPING`: Velocity damping (0-1)
- `TURBULENCE`: Random movement intensity

## Adding Your Image

1. Place your image in the `public/` folder
2. Update `PHOTO_PATH` in `config/experience.ts` to match your filename
3. For best results, use a high-contrast image with good lighting

## Adding Music

1. Place your audio file in the `public/` folder
2. Update `MUSIC_PATH` in `config/experience.ts`
3. Set `ENABLE_AUDIO` to `true`

## Development

```bash
npm run dev
```

The development server will start at http://localhost:3000

## Build

```bash
npm run build
```

## Performance

The experience automatically adapts to device capabilities:
- Detects mobile vs desktop
- Adjusts particle count based on available memory and CPU cores
- Reduces pixel ratio on lower-end devices
- Monitors FPS and can adjust quality dynamically

## Browser Support

- Chrome/Edge (recommended)
- Safari
- Firefox
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technical Details

- **Three.js**: 3D rendering
- **React Three Fiber**: React integration for Three.js
- **Simplex Noise**: Organic particle movement
- **GSAP**: Smooth animations (if needed for additional effects)
- **Post-processing**: Bloom and vignette effects
- **WebGL**: GPU-accelerated particle rendering

## Experience Timeline

1. **0-3s**: Black screen with intro text
2. **3-7s**: Particles float randomly in chaos phase
3. **7-19s**: Particles gradually form the image
4. **19-21s**: Final touches and stabilization
5. **21s+**: Final messages appear

## Notes

- The image is processed client-side in the browser
- No server-side processing required
- All particle calculations happen in real-time
- The experience is fully contained in a single-page application
