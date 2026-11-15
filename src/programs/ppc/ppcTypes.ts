export const SUPPORTED_DISCIPLINES = ['wa1500-150', 'wa1500-60', 'wa1500-48'] as const;

export type PPCDiscipline = typeof SUPPORTED_DISCIPLINES[number];
