import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

/**
 * Marge haute d'un écran présenté en modale.
 *
 * Sur iOS une modale est une « page sheet » : son bord supérieur est déjà
 * descendu sous la barre d'état, mais `useSafeAreaInsets` continue de renvoyer
 * l'inset de la fenêtre. L'appliquer ajouterait une soixantaine de pixels de
 * vide. Sur Android la modale couvre tout l'écran, l'inset reste nécessaire.
 */
export function useModalTopInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? Spacing.four : insets.top + Spacing.three;
}
