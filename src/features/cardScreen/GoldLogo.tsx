import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { colors } from "@/src/theme";

export type GoldLogoProps = {
  size?: number;
};

/** Gold coin emblem (see assets/brand/logo-gold.svg), decorative. */
export function GoldLogo({ size = 26 }: GoldLogoProps) {
  return (
    <View testID="card-gold-logo">
      <Svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Defs>
          <LinearGradient id="goldMark" x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={colors.goldLight} />
            <Stop offset="0.5" stopColor={colors.goldBase} />
            <Stop offset="1" stopColor={colors.goldDeep} />
          </LinearGradient>
        </Defs>
        <Path
          transform="translate(128 128) scale(0.8)"
          d="M-94 100 L0 -112 L94 100 M-62.96 30 H62.96"
          fill="none"
          stroke="url(#goldMark)"
          strokeWidth={22}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={128}
          cy={128}
          r={160}
          fill="none"
          stroke="url(#goldMark)"
          strokeWidth={8}
        />
      </Svg>
    </View>
  );
}
