import test from 'node:test';
import assert from 'node:assert/strict';

import { getTargetInfluence, initializeParticles, updatePhysics } from './particlePhysics';
import { scorePixelImportance } from './imageToParticles';
import { TimelineController } from './timeline';

test('initializeParticles starts offset from the target and then converges toward it', () => {
  const particles = initializeParticles(
    [
      {
        x: 100,
        y: 200,
        z: 12,
        r: 1,
        g: 0.5,
        b: 0.2,
        brightness: 0.8,
        size: 2,
        importance: 0.9,
      },
    ],
    1280,
    720
  );

  assert.notEqual(particles[0].position[0], particles[0].targetPosition[0]);
  assert.notEqual(particles[0].position[1], particles[0].targetPosition[1]);
  assert.equal(particles[0].targetPosition[0], 100);
  assert.equal(particles[0].targetPosition[1], 200);
});

test('updatePhysics moves particles closer to their targets without global vertical drift', () => {
  const initial = initializeParticles(
    [
      {
        x: 300,
        y: 400,
        z: 0,
        r: 1,
        g: 1,
        b: 1,
        brightness: 1,
        size: 2,
        importance: 1,
      },
    ],
    1280,
    720
  );

  const next = updatePhysics(
    {
      particles: initial,
      time: 12,
      formationProgress: 0.84,
      isForming: true,
      isComplete: false,
      viewportWidth: 1280,
      viewportHeight: 720,
    },
    1 / 60
  );

  assert.ok(Math.abs(next.particles[0].position[0] - 300) < Math.abs(initial[0].position[0] - 300));
  assert.ok(Math.abs(next.particles[0].position[1] - 400) < Math.abs(initial[0].position[1] - 400));
});

test('early formation keeps the image hidden instead of snapping into the face', () => {
  const initial = initializeParticles(
    [
      {
        x: 300,
        y: 400,
        z: 0,
        r: 1,
        g: 0.8,
        b: 0.7,
        brightness: 1,
        size: 2,
        importance: 0.98,
      },
    ],
    1280,
    720
  );

  const next = updatePhysics(
    {
      particles: initial,
      time: 12,
      formationProgress: 0.42,
      isForming: true,
      isComplete: false,
      viewportWidth: 1280,
      viewportHeight: 720,
    },
    1 / 60
  );

  assert.ok(Math.abs(next.particles[0].position[0] - 300) > 20, 'target should stay hidden during early formation');
  assert.ok(Math.abs(next.particles[0].position[1] - 400) > 20, 'target should stay hidden during early formation');
});

test('timeline eventually marks the experience as complete after the reveal window', () => {
  const originalNow = performance.now.bind(performance);
  let fakeNow = 0;
  performance.now = () => fakeNow;

  try {
    const timeline = new TimelineController();
    timeline.start();
    fakeNow = 35000;
    assert.equal(timeline.isComplete(), true);
  } finally {
    performance.now = originalNow;
  }
});

test('target reveal starts in time for the image to form during the experience', () => {
  assert.ok(getTargetInfluence(0.18, 0.98) < 0.05, 'image should stay hidden before the reveal begins');
  assert.ok(getTargetInfluence(0.42, 0.98) > 0.25, 'image should start revealing before the final act');
  assert.ok(getTargetInfluence(0.84, 0.98) > 0.7, 'final act should have strong target influence');
  assert.ok(getTargetInfluence(0.88, 1) > 0.85, 'high-priority particles should lock onto the image during the reveal');
});

test('dark but high-contrast pixels still receive image importance', () => {
  const importance = scorePixelImportance(0.22, 28, 0.22, 0.35);
  assert.ok(importance > 0.2, 'dark face pixels with strong edges must not be discarded');
});
