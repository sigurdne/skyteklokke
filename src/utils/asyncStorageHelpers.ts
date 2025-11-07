import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

/**
 * Helper functions for AsyncStorage operations in timer adapters
 * Reduces boilerplate code for loading and saving settings
 */

/**
 * Load a number value from AsyncStorage
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored number or default value
 */
export async function loadNumber(key: string, defaultValue?: number): Promise<number | undefined> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return parseInt(value, 10);
    }
    return defaultValue;
  } catch (error) {
    logger.error(`Failed to load number from key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Load a boolean value from AsyncStorage
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored boolean or default value
 */
export async function loadBoolean(key: string, defaultValue?: boolean): Promise<boolean | undefined> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value === 'true';
    }
    return defaultValue;
  } catch (error) {
    logger.error(`Failed to load boolean from key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Load a string value from AsyncStorage
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored string or default value
 */
export async function loadString(key: string, defaultValue?: string): Promise<string | undefined> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    logger.error(`Failed to load string from key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Save a number value to AsyncStorage
 * @param key - The storage key
 * @param value - The number value to save
 */
export async function saveNumber(key: string, value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value.toString());
  } catch (error) {
    logger.error(`Failed to save number to key "${key}":`, error);
  }
}

/**
 * Save a boolean value to AsyncStorage
 * @param key - The storage key
 * @param value - The boolean value to save
 */
export async function saveBoolean(key: string, value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value.toString());
  } catch (error) {
    logger.error(`Failed to save boolean to key "${key}":`, error);
  }
}

/**
 * Save a string value to AsyncStorage
 * @param key - The storage key
 * @param value - The string value to save
 */
export async function saveString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    logger.error(`Failed to save string to key "${key}":`, error);
  }
}

/**
 * Load multiple settings at once
 * @param settings - Array of setting definitions
 * @returns Object with loaded values
 */
export async function loadSettings<T extends Record<string, any>>(
  settings: Array<{
    key: string;
    type: 'number' | 'boolean' | 'string';
    defaultValue?: any;
    stateKey: keyof T;
  }>
): Promise<Partial<T>> {
  const result: Partial<T> = {};
  
  await Promise.all(
    settings.map(async ({ key, type, defaultValue, stateKey }) => {
      let value: any;
      switch (type) {
        case 'number':
          value = await loadNumber(key, defaultValue);
          break;
        case 'boolean':
          value = await loadBoolean(key, defaultValue);
          break;
        case 'string':
          value = await loadString(key, defaultValue);
          break;
      }
      if (value !== undefined) {
        result[stateKey] = value;
      }
    })
  );
  
  return result;
}
