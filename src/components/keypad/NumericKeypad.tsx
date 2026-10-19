import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { colors, radius, spacing } from '@/src/theme';

import type { AmountKey } from './useAmountInput';

export type NumericKeypadProps = {
  onKey: (key: AmountKey) => void;
  decimalEnabled: boolean;
  testID?: string;
};

const ROWS: AmountKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['decimal', '0', 'backspace'],
];

export function NumericKeypad({ onKey, decimalEnabled, testID }: NumericKeypadProps) {
  const { t } = useTranslation('keypad');

  const handlePress = (key: AmountKey) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKey(key);
  };

  return (
    <View testID={testID} style={styles.grid}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => {
            const disabled = key === 'decimal' && !decimalEnabled;
            const label =
              key === 'decimal'
                ? t('decimal')
                : key === 'backspace'
                  ? t('backspace')
                  : t('digit', { digit: key });
            return (
              <Pressable
                key={key}
                testID={testID ? `${testID}-${key}` : `key-${key}`}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => handlePress(key)}
                style={({ pressed }) => [
                  styles.key,
                  disabled ? styles.disabled : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                {key === 'backspace' ? (
                  <Feather name="delete" size={24} color={colors.navy800} />
                ) : (
                  <AppText variant="h2" tabular>
                    {key === 'decimal' ? t('separator') : key}
                  </AppText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const KEY_SIZE = 72;

const styles = StyleSheet.create({
  grid: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
