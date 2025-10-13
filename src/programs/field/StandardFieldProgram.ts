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
        prepareTime: 5,          // seconds
        audioEnabled: true,
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
    const { readyTime, prepareTime, shootingDuration, ceaseWarning } = this.settings;

    return [
      {
        id: 'ready_check',
        delay: 0,
        state: states.READY_CHECK,
        command: 'ready_check',
        audioEnabled: true,
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
        audioEnabled: true,
      },
      {
        id: 'prepare_wait',
        delay: prepareTime * 1000, // 5 seconds
        state: states.PREPARE,
      },
      {
        id: 'fire',
        delay: 0,
        state: states.FIRE,
        command: 'fire',
        audioEnabled: true,
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
        audioEnabled: true,
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
      },
    ];
  }

  validateSettings(settings: ProgramSettings): boolean {
    const { shootingDuration, ceaseWarning, readyTime, prepareTime } = settings;

    // Validate that all required settings exist and are positive numbers
    if (
      typeof shootingDuration !== 'number' ||
      typeof ceaseWarning !== 'number' ||
      typeof readyTime !== 'number' ||
      typeof prepareTime !== 'number'
    ) {
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
