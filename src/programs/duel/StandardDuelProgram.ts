import { BaseProgram } from '../base/BaseProgram';
import { ProgramSettings, TimingStep, UIConfig } from '../../types';

/**
 * Standard Duel Shooting Program
 * Implements duel shooting simulator with countdown and light sequences
 */
export class StandardDuelProgram extends BaseProgram {
  constructor() {
    super({
      id: 'standard-duel',
      name: 'Standard Duellskyting',
      category: 'duel',
      type: 'light',
      supportedLanguages: ['no', 'en', 'sv', 'da'],
      defaultSettings: {
        countdownDuration: 60,   // seconds
        redLightDuration: 7,     // seconds
        greenLightDuration: 3,   // seconds
        numberOfCycles: 5,       // number of light cycles
        audioEnabled: true,
      },
    });
  }

  getStates(): { [key: string]: string } {
    return {
      IDLE: 'idle',
      COUNTDOWN: 'countdown',
      RED_LIGHT: 'red_light',
      GREEN_LIGHT: 'green_light',
      FINISHED: 'finished',
    };
  }

  getCommands(): string[] {
    return ['start'];
  }

  getTimingSequence(): TimingStep[] {
    const states = this.getStates();
    const { 
      countdownDuration, 
      redLightDuration, 
      greenLightDuration, 
      numberOfCycles 
    } = this.settings;

    const sequence: TimingStep[] = [
      {
        id: 'start',
        delay: 0,
        state: states.COUNTDOWN,
        command: 'start',
        audioEnabled: true,
      },
      {
        id: 'countdown',
        delay: countdownDuration * 1000, // 60 seconds
        state: states.COUNTDOWN,
      },
    ];

    // Add light cycles
    for (let i = 0; i < numberOfCycles; i++) {
      // Red light
      sequence.push({
        id: `red_light_${i + 1}`,
        delay: 0,
        state: states.RED_LIGHT,
      });
      sequence.push({
        id: `red_wait_${i + 1}`,
        delay: redLightDuration * 1000, // 7 seconds
        state: states.RED_LIGHT,
      });

      // Green light
      sequence.push({
        id: `green_light_${i + 1}`,
        delay: 0,
        state: states.GREEN_LIGHT,
      });
      sequence.push({
        id: `green_wait_${i + 1}`,
        delay: greenLightDuration * 1000, // 3 seconds
        state: states.GREEN_LIGHT,
      });
    }

    // Finished
    sequence.push({
      id: 'finished',
      delay: 0,
      state: states.FINISHED,
    });

    return sequence;
  }

  validateSettings(settings: ProgramSettings): boolean {
    const { 
      countdownDuration, 
      redLightDuration, 
      greenLightDuration, 
      numberOfCycles 
    } = settings;

    // Validate that all required settings exist and are positive numbers
    if (
      typeof countdownDuration !== 'number' ||
      typeof redLightDuration !== 'number' ||
      typeof greenLightDuration !== 'number' ||
      typeof numberOfCycles !== 'number'
    ) {
      return false;
    }

    // Validate ranges
    if (countdownDuration < 10 || countdownDuration > 300) return false;
    if (redLightDuration < 1 || redLightDuration > 60) return false;
    if (greenLightDuration < 1 || greenLightDuration > 60) return false;
    if (numberOfCycles < 1 || numberOfCycles > 20) return false;

    return true;
  }

  getUIConfig(): UIConfig {
    return {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      showTimer: true,
      showCommand: false,
      fullscreen: true,
    };
  }
}
