import { BaseProgram } from '../base/BaseProgram';
import { ProgramSettings, TimingStep, UIConfig } from '../../types';
import { PPCDiscipline, SUPPORTED_DISCIPLINES } from './ppcTypes';
import {
  PPCDisciplineDefinition,
  PPCStage,
  PPC_DISCIPLINE_DEFINITIONS,
  getDisciplineDefinition as resolveDisciplineDefinition,
  getStageDefinition as resolveStageDefinition,
} from './stages';

const COMMAND_GAP_MS = 3500;
const COUNTDOWN_INTERVAL_MS = 1000;
const DEFAULT_DISCIPLINE: PPCDiscipline = 'wa1500-150';

const DEFAULT_STAGE_ID = getFirstStageIdForDiscipline(DEFAULT_DISCIPLINE);

export interface PPCProgramSettings extends ProgramSettings {
  discipline: PPCDiscipline;
  currentStageId: string | null;
  autoAdvance: boolean;
  soundMode: boolean;
  commandAudioKeys: {
    prepare: string | null;
    lineReady: string | null;
    lineIsReady: string | null;
  };
}

/**
 * PPC Program placeholder implementation.
 * Future commits will introduce full stage sequencing and UI integrations.
 */
export class PPCProgram extends BaseProgram {
  constructor() {
    super({
      id: 'ppc-standard',
      name: 'Precision Pistol Competition',
      category: 'ppc',
      type: 'visual-audio',
      supportedLanguages: ['no', 'en', 'sv', 'da'],
      defaultSettings: {
        discipline: DEFAULT_DISCIPLINE,
        currentStageId: DEFAULT_STAGE_ID,
        autoAdvance: false,
        soundMode: true,
        commandAudioKeys: {
          prepare: null,
          lineReady: null,
          lineIsReady: null,
        },
      } satisfies PPCProgramSettings,
    });
  }

  getStates(): { [key: string]: string } {
    return {
      IDLE: 'idle',
      BRIEFING: 'briefing',
      PRESTART: 'prestart',
      COUNTDOWN: 'countdown',
      SHOOTING: 'shooting',
      FINISHED: 'finished',
    };
  }

  getCommands(): string[] {
    return ['lade_hylstre', 'er_linja_klar', 'linja_er_klar'];
  }

  getTimingSequence(): TimingStep[] {
    const settings = this.getSettings() as PPCProgramSettings;
    const stage = this.resolveStage(settings);

    if (!stage) {
      return [];
    }

    return this.buildTimingSequence(stage);
  }

  validateSettings(settings: ProgramSettings): boolean {
    const candidate = settings as Partial<PPCProgramSettings>;

    if (!candidate.discipline || !SUPPORTED_DISCIPLINES.includes(candidate.discipline as PPCDiscipline)) {
      return false;
    }

    if (candidate.currentStageId !== undefined) {
      if (candidate.currentStageId !== null && typeof candidate.currentStageId !== 'string') {
        return false;
      }

      if (typeof candidate.currentStageId === 'string' && !resolveStageDefinition(candidate.currentStageId)) {
        return false;
      }
    }

    if (candidate.autoAdvance !== undefined && typeof candidate.autoAdvance !== 'boolean') {
      return false;
    }

    if (candidate.soundMode !== undefined && typeof candidate.soundMode !== 'boolean') {
      return false;
    }

    if (candidate.commandAudioKeys) {
      const { prepare, lineReady, lineIsReady } = candidate.commandAudioKeys;
      if (![prepare, lineReady, lineIsReady].every((value) => value === null || typeof value === 'string')) {
        return false;
      }
    }

    return true;
  }

  getUIConfig(): UIConfig {
    return {
      backgroundColor: '#0B1B3B',
      textColor: '#FFFFFF',
      showTimer: true,
      showCommand: true,
      fullscreen: true,
    };
  }

  listDisciplineDefinitions(): PPCDisciplineDefinition[] {
    return Object.values(PPC_DISCIPLINE_DEFINITIONS);
  }

  getDisciplineDefinition(discipline: PPCDiscipline): PPCDisciplineDefinition {
    return resolveDisciplineDefinition(discipline);
  }

  getStageDefinition(stageId: string): PPCStage | undefined {
    return resolveStageDefinition(stageId);
  }

  private resolveStage(settings: PPCProgramSettings): PPCStage | null {
    if (settings.currentStageId) {
      const stage = resolveStageDefinition(settings.currentStageId);
      if (stage) {
        return stage;
      }
    }

    const fallbackStageId = getFirstStageIdForDiscipline(settings.discipline);
    if (!fallbackStageId) {
      return null;
    }

    return resolveStageDefinition(fallbackStageId) ?? null;
  }

  private buildTimingSequence(stage: PPCStage): TimingStep[] {
    const steps: TimingStep[] = [];
    const prefix = stage.id;

    const pushStep = (
      id: string,
      state: string,
      options: Partial<Omit<TimingStep, 'id' | 'state' | 'delay'>> & { delay?: number } = {},
    ) => {
      steps.push({
        id,
        state,
        delay: options.delay ?? COUNTDOWN_INTERVAL_MS,
        command: options.command,
        audioEnabled: options.audioEnabled,
        countdown: options.countdown,
      });
    };

    // Briefing (title and overview) is handled by UI info tiles before timer starts
    // Manual commands (lade_hylstre, er_linja_klar, linja_er_klar) are handled by UI buttons
    // Timer sequence starts directly at countdown -3

    pushStep(`${prefix}_countdown_neg3`, 'prestart', {
      countdown: -3,
      delay: COUNTDOWN_INTERVAL_MS,
    });

    pushStep(`${prefix}_countdown_neg2`, 'prestart', {
      countdown: -2,
      delay: COUNTDOWN_INTERVAL_MS,
    });

    pushStep(`${prefix}_countdown_neg1`, 'prestart', {
      countdown: -1,
      delay: COUNTDOWN_INTERVAL_MS - 200, // Shorten to make room for early beep
    });

    pushStep(`${prefix}_beep_before_shooting`, 'prestart', {
      countdown: -1, // Keep showing -1 during beep
      command: 'beep',
      audioEnabled: true,
      delay: 200, // Beep plays 200ms before transition to shooting
    });

    pushStep(`${prefix}_shooting_start`, 'shooting', {
      countdown: stage.timeSeconds,
      delay: 0, // Immediate transition after beep
    });

    for (let remaining = stage.timeSeconds - 1; remaining >= 2; remaining--) {
      pushStep(`${prefix}_shooting_${remaining}`, 'shooting', {
        countdown: remaining,
      });
    }

    pushStep(`${prefix}_shooting_1`, 'shooting', {
      countdown: 1,
      delay: COUNTDOWN_INTERVAL_MS - 200, // Shorten to make room for early beep
    });

    pushStep(`${prefix}_beep_before_finished`, 'shooting', {
      countdown: 1, // Keep showing 1 during beep
      command: 'beep',
      audioEnabled: true,
      delay: 200, // Beep plays 200ms before transition to finished
    });

    pushStep(`${prefix}_finished`, 'finished', {
      countdown: 0,
      delay: COMMAND_GAP_MS,
    });

    return steps;
  }
}

export default PPCProgram;

function getFirstStageIdForDiscipline(discipline: PPCDiscipline): string | null {
  const definition = resolveDisciplineDefinition(discipline);
  for (const group of definition.groups) {
    const first = group.stages[0];
    if (first) {
      return first.stageId;
    }
  }
  return null;
}
