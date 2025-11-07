import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Jest globals types are included via tsconfig ("types": ["jest"]) so no need for ts-expect-error

import { deleteClip } from '../src/services/AudioClipService';

jest.mock('expo-file-system', () => ({
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    setItem: jest.fn(async (k: string, v: string) => {
      store[k] = v;
    }),
    getItem: jest.fn(async (k: string) => store[k] ?? null),
    removeItem: jest.fn(async (k: string) => {
      delete store[k];
    }),
    clear: jest.fn(async () => {
      Object.keys(store).forEach(k => delete store[k]);
    }),
  } as any;
});

const STORAGE_PREFIX = '@audioClip:';

describe('AudioClipService.deleteClip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes file and removes prefixed metadata key', async () => {
    const key = 'test_stage_title';
    const uri = 'file:///some/path/audio-clips/test_stage_title.m4a';

    // Seed metadata as loadClipMeta will read it
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify({ key, uri, createdAt: Date.now() }));

    await deleteClip(key);

    // File should be deleted
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(uri);

    // Metadata should be removed with the prefixed key
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`${STORAGE_PREFIX}${key}`);
  });

  it('handles missing file metadata gracefully', async () => {
    const key = 'nonexistent_key';

    await expect(deleteClip(key)).resolves.toBeUndefined();

    // Should still attempt to remove metadata by prefixed key
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`${STORAGE_PREFIX}${key}`);
  });
});
