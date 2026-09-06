import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TxtVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';

const VARIANTS: Record<TxtVariant, TextStyle> = {
  display: { fontSize: 44, lineHeight: 48, fontWeight: '800', letterSpacing: -1.2 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  mono: { fontSize: 14, lineHeight: 18, fontWeight: '600', fontFamily: Fonts.mono },
};

export function Txt({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: TxtVariant; muted?: boolean; color?: string }) {
  const t = useTheme();
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: Fonts.rounded, color: color ?? (muted ? t.textSecondary : t.text) },
        VARIANTS[variant],
        style,
      ]}
    />
  );
}

export function Card({
  style,
  padded = true,
  ...rest
}: ViewProps & { padded?: boolean }) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t.card,
          borderRadius: Radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.border,
          padding: padded ? Spacing.five : 0,
        },
        style,
      ]}
    />
  );
}

export function Row({ style, gap = Spacing.three, ...rest }: ViewProps & { gap?: number }) {
  return <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]} />;
}

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  loading,
  icon,
  style,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const palette = {
    primary: { bg: t.accent, fg: t.accentText, border: 'transparent' },
    secondary: { bg: t.cardAlt, fg: t.text, border: t.border },
    ghost: { bg: 'transparent', fg: t.text, border: t.border },
    danger: { bg: 'transparent', fg: t.danger, border: t.border },
  }[variant];

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      onPress={(e) => {
        haptic();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'primary' ? 0 : StyleSheet.hairlineWidth,
          borderRadius: Radius.pill,
          paddingVertical: 16,
          paddingHorizontal: Spacing.six,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Spacing.two,
          opacity: disabled ? 0.35 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon}
          <Txt variant="heading" color={palette.fg} style={{ fontSize: 16 }}>
            {title}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          paddingVertical: Spacing.two,
          paddingHorizontal: Spacing.four,
          borderRadius: Radius.pill,
          backgroundColor: selected ? t.accent : t.cardAlt,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? t.accent : t.border,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}>
      <Txt variant="label" color={selected ? t.accentText : t.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Grande option d'onboarding / réglages, plein largeur. */
export function OptionRow({
  title,
  subtitle,
  selected,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        backgroundColor: selected ? t.accent : t.card,
        borderColor: selected ? t.accent : t.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: Radius.md,
        paddingVertical: Spacing.four,
        paddingHorizontal: Spacing.five,
        opacity: pressed ? 0.8 : 1,
      })}>
      <View style={{ flex: 1 }}>
        <Txt variant="heading" color={selected ? t.accentText : t.text}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color={selected ? t.accentText : t.textSecondary} style={{ opacity: 0.8 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />;
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Txt variant="caption" muted style={[{ textTransform: 'uppercase', letterSpacing: 0.8 }, style]}>
      {children}
    </Txt>
  );
}
