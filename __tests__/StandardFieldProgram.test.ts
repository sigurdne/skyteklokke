import { StandardFieldProgram } from '../src/programs/field/StandardFieldProgram';

describe('StandardFieldProgram', () => {
  let program: StandardFieldProgram;

  beforeEach(() => {
    program = new StandardFieldProgram();
  });

  it('initializes with correct default settings', () => {
    expect(program.id).toBe('standard-field');
    const settings = program.getSettings();
    expect(settings.shootingDuration).toBe(10);
    expect(settings.prepareTime).toBe(10);
    expect(settings.soundMode).toBe(false);
    expect(settings.startMode).toBe('pistol');
  });

  it('generates correct timing sequence for default settings (visual mode)', () => {
    // Default: soundMode = false
    const sequence = program.getTimingSequence();
    
    // Should NOT have "shooters_ready" step in visual mode
    const hasShootersReady = sequence.some(step => step.id === 'shooters_ready');
    expect(hasShootersReady).toBe(false);

    // Should have prepare steps
    const prepareSteps = sequence.filter(step => step.state === 'prepare');
    expect(prepareSteps.length).toBeGreaterThan(0);

    // Should have fire start step
    const fireStart = sequence.find(step => step.id === 'fire_start');
    expect(fireStart).toBeDefined();
    expect(fireStart?.state).toBe('fire');
    expect(fireStart?.countdown).toBe(10); // Default shooting duration
  });

  it('generates correct timing sequence for sound mode', () => {
    program.updateSettings({ soundMode: true });
    const sequence = program.getTimingSequence();

    // Should HAVE "shooters_ready" step in sound mode
    const shootersReady = sequence.find(step => step.id === 'shooters_ready');
    expect(shootersReady).toBeDefined();
    expect(shootersReady?.command).toBe('shooters_ready');
    expect(shootersReady?.audioEnabled).toBe(true);
  });

  it('starts rifle sequence with commands at 0, 10, and 15 seconds', () => {
    program.updateSettings({ startMode: 'rifle', soundMode: true });
    const sequence = program.getTimingSequence();

    expect(sequence[0]).toMatchObject({
      id: 'rifle_ready_in_10',
      delay: 1000,
      audioEnabled: true,
      countdown: 10,
    });
    expect(sequence[0]).not.toHaveProperty('command');

    expect(sequence.filter(step => step.id.startsWith('rifle_prepare_')).map(step => step.countdown))
      .toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);

    const readyIndex = sequence.findIndex(step => step.id === 'prepare_warning_5');
    expect(sequence[readyIndex]).toMatchObject({
      countdown: 5,
      command: 'ready_command',
    });

    const fireIndex = sequence.findIndex(step => step.id === 'fire_start');
    const fireAtMs = sequence.slice(0, fireIndex).reduce((total, step) => total + step.delay, 0);
    expect(fireAtMs).toBe(15000);
    expect(sequence[fireIndex]?.command).toBe('fire_command');
  });

  it('validates settings correctly', () => {
    const defaultSettings = program.getSettings();
    
    const validSettings = {
      ...defaultSettings,
      shootingDuration: 20,
      prepareTime: 15
    };
    expect(program.validateSettings(validSettings)).toBe(true);

    const invalidSettings = {
      ...defaultSettings,
      shootingDuration: -5, // Invalid
    };
    expect(program.validateSettings(invalidSettings)).toBe(false);
  });

  it('calculates total duration correctly', () => {
    // Default: 10s prepare + 10s shooting + finish delay
    const duration = program.getTotalDuration();
    expect(duration).toBeGreaterThanOrEqual(20000); // Duration is in ms
  });
});
