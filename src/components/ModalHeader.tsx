import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ModalHeader({
  title,
  subtitle,
  onClose,
  right,
}: {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.five,
        paddingBottom: Spacing.four,
      }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        onPress={() => (onClose ? onClose() : router.back())}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: Radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.cardAlt,
          opacity: pressed ? 0.6 : 1,
        })}>
        <Icon name="close" size={18} />
      </Pressable>

      <View style={{ flex: 1 }}>
        <Txt variant="heading" numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" muted numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>

      {right}
    </View>
  );
}
