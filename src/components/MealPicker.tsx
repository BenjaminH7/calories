import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MEAL_EMOJI, MEAL_LABELS, MEAL_ORDER, type Meal } from '@/store/types';

/** Choix du repas : quatre pastilles pleine largeur, une seule sélectionnée. */
export function MealPicker({ value, onChange }: { value: Meal; onChange: (meal: Meal) => void }) {
  const t = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
      {MEAL_ORDER.map((meal) => {
        const selected = meal === value;
        return (
          <Pressable
            key={meal}
            accessibilityRole="button"
            accessibilityState={selected ? { selected: true } : {}}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(meal);
            }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              gap: 2,
              paddingVertical: Spacing.three,
              borderRadius: Radius.md,
              backgroundColor: selected ? t.accent : t.cardAlt,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: selected ? t.accent : t.border,
              opacity: pressed ? 0.75 : 1,
            })}>
            <Txt variant="body" style={{ fontSize: 17 }}>
              {MEAL_EMOJI[meal]}
            </Txt>
            <Txt
              variant="caption"
              color={selected ? t.accentText : t.textSecondary}
              style={{ fontSize: 10.5 }}
              numberOfLines={1}>
              {MEAL_LABELS[meal]}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
