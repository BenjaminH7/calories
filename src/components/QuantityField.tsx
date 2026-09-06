import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Chip, Row, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { UNIT_LABELS, type Unit } from '@/store/types';

/** Raccourcis de quantité proposés selon l'unité. */
const PRESETS: Record<Unit, number[]> = {
  g: [30, 50, 100, 150, 200, 250],
  ml: [100, 150, 200, 250, 330, 500],
  tbsp: [0.5, 1, 2, 3],
  tsp: [0.5, 1, 2, 3],
  piece: [1, 2, 3, 4],
  serving: [0.5, 1, 1.5, 2],
};

const STEPS: Record<Unit, number> = {
  g: 10,
  ml: 10,
  tbsp: 0.5,
  tsp: 0.5,
  piece: 1,
  serving: 0.5,
};

/**
 * Saisie de quantité : gros champ numérique, ± , unités et raccourcis.
 * Pensé pour taper « 125 g » en deux gestes maximum.
 */
export function QuantityField({
  quantity,
  unit,
  units,
  onChangeQuantity,
  onChangeUnit,
  equivalent,
}: {
  quantity: number;
  unit: Unit;
  units: Unit[];
  onChangeQuantity: (value: number) => void;
  onChangeUnit: (unit: Unit) => void;
  /** Équivalence affichée sous le champ, ex. « ≈ 13,8 g » pour 1 c. à soupe. */
  equivalent?: string | null;
}) {
  const t = useTheme();
  const step = STEPS[unit];

  const bump = (delta: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const next = Math.max(0, Math.round((quantity + delta) * 100) / 100);
    onChangeQuantity(next);
  };

  return (
    <View style={{ gap: Spacing.four }}>
      <Row gap={Spacing.three}>
        <RoundButton onPress={() => bump(-step)} icon="minus" disabled={quantity <= 0} />

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: Spacing.two,
            backgroundColor: t.cardAlt,
            borderRadius: Radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            paddingVertical: Spacing.three,
          }}>
          <TextInput
            value={quantity === 0 ? '' : String(quantity)}
            onChangeText={(text) => {
              const parsed = parseFloat(text.replace(',', '.'));
              onChangeQuantity(Number.isFinite(parsed) ? parsed : 0);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={t.textSecondary}
            selectTextOnFocus
            style={{
              fontFamily: Fonts.rounded,
              fontSize: 34,
              fontWeight: '800',
              letterSpacing: -1,
              color: t.text,
              minWidth: 60,
              textAlign: 'center',
              paddingVertical: 0,
            }}
          />
          <Txt variant="heading" muted>
            {UNIT_LABELS[unit]}
          </Txt>
        </View>

        <RoundButton onPress={() => bump(step)} icon="plus" />
      </Row>

      {equivalent ? (
        <Txt variant="caption" muted style={{ textAlign: 'center', marginTop: -Spacing.two }}>
          {equivalent}
        </Txt>
      ) : null}

      {units.length > 1 && (
        <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
          {units.map((u) => (
            <Chip
              key={u}
              label={UNIT_LABELS[u]}
              selected={u === unit}
              onPress={() => onChangeUnit(u)}
            />
          ))}
        </Row>
      )}

      <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
        {PRESETS[unit].map((value) => (
          <Chip
            key={value}
            label={`${value} ${UNIT_LABELS[unit]}`}
            selected={Math.abs(value - quantity) < 0.001}
            onPress={() => onChangeQuantity(value)}
          />
        ))}
      </Row>
    </View>
  );
}

function RoundButton({
  onPress,
  icon,
  disabled,
}: {
  onPress: () => void;
  icon: 'plus' | 'minus';
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: Radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.cardAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}>
      <Icon name={icon} size={22} />
    </Pressable>
  );
}
