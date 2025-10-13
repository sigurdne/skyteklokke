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
        shootingDuration: 10,    // seconds to shoot (default 10)
        warningTime: 2,          // seconds before end warning (yellow)
        prepareTime: 10,         // countdown from 10 to 0
        prepareWarning: 5,       // yellow warning at 5 seconds remaining
        audioEnabled: true,
        competitionMode: true,   // no audio in competition mode (default ON)
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

    console.log('🎯 Generating sequence with settings:', { prepareTime, prepareWarning, shootingDuration, warningTime });

    const steps: TimingStep[] = [];

        // Phase 1: Prepare countdown (white)
    for (let i = prepareTime; i > prepareWarning; i--) {
      steps.push({
        id: `prepare_${i}`,
        delay: i === prepareTime ? 0 : 1000, // First step shown immediately, then 1s between steps
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

    // Phase 3: Shooting starts - show duration and "Ild!" command
    // Start at shootingDuration, will count down each second
    steps.push({
      id: 'fire_start',
      delay: 1000,
      state: states.FIRE,
      countdown: shootingDuration,
      command: 'go',
      audioEnabled,
    });

    // Phase 4: Count DOWN in GREEN until warning time
    // If shootingDuration is 10 and warningTime is 2:
    //   countdown: 9, 8, 7, 6, 5, 4, 3 (stops before warningTime)
    // If shootingDuration is 4 and warningTime is 2:
    //   countdown: 3 (only one value)
    for (let i = shootingDuration - 1; i > warningTime; i--) {
      steps.push({
        id: `fire_${i}`,
        delay: 1000,
        state: states.FIRE,
        countdown: i,
        audioEnabled: false,
      });
    }

    // Phase 5: Warning phase in YELLOW - count down to 1
    // warningTime is typically 2, so: 2, 1
    for (let i = warningTime; i >= 1; i--) {
      steps.push({
        id: `fire_warning_${i}`,
        delay: 1000,
        state: states.FIRE_WARNING,
        countdown: i,
        audioEnabled: false,
      });
    }

    // Phase 6: Time's up at 0 - RED background
    steps.push({
      id: 'finished',
      delay: 1000,
      state: states.FINISHED,
      countdown: 0,
      audioEnabled: false,
    });

    console.log('🎯 Generated sequence:', steps.map(s => `${s.id}:${s.countdown}`).join(' → '));

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
