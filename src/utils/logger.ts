const DEBUG = true; // set to true for local debugging

export const log = (...args: any[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(...args);
};

export const info = (...args: any[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.info(...args);
};

export const warn = (...args: any[]) => {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.warn(...args);
};

export const error = (...args: any[]) => {
  // Always log errors - they may indicate real issues. Toggle if you want fully silent.
  // eslint-disable-next-line no-console
  console.error(...args);
};

export default { log, info, warn, error };
