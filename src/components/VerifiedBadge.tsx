import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/use-theme';

/**
 * Pastille verte des aliments issus de la table CIQUAL (ANSES) : valeurs
 * mesurées en laboratoire, par opposition aux fiches contributives
 * d'OpenFoodFacts.
 */
export function VerifiedBadge({ size = 16 }: { size?: number }) {
  const t = useTheme();

  return (
    <View
      accessibilityLabel="Aliment vérifié"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.proteinDone,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {/* Blanc en dur : le vert reste vert dans les deux thèmes. */}
      <Icon name="check" size={size * 0.62} color="#FFFFFF" strokeWidth={3.6} />
    </View>
  );
}
