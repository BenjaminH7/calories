import { Card, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Carte affichée sur l'accueil uniquement s'il y a vraiment quelque chose à
 * lisser. Dans le tampon, il n'y a rien à rééquilibrer : le bloc n'existe
 * tout simplement pas, plutôt que d'afficher un "0 kcal" qui serait un
 * verdict déguisé.
 */
export function DebtBanner({ rebalance }: { rebalance: { amount: number; days: number } | null }) {
  const t = useTheme();
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
