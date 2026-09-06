import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Row, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysBetween, humanDay, shortDate, type DayKey } from '@/lib/date';
import { dailySaving, realSavedSoFar, savingStart, type DayAdjustment } from '@/lib/nutrition';
import type { CalorieEvent } from '@/store/types';

/**
 * Bandeau affiché sur l'accueil : soit « tu épargnes X kcal aujourd'hui »,
 * soit « c'est le jour J, +X kcal débloquées ».
 *
 * Quand une dette est active, le prélèvement du jour est gelé (pas de
 * double effort) : on l'affiche en pause plutôt que d'annoncer un montant
 * qui n'a pas vraiment été retiré. Le total « déjà mis de côté » reste
 * honnête — un jour gelé n'y contribue jamais, même rétroactivement.
 */
export function SavingBanner({
  adjustment,
  day,
  upcoming,
  frozen,
  totalsFor,
  baseGoal,
  events,
}: {
  adjustment: DayAdjustment;
  day: DayKey;
  /** Événements créés dont la fenêtre d'épargne n'a pas encore commencé. */
  upcoming?: CalorieEvent[];
  /** Dette active aujourd'hui : le prélèvement du jour est gelé. */
  frozen: boolean;
  totalsFor: (d: DayKey) => number;
  baseGoal: number;
  events: CalorieEvent[];
}) {
  const t = useTheme();
  const router = useRouter();

  const event = adjustment.happeningToday[0] ?? adjustment.savingFor[0];

  // Rien ne se prélève aujourd'hui : on annonce quand même l'échéance, sinon
  // l'utilisateur croit que son épargne ne fait rien.
  if (!event) {
    const next = upcoming?.[0];
    if (!next) return null;
    return (
      <Pressable
        onPress={() => router.push('/(tabs)/events')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
          backgroundColor: t.card,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: Radius.lg,
          padding: Spacing.four,
          opacity: pressed ? 0.85 : 1,
        })}>
        <Txt variant="heading">{next.emoji}</Txt>
        <View style={{ flex: 1 }}>
          <Txt variant="label" numberOfLines={1}>
            {next.name} · {humanDay(next.date)}
          </Txt>
          <Txt variant="caption" muted>
            Épargne à partir du {shortDate(savingStart(next))} · −{dailySaving(next)} kcal / jour
          </Txt>
        </View>
      </Pressable>
    );
  }

  const isEventDay = adjustment.happeningToday.length > 0;
  const daysLeft = daysBetween(day, event.date);
  const saved = realSavedSoFar(totalsFor, baseGoal, events, event, day);
  const ratio = Math.min(saved / Math.max(1, event.budget), 1);

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/events')}
      style={({ pressed }) => ({
        backgroundColor: isEventDay ? t.accent : t.card,
        borderColor: isEventDay ? t.accent : t.border,
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.five,
        gap: Spacing.three,
        opacity: pressed ? 0.85 : 1,
      })}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={Spacing.three} style={{ flex: 1 }}>
          <Txt variant="title" style={{ fontSize: 24 }}>
            {event.emoji}
          </Txt>
          <View style={{ flex: 1 }}>
            <Txt variant="heading" color={isEventDay ? t.accentText : t.text} numberOfLines={1}>
              {event.name}
            </Txt>
            <Txt variant="caption" color={isEventDay ? t.accentText : t.textSecondary}>
              {isEventDay
                ? `+${event.budget} kcal débloquées aujourd'hui`
                : `${humanDay(event.date)} · dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
            </Txt>
          </View>
        </Row>

        {!isEventDay && (
          <View style={{ alignItems: 'flex-end' }}>
            {frozen ? (
              <Txt variant="heading" color={t.textSecondary}>
                En pause
              </Txt>
            ) : (
              <>
                <Txt variant="heading" color={t.saving}>
                  −{dailySaving(event, day)}
                </Txt>
                <Txt variant="caption" muted>
                  kcal aujourd&apos;hui
                </Txt>
              </>
            )}
          </View>
        )}
      </Row>

      {!isEventDay && (
        <>
          <View
            style={{
              height: 8,
              borderRadius: Radius.pill,
              backgroundColor: t.ringTrack,
              overflow: 'hidden',
            }}>
            <View
              style={{
                width: `${ratio * 100}%`,
                height: '100%',
                backgroundColor: t.saving,
                borderRadius: Radius.pill,
              }}
            />
          </View>
          <Txt variant="caption" muted>
            {Math.round(saved)} / {event.budget} kcal déjà mis de côté
            {frozen ? ' · gelé le temps du rééquilibrage' : ''}
            {adjustment.savingFor.length > 1
              ? ` · +${adjustment.savingFor.length - 1} autre événement`
              : ''}
          </Txt>
        </>
      )}
    </Pressable>
  );
}
