import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { colors, radius, spacing } from '@/src/theme';
import { shadow } from '@/src/theme/tokens';

import { TAB_ITEM_SIZE, tabBarBottom } from './tabBarLayout';

type FeatherName = keyof typeof Feather.glyphMap;

const TABS: Record<string, { icon: FeatherName; labelKey: string }> = {
  index: { icon: 'home', labelKey: 'tabs.home' },
  card: { icon: 'credit-card', labelKey: 'tabs.card' },
  abundance: { icon: 'pie-chart', labelKey: 'tabs.abundance' },
  history: { icon: 'clock', labelKey: 'tabs.history' },
  settings: { icon: 'settings', labelKey: 'tabs.settings' },
};

type TabItemProps = {
  testID: string;
  label: string;
  icon: FeatherName;
  focused: boolean;
  onPress: () => void;
};

function TabItem({ testID, label, icon, focused, onPress }: TabItemProps) {
  const [progress] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, progress]);

  return (
    <Animated.View style={[styles.wrap, { flexGrow: progress }]}>
      <Pressable
        testID={testID}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={[styles.item, focused ? styles.itemActive : styles.itemInactive]}
      >
        <Feather name={icon} size={20} color={focused ? colors.navy800 : colors.textOnDarkMuted} />
        {focused ? (
          <Animated.View style={{ opacity: progress }}>
            <AppText variant="bodyStrong" style={styles.label} numberOfLines={1}>
              {label}
            </AppText>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useTranslation('nav');

  return (
    <View style={[styles.bar, { bottom: tabBarBottom(insets.bottom) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        return (
          <TabItem
            key={route.key}
            testID={`tab-${route.name}`}
            label={tab ? t(tab.labelKey) : route.name}
            icon={tab?.icon ?? 'circle'}
            focused={state.index === index}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (state.index !== index && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy800,
    borderRadius: radius.pill,
    padding: spacing.sm,
    ...shadow.card,
  },
  wrap: {
    flexBasis: TAB_ITEM_SIZE,
    flexShrink: 1,
  },
  item: {
    height: TAB_ITEM_SIZE,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  itemActive: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
  },
  itemInactive: {
    backgroundColor: colors.glassFill,
  },
  label: {
    color: colors.navy800,
  },
});
