# UI Components Specification

## Navigation Components

### ProgramCard Component
```typescript
interface ProgramCardProps {
  icon: string;           // Emoji icon (🏹, ⚔️, 🎯)
  title: string;          // Program title (i18n key)
  description: string;    // Program description (i18n key)
  category: 'field' | 'duel' | 'silhouette' | 'training';
  difficulty?: 'beginner' | 'intermediate' | 'expert';
  onPress: () => void;
  disabled?: boolean;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  icon,
  title,
  description,
  category,
  difficulty = 'beginner',
  onPress,
  disabled = false
}) => {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity 
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{t(title)}</Text>
          <DifficultyBadge level={difficulty} />
        </View>
      </View>
      <Text style={styles.cardDescription}>{t(description)}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.startButton}>{t('navigation.start_program')}</Text>
      </View>
    </TouchableOpacity>
  );
};
```

### Header Component
```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction
}) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.header}>
      {showBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>{t('navigation.back')}</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        )}
      </View>
      
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress}>
          <Text style={styles.rightAction}>{rightAction.icon}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### DifficultyBadge Component
```typescript
interface DifficultyBadgeProps {
  level: 'beginner' | 'intermediate' | 'expert';
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ level }) => {
  const badgeColors = {
    beginner: '#27AE60',    // Green
    intermediate: '#F39C12', // Orange  
    expert: '#E74C3C'       // Red
  };
  
  const badgeLabels = {
    beginner: '●',
    intermediate: '●●', 
    expert: '●●●'
  };
  
  return (
    <View style={[styles.badge, { backgroundColor: badgeColors[level] }]}>
      <Text style={styles.badgeText}>{badgeLabels[level]}</Text>
    </View>
  );
};
```

## Screen Layout Specifications

### HomeScreen Layout
```
┌─────────────────────────────┐
│ ← SkyteKlokke        ⚙️     │ Header (60px)
├─────────────────────────────┤
│ Presis timer for skyttere   │ Subtitle (40px)
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 🏹 FELTSKYTING      ●   │ │ ProgramCard (100px)
│ │ Standard konkurranse    │ │
│ │ Start program →         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚔️ DUELLSKYTING     ●   │ │ ProgramCard (100px)
│ │ Tørrtrening simulator   │ │
│ │ Start program →         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🎯 SILHUETTSKYTING  ●●  │ │ ProgramCard (100px)
│ │ Rytmetrening            │ │
│ │ Start program →         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚙️ INNSTILLINGER        │ │ SettingsCard (80px)
│ │ Språk og lydinnstillinger│ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

### Mobile Responsive Breakpoints
```typescript
const breakpoints = {
  small: 320,   // iPhone SE
  medium: 375,  // iPhone 12/13/14
  large: 414,   // iPhone 12/13/14 Plus
  tablet: 768   // iPad
};

const getResponsiveStyle = (screenWidth: number) => {
  if (screenWidth >= breakpoints.tablet) {
    return {
      cardColumns: 2,
      cardSpacing: 24,
      headerSize: 32
    };
  }
  
  return {
    cardColumns: 1,
    cardSpacing: 16,
    headerSize: 28
  };
};
```

## Styling System

### Color Palette
```typescript
export const colors = {
  // Primary colors for shooting sports
  primary: '#2C3E50',      // Professional dark blue
  primaryLight: '#34495E',
  primaryDark: '#1A252F',
  
  // Action colors
  success: '#27AE60',      // Green for start/go
  warning: '#F39C12',      // Orange for warning/prepare
  danger: '#E74C3C',       // Red for stop/danger
  
  // Neutral colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceElevated: '#FFFFFF',
  
  // Text colors
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  textMuted: '#BDC3C7',
  
  // Borders and dividers
  border: '#E1E8ED',
  divider: '#F1F3F4'
};
```

### Typography Scale
```typescript
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.5
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.25
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.5
  }
};
```

### Animation Timing
```typescript
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  
  // Easing curves
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  
  // Shooting-specific timing (critical for precision)
  audioDelay: 50,     // Maximum acceptable audio delay
  visualUpdate: 16,   // 60fps for smooth visual updates
  commandTiming: 100  // Buffer for command processing
};
```

## Accessibility Features

### Screen Reader Support
```typescript
// Accessibility props for program cards
const accessibilityProps = {
  accessible: true,
  accessibilityRole: 'button' as const,
  accessibilityLabel: `${title}. ${description}. Difficulty: ${difficulty}`,
  accessibilityHint: 'Double tap to start this shooting program',
  accessibilityState: { disabled }
};
```

### High Contrast Mode
```typescript
const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    // Check system accessibility settings
    AccessibilityInfo.isHighTextContrastEnabled().then(setIsHighContrast);
  }, []);
  
  return isHighContrast;
};

// High contrast color overrides
const highContrastColors = {
  background: '#000000',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  primary: '#00FF00',  // High contrast green
  danger: '#FF0000'    // High contrast red
};
```