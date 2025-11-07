import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { colors } from '../../../theme';
import { timerStyles } from '../timerStyles';
import { TimerDisplayContext, TimerEventHelpers, TimerProgramAdapter, TimerProgramBindings, TimerProgramSettingsBindings } from '../BaseTimerScreen';
import { TimerEvent } from '../../../types';
import { loadNumber, saveNumber } from '../../../utils/asyncStorageHelpers';

const DUEL_COUNTDOWN_KEY = 'duelCountdownDuration';
const DUEL_SERIES_KEY = 'duelSeries';

export const standardDuelTimerAdapter: TimerProgramAdapter = {
  id: 'standard-duel',
  useBindings: () => {
    const [duelCountdownDuration, setDuelCountdownDuration] = useState<number>(60);
    const [duelSeries, setDuelSeries] = useState<number>(6);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [currentSeriesIndex, setCurrentSeriesIndex] = useState<number | null>(null);

    useEffect(() => {
      const loadSettings = async () => {
        const countdown = await loadNumber(DUEL_COUNTDOWN_KEY);
        if (countdown !== undefined) {
          setDuelCountdownDuration(countdown);
        }
        
        const series = await loadNumber(DUEL_SERIES_KEY);
        if (series !== undefined) {
          setDuelSeries(series);
        }
      };

      loadSettings();
    }, []);

    const updateCountdown = useCallback(async (duration: number) => {
      setDuelCountdownDuration(duration);
      await saveNumber(DUEL_COUNTDOWN_KEY, duration);
    }, []);

    const updateSeries = useCallback(async (series: number) => {
      setDuelSeries(series);
      await saveNumber(DUEL_SERIES_KEY, series);
    }, []);

    const settingsBindings: TimerProgramSettingsBindings = {
      showButton: true,
      buttonLabel: '⚙️ Innstillinger',
      open: () => {
        setShowSettings(true);
      },
      close: () => {
        setShowSettings(false);
      },
      isVisible: showSettings,
      renderContent: () => (
        <>
          <Text style={timerStyles.modalSubtitle}>Antall serier (duell)</Text>
          <View style={timerStyles.pickerContainer}>
            <Picker
              selectedValue={duelSeries}
              onValueChange={(value) => updateSeries(value)}
              style={timerStyles.picker}
              itemStyle={timerStyles.pickerItem}
            >
              {[1, 6, 12].map((value) => (
                <Picker.Item key={value} label={`${value}`} value={value} />
              ))}
            </Picker>
          </View>

          <Text style={timerStyles.modalSubtitle}>Nedtelling mellom serier (sek)</Text>
          <View style={timerStyles.pickerContainer}>
            <Picker
              selectedValue={duelCountdownDuration}
              onValueChange={(value) => updateCountdown(value)}
              style={timerStyles.picker}
              itemStyle={timerStyles.pickerItem}
            >
              {[20, 30, 60].map((value) => (
                <Picker.Item key={value} label={`${value} sek`} value={value} />
              ))}
            </Picker>
          </View>
        </>
      ),
    };

    const beforeTimerStart: TimerProgramBindings['beforeTimerStart'] = async (program) => {
      program.updateSettings({
        countdownDuration: duelCountdownDuration,
        numberOfCycles: duelSeries,
      });
      setCurrentSeriesIndex(null);
    };

    const handleTimerEvent = async (event: TimerEvent, _helpers: TimerEventHelpers) => {
      if (event.stepId) {
        const match = event.stepId.match(/^series_(\d+)_/);
        if (match) {
          setCurrentSeriesIndex(parseInt(match[1], 10));
        } else {
          setCurrentSeriesIndex(null);
        }
      }
      return false;
    };

  const showFullscreenDisplay = (context: TimerDisplayContext) => context.isRunning;

  const getDisplayColor = (context: TimerDisplayContext) => {
      if (context.currentState === 'countdown') return '#000000';
      if (context.currentState === 'red_light') return colors.redLight;
      if (context.currentState === 'green_light') return colors.greenLight;
      if (context.currentState === 'finished') return colors.redLight;
      return context.backgroundColor;
    };

  const renderFullscreenOverlay = (_context: TimerDisplayContext) => {
      if (currentSeriesIndex === null) {
        return null;
      }
      return (
        <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={[timerStyles.fullscreenCommand, { color: '#FFFFFF', fontSize: 28 }]}>{`Serie ${currentSeriesIndex}/${duelSeries}`}</Text>
        </View>
      );
    };

    const bindings: TimerProgramBindings = {
      settings: settingsBindings,
      beforeTimerStart,
      handleTimerEvent,
      showFullscreenDisplay,
      getDisplayColor,
      renderFullscreenOverlay,
    };

    return bindings;
  },
};

export default standardDuelTimerAdapter;
