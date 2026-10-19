import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients } from '@/src/theme';

export type ScreenProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function Waves() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id="waveA" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.55} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="waveB" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.navy700} stopOpacity={0.5} />
          <Stop offset="100%" stopColor={colors.navy700} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={60} cy={560} rx={260} ry={110} fill="url(#waveA)" />
      <Ellipse cx={340} cy={700} rx={300} ry={130} fill="url(#waveB)" />
      <Ellipse cx={200} cy={820} rx={320} ry={90} fill="url(#waveA)" />
    </Svg>
  );
}

export function Screen({ children, style, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View testID={testID} style={styles.root}>
      <LinearGradient
        colors={[...gradients.sky.colors]}
        start={gradients.sky.start}
        end={gradients.sky.end}
        style={StyleSheet.absoluteFill}
      />
      <Waves />
      <View style={[styles.content, { paddingTop: insets.top }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.skyTop,
  },
  content: {
    flex: 1,
  },
});
