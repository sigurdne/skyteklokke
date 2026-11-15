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

jest.mock('expo-audio', () => ({
  AudioModule: {
    AudioRecorder: jest.fn(() => ({
      prepareToRecordAsync: jest.fn(),
      record: jest.fn(),
      stop: jest.fn(),
      release: jest.fn(),
      getStatus: jest.fn(() => ({ durationMillis: 1000 })),
      uri: 'file:///recorded.m4a',
    })),
  },
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, status: 'granted' })),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('../src/utils/logger', () => ({
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  setDebug: jest.fn(),
  isDebug: jest.fn(() => true),
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
      const { AudioModule, requestRecordingPermissionsAsync, setAudioModeAsync } = require('expo-audio');
      
      await UserRecordingService.startRecording();
      
      expect(requestRecordingPermissionsAsync).toHaveBeenCalled();
      expect(setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      expect(AudioModule.AudioRecorder).toHaveBeenCalled();
    });

    it('throws error if permission denied', async () => {
      const { requestRecordingPermissionsAsync } = require('expo-audio');
      requestRecordingPermissionsAsync.mockResolvedValueOnce({ granted: false, status: 'denied' });
      
      await expect(UserRecordingService.startRecording()).rejects.toThrow('Missing audio recording permissions');
    });

    it('stops and releases the recorder', async () => {
      const { AudioModule, setAudioModeAsync } = require('expo-audio');

      await UserRecordingService.startRecording();
      const recorder = AudioModule.AudioRecorder.mock.results[0].value;

      await expect(UserRecordingService.stopRecording()).resolves.toEqual({
        uri: 'file:///recorded.m4a',
        durationMs: 1000,
      });
      expect(recorder.stop).toHaveBeenCalled();
      expect(recorder.release).toHaveBeenCalled();
      expect(setAudioModeAsync).toHaveBeenLastCalledWith({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    });

    it('cancels recording and deletes its temporary file', async () => {
      const { AudioModule } = require('expo-audio');
      const MockFile = require('expo-file-system').File;

      await UserRecordingService.startRecording();
      const recorder = AudioModule.AudioRecorder.mock.results[0].value;

      await UserRecordingService.cancelRecording();

      expect(recorder.stop).toHaveBeenCalled();
      expect(recorder.release).toHaveBeenCalled();
      expect(new MockFile().delete).toHaveBeenCalled();
    });
  });
});
