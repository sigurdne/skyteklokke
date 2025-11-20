import AsyncStorage from '@react-native-async-storage/async-storage';
import UserRecordingService, { RecordingMetadata } from '../src/services/UserRecordingService';

// Mock expo-file-system
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
      document: { uri: 'file:///mock/document' },
      cache: { uri: 'file:///mock/cache' },
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
    getAllKeys: jest.fn(async () => Object.keys(store)),
    clear: jest.fn(async () => {
      Object.keys(store).forEach(k => delete store[k]);
    }),
  } as any;
});

jest.mock('../src/services/AudioService', () => ({
  getLanguage: jest.fn(() => 'no'),
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({
        recording: {
          stopAndUnloadAsync: jest.fn(),
          getURI: jest.fn(() => 'file:///recorded.m4a'),
          getStatusAsync: jest.fn(() => Promise.resolve({ durationMillis: 1000 })),
        }
      })),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
}));

describe('UserRecordingService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('Metadata', () => {
    it('saves and retrieves metadata', async () => {
      const meta: RecordingMetadata = {
        id: 'test-id',
        category: 'test-cat',
        language: 'no',
        uri: 'file:///test.m4a',
        createdAt: 1234567890,
      };

      await UserRecordingService.saveMetadata(meta);
      
      const retrieved = await UserRecordingService.getMetadata('test-cat', 'test-id', 'no');
      expect(retrieved).toEqual(meta);
    });

    it('deletes metadata', async () => {
      const meta: RecordingMetadata = {
        id: 'test-id',
        category: 'test-cat',
        language: 'no',
        uri: 'file:///test.m4a',
        createdAt: 1234567890,
      };

      await UserRecordingService.saveMetadata(meta);
      await UserRecordingService.deleteMetadata('test-cat', 'test-id', 'no');
      
      const retrieved = await UserRecordingService.getMetadata('test-cat', 'test-id', 'no');
      expect(retrieved).toBeNull();
    });
  });

  describe('deleteRecording', () => {
    it('deletes file and metadata', async () => {
      const meta: RecordingMetadata = {
        id: 'test-id',
        category: 'test-cat',
        language: 'no',
        uri: 'file:///test.m4a',
        createdAt: 1234567890,
      };

      await UserRecordingService.saveMetadata(meta);
      await UserRecordingService.deleteRecording('test-cat', 'test-id', 'no');

      const MockFile = require('expo-file-system').File;
      const mockFileInstance = new MockFile();
      expect(mockFileInstance.delete).toHaveBeenCalled();
      
      const retrieved = await UserRecordingService.getMetadata('test-cat', 'test-id', 'no');
      expect(retrieved).toBeNull();
    });
  });

  describe('startRecording', () => {
    it('requests permissions and starts recording', async () => {
      const { Audio } = require('expo-av');
      
      await UserRecordingService.startRecording();
      
      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      expect(Audio.Recording.createAsync).toHaveBeenCalled();
    });

    it('throws error if permission denied', async () => {
      const { Audio } = require('expo-av');
      Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
      
      await expect(UserRecordingService.startRecording()).rejects.toThrow('Missing audio recording permissions');
    });
  });
});
