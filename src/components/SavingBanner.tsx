import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Row, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DayKey, daysBetween, humanDay } from '@/lib/date';
import { dailySaving, savedSoFar, type DayAdjustment } from '@/lib/nutrition';

/**
 * Bandeau affiché sur l'accueil : soit « tu épargnes X kcal aujourd'hui »,
 * soit « c'est le jour J, +X kcal débloquées ».
 */
export function SavingBanner({ adjustment, day }: { adjustment: DayAdjustment; day: DayKey }) {
  const t = useTheme();
  const router = useRouter();

  const event = adjustment.happeningToday[0] ?? adjustment.savingFor[0];
  if (!event) return null;

  const isEventDay = adjustment.happeningToday.length > 0;
  const daysLeft = daysBetween(day, event.date);
  const saved = savedSoFar(event, day);
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
            <Txt variant="heading" color={t.saving}>
              −{dailySaving(event)}
            </Txt>
            <Txt variant="caption" muted>
              kcal aujourd&apos;hui
            </Txt>
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
            {adjustment.savingFor.length > 1
              ? ` · +${adjustment.savingFor.length - 1} autre événement`
              : ''}
          </Txt>
        </>
      )}
    </Pressable>
  );
}
