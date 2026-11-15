import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { colors, typography, spacing, screenStyles, sectionStyles, textStyles } from '../theme';
import { RootStackParamList } from '../navigation/types';

type AboutScreenProps = NativeStackScreenProps<RootStackParamList, 'About'>;

const APP_VERSION = '0.1.0';

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title={t('about.title')}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.appTitle}>{t('about.app_name')}</Text>
            <Text style={styles.version}>{t('about.version')} {APP_VERSION}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.description}>{t('about.app_description')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('about.features_title')}</Text>
            <View style={styles.featureList}>
              <Text style={styles.feature}>• {t('about.feature_field')}</Text>
              <Text style={styles.feature}>• {t('about.feature_duel')}</Text>
              <Text style={styles.feature}>• {t('about.feature_multilang')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('about.developer')}</Text>
            <Text style={styles.infoText}>Sigurd Nes</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('about.license')}</Text>
            <Text style={styles.infoText}>MIT License</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ...screenStyles,
  ...sectionStyles,
  ...textStyles,
  appTitle: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  version: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  feature: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
});
