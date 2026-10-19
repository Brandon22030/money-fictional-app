import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type CardShineProps = { width: number; disabled?: boolean; testID?: string };

const SWEEP_MS = 2800;
const PAUSE_MS = 2600;

export function CardShine({ width, disabled = false, testID }: CardShineProps) {
  const x = useSharedValue(-1);

  useEffect(() => {
    if (disabled) {
      cancelAnimation(x);
      x.value = -1;
      return;
    }
    x.value = withRepeat(
      withDelay(PAUSE_MS, withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.quad) })),
      -1,
      false,
    );
    return () => cancelAnimation(x);
  }, [disabled, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * width }] }));

  if (disabled) return null;

  return (
    <Animated.View testID={testID} pointerEvents="none" style={[styles.band, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,248,225,0.26)', 'transparent']}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: { ...StyleSheet.absoluteFill },
});
