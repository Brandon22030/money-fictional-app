import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadow } from '@/src/theme';

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  card: 'credit-card',
  abundance: 'pie-chart',
  history: 'clock',
  settings: 'settings',
};

export function TabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { bottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key]?.options.title ?? route.name;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => navigateToTab(route.key)}
            style={styles.item}
          >
            <Feather
              name={ICONS[route.name] ?? 'circle'}
              size={22}
              color={focused ? colors.accent : colors.textOnDarkMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: colors.navy800,
    borderRadius: radius.pill,
    paddingVertical: 14,
    ...shadow.card,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
});
