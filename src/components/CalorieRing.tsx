import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { debtBuffer } from '@/lib/nutrition';

type Props = {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
};

/**
 * Anneau principal : calories restantes au centre, arc rempli à hauteur du
 * pourcentage consommé.
 *
 * Au-delà de l'objectif, on ne dit jamais "dépassé" : entre l'objectif et le
 * tampon de bruit, la vraie question de l'utilisateur n'est pas "j'ai
 * échoué ?" mais "jusqu'où je peux encore aller ?" — on répond donc en marge
 * restante, pas en déficit. Au-delà du tampon (dette réelle), le centre
 * pointe vers le rééquilibrage à venir plutôt que vers un verdict. Toujours
 * en ambre, jamais en rouge — l'app doit toujours encourager.
 */
export function CalorieRing({ consumed, goal, size = 190, strokeWidth = 16 }: Props) {
  const t = useTheme();
  const buffer = debtBuffer(goal);
  const remaining = goal - consumed;
  const margin = goal + buffer - consumed;
  const inBuffer = remaining < 0 && margin >= 0;
  const overBuffer = margin < 0;
  const over = inBuffer || overBuffer;
  const ratio = goal > 0 ? Math.min(consumed / goal, 1) : 0;

  const big = remaining >= 0 ? remaining : overBuffer ? 0 : margin;
  const label = remaining >= 0 ? 'kcal restantes' : 'kcal de marge';
  const caption = overBuffer
    ? 'sera lissé sur les prochains jours'
    : inBuffer
      ? `${Math.abs(Math.round(remaining))} kcal dans la marge`
      : null;

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
            stroke={over ? t.saving : t.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </G>
      </Svg>

      {/* Largeur bornée au carré inscrit dans le cercle : un texte plus long
          (la légende de marge) doit passer à la ligne plutôt que déborder
          visuellement sur le tracé de l'anneau. */}
      <View style={{ maxWidth: size * 0.62, alignItems: 'center' }}>
        <Txt variant="display" color={over ? t.saving : t.text}>
          {Math.round(big)}
        </Txt>
        <Txt variant="label" muted>
          {label}
        </Txt>
        {caption ? (
          <Txt variant="caption" muted style={{ marginTop: 2, textAlign: 'center' }}>
            {caption}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}
