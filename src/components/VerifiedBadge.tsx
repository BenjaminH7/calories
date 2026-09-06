import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Marque les aliments issus de la table CIQUAL (ANSES) : valeurs mesurées en
 * laboratoire, par opposition aux fiches contributives d'OpenFoodFacts.
 */
export function VerifiedBadge({ compact }: { compact?: boolean }) {
  const t = useTheme();

  return (
    <View
      accessibilityLabel="Aliment vérifié, source CIQUAL"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 3,
        paddingHorizontal: compact ? Spacing.two : Spacing.three,
        paddingVertical: 2,
        borderRadius: Radius.pill,
        backgroundColor: `${t.proteinDone}1A`,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${t.proteinDone}55`,
      }}>
      <Icon name="check" size={compact ? 10 : 12} color={t.proteinDone} strokeWidth={3.2} />
      <Txt variant="caption" color={t.proteinDone} style={{ fontSize: compact ? 9.5 : 10.5 }}>
        {compact ? 'Vérifié' : 'Aliment vérifié'}
      </Txt>
    </View>
  );
}
