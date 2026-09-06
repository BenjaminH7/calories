import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/CalorieRing';
import { Icon } from '@/components/Icon';
import { ProteinBar } from '@/components/ProteinBar';
import { SavingBanner } from '@/components/SavingBanner';
import { Card, Divider, Row, SectionTitle, Txt } from '@/components/ui';
import { WeekStrip, type DaySummary } from '@/components/WeekStrip';
import { Radius, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DayKey, daysBetween, humanDay, today, weekEndingAt } from '@/lib/date';
import { calorieStreak, effectiveCalorieGoal } from '@/lib/nutrition';
import { MEAL_EMOJI, MEAL_LABELS, MEAL_ORDER, UNIT_LABELS, type FoodEntry } from '@/store/types';
import { entriesForDay, totalsForDay, useAppStore } from '@/store/useAppStore';

export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState<DayKey>(today());

  const entries = useAppStore((s) => s.entries);
  const events = useAppStore((s) => s.events);
  const calorieGoal = useAppStore((s) => s.calorieGoal);
  const proteinGoal = useAppStore((s) => s.proteinGoal);
  const removeEntry = useAppStore((s) => s.removeEntry);

  const dayEntries = useMemo(() => entriesForDay(entries, day), [entries, day]);
  const totals = useMemo(() => totalsForDay(entries, day), [entries, day]);
  const { goal, adjustment } = useMemo(
    () => effectiveCalorieGoal(calorieGoal, events, day),
    [calorieGoal, events, day],
  );
  const eventDays = useMemo(() => new Set(events.map((e) => e.date)), [events]);

  // Série de jours consécutifs dans l'objectif calories.
  const streak = useMemo(
    () =>
      calorieStreak((d) => totalsForDay(entries, d).kcal, calorieGoal, events, today()),
    [entries, calorieGoal, events],
  );

  // Événements à venir dont l'épargne n'a pas encore démarré.
  const pendingEvents = useMemo(
    () =>
      events
        .filter((e) => e.date > day && daysBetween(day, e.date) > e.spreadDays)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, day],
  );

  // Bilan des 7 derniers jours : consommé vs objectif ajusté.
  const week = useMemo<DaySummary[]>(() => {
    const anchor = day > today() ? day : today();
    return weekEndingAt(anchor).map((d) => {
      const dayTotals = totalsForDay(entries, d);
      return {
        day: d,
        kcal: dayTotals.kcal,
        goal: effectiveCalorieGoal(calorieGoal, events, d).goal,
        hasEntries: dayTotals.kcal > 0,
        hasEvent: eventDays.has(d),
      };
    });
  }, [entries, events, calorieGoal, day, eventDays]);

  // Journal découpé par repas, dans l'ordre de la journée.
  const meals = useMemo(
    () =>
      MEAL_ORDER.map((meal) => {
        const items = dayEntries.filter((e) => e.meal === meal);
        return {
          meal,
          items,
          kcal: items.reduce((sum, e) => sum + e.kcal, 0),
        };
      }),
    [dayEntries],
  );

  const confirmDelete = (entry: FoodEntry) =>
    Alert.alert(entry.name, 'Supprimer cet aliment ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeEntry(entry.id) },
    ]);

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
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Txt variant="title">{humanDay(day)}</Txt>
          <Txt variant="caption" muted>
            {adjustment.saved > 0
              ? `Objectif ajusté : ${goal} kcal`
              : `Objectif : ${goal} kcal · ${proteinGoal} g de protéines`}
          </Txt>
        </View>
        <Row gap={Spacing.two}>
          {day !== today() ? (
            <Pressable
              onPress={() => setDay(today())}
              style={({ pressed }) => ({
                paddingHorizontal: Spacing.four,
                paddingVertical: Spacing.two,
                borderRadius: Radius.pill,
                backgroundColor: t.cardAlt,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Txt variant="label">Aujourd&apos;hui</Txt>
            </Pressable>
          ) : null}

          <StreakBadge streak={streak} />
        </Row>
      </Row>

      <WeekStrip days={week} selected={day} onSelect={setDay} />

      <Card style={{ alignItems: 'center', gap: Spacing.four, paddingVertical: Spacing.six }}>
        <CalorieRing consumed={totals.kcal} goal={goal} />

        <Row gap={Spacing.six}>
          <Stat label="Consommé" value={`${Math.round(totals.kcal)}`} />
          <View style={{ width: 1, height: 28, backgroundColor: t.border }} />
          <Stat label="Objectif" value={`${goal}`} />
          {adjustment.saved > 0 && (
            <>
              <View style={{ width: 1, height: 28, backgroundColor: t.border }} />
              <Stat label="Épargné" value={`−${adjustment.saved}`} color={t.saving} />
            </>
          )}
        </Row>
      </Card>

      <ProteinBar consumed={totals.protein} goal={proteinGoal} />

      <SavingBanner adjustment={adjustment} day={day} upcoming={pendingEvents} />

      <View style={{ gap: Spacing.three }}>
        <SectionTitle>
          Journal · {dayEntries.length} aliment{dayEntries.length > 1 ? 's' : ''}
        </SectionTitle>

        {meals.map(({ meal, items, kcal }) => (
          <Card key={meal} padded={false} style={{ overflow: 'hidden' }}>
            <Pressable
              onPress={() => router.push({ pathname: '/add', params: { day, meal } })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                paddingHorizontal: Spacing.four,
                paddingVertical: Spacing.three,
                backgroundColor: t.cardAlt,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Txt variant="body">{MEAL_EMOJI[meal]}</Txt>
              <Txt variant="heading" style={{ flex: 1, fontSize: 15 }}>
                {MEAL_LABELS[meal]}
              </Txt>
              <Txt variant="label" muted>
                {items.length > 0 ? `${Math.round(kcal)} kcal` : 'vide'}
              </Txt>
              <Icon name="plus" size={16} color={t.textSecondary} />
            </Pressable>

            {items.map((entry, i) => (
              <View key={entry.id}>
                {i > 0 && <Divider />}
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/add/portion', params: { entryId: entry.id } })
                  }
                  onLongPress={() => confirmDelete(entry)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.three,
                    padding: Spacing.four,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="heading" style={{ fontSize: 15 }} numberOfLines={1}>
                      {entry.name}
                    </Txt>
                    <Txt variant="caption" muted numberOfLines={1}>
                      {entry.brand ? `${entry.brand} · ` : ''}
                      {formatQuantity(entry)}
                    </Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="heading" style={{ fontSize: 15 }}>
                      {Math.round(entry.kcal)} kcal
                    </Txt>
                    <Txt variant="caption" muted>
                      {Math.round(entry.protein * 10) / 10} g prot.
                    </Txt>
                  </View>
                  <Icon name="chevronRight" size={16} color={t.textSecondary} />
                </Pressable>
              </View>
            ))}
          </Card>
        ))}

        {dayEntries.length === 0 ? (
          <Txt variant="caption" muted style={{ textAlign: 'center', paddingTop: Spacing.two }}>
            Touche un repas pour y ajouter un aliment.
          </Txt>
        ) : null}
      </View>
    </ScrollView>
  );
}

function formatQuantity(entry: FoodEntry) {
  const unit = UNIT_LABELS[entry.unit];
  const plural = (entry.unit === 'piece' || entry.unit === 'serving') && entry.quantity > 1 ? 's' : '';
  return `${Math.round(entry.quantity * 10) / 10} ${unit}${plural}`;
}

/** Série de jours dans l'objectif. S'éteint en gris quand la série est à zéro. */
function StreakBadge({ streak }: { streak: number }) {
  const t = useTheme();
  const alive = streak > 0;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={
        alive ? `Série de ${streak} jour${streak > 1 ? 's' : ''} dans l'objectif` : 'Aucune série en cours'
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Radius.pill,
        backgroundColor: alive ? `${t.saving}22` : t.cardAlt,
      }}>
      <Icon name="flame" size={17} color={alive ? t.saving : t.textSecondary} filled={alive} />
      <Txt variant="heading" style={{ fontSize: 15 }} color={alive ? t.saving : t.textSecondary}>
        {streak}
      </Txt>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt variant="heading" color={color}>
        {value}
      </Txt>
      <Txt variant="caption" muted>
        {label}
      </Txt>
    </View>
  );
}
