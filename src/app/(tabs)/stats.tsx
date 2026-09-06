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
import { effectiveCalorieGoal } from '@/lib/nutrition';
import { totalsForDay, useAppStore } from '@/store/useAppStore';

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
  const proteinGoal = useAppStore((s) => s.proteinGoal);

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
          goal: effectiveCalorieGoal(calorieGoal, events, day).goal,
          logged: totals.kcal > 0,
          future: day > today(),
        };
      }),
    [entries, events, calorieGoal, monday],
  );

  const logged = days.filter((d) => d.logged);
  const onTarget = logged.filter((d) => d.kcal <= d.goal).length;
  const proteinHit = logged.filter((d) => proteinGoal > 0 && d.protein >= proteinGoal).length;
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
      <Card style={{ gap: Spacing.five }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <SectionTitle>Moyenne par jour</SectionTitle>
            <Txt variant="title">
              {avgKcal}
              <Txt variant="heading" muted>
                {' '}
                kcal
              </Txt>
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <SectionTitle>Objectif</SectionTitle>
            <Txt variant="heading" muted>
              {calorieGoal} kcal
            </Txt>
          </View>
        </Row>

        <View style={{ height: 150, justifyContent: 'flex-end' }}>
          {/* Ligne d'objectif */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: (calorieGoal / scale) * 150,
              height: StyleSheet.hairlineWidth * 2,
              backgroundColor: t.border,
            }}
          />

          <Row gap={Spacing.two} style={{ alignItems: 'flex-end', height: '100%' }}>
            {days.map((d) => {
              const over = d.kcal > d.goal;
              const height = d.logged ? Math.max((d.kcal / scale) * 150, 6) : 4;
              return (
                <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: Spacing.one }}>
                  {d.logged ? (
                    <Txt variant="caption" muted style={{ fontSize: 9 }}>
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
                          ? t.danger
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
      </Card>

      {/* Résumé */}
      <Row gap={Spacing.three}>
        <Tile
          value={`${onTarget}/${logged.length || 0}`}
          label="jours dans l'objectif"
          color={onTarget === logged.length && logged.length > 0 ? t.proteinDone : undefined}
        />
        <Tile
          value={`${proteinHit}/${logged.length || 0}`}
          label="jours protéines OK"
          color={proteinHit === logged.length && logged.length > 0 ? t.proteinDone : undefined}
        />
      </Row>

      <Row gap={Spacing.three}>
        <Tile value={`${avgProtein} g`} label="protéines / jour" color={t.protein} />
        <Tile value={`${logged.length}/7`} label="jours renseignés" />
      </Row>

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

function Tile({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <Card style={{ flex: 1, gap: Spacing.one }}>
      <Txt variant="title" color={color} style={{ fontSize: 24 }}>
        {value}
      </Txt>
      <Txt variant="caption" muted>
        {label}
      </Txt>
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
