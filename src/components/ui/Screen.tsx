import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from '@/src/theme';

// Pre-rendered mockup background (sky gradient, blurred waves, light veil), see scripts/visual/render-bg.mjs.
const skyBackground = require('@/assets/visual/sky-bg.png');

export type ScreenProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Screen({ children, style, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View testID={testID} style={styles.root}>
      <Image
        source={skyBackground}
        resizeMode="stretch"
        style={styles.background}
        accessibilityIgnoresInvertColors
      />
      <View
        style={[styles.content, { paddingTop: Math.max(layout.screenTop, insets.top + 4) }, style]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.skyTop,
  },
  // Explicit size: on web, Image otherwise takes the PNG's intrinsic pixel size (1170x2532),
  // which overrides the absolute insets and shows only the light top-left corner.
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
});
