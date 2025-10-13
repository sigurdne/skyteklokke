import { BaseProgram } from '../base/BaseProgram';
import { ProgramSettings, TimingStep, UIConfig } from '../../types';

/**
 * Standard Field Shooting Program
 * Implements the standard field shooting timer sequence with audio commands
 */
export class StandardFieldProgram extends BaseProgram {
  constructor() {
    super({
      id: 'standard-field',
      name: 'Standard Feltskyting',
      category: 'field',
      type: 'visual-audio',
      supportedLanguages: ['no', 'en', 'sv', 'da'],
      defaultSettings: {
        shootingDuration: 25,    // seconds to shoot (default 25)
        warningTime: 2,          // seconds before end warning (yellow)
        prepareTime: 10,         // countdown from 10 to 0
        prepareWarning: 5,       // yellow warning at 5 seconds remaining
        audioEnabled: true,
        competitionMode: false,  // no audio in competition mode
      },
    });
  }

  getStates(): { [key: string]: string } {
    return {
      IDLE: 'idle',
      PREPARE: 'prepare',           // White, counting down 10→0
      PREPARE_WARNING: 'prepare_warning',  // Yellow, 5 seconds left
      FIRE: 'fire',                 // Green, counting up 0→shootingDuration
      FIRE_WARNING: 'fire_warning', // Yellow, 2 seconds left
      FINISHED: 'finished',         // Red, time is up
    };
  }

  getCommands(): string[] {
    return ['start', 'go'];
  }

  getTimingSequence(): TimingStep[] {
    const states = this.getStates();
    const { prepareTime, prepareWarning, shootingDuration, warningTime, competitionMode } = this.settings;
    const audioEnabled = !competitionMode;

    const steps: TimingStep[] = [];

    // Phase 1: Countdown from 10 to 6 (WHITE background)
    for (let i = prepareTime; i > prepareWarning; i--) {
      steps.push({
        id: `prepare_${i}`,
        delay: i === prepareTime ? 0 : 1000,
        state: states.PREPARE,
        countdown: i,
        audioEnabled: false,
      });
    }

    // Phase 2: Countdown from 5 to 1 (YELLOW background)
    for (let i = prepareWarning; i >= 1; i--) {
      steps.push({
        id: `prepare_warning_${i}`,
        delay: 1000,
        state: states.PREPARE_WARNING,
        countdown: i,
        audioEnabled: false,
      });
    }

    // Phase 3: Countdown reaches 0, go to GREEN and start counting up
    steps.push({
      id: 'fire_start',
      delay: 1000,
      state: states.FIRE,
      countdown: 0,
      command: 'go',
      audioEnabled,
    });

    // Phase 4: Count up from 1 to (shootingDuration - warningTime) in GREEN
    const greenTime = shootingDuration - warningTime;
    for (let i = 1; i <= greenTime; i++) {
      steps.push({
        id: `fire_${i}`,
        delay: 1000,
        state: states.FIRE,
        countdown: i,
        audioEnabled: false,
      });
    }

    // Phase 5: Last 2 seconds in YELLOW (warning)
    for (let i = greenTime + 1; i < shootingDuration; i++) {
      steps.push({
        id: `fire_warning_${i}`,
        delay: 1000,
        state: states.FIRE_WARNING,
        countdown: i,
        audioEnabled: false,
      });
    }

    // Phase 6: Time's up - RED background
    steps.push({
      id: 'finished',
      delay: 1000,
      state: states.FINISHED,
      countdown: shootingDuration,
      audioEnabled: false,
    });

    return steps;
  }

  validateSettings(settings: ProgramSettings): boolean {
    const { shootingDuration, warningTime, prepareTime, prepareWarning, competitionMode } = settings;

    // Validate that all required settings exist and are positive numbers
    if (
      typeof shootingDuration !== 'number' ||
      typeof warningTime !== 'number' ||
      typeof prepareTime !== 'number' ||
      typeof prepareWarning !== 'number'
    ) {
      return false;
    }

    // Validate competitionMode is boolean if provided
    if (competitionMode !== undefined && typeof competitionMode !== 'boolean') {
      return false;
    }

    // Validate ranges
    if (shootingDuration < 1 || shootingDuration > 300) return false;
    if (warningTime < 0 || warningTime > shootingDuration) return false;
    if (prepareTime < 5 || prepareTime > 60) return false;
    if (prepareWarning < 1 || prepareWarning >= prepareTime) return false;

    return true;
  }

  getUIConfig(): UIConfig {
    return {
      backgroundColor: '#FFFFFF',
      textColor: '#2C3E50',
      showTimer: true,
      showCommand: true,
      fullscreen: false,
    };
  }
}
