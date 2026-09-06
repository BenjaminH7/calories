import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DayKey, dayNumber, today, weekdayLetter } from '@/lib/date';

export type DaySummary = {
  day: DayKey;
  /** Calories consommées ce jour-là. */
  kcal: number;
  /** Objectif effectif du jour (épargne comprise). */
  goal: number;
  hasEntries: boolean;
  hasEvent: boolean;
};

/** Statut d'un jour, uniquement sur les calories. */
type Status = 'empty' | 'future' | 'ok' | 'over';

function statusOf(summary: DaySummary): Status {
  if (summary.day > today()) return 'future';
  if (!summary.hasEntries) return 'empty';
  return summary.kcal > summary.goal ? 'over' : 'ok';
}

/**
 * Bandeau des 7 derniers jours façon Cal AI : un anneau par jour, vert si
 * l'objectif calories est tenu, rouge s'il est dépassé, avec le total dessous.
 */
export function WeekStrip({
  days,
  selected,
  onSelect,
}: {
  days: DaySummary[];
  selected: DayKey;
  onSelect: (day: DayKey) => void;
}) {
  const t = useTheme();

  const colorFor = (status: Status) =>
    ({
      over: t.danger,
      ok: t.proteinDone,
      empty: t.ringTrack,
      future: t.ringTrack,
    })[status];

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', gap: Spacing.one }}>
        {days.map((summary) => {
          const status = statusOf(summary);
          const isSelected = summary.day === selected;
          const color = colorFor(status);

          return (
            <Pressable
              key={summary.day}
              accessibilityRole="button"
              accessibilityState={isSelected ? { selected: true } : {}}
              accessibilityLabel={`${summary.day} : ${Math.round(summary.kcal)} sur ${summary.goal} kcal`}
              onPress={() => onSelect(summary.day)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: Spacing.one,
                paddingVertical: Spacing.two,
                borderRadius: Radius.md,
                backgroundColor: isSelected ? t.cardAlt : 'transparent',
                borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
                borderColor: isSelected ? t.accent : 'transparent',
                opacity: status === 'future' ? 0.4 : 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Txt variant="caption" muted style={{ fontSize: 10 }}>
                  {weekdayLetter(summary.day)}
                </Txt>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: summary.hasEvent ? t.saving : 'transparent',
                  }}
                />
              </View>

              <DayRing
                label={String(dayNumber(summary.day))}
                ratio={summary.goal > 0 ? Math.min(summary.kcal / summary.goal, 1) : 0}
                color={color}
                track={t.ringTrack}
                textColor={t.text}
                filled={false}
                accentText={t.accentText}
              />

              <Txt
                variant="caption"
                color={status === 'over' ? t.danger : t.textSecondary}
                style={{ fontSize: 9.5 }}
                numberOfLines={1}>
                {summary.hasEntries ? Math.round(summary.kcal) : '–'}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.four }}>
        <Legend color={t.proteinDone} label="objectif tenu" />
        <Legend color={t.danger} label="dépassé" />
      </View>
    </View>
  );
}

function DayRing({
  label,
  ratio,
  color,
  track,
  textColor,
  filled,
  accentText,
}: {
  label: string;
  ratio: number;
  color: string;
  track: string;
  textColor: string;
  filled: boolean;
  accentText: string;
}) {
  const size = 34;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={track}
            strokeWidth={stroke}
            fill={filled ? color : 'none'}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </G>
      </Svg>
      <Txt variant="label" color={filled ? accentText : textColor} style={{ fontSize: 12 }}>
        {label}
      </Txt>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Txt variant="caption" muted style={{ fontSize: 9.5 }}>
        {label}
      </Txt>
    </View>
  );
}
