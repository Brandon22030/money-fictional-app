import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/src/components/ui';
import { colors, font, glass, shadows } from '@/src/theme';

export type ActionTileProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  testID?: string;
};

export function ActionTile({ icon, label, onPress, testID }: ActionTileProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={glass.colors}
          start={glass.start}
          end={glass.end}
          style={StyleSheet.absoluteFill}
        />
        {/* View wrapper: on web a bare svg would paint under the absolute gradient. */}
        <View>
          <Icon name={icon} size={24} color={colors.accentSoft} />
        </View>
        <AppText variant="caption" tone="onDark" style={styles.label}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

// The shadow lives on the unclipped Pressable, the clipping and gradient on the inner view.
const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: 84,
    borderRadius: 22,
    backgroundColor: glass.colors[0],
    ...shadows.tile,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
  },
  label: { ...font(12, 'semiBold') },
  pressed: { opacity: 0.7 },
});
