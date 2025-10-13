export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  timer: {
    fontSize: 72,
    fontWeight: '700' as const,
    lineHeight: 80,
    fontFamily: 'monospace',
  },
  command: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  button: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export type TypographyVariant = keyof typeof typography;
