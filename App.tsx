import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { HomeScreen } from './src/screens/HomeScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './src/utils/logger';

export type RootStackParamList = {
  Home: undefined;
  Timer: { programId: string };
  Settings: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Global JS error handler to persist stack traces for crashes
    const handleError = async (error: any, isFatal?: boolean) => {
      try {
        const payload = {
          timestamp: Date.now(),
          message: (error && error.message) || String(error),
          stack: (error && error.stack) || null,
          isFatal: !!isFatal,
        };
        await AsyncStorage.setItem('timerEngineCrash', JSON.stringify(payload));
  logger.error('Persisted global error', payload);
      } catch (e) {
        // ignore
      }
    };

    // React Native global handler
    const oldHandler = (global as any).ErrorUtils && (global as any).ErrorUtils.getGlobalHandler && (global as any).ErrorUtils.getGlobalHandler();
    try {
      if ((global as any).ErrorUtils && (global as any).ErrorUtils.setGlobalHandler) {
        (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
          handleError(error, isFatal);
          if (oldHandler) oldHandler(error, isFatal);
        });
      }
    } catch (e) {
      // ignore
    }

    // Global handler for web/Expo web (guarded via globalThis)
    let oldOnError: any = null;
    try {
      if ((globalThis as any) && typeof (globalThis as any).onerror !== 'undefined') {
        oldOnError = (globalThis as any).onerror;
        (globalThis as any).onerror = function (message: any, source: any, lineno: any, colno: any, error: any) {
          handleError(error || message, true);
          if (typeof oldOnError === 'function') return oldOnError(message, source, lineno, colno, error);
          return false;
        };
      }
    } catch (e) {
      // ignore
    }

    // Also print any persisted diagnostics/crash info on startup so logs are available after a hard crash
    (async () => {
      try {
        const diag = await AsyncStorage.getItem('timerEngineDiagnostics');
        if (diag) {
          logger.log('Persisted timerEngineDiagnostics:', diag);
        }
      } catch (e) {
        // ignore
      }
      try {
        const crash = await AsyncStorage.getItem('timerEngineCrash');
        if (crash) {
          logger.log('Persisted timerEngineCrash:', crash);
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      // restore previous handlers if possible
      try {
        if ((global as any).ErrorUtils && (global as any).ErrorUtils.setGlobalHandler && oldHandler) {
          (global as any).ErrorUtils.setGlobalHandler(oldHandler);
        }
      } catch (e) {
        // ignore
      }
      try {
        if ((globalThis as any) && typeof (globalThis as any).onerror !== 'undefined') {
          (globalThis as any).onerror = oldOnError;
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Timer" component={TimerScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
