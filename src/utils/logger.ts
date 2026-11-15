let DEBUG = true; // mutable so it can be toggled at runtime

export function setDebug(enabled: boolean) {
  DEBUG = enabled;
}

export function isDebug(): boolean {
  return DEBUG;
}

export const log = (...args: unknown[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(...args);
};

export const info = (...args: unknown[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.info(...args);
};

export const warn = (...args: unknown[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.warn(...args);
};

export const error = (...args: unknown[]) => {
  // Always log errors - may indicate real issues
  // eslint-disable-next-line no-console
  console.error(...args);
};

export default { log, info, warn, error, setDebug, isDebug };
