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

    const steps: TimingStep[] = [];

    // 60 second countdown (count DOWN from 60 to 1)
    for (let i = countdownDuration; i >= 1; i--) {
      steps.push({
        id: `countdown_${i}`,
        delay: i === countdownDuration ? 0 : 1000, // First step immediate, then 1s between
        state: states.COUNTDOWN,
        countdown: i,
        audioEnabled: false, // No audio in duel mode
      });
    }

    // Light sequence (5 cycles)
    for (let cycle = 0; cycle < numberOfCycles; cycle++) {
      // Red light phase (7 seconds)
      for (let i = redLightDuration; i >= 1; i--) {
        steps.push({
          id: `red_light_${cycle + 1}_${i}`,
          delay: 1000,
          state: states.RED_LIGHT,
          countdown: i,
          audioEnabled: false,
        });
      }

      // Green light phase (3 seconds)
      for (let i = greenLightDuration; i >= 1; i--) {
        steps.push({
          id: `green_light_${cycle + 1}_${i}`,
          delay: 1000,
          state: states.GREEN_LIGHT,
          countdown: i,
          audioEnabled: false,
        });
      }
    }

    // Finished - permanent red light
    steps.push({
      id: 'finished',
      delay: 1000,
      state: states.FINISHED,
      countdown: 0,
      audioEnabled: false,
    });

    return steps;
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
