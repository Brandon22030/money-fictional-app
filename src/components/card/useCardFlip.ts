import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export const FLIP_DURATION_MS = 500;
const PERSPECTIVE = 1000;

export function useCardFlip(flipped: boolean) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(flipped ? 1 : 0);

  useEffect(() => {
    const target = flipped ? 1 : 0;
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: FLIP_DURATION_MS, easing: Easing.inOut(Easing.cubic) });
  }, [flipped, reduceMotion, progress]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: PERSPECTIVE }, { rotateY: `${progress.value * 180}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: PERSPECTIVE }, { rotateY: `${progress.value * 180 - 180}deg` }],
  }));

  return { frontStyle, backStyle, reduceMotion };
}
