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
        shootingDuration: 10,    // seconds
        ceaseWarning: 2,         // seconds before cease fire
        readyTime: 10,           // seconds
        prepareTime: 10,         // seconds (changed to 10 for countdown)
        audioEnabled: true,
        competitionMode: false,  // no audio in competition mode
      },
    });
  }

  getStates(): { [key: string]: string } {
    return {
      IDLE: 'idle',
      READY_CHECK: 'ready_check',
      PREPARE: 'prepare',
      FIRE: 'fire',
      CEASE_FIRE: 'cease_fire',
      FINISHED: 'finished',
    };
  }

  getCommands(): string[] {
    return ['ready_check', 'prepare', 'fire', 'cease_fire'];
  }

  getTimingSequence(): TimingStep[] {
    const states = this.getStates();
    const { readyTime, prepareTime, shootingDuration, ceaseWarning, competitionMode } = this.settings;
    const audioEnabled = !competitionMode;

    const steps: TimingStep[] = [
      {
        id: 'ready_check',
        delay: 0,
        state: states.READY_CHECK,
        command: 'ready_check',
        audioEnabled,
      },
      {
        id: 'ready_wait',
        delay: readyTime * 1000, // 10 seconds
        state: states.READY_CHECK,
      },
      {
        id: 'prepare',
        delay: 0,
        state: states.PREPARE,
        command: 'prepare',
        audioEnabled,
      },
    ];

    // Add countdown from 10 to 1 before "fire"
    for (let i = 10; i >= 1; i--) {
      steps.push({
        id: `countdown_${i}`,
        delay: i === 10 ? 0 : 1000, // First countdown immediate, rest after 1 second
        state: states.PREPARE,
        countdown: i,
        audioEnabled: false, // Visual only, no audio countdown
      });
    }

    steps.push(
      {
        id: 'fire',
        delay: 1000, // 1 second after countdown reaches 1
        state: states.FIRE,
        command: 'fire',
        audioEnabled,
      },
      {
        id: 'shooting',
        delay: (shootingDuration - ceaseWarning) * 1000, // 8 seconds (10 - 2)
        state: states.FIRE,
      },
      {
        id: 'cease_fire',
        delay: 0,
        state: states.CEASE_FIRE,
        command: 'cease_fire',
        audioEnabled,
      },
      {
        id: 'cease_wait',
        delay: ceaseWarning * 1000, // 2 seconds
        state: states.CEASE_FIRE,
      },
      {
        id: 'finished',
        delay: 0,
        state: states.FINISHED,
      }
    );

    return steps;
  }

  validateSettings(settings: ProgramSettings): boolean {
    const { shootingDuration, ceaseWarning, readyTime, prepareTime, competitionMode } = settings;

    // Validate that all required settings exist and are positive numbers
    if (
      typeof shootingDuration !== 'number' ||
      typeof ceaseWarning !== 'number' ||
      typeof readyTime !== 'number' ||
      typeof prepareTime !== 'number'
    ) {
      return false;
    }

    // Validate competitionMode is boolean if provided
    if (competitionMode !== undefined && typeof competitionMode !== 'boolean') {
      return false;
    }

    // Validate ranges
    if (shootingDuration < 1 || shootingDuration > 300) return false;
    if (ceaseWarning < 0 || ceaseWarning > shootingDuration) return false;
    if (readyTime < 1 || readyTime > 60) return false;
    if (prepareTime < 1 || prepareTime > 60) return false;

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
