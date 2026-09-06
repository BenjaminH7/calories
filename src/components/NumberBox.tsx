import { StyleSheet, TextInput, View } from 'react-native';

import { Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Champ numérique encadré, avec libellé au-dessus et unité à droite. */
export function NumberBox({
  label,
  suffix,
  value,
  onChangeText,
  color,
  autoFocus,
  size = 26,
}: {
  label: string;
  suffix: string;
  value: string;
  onChangeText: (v: string) => void;
  color?: string;
  autoFocus?: boolean;
  size?: number;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: Spacing.two }}>
      <Txt variant="caption" muted>
        {label}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: Spacing.two,
          backgroundColor: t.cardAlt,
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.border,
          paddingHorizontal: Spacing.four,
          paddingVertical: Spacing.three,
        }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={t.textSecondary}
          selectTextOnFocus
          autoFocus={autoFocus}
          style={{
            flex: 1,
            fontFamily: Fonts.rounded,
            fontSize: size,
            fontWeight: '800',
            letterSpacing: -0.6,
            color: color ?? t.text,
            paddingVertical: 0,
          }}
        />
        <Txt variant="caption" muted>
          {suffix}
        </Txt>
      </View>
    </View>
  );
}

/** Parse une saisie utilisateur en nombre positif (virgule acceptée). */
export function parseNumber(text: string): number {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
