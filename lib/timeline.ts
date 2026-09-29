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
    const totalDuration = 28;
    const totalProgress = clamp(time / totalDuration, 0, 1);

    const phaseInfo = [
      { start: 0, end: 6, phase: 'intro_1', text: null },
      { start: 6, end: 12, phase: 'intro_2', text: null },
      { start: 12, end: 18, phase: 'intro_3', text: null },
      { start: 18, end: 24, phase: 'organization', text: null },
      { start: 24, end: 28, phase: 'formation', text: null },
    ] as const;

    let currentPhase: TimelinePhase = 'complete';
    let currentText: string | null = null;
    let showText = false;
    let formationProgress = 0;
    let phaseProgress = 0;

    if (time >= totalDuration) {
      formationProgress = 1;
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

      if (time < 6) {
        formationProgress = clamp(time / 6, 0, 0.12);
      } else if (time < 12) {
        formationProgress = clamp(0.12 + ((time - 6) / 6) * 0.18, 0.12, 0.3);
      } else if (time < 18) {
        formationProgress = clamp(0.3 + ((time - 12) / 6) * 0.2, 0.3, 0.5);
      } else if (time < 24) {
        formationProgress = clamp(0.5 + ((time - 18) / 6) * 0.22, 0.5, 0.72);
      } else {
        formationProgress = clamp(0.72 + ((time - 24) / 4) * 0.28, 0.72, 1);
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
    return this.getState().currentPhase === 'complete';
  }
}
