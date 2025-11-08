import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';
import { colors, screenStyles, sectionStyles, listStyles } from '../theme';
import { Language } from '../types';
import { RootStackParamList } from '../navigation/types';
import logger from '../utils/logger';
import AudioService from '../services/AudioService';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const LANGUAGE_STORAGE_KEY = '@skyteklokke:language';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(i18n.language as Language);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage as Language);
      }
    } catch (error) {
      logger.error('Error loading language:', error);
    }
  };

  const handleLanguageChange = async (language: Language) => {
    try {
      setSelectedLanguage(language);
  await i18n.changeLanguage(language);
  AudioService.setLanguage(language);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      logger.error('Error changing language:', error);
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'no', label: t('settings.norwegian') },
    { code: 'en', label: t('settings.english') },
    { code: 'sv', label: t('settings.swedish') },
    { code: 'da', label: t('settings.danish') },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title={t('navigation.settings')}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <View style={styles.languageList}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.listItem,
                    selectedLanguage === language.code && styles.listItemSelected,
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text
                    style={[
                      styles.listItemText,
                      selectedLanguage === language.code && styles.listItemTextSelected,
                    ]}
                  >
                    {language.label}
                  </Text>
                  {selectedLanguage === language.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ...screenStyles,
  ...sectionStyles,
  ...listStyles,
  languageList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
