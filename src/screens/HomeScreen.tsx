import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { ProgramCard } from '../components/ProgramCard';
import { colors, spacing } from '../theme';
import ProgramManager from '../services/ProgramManager';

type RootStackParamList = {
  Home: undefined;
  Timer: { programId: string };
  Settings: undefined;
  About: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  const handleProgramSelect = (programId: string) => {
    navigation.navigate('Timer', { programId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title={t('navigation.home_title')}
          subtitle={t('navigation.home_subtitle')}
        />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ProgramCard
            icon="🏹"
            title={t('programs.field_title')}
            description={t('programs.field_description')}
            category="field"
            difficulty="beginner"
            onPress={() => handleProgramSelect('standard-field')}
          />
          <ProgramCard
            icon="⚔️"
            title={t('programs.duel_title')}
            description={t('programs.duel_description')}
            category="duel"
            difficulty="beginner"
            onPress={() => handleProgramSelect('standard-duel')}
          />
          <ProgramCard
            icon="⚙️"
            title={t('settings.title')}
            description={t('settings.description')}
            category="training"
            onPress={() => navigation.navigate('Settings')}
          />
          <ProgramCard
            icon="ℹ️"
            title={t('about.title')}
            description={t('about.description')}
            category="training"
            onPress={() => navigation.navigate('About')}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
});
