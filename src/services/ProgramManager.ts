import { BaseProgram } from '../programs/base/BaseProgram';
import { StandardFieldProgram } from '../programs/field/StandardFieldProgram';
import { StandardDuelProgram } from '../programs/duel/StandardDuelProgram';
import { ProgramCategory, ProgramSettings } from '../types';

/**
 * Program Manager - Singleton service for managing shooting programs
 */
export class ProgramManager {
  private static instance: ProgramManager;
  private programs: Map<string, BaseProgram>;
  private activeProgram: BaseProgram | null;

  private constructor() {
    this.programs = new Map();
    this.activeProgram = null;
    this.registerDefaultPrograms();
  }

  static getInstance(): ProgramManager {
    if (!ProgramManager.instance) {
      ProgramManager.instance = new ProgramManager();
    }
    return ProgramManager.instance;
  }

  private registerDefaultPrograms(): void {
    // Register all available programs
    this.registerProgram(new StandardFieldProgram());
    this.registerProgram(new StandardDuelProgram());
  }

  registerProgram(program: BaseProgram): void {
    if (!(program instanceof BaseProgram)) {
      throw new Error('Program must extend BaseProgram');
    }
    this.programs.set(program.id, program);
  }

  getProgram(programId: string): BaseProgram | undefined {
    return this.programs.get(programId);
  }

  getAvailablePrograms(category?: ProgramCategory): BaseProgram[] {
    const programs = Array.from(this.programs.values());
    return category 
      ? programs.filter(p => p.category === category)
      : programs;
  }

  setActiveProgram(programId: string, settings?: ProgramSettings): BaseProgram {
    const program = this.programs.get(programId);
    if (!program) {
      throw new Error(`Program ${programId} not found`);
    }

    if (settings) {
      if (!program.validateSettings(settings)) {
        throw new Error('Invalid settings for program');
      }
      program.updateSettings(settings);
    }

    this.activeProgram = program;
    return program;
  }

  getActiveProgram(): BaseProgram | null {
    return this.activeProgram;
  }

  clearActiveProgram(): void {
    this.activeProgram = null;
  }
}

// Export singleton instance
export default ProgramManager.getInstance();
