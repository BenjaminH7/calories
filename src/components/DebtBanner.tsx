import { Card, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Carte affichée sur l'accueil uniquement s'il y a vraiment quelque chose à
 * dire. Dans le tampon, il n'y a rien à rééquilibrer : le bloc n'existe pas,
 * plutôt que d'afficher un "0 kcal" qui serait un verdict déguisé.
 *
 * Le lissage traite un incident, pas un motif. Plusieurs vrais dépassements
 * dans la semaine, et continuer à chuchoter "c'est lissé" deviendrait
 * malhonnête : on remplace le chiffre par une question.
 */
export function DebtBanner({
  rebalance,
  pattern,
}: {
  rebalance: { amount: number; days: number } | null;
  pattern: boolean;
}) {
  const t = useTheme();

  if (pattern) {
    return (
      <Card style={{ gap: Spacing.one }}>
        <Txt variant="label">Plusieurs gros dépassements cette semaine</Txt>
        <Txt variant="body" muted>
          Le lissage ne règle pas ça. Qu&apos;est-ce qui se passe en ce moment — stress, soirées,
          autre chose ?
        </Txt>
      </Card>
    );
  }

  if (!rebalance || rebalance.amount <= 0) return null;

  return (
    <Card style={{ gap: Spacing.one }}>
      <Txt variant="label">Rééquilibrage</Txt>
      <Txt variant="body" muted>
        <Txt variant="body" color={t.saving}>
          {rebalance.amount} kcal
        </Txt>{' '}
        lissées sur {rebalance.days} jour{rebalance.days > 1 ? 's' : ''}.
      </Txt>
    </Card>
  );
}
