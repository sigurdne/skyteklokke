import { File, Directory, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Jest globals types are included via tsconfig ("types": ["jest"]) so no need for ts-expect-error

import { deleteClip } from '../src/services/AudioClipService';

// Mock expo-file-system with the new API structure
jest.mock('expo-file-system', () => {
  const mockFile = {
    exists: true,
    delete: jest.fn(),
    copy: jest.fn(),
  };
  
  const mockDirectory = {
    exists: true,
    create: jest.fn(),
  };

  return {
    File: jest.fn(() => mockFile),
    Directory: jest.fn(() => mockDirectory),
    Paths: {
      document: 'file:///mock/document',
      cache: 'file:///mock/cache',
    },
  };
});

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
    const language = 'no';
    // The service constructs the path using Paths.document + 'audio-clips' + language + key + .m4a
    // We don't need to assert the exact path here, just that File(path).delete() was called.
    
    // Seed metadata as loadClipMeta will read it
    // Note: The service now expects language-specific keys: @audioClip:no:test_stage_title
    const storageKey = `${STORAGE_PREFIX}${language}:${key}`;
    const uri = `file:///mock/document/audio-clips/${language}/${key}.m4a`;
    
    await AsyncStorage.setItem(storageKey, JSON.stringify({ key, uri, createdAt: Date.now() }));

    await deleteClip(key, language);

    // Verify File constructor was called (we can't easily check the exact path passed to constructor with this mock setup, 
    // but we can verify the delete method on the instance was called)
    const MockFile = require('expo-file-system').File;
    const mockFileInstance = new MockFile();
    expect(mockFileInstance.delete).toHaveBeenCalled();

    // Metadata should be removed with the prefixed key
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(storageKey);
  });

  it('handles missing file metadata gracefully', async () => {
    const key = 'nonexistent_key';
    const language = 'no';
    const storageKey = `${STORAGE_PREFIX}${language}:${key}`;

    await expect(deleteClip(key, language)).resolves.toBeUndefined();

    // Should still attempt to remove metadata by prefixed key
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(storageKey);
  });
});
