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
        // Allowed countdown durations for duel: 20, 30 or 60 seconds. Default 60.
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

    // Countdown (count DOWN from chosen duration to 1)
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
      // Red light phase (count up from 1 to redLightDuration)
      for (let i = 1; i <= redLightDuration; i++) {
        steps.push({
          id: `red_light_${cycle + 1}_${i}`,
          delay: 1000,
          state: states.RED_LIGHT,
          countdown: i,
          audioEnabled: false,
        });
      }

      // Green light phase (count up from 1 to greenLightDuration)
      for (let i = 1; i <= greenLightDuration; i++) {
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

  // Validate allowed countdown durations for duel mode
  const allowedDurations = [20, 30, 60];
  if (!allowedDurations.includes(countdownDuration)) return false;
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
