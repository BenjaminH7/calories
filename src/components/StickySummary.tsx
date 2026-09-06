import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Bandeau collé en haut, révélé quand l'anneau des calories sort de l'écran.
 * Purement informatif : `pointerEvents="none"` pour ne jamais intercepter le
 * scroll ni les taps des cartes qui passent dessous.
 */
export function StickySummary({
  consumed,
  goal,
  protein,
  proteinGoal,
  label,
  opacity,
  translateY,
}: {
  consumed: number;
  goal: number;
  protein: number;
  proteinGoal: number;
  label: string;
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
        paddingTop: insets.top + Spacing.two,
        paddingBottom: Spacing.three,
        paddingHorizontal: Spacing.five,
        backgroundColor: t.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: t.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.five,
      }}>
      <Metric
        value={`${Math.abs(Math.round(kcalLeft))}`}
        unit="kcal"
        caption={over ? `en trop · ${label}` : `restantes · ${label}`}
        ratio={goal > 0 ? Math.min(consumed / goal, 1) : 0}
        color={over ? t.danger : t.accent}
        track={t.ringTrack}
      />

      <View style={{ width: StyleSheet.hairlineWidth, height: 28, backgroundColor: t.border }} />

      <Metric
        value={`${Math.round(proteinLeft)}`}
        unit="g"
        caption={proteinDone ? 'protéines ✓' : 'protéines restantes'}
        ratio={proteinGoal > 0 ? Math.min(protein / proteinGoal, 1) : 0}
        color={proteinDone ? t.proteinDone : t.protein}
        track={t.ringTrack}
      />
    </Animated.View>
  );
}

function Metric({
  value,
  unit,
  caption,
  ratio,
  color,
  track,
}: {
  value: string;
  unit: string;
  caption: string;
  ratio: number;
  color: string;
  track: string;
}) {
  return (
    <View style={{ flex: 1, gap: Spacing.one }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Txt variant="heading" color={color} style={{ fontSize: 19 }}>
          {value}
        </Txt>
        <Txt variant="caption" muted>
          {unit}
        </Txt>
      </View>

      <View style={{ height: 3, borderRadius: 2, backgroundColor: track, overflow: 'hidden' }}>
        <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
      </View>

      <Txt variant="caption" muted style={{ fontSize: 10 }} numberOfLines={1}>
        {caption}
      </Txt>
    </View>
  );
}
