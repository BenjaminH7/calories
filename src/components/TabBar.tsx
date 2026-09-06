import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/ui';
import { Radius, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICONS: Record<string, IconName> = {
  index: 'home',
  stats: 'chart',
  events: 'wallet',
  settings: 'sliders',
};

const LABELS: Record<string, string> = {
  index: 'Accueil',
  stats: 'Stats',
  events: 'Épargne',
  settings: 'Réglages',
};

/** Barre d'onglets façon Cal AI : 3 onglets + bouton d'ajout noir au centre. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Deux onglets de chaque côté du bouton d'ajout : il tombe pile au centre.
  const renderTab = (routeName: string, flex = 1) => {
    const index = state.routes.findIndex((r) => r.name === routeName);
    if (index === -1) return null;
    const route = state.routes[index];
    const focused = state.index === index;

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={LABELS[routeName]}
        onPress={() => {
          tap();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }}
        style={{ flex, alignItems: 'center', gap: 3, paddingTop: Spacing.one }}>
        <Icon name={ICONS[routeName]} size={22} color={focused ? t.text : t.textSecondary} />
        <Txt variant="caption" color={focused ? t.text : t.textSecondary} style={{ fontSize: 10.5 }}>
          {LABELS[routeName]}
        </Txt>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: t.card,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.border,
        // Sans encoche (insets.bottom = 0) on garde une petite marge, sinon la
        // barre colle au bord de l'écran.
        paddingBottom: insets.bottom || Spacing.two,
        height: TAB_BAR_HEIGHT + (insets.bottom || Spacing.two),
        paddingHorizontal: Spacing.two,
      }}>
      {renderTab('index')}
      {renderTab('stats')}

      <View style={{ width: 72, alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un aliment"
          onPress={() => {
            tap();
            router.push('/add');
          }}
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: Radius.pill,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -18,
            transform: [{ scale: pressed ? 0.94 : 1 }],
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          })}>
          <Icon name="plus" size={28} color={t.accentText} strokeWidth={2.6} />
        </Pressable>
      </View>

      {renderTab('events')}
      {renderTab('settings')}
    </View>
  );
}
