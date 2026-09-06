import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { Button, Card, Chip, Row, SectionTitle, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useModalTopInset } from '@/hooks/use-modal-inset';
import { useTheme } from '@/hooks/use-theme';
import { addDays, daysBetween, humanDay, shortDate, today, type DayKey } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';

const PRESETS = [
  { emoji: '🍽️', name: 'Restaurant', budget: 1000 },
  { emoji: '🍕', name: 'Pizza', budget: 800 },
  { emoji: '🎂', name: 'Anniversaire', budget: 900 },
  { emoji: '🍔', name: 'Burger', budget: 1200 },
  { emoji: '🍻', name: 'Soirée', budget: 700 },
  { emoji: '🥐', name: 'Brunch', budget: 600 },
];

const BUDGETS = [500, 700, 1000, 1500, 2000];
/** Durées proposées ; la durée maximale possible est toujours ajoutée en plus. */
const SPREADS = [3, 5, 7, 10, 14, 21, 30];

export default function NewEventScreen() {
  const t = useTheme();
  const router = useRouter();
  const topInset = useModalTopInset();
  const addEvent = useAppStore((s) => s.addEvent);
  const calorieGoal = useAppStore((s) => s.calorieGoal);

  const [emoji, setEmoji] = useState('🍽️');
  const [name, setName] = useState('Restaurant');
  const [budget, setBudget] = useState(1000);
  const [budgetInput, setBudgetInput] = useState('1000');
  const [date, setDate] = useState<DayKey>(addDays(today(), 7));
  const [spread, setSpread] = useState(7);

  // On ne peut pas épargner plus de jours qu'il n'en reste avant l'événement.
  const maxSpread = Math.max(1, daysBetween(today(), date));
  const effectiveSpread = Math.min(spread, maxSpread);
  const perDay = Math.round(budget / Math.max(1, effectiveSpread) / 5) * 5;
  const adjustedGoal = Math.max(0, calorieGoal - perDay);
  const tooAggressive = perDay > calorieGoal * 0.25;

  const dateOptions = useMemo(
    () => Array.from({ length: 60 }, (_, i) => addDays(today(), i + 1)),
    [],
  );

  // Les durées plus longues que le délai restant n'ont pas de sens ; on ajoute
  // toujours le maximum possible, qui fait démarrer l'épargne dès aujourd'hui.
  const spreadOptions = useMemo(
    () => [...new Set([...SPREADS.filter((s) => s < maxSpread), maxSpread])],
    [maxSpread],
  );

  const savingStartsOn = addDays(date, -effectiveSpread);
  const startsToday = effectiveSpread === maxSpread;

  const save = () => {
    if (!name.trim() || budget <= 0) return;
    addEvent({
      name: name.trim(),
      emoji,
      date,
      budget: Math.round(budget),
      spreadDays: effectiveSpread,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingTop: topInset }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader title="Nouvel événement" subtitle="Épargne de calories" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.five,
          paddingBottom: Spacing.seven,
          gap: Spacing.four,
        }}
        keyboardShouldPersistTaps="handled">
        <Card style={{ gap: Spacing.four }}>
          <SectionTitle>C&apos;est quoi ?</SectionTitle>
          <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <Chip
                key={p.name}
                label={`${p.emoji} ${p.name}`}
                selected={name === p.name && emoji === p.emoji}
                onPress={() => {
                  setEmoji(p.emoji);
                  setName(p.name);
                  setBudget(p.budget);
                  setBudgetInput(String(p.budget));
                }}
              />
            ))}
          </Row>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nom de l'événement"
            placeholderTextColor={t.textSecondary}
            style={{
              fontFamily: Fonts.rounded,
              fontSize: 17,
              fontWeight: '600',
              color: t.text,
              backgroundColor: t.cardAlt,
              borderRadius: Radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.border,
              paddingHorizontal: Spacing.four,
              paddingVertical: Spacing.three,
            }}
          />
        </Card>

        <Card style={{ gap: Spacing.four }}>
          <SectionTitle>Quand ?</SectionTitle>
          <Txt variant="heading">{humanDay(date)}</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
            {dateOptions.map((d) => (
              <Chip key={d} label={shortDate(d)} selected={d === date} onPress={() => setDate(d)} />
            ))}
          </ScrollView>
        </Card>

        <Card style={{ gap: Spacing.four }}>
          <SectionTitle>Budget calories du jour J</SectionTitle>
          <Row gap={Spacing.two} style={{ alignItems: 'baseline' }}>
            <TextInput
              value={budgetInput}
              onChangeText={(text) => {
                setBudgetInput(text);
                const parsed = parseInt(text.replace(/\D/g, ''), 10);
                setBudget(Number.isFinite(parsed) ? parsed : 0);
              }}
              keyboardType="number-pad"
              selectTextOnFocus
              style={{
                fontFamily: Fonts.rounded,
                fontSize: 40,
                fontWeight: '800',
                letterSpacing: -1.2,
                color: t.text,
                paddingVertical: 0,
                minWidth: 110,
              }}
            />
            <Txt variant="heading" muted>
              kcal en plus
            </Txt>
          </Row>
          <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
            {BUDGETS.map((b) => (
              <Chip
                key={b}
                label={`${b}`}
                selected={budget === b}
                onPress={() => {
                  setBudget(b);
                  setBudgetInput(String(b));
                }}
              />
            ))}
          </Row>
        </Card>

        <Card style={{ gap: Spacing.four }}>
          <SectionTitle>Épargner sur combien de jours ?</SectionTitle>
          <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
            {spreadOptions.map((s) => (
              <Chip
                key={s}
                label={s === maxSpread ? `Dès aujourd'hui (${s} j)` : `${s} jours`}
                selected={effectiveSpread === s}
                onPress={() => setSpread(s)}
              />
            ))}
          </Row>
          <Txt variant="caption" muted>
            {startsToday
              ? `L'épargne démarre aujourd'hui, au plus tôt possible.`
              : `L'épargne démarrera le ${shortDate(savingStartsOn)}. Choisis une durée plus longue pour commencer plus tôt.`}
          </Txt>
        </Card>

        <Card style={{ gap: Spacing.three, backgroundColor: t.cardAlt }}>
          <SectionTitle>Ce que ça donne</SectionTitle>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Txt variant="title" color={t.saving}>
                −{perDay}
              </Txt>
              <Txt variant="caption" muted>
                kcal / jour pendant {effectiveSpread} j
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="title">{adjustedGoal}</Txt>
              <Txt variant="caption" muted>
                objectif quotidien ajusté
              </Txt>
            </View>
          </Row>
          <Txt variant="caption" muted>
            Du {startsToday ? "aujourd'hui" : shortDate(savingStartsOn)} au{' '}
            {shortDate(addDays(date, -1))}, puis le {shortDate(date)} ton objectif passera à{' '}
            <Txt variant="caption" color={t.text}>
              {calorieGoal + Math.round(budget)} kcal
            </Txt>
            .
          </Txt>
          {tooAggressive ? (
            <Txt variant="caption" color={t.danger}>
              Ça fait plus de 25 % de ton objectif en moins chaque jour. Étale sur plus de jours ou
              baisse le budget.
            </Txt>
          ) : null}
        </Card>

        <Button title="Créer l'épargne" onPress={save} disabled={!name.trim() || budget <= 0} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
