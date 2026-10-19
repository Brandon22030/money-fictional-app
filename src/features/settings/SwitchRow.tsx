import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { colors, font } from '@/src/theme';

export type SwitchRowProps = {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testID?: string;
};

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const KNOB = 22;
const KNOB_INSET = 3;

/** Glass row with a label and an on/off switch, sized like the holder field. */
export function SwitchRow({ label, hint, value, onChange, testID }: SwitchRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <AppText style={styles.label}>{label}</AppText>
      <View style={[styles.track, value ? styles.trackOn : null]}>
        <View style={[styles.knob, value ? styles.knobOn : null]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  label: {
    flex: 1,
    ...font(15, 'semiBold'),
    color: colors.textOnDark,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.textOnDarkMuted,
    marginLeft: KNOB_INSET - 1,
  },
  knobOn: {
    backgroundColor: colors.navy900,
    marginLeft: TRACK_WIDTH - KNOB - KNOB_INSET - 1,
  },
});
