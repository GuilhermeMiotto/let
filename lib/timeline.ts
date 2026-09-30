import { EXPERIENCE_CONFIG } from '@/config/experience';

export type TimelinePhase =
  | 'intro_1'
  | 'intro_2'
  | 'intro_3'
  | 'organization'
  | 'formation'
  | 'recognition'
  | 'detail'
  | 'reveal'
  | 'final'
  | 'complete';

export interface TimelineState {
  currentPhase: TimelinePhase;
  currentText: string | null;
  showText: boolean;
  formationProgress: number;
  phaseProgress: number;
  totalProgress: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export class TimelineController {
  private startTime = 0;
  private isRunning = false;

  start(): void {
    this.startTime = performance.now();
    this.isRunning = true;
  }

  stop(): void {
    this.isRunning = false;
  }

  getCurrentTime(): number {
    if (!this.isRunning) return 0;
    return (performance.now() - this.startTime) / 1000;
  }

  getState(): TimelineState {
    const time = this.getCurrentTime();
    const totalDuration = 40;
    const totalProgress = clamp(time / totalDuration, 0, 1);

    const phaseInfo = [
      { start: 0, end: 8, phase: 'intro_1', text: null },
      { start: 8, end: 16, phase: 'intro_2', text: null },
      { start: 16, end: 24, phase: 'intro_3', text: null },
      { start: 24, end: 32, phase: 'organization', text: null },
      { start: 32, end: 40, phase: 'formation', text: null },
    ] as const;

    let currentPhase: TimelinePhase = 'complete';
    let currentText: string | null = null;
    let showText = false;
    let formationProgress = 0;
    let phaseProgress = 0;

    if (time >= totalDuration) {
      formationProgress = 0.96;
      currentPhase = 'complete';
      currentText = null;
      showText = false;
      phaseProgress = 1;
    } else {
      for (const phase of phaseInfo) {
        if (time >= phase.start && time < phase.end) {
          currentPhase = phase.phase;
          currentText = phase.text;
          showText = Boolean(phase.text);
          phaseProgress = (time - phase.start) / (phase.end - phase.start);
          break;
        }
      }

      if (time < 8) {
        formationProgress = clamp(time / 8, 0, 0.18);
      } else if (time < 16) {
        formationProgress = clamp(0.18 + ((time - 8) / 8) * 0.2, 0.18, 0.38);
      } else if (time < 24) {
        formationProgress = clamp(0.38 + ((time - 16) / 8) * 0.22, 0.38, 0.6);
      } else if (time < 32) {
        formationProgress = clamp(0.6 + ((time - 24) / 8) * 0.2, 0.6, 0.82);
      } else {
        formationProgress = clamp(0.82 + ((time - 32) / 8) * 0.14, 0.82, 0.96);
      }
    }

    return {
      currentPhase,
      currentText,
      showText,
      formationProgress: clamp(formationProgress, 0, 1),
      phaseProgress: clamp(phaseProgress, 0, 1),
      totalProgress,
    };
  }

  isInFormation(): boolean {
    const state = this.getState();
    return state.formationProgress > 0.08;
  }

  isInChaos(): boolean {
    const state = this.getState();
    return state.formationProgress < 0.64;
  }

  isComplete(): boolean {
    const state = this.getState();
    return state.currentPhase === 'complete' && state.formationProgress >= 0.94;
  }
}
