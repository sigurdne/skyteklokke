import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { ProgramCard } from '../components/ProgramCard';
import { colors, spacing, typography, screenStyles, modalStyles } from '../theme';
import { RootStackParamList } from '../navigation/types';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleProgramSelect = (programId: string) => {
    navigation.navigate('Timer', { programId });
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  const handleNavigateSettings = () => {
    setMenuVisible(false);
    navigation.navigate('Settings');
  };

  const handleNavigateAbout = () => {
    setMenuVisible(false);
    navigation.navigate('About');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title={t('navigation.home_title')}
          subtitle={t('navigation.home_subtitle')}
          rightAction={{
            icon: '☰',
            onPress: handleMenuPress,
          }}
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
            icon="🎯"
            title={t('programs.ppc_title')}
            description={t('programs.ppc_description')}
            category="ppc"
            difficulty="intermediate"
            onPress={() => navigation.navigate('PPC')}
          />
        </ScrollView>

        {/* Hamburger Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={handleMenuClose}
        >
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={handleMenuClose}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleNavigateSettings}
              >
                <Text style={styles.menuIcon}>⚙️</Text>
                <Text style={styles.menuText}>{t('settings.title')}</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleNavigateAbout}
              >
                <Text style={styles.menuIcon}>ℹ️</Text>
                <Text style={styles.menuText}>{t('about.title')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ...screenStyles,
  ...modalStyles,
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  menuText: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.textSecondary,
    opacity: 0.2,
    marginHorizontal: spacing.md,
  },
});
