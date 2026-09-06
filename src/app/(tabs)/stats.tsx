import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Card, Row, SectionTitle, Txt } from '@/components/ui';
import { Radius, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addDays,
  type DayKey,
  humanWeek,
  mondayOf,
  today,
  weekdayLetter,
  weekFrom,
  weekRangeLabel,
} from '@/lib/date';
import { dailyGoal, debtBuffer } from '@/lib/nutrition';
import { totalsForDay, useAppStore } from '@/store/useAppStore';

/** Hauteur de la zone des barres. */
const CHART_HEIGHT = 150;

type DayStat = {
  day: DayKey;
  kcal: number;
  protein: number;
  goal: number;
  logged: boolean;
  future: boolean;
};

export default function StatsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const entries = useAppStore((s) => s.entries);
  const events = useAppStore((s) => s.events);
  const calorieGoal = useAppStore((s) => s.calorieGoal);

  const currentMonday = mondayOf(today());
  const [monday, setMonday] = useState<DayKey>(currentMonday);

  const days = useMemo<DayStat[]>(
    () =>
      weekFrom(monday).map((day) => {
        const totals = totalsForDay(entries, day);
        return {
          day,
          kcal: totals.kcal,
          protein: totals.protein,
          goal: dailyGoal((d) => totalsForDay(entries, d).kcal, calorieGoal, events, day).goal,
          logged: totals.kcal > 0,
          future: day > today(),
        };
      }),
    [entries, events, calorieGoal, monday],
  );

  // Les moyennes ne portent que sur les jours renseignés : un jour vide
  // tirerait la moyenne vers le bas sans rien vouloir dire.
  const logged = days.filter((d) => d.logged);
  const avgKcal = logged.length ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length) : 0;
  const avgProtein = logged.length
    ? Math.round(logged.reduce((s, d) => s + d.protein, 0) / logged.length)
    : 0;

  // Échelle du graphique : le plus grand entre l'objectif et le pire jour.
  const scale = Math.max(calorieGoal, ...days.map((d) => d.kcal), 1) * 1.12;
  const isCurrentWeek = monday === currentMonday;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.three,
        paddingHorizontal: Spacing.five,
        paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing.seven,
        gap: Spacing.four,
      }}
      showsVerticalScrollIndicator={false}>
      <Txt variant="title">Stats</Txt>

      {/* Navigation de semaine */}
      <Row style={{ justifyContent: 'space-between' }}>
        <ArrowButton icon="chevronLeft" onPress={() => setMonday(addDays(monday, -7))} />
        <View style={{ alignItems: 'center' }}>
          <Txt variant="heading">{humanWeek(monday)}</Txt>
          <Txt variant="caption" muted>
            {weekRangeLabel(monday)}
          </Txt>
        </View>
        <ArrowButton
          icon="chevronRight"
          disabled={isCurrentWeek}
          onPress={() => setMonday(addDays(monday, 7))}
        />
      </Row>

      {/* Graphique de la semaine */}
      <Card style={{ gap: Spacing.four }}>
        {/* Barres et initiales des jours forment un bloc : elles se touchent. */}
        <View style={{ gap: Spacing.two }}>
          <View style={{ height: CHART_HEIGHT, justifyContent: 'flex-end' }}>
            <Row gap={Spacing.two} style={{ alignItems: 'flex-end', height: '100%' }}>
              {days.map((d) => {
                const over = d.kcal > d.goal + debtBuffer(d.goal);
                const height = d.logged ? Math.max((d.kcal / scale) * CHART_HEIGHT, 6) : 4;
                return (
                  <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: Spacing.one }}>
                    {d.logged ? (
                      <Txt
                        variant="caption"
                        color={over ? t.saving : t.textSecondary}
                        style={{ fontSize: 10 }}>
                        {Math.round(d.kcal)}
                      </Txt>
                    ) : null}
                    <View
                      style={{
                        width: '78%',
                        height,
                        borderRadius: Radius.sm,
                        backgroundColor: !d.logged
                          ? t.ringTrack
                          : over
                            ? t.saving
                            : t.proteinDone,
                        opacity: d.future ? 0.4 : 1,
                      }}
                    />
                  </View>
                );
              })}
            </Row>
          </View>

          <Row gap={Spacing.two}>
            {days.map((d) => (
              <Txt
                key={d.day}
                variant="caption"
                muted
                style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>
                {weekdayLetter(d.day)}
              </Txt>
            ))}
          </Row>
        </View>
      </Card>

      {/* Moyennes, calculées sur les seuls jours renseignés de la semaine */}
      <View style={{ gap: Spacing.three }}>
        <SectionTitle>Moyenne de la semaine</SectionTitle>
        <Row gap={Spacing.three} style={{ alignItems: 'stretch' }}>
          <Tile label="Calories" value={avgKcal} unit="kcal" />
          <Tile label="Protéines" value={avgProtein} unit="g" />
        </Row>
        <Txt variant="caption" muted>
          Calculée sur {logged.length} jour{logged.length > 1 ? 's' : ''} renseigné
          {logged.length > 1 ? 's' : ''}, pas sur 7.
        </Txt>
      </View>

      {logged.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six }}>
          <Icon name="calendar" size={28} color={t.textSecondary} />
          <Txt variant="body" muted style={{ textAlign: 'center' }}>
            Rien d&apos;enregistré cette semaine-là.
          </Txt>
        </Card>
      ) : null}
    </ScrollView>
  );
}

/** Tuile de moyenne. Les deux partagent la même hauteur via `alignItems: stretch`. */
function Tile({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <Card style={{ flex: 1, gap: Spacing.two, paddingVertical: Spacing.four }}>
      <SectionTitle>{label}</SectionTitle>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.one }}>
        <Txt variant="title" style={{ fontSize: 26 }}>
          {value}
        </Txt>
        <Txt variant="label" muted>
          {unit}
        </Txt>
      </View>
    </Card>
  );
}

function ArrowButton({
  icon,
  onPress,
  disabled,
}: {
  icon: 'chevronLeft' | 'chevronRight';
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: Radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.cardAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
        opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
      })}>
      <Icon name={icon} size={18} />
    </Pressable>
  );
}
