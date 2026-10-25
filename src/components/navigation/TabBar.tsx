import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon, type IconName } from '@/src/components/ui/Icon';
import { colors, font, glass, radius, shadows } from '@/src/theme';

import { TAB_BAR_HEIGHT, TAB_ITEM_SIZE, tabBarBottom } from './tabBarLayout';

const ICON_INACTIVE = 'rgba(255,255,255,0.85)';
const SUBTLE_FILL = 'rgba(255,255,255,0.1)';

// The active label shrinks (then truncates as a last resort) instead of overflowing the pill
// on narrow screens or with a large system font. At 390 pt it renders at full size.
export const LABEL_MIN_FONT_SCALE = 0.8;
export const LABEL_MAX_FONT_SIZE_MULTIPLIER = 1.2;

const ITEM_BORDER_WIDTH = 1;

const TABS: Record<string, { icon: IconName; labelKey: string }> = {
  index: { icon: 'home', labelKey: 'tabs.home' },
  card: { icon: 'card', labelKey: 'tabs.card' },
  abundance: { icon: 'pie', labelKey: 'tabs.abundance' },
  history: { icon: 'clock', labelKey: 'tabs.history' },
  settings: { icon: 'sliders', labelKey: 'tabs.settings' },
};

type TabItemProps = {
  testID: string;
  label: string;
  icon: IconName;
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
        <View style={styles.content}>
          <View style={styles.icon}>
            <Icon
              name={icon}
              size={22}
              color={focused ? colors.navy900 : ICON_INACTIVE}
            />
          </View>
          {focused ? (
            <Animated.View style={[styles.labelWrap, { opacity: progress }]}>
              <Text
                style={styles.label}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={LABEL_MIN_FONT_SCALE}
                maxFontSizeMultiplier={LABEL_MAX_FONT_SIZE_MULTIPLIER}
              >
                {label}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { t } = useTranslation('nav');

  return (
    <View style={[styles.bar, { bottom: tabBarBottom(insets.bottom) }]}>
      <LinearGradient
        colors={[colors.navy800, colors.navy900]}
        start={glass.start}
        end={glass.end}
        style={styles.gradient}
      />
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        return (
          <TabItem
            key={route.key}
            testID={`tab-${route.name}`}
            label={tab ? t(tab.labelKey) : route.name}
            icon={tab?.icon ?? 'home'}
            focused={state.index === index}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (state.index !== index && !event.defaultPrevented) {
                navigateToTab(route.key);
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
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 8,
    borderRadius: 35,
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
    backgroundColor: colors.navy800,
    ...shadows.tabBar,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 34,
  },
  wrap: {
    flexBasis: TAB_ITEM_SIZE,
    flexShrink: 0,
  },
  item: {
    height: TAB_ITEM_SIZE,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: ITEM_BORDER_WIDTH,
  },
  itemActive: {
    backgroundColor: colors.accent,
    borderColor: 'rgba(255,255,255,0.35)',
    // The pill fills the free width of the bar and centres its content. As in the mockup,
    // "Abondance" and "Historique" reach the pill edge at 390 pt, so no inner padding.
    paddingHorizontal: 0,
    ...shadows.activeTab,
  },
  itemInactive: {
    backgroundColor: SUBTLE_FILL,
    borderColor: SUBTLE_FILL,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
    // Lets the label run over the 1 pt pill border (never past the pill), as in the mockup
    // where "Abondance" is a fraction wider than the pill inner width at 390 pt.
    marginHorizontal: -ITEM_BORDER_WIDTH,
  },
  icon: {
    flexShrink: 0,
  },
  labelWrap: {
    flexShrink: 1,
    minWidth: 0,
  },
  label: {
    ...font(14, 'bold'),
    color: colors.navy900,
  },
});
