import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";

export type ActionTileProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
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
      <Feather name={icon} size={20} color={colors.navy800} />
      <AppText variant="caption" tone="onLight">
        {label}
      </AppText>
    </Pressable>
  );
}

export const tileStyles = {
  base: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
} as const;

const styles = StyleSheet.create({
  tile: {
    ...tileStyles.base,
    flex: 1,
    backgroundColor: colors.glassLight,
    borderColor: colors.glassBorder,
  },
  pressed: { opacity: 0.7 },
});
