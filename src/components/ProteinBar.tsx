import { View } from 'react-native';

import { Card, Row, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Barre protéines : passe au vert (et affiche ✓) dès que l'objectif est atteint.
 */
export function ProteinBar({ consumed, goal }: { consumed: number; goal: number }) {
  const t = useTheme();
  const done = goal > 0 && consumed >= goal;
  const ratio = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const color = done ? t.proteinDone : t.protein;
  const left = Math.max(0, goal - consumed);

  return (
    <Card style={{ gap: Spacing.three }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={Spacing.two}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
            }}
          />
          <Txt variant="heading">Protéines</Txt>
          {done ? (
            <Txt variant="label" color={t.proteinDone}>
              ✓ objectif atteint
            </Txt>
          ) : null}
        </Row>
        <Txt variant="heading" color={done ? t.proteinDone : t.text}>
          {Math.round(consumed)}
          <Txt variant="label" muted>
            {' '}
            / {goal} g
          </Txt>
        </Txt>
      </Row>

      <View
        style={{
          height: 12,
          borderRadius: Radius.pill,
          backgroundColor: t.ringTrack,
          overflow: 'hidden',
        }}>
        <View
          style={{
            width: `${ratio * 100}%`,
            height: '100%',
            borderRadius: Radius.pill,
            backgroundColor: color,
          }}
        />
      </View>

      <Txt variant="caption" muted>
        {done ? 'Bien joué, tu peux arrêter de compter.' : `Encore ${Math.round(left)} g à aller chercher.`}
      </Txt>
    </Card>
  );
}
