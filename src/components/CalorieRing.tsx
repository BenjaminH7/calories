import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
};

/**
 * Anneau principal : calories restantes au centre, arc rempli à hauteur du
 * pourcentage consommé. Passe en rouge dès qu'on dépasse l'objectif.
 */
export function CalorieRing({ consumed, goal, size = 190, strokeWidth = 16 }: Props) {
  const t = useTheme();
  const remaining = goal - consumed;
  const over = remaining < 0;
  const ratio = goal > 0 ? Math.min(consumed / goal, 1) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={t.ringTrack}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={over ? t.danger : t.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </G>
      </Svg>

      <Txt variant="display" color={over ? t.danger : t.text}>
        {Math.abs(Math.round(remaining))}
      </Txt>
      <Txt variant="label" muted>
        {over ? 'kcal en trop' : 'kcal restantes'}
      </Txt>
    </View>
  );
}
