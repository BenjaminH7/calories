import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Bandeau fin collé en haut, révélé quand l'anneau des calories sort de
 * l'écran. Purement informatif : `pointerEvents="none"` pour ne jamais
 * intercepter le scroll ni les taps des cartes qui passent dessous.
 */
export function StickySummary({
  consumed,
  goal,
  protein,
  proteinGoal,
  opacity,
  translateY,
}: {
  consumed: number;
  goal: number;
  protein: number;
  proteinGoal: number;
  opacity: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const kcalLeft = goal - consumed;
  const over = kcalLeft < 0;
  const proteinLeft = Math.max(0, proteinGoal - protein);
  const proteinDone = proteinGoal > 0 && protein >= proteinGoal;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        opacity,
        transform: [{ translateY }],
        paddingTop: insets.top + Spacing.one,
        paddingBottom: Spacing.two,
        paddingHorizontal: Spacing.five,
        backgroundColor: t.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: t.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
      }}>
      <Metric
        value={Math.abs(Math.round(kcalLeft))}
        unit="kcal"
        suffix={over ? 'en trop' : 'restantes'}
        color={over ? t.danger : t.text}
      />

      <View style={{ width: StyleSheet.hairlineWidth, height: 16, backgroundColor: t.border }} />

      <Metric
        value={Math.round(proteinLeft)}
        unit="g"
        suffix={proteinDone ? 'protéines ✓' : 'protéines'}
        color={proteinDone ? t.proteinDone : t.text}
      />
    </Animated.View>
  );
}

function Metric({
  value,
  unit,
  suffix,
  color,
}: {
  value: number;
  unit: string;
  suffix: string;
  color: string;
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      <Txt variant="heading" color={color} style={{ fontSize: 16 }}>
        {value}
      </Txt>
      <Txt variant="caption" color={color} style={{ fontSize: 11 }}>
        {unit}
      </Txt>
      <Txt variant="caption" muted style={{ fontSize: 11 }} numberOfLines={1}>
        {suffix}
      </Txt>
    </View>
  );
}
