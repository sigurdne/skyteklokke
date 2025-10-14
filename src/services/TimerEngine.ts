import { TimingStep, TimerEvent, TimerEventListener } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

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
  private listenerErrorCount: number;
  // Diagnostic buffer to record last events and steps for post-mortem
  private diagnostics: { timestamp: number; event?: TimerEvent; stepId?: string; note?: string }[];
  private maxDiagnostics: number;

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
    this.listenerErrorCount = 0;
    this.diagnostics = [];
    this.maxDiagnostics = 200; // keep last 200 items
  }

  addEventListener(listener: TimerEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: TimerEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: TimerEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
        // capture diagnostic event
        this.pushDiagnostic({ timestamp: Date.now(), event, stepId: (event as any).stepId });
      } catch (err) {
        // Prevent listener errors from crashing the timer engine
        // Log so we can investigate without breaking the sequence
        // Log the error and the event for easier debugging
  // Don't let listener errors crash the engine; persist and surface via logger
  logger.error('TimerEngine listener error:', err, 'event=', event);
        this.listenerErrorCount++;
        // If many listener errors happen in a row, stop the engine to avoid cascading crashes
        if (this.listenerErrorCount > 5) {
          logger.error('TimerEngine: too many listener errors, stopping engine');
          try {
            this.stop();
          } catch (stopErr) {
            logger.error('Error stopping TimerEngine after listener failures:', stopErr);
          }
          // Persist diagnostics for post-mortem
          try {
            AsyncStorage.setItem('timerEngineDiagnostics', JSON.stringify(this.diagnostics));
          } catch (e) {
            // ignore
          }
        }
      }
    });
  }

  // Validate a timing step shape before executing/emitting
  private isValidStep(step: TimingStep | undefined): boolean {
    if (!step) return false;
    if (!step.id || typeof step.id !== 'string') return false;
    if (!step.state || typeof step.state !== 'string') return false;
    if (typeof step.delay !== 'number' || Number.isNaN(step.delay) || step.delay < 0) return false;
    // countdown may be undefined, but if present should be number
    if (step.countdown !== undefined && typeof step.countdown !== 'number') return false;
    return true;
  }

  // Push diagnostic entry keeping buffer bounded
  private pushDiagnostic(entry: { timestamp: number; event?: TimerEvent; stepId?: string; note?: string }) {
    this.diagnostics.push(entry);
    if (this.diagnostics.length > this.maxDiagnostics) {
      this.diagnostics.splice(0, this.diagnostics.length - this.maxDiagnostics);
    }
    // Persist periodically to survive crashes
    try {
      if (this.diagnostics.length % 20 === 0) {
        AsyncStorage.setItem('timerEngineDiagnostics', JSON.stringify(this.diagnostics));
      }
    } catch (e) {
      // ignore
    }
  }

  // Expose diagnostics for consumers
  async getDiagnostics(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem('timerEngineDiagnostics');
      if (stored) return stored;
    } catch (e) {
      // ignore
    }
    return JSON.stringify(this.diagnostics || []);
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
      logger.log('TimerEngine: start - sequence length=', this.sequence.length);
    this.pushDiagnostic({ timestamp: Date.now(), note: 'start', event: undefined });
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
      logger.log('TimerEngine: pause at index=', this.currentStepIndex);
    this.pushDiagnostic({ timestamp: Date.now(), note: 'pause', event: undefined });
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

      logger.log('TimerEngine: resume at index=', this.currentStepIndex);
    this.pushDiagnostic({ timestamp: Date.now(), note: 'resume', event: undefined });

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
      logger.log('TimerEngine: stop at index=', this.currentStepIndex);
    this.pushDiagnostic({ timestamp: Date.now(), note: 'stop', event: undefined });
  }

  private executeStep(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    if (this.currentStepIndex >= this.sequence.length) {
      this.emit({ type: 'complete', timestamp: Date.now() });
      return;
    }

    const step = this.sequence[this.currentStepIndex];
    if (!this.isValidStep(step)) {
      logger.warn('TimerEngine: invalid or malformed step, skipping', this.currentStepIndex, step);
      this.pushDiagnostic({ timestamp: Date.now(), note: 'invalid_or_malformed_step', stepId: (step && step.id) || undefined });
      this.currentStepIndex++;
      this.timeoutId = setTimeout(() => this.executeStep(), 0);
      return;
    }

    try {
      logger.log('TimerEngine: executing step index=', this.currentStepIndex, 'id=', step.id, 'state=', step.state, 'countdown=', step.countdown, 'delay=', step.delay);
      this.pushDiagnostic({ timestamp: Date.now(), stepId: step.id });

      const emitStateAndCountdown = () => {
        this.emit({ type: 'state_change', state: step.state, command: step.command, stepId: step.id, timestamp: Date.now() });
        if (step.countdown !== undefined) {
          this.emit({ type: 'countdown', countdown: step.countdown, state: step.state, stepId: step.id, timestamp: Date.now() });
        }
      };

      if (step.command && step.audioEnabled) {
        try {
          this.emit({ type: 'command', command: step.command, state: step.state, stepId: step.id, timestamp: Date.now() });
        } catch (e) {
          logger.error('TimerEngine: emit(command) error', e, 'step=', step);
          this.pushDiagnostic({ timestamp: Date.now(), note: 'emit_command_error', stepId: step.id });
        }

        setTimeout(() => {
          try {
            emitStateAndCountdown();
          } catch (innerErr) {
            logger.error('TimerEngine: error in delayed emit', innerErr, 'step=', step);
            this.pushDiagnostic({ timestamp: Date.now(), note: 'delayed_emit_error', stepId: step.id });
            try { AsyncStorage.setItem('timerEngineDiagnostics', JSON.stringify(this.diagnostics)); } catch (e) { /* ignore */ }
          }
        }, 350);
      } else {
        try {
          emitStateAndCountdown();
        } catch (e) {
          logger.error('TimerEngine: error in immediate emit', e, 'step=', step);
          this.pushDiagnostic({ timestamp: Date.now(), note: 'immediate_emit_error', stepId: step.id });
        }
      }

      // Advance
      this.currentStepIndex++;
      try { this.pushDiagnostic({ timestamp: Date.now(), note: 'advanced', stepId: step.id }); } catch (e) { /* ignore */ }

      const nextDelay = typeof step.delay === 'number' && step.delay > 0 ? step.delay : 1000;
      this.timeoutId = setTimeout(() => {
        try { this.executeStep(); } catch (err) { logger.error('TimerEngine executeStep error:', err); this.pushDiagnostic({ timestamp: Date.now(), note: 'execute_error' }); }
      }, nextDelay);
    } catch (err) {
      logger.error('TimerEngine executeStep fatal error:', err);
      this.pushDiagnostic({ timestamp: Date.now(), note: 'fatal_execute_error' });
      this.currentStepIndex++;
      this.timeoutId = setTimeout(() => this.executeStep(), 1000);
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
