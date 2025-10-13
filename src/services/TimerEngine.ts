import { TimingStep, TimerEvent, TimerEventListener } from '../types';

/**
 * Timer Engine - Manages timer execution with precise timing
 */
export class TimerEngine {
  private sequence: TimingStep[];
  private currentStepIndex: number;
  private isRunning: boolean;
  private isPaused: boolean;
  private startTime: number;
  private pauseTime: number;
  private timeoutId: NodeJS.Timeout | null;
  private intervalId: NodeJS.Timeout | null;
  private listeners: TimerEventListener[];
  private elapsedTime: number;

  constructor(sequence: TimingStep[]) {
    this.sequence = sequence;
    this.currentStepIndex = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.timeoutId = null;
    this.intervalId = null;
    this.listeners = [];
    this.elapsedTime = 0;
  }

  addEventListener(listener: TimerEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: TimerEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: TimerEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.currentStepIndex = 0;
    this.elapsedTime = 0;
    this.executeStep();
  }

  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.pauseTime = Date.now();
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emit({
      type: 'pause',
      timestamp: Date.now(),
    });
  }

  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    const pausedDuration = Date.now() - this.pauseTime;
    this.startTime += pausedDuration;

    this.emit({
      type: 'resume',
      timestamp: Date.now(),
    });

    this.executeStep();
  }

  reset(): void {
    this.stop();
    this.currentStepIndex = 0;
    this.elapsedTime = 0;

    this.emit({
      type: 'reset',
      timestamp: Date.now(),
    });
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private executeStep(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    if (this.currentStepIndex >= this.sequence.length) {
      this.emit({
        type: 'complete',
        timestamp: Date.now(),
      });
      this.stop();
      return;
    }

    const step = this.sequence[this.currentStepIndex];

    // Emit state change event
    this.emit({
      type: 'state_change',
      state: step.state,
      command: step.command,
      timestamp: Date.now(),
    });

    // Emit command event if present
    if (step.command && step.audioEnabled) {
      this.emit({
        type: 'command',
        command: step.command,
        state: step.state,
        timestamp: Date.now(),
      });
    }

    // Move to next step
    this.currentStepIndex++;

    // Schedule next step
    if (step.delay > 0) {
      this.timeoutId = setTimeout(() => {
        this.executeStep();
      }, step.delay);
    } else {
      // Execute immediately if no delay
      this.executeStep();
    }
  }

  getCurrentState(): string | null {
    if (this.currentStepIndex > 0 && this.currentStepIndex <= this.sequence.length) {
      return this.sequence[this.currentStepIndex - 1].state;
    }
    return null;
  }

  getElapsedTime(): number {
    if (!this.isRunning) {
      return this.elapsedTime;
    }
    if (this.isPaused) {
      return this.pauseTime - this.startTime;
    }
    return Date.now() - this.startTime;
  }

  getRemainingTime(): number {
    const totalDuration = this.sequence.reduce((sum, step) => sum + step.delay, 0);
    return Math.max(0, totalDuration - this.getElapsedTime());
  }

  isTimerRunning(): boolean {
    return this.isRunning && !this.isPaused;
  }

  isTimerPaused(): boolean {
    return this.isPaused;
  }
}
