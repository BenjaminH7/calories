import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Card, Row, SectionTitle, Txt } from '@/components/ui';
import { Radius, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysBetween, humanDay, shortDate, today } from '@/lib/date';
import { adjustmentsFor, dailyGoal, dailySaving, savedSoFar, savingStart } from '@/lib/nutrition';
import type { CalorieEvent } from '@/store/types';
import { pastEvents, totalsForDay, upcomingEvents, useAppStore } from '@/store/useAppStore';

export default function EventsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = today();

  const entries = useAppStore((s) => s.entries);
  const events = useAppStore((s) => s.events);
  const calorieGoal = useAppStore((s) => s.calorieGoal);
  const removeEvent = useAppStore((s) => s.removeEvent);

  const upcoming = useMemo(() => upcomingEvents(events, now), [events, now]);
  const past = useMemo(() => pastEvents(events, now), [events, now]);
  // Même calcul que l'accueil : seuls les événements dont la fenêtre d'épargne
  // a commencé prélèvent quelque chose aujourd'hui.
  const savedToday = useMemo(() => adjustmentsFor(events, now).saved, [events, now]);
  const todayGoal = useMemo(
    () => dailyGoal((d) => totalsForDay(entries, d).kcal, calorieGoal, events, now).goal,
    [entries, calorieGoal, events, now],
  );

  // Événements créés mais dont l'épargne n'a pas encore démarré.
  const notStarted = useMemo(
    () => upcoming.filter((e) => daysBetween(now, e.date) > e.spreadDays),
    [upcoming, now],
  );

  const confirmDelete = (event: CalorieEvent) =>
    Alert.alert(event.name, "Annuler cette épargne ? L'objectif quotidien revient à la normale.", [
      { text: 'Garder', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeEvent(event.id) },
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
      <View>
        <Txt variant="title">Épargne</Txt>
        <Txt variant="caption" muted>
          Mets des calories de côté avant un gros repas.
        </Txt>
      </View>

      <Card style={{ gap: Spacing.three }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <SectionTitle>Prélevé aujourd&apos;hui</SectionTitle>
            <Txt variant="title" color={savedToday > 0 ? t.saving : t.text}>
              −{savedToday} kcal
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <SectionTitle>Objectif du jour</SectionTitle>
            <Txt variant="title">{todayGoal}</Txt>
          </View>
        </Row>
        <Txt variant="caption" muted>
          {savedToday > 0
            ? `Ton objectif de base (${calorieGoal} kcal) est réduit tant que l'épargne tourne.`
            : notStarted.length > 0
              ? `L'épargne n'a pas encore démarré : elle commencera le ${shortDate(
                  savingStart(notStarted[0]),
                )}, ${notStarted[0].spreadDays} jours avant « ${notStarted[0].name} ».`
              : 'Aucune épargne en cours. Crée un événement pour commencer.'}
        </Txt>
      </Card>

      <Button
        title="Nouvel événement"
        icon={<Icon name="plus" size={18} color={t.accentText} />}
        onPress={() => router.push('/event/new')}
      />

      {upcoming.length > 0 && (
        <View style={{ gap: Spacing.three }}>
          <SectionTitle>À venir</SectionTitle>
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} onDelete={() => confirmDelete(event)} />
          ))}
        </View>
      )}

      {upcoming.length === 0 && (
        <Card style={{ alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.seven }}>
          <Icon name="calendar" size={30} color={t.textSecondary} />
          <Txt variant="heading" style={{ textAlign: 'center' }}>
            Un resto en vue ?
          </Txt>
          <Txt variant="body" muted style={{ textAlign: 'center' }}>
            Dis-nous quand et combien tu comptes manger.{'\n'}
            On répartit l&apos;effort sur les jours d&apos;avant.
          </Txt>
        </Card>
      )}

      {past.length > 0 && (
        <View style={{ gap: Spacing.three }}>
          <SectionTitle>Passés</SectionTitle>
          {past.slice(0, 10).map((event) => (
            <Pressable
              key={event.id}
              onLongPress={() => confirmDelete(event)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                backgroundColor: t.card,
                borderRadius: Radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.border,
                padding: Spacing.four,
                opacity: 0.65,
              }}>
              <Txt variant="heading">{event.emoji}</Txt>
              <View style={{ flex: 1 }}>
                <Txt variant="heading" style={{ fontSize: 15 }} numberOfLines={1}>
                  {event.name}
                </Txt>
                <Txt variant="caption" muted>
                  {shortDate(event.date)} · {event.budget} kcal
                </Txt>
              </View>
              <Icon name="check" size={16} color={t.textSecondary} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function EventCard({ event, onDelete }: { event: CalorieEvent; onDelete: () => void }) {
  const t = useTheme();
  const now = today();
  const daysLeft = daysBetween(now, event.date);
  const isToday = daysLeft === 0;
  const saved = savedSoFar(event, now);
  const ratio = Math.min(saved / Math.max(1, event.budget), 1);
  const savingActive = daysLeft >= 1 && daysLeft <= event.spreadDays;
  const perDay = savingActive ? dailySaving(event, now) : dailySaving(event);

  return (
    <Card style={{ gap: Spacing.four }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={Spacing.three} style={{ flex: 1 }}>
          <Txt variant="title" style={{ fontSize: 26 }}>
            {event.emoji}
          </Txt>
          <View style={{ flex: 1 }}>
            <Txt variant="heading" numberOfLines={1}>
              {event.name}
            </Txt>
            <Txt variant="caption" muted>
              {humanDay(event.date)} ·{' '}
              {isToday
                ? "c'est aujourd'hui"
                : `dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
            </Txt>
          </View>
        </Row>
        <Pressable onPress={onDelete} hitSlop={10}>
          <Icon name="trash" size={18} color={t.textSecondary} />
        </Pressable>
      </Row>

      <View style={{ gap: Spacing.two }}>
        <View
          style={{
            height: 10,
            borderRadius: Radius.pill,
            backgroundColor: t.ringTrack,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: `${ratio * 100}%`,
              height: '100%',
              borderRadius: Radius.pill,
              backgroundColor: isToday ? t.proteinDone : t.saving,
            }}
          />
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="caption" muted>
            {Math.round(saved)} / {event.budget} kcal épargnées
          </Txt>
          <Txt variant="caption" color={isToday ? t.proteinDone : t.saving}>
            {isToday ? `+${event.budget} kcal débloquées` : savingActive ? `−${perDay} kcal / jour` : 'épargne à venir'}
          </Txt>
        </Row>
      </View>

      {!isToday && (
        <Txt variant="caption" muted>
          {savingActive
            ? `Répartition sur ${event.spreadDays} jour${event.spreadDays > 1 ? 's' : ''} avant l'événement.`
            : `Ton objectif ne bougera qu'à partir du ${shortDate(savingStart(event))}, soit ${
                event.spreadDays
              } jour${event.spreadDays > 1 ? 's' : ''} avant.`}
        </Txt>
      )}
    </Card>
  );
}
