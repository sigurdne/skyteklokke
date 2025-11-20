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
