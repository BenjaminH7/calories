import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Card, OptionRow, Row, SectionTitle, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ACTIVITY_HINTS,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  suggestTargets,
} from '@/lib/nutrition';
import type { Activity, Goal, Profile, Sex } from '@/store/types';
import { DEFAULT_PROFILE, useAppStore } from '@/store/useAppStore';

const STEPS = ['sex', 'body', 'activity', 'goal', 'targets'] as const;
type Step = (typeof STEPS)[number];

const PACES = [0.25, 0.5, 0.75, 1];

export default function OnboardingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [overrides, setOverrides] = useState<{ calorieGoal?: string; proteinGoal?: string }>({});

  const step: Step = STEPS[stepIndex];
  const suggested = useMemo(() => suggestTargets(profile), [profile]);

  const calorieGoal = parseInt(overrides.calorieGoal ?? '', 10) || suggested.calorieGoal;
  const proteinGoal = parseInt(overrides.proteinGoal ?? '', 10) || suggested.proteinGoal;

  const patch = (p: Partial<Profile>) => setProfile((prev) => ({ ...prev, ...p }));

  const go = (delta: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)));
  };

  const finish = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding(profile, calorieGoal, proteinGoal);
  };

  const bodyValid =
    profile.age >= 10 && profile.age <= 100 &&
    profile.heightCm >= 120 && profile.heightCm <= 230 &&
    profile.weightKg >= 30 && profile.weightKg <= 300;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.background, paddingTop: insets.top + Spacing.four }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingHorizontal: Spacing.five, gap: Spacing.four }}>
        <Row gap={Spacing.three}>
          {stepIndex > 0 ? (
            <Pressable onPress={() => go(-1)} hitSlop={10}>
              <Icon name="chevronLeft" size={22} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.ringTrack }}>
            <View
              style={{
                width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
                height: '100%',
                borderRadius: 3,
                backgroundColor: t.accent,
              }}
            />
          </View>
          <Txt variant="caption" muted>
            {stepIndex + 1}/{STEPS.length}
          </Txt>
        </Row>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.five,
          paddingBottom: Spacing.seven,
          gap: Spacing.five,
        }}
        keyboardShouldPersistTaps="handled">
        {step === 'sex' && (
          <>
            <Heading title="On commence par toi" subtitle="Pour estimer ta dépense énergétique." />
            <View style={{ gap: Spacing.three }}>
              {(['male', 'female'] as Sex[]).map((s) => (
                <OptionRow
                  key={s}
                  title={s === 'male' ? 'Homme' : 'Femme'}
                  selected={profile.sex === s}
                  onPress={() => patch({ sex: s })}
                />
              ))}
            </View>
          </>
        )}

        {step === 'body' && (
          <>
            <Heading title="Tes mesures" subtitle="Modifiables à tout moment dans les réglages." />
            <Card style={{ gap: Spacing.five }}>
              <StatInput
                label="Âge"
                suffix="ans"
                value={profile.age}
                onChange={(v) => patch({ age: v })}
              />
              <StatInput
                label="Taille"
                suffix="cm"
                value={profile.heightCm}
                onChange={(v) => patch({ heightCm: v })}
              />
              <StatInput
                label="Poids"
                suffix="kg"
                value={profile.weightKg}
                onChange={(v) => patch({ weightKg: v })}
                allowDecimal
              />
            </Card>
            {!bodyValid ? (
              <Txt variant="caption" color={t.danger}>
                Vérifie tes valeurs : âge 10–100, taille 120–230 cm, poids 30–300 kg.
              </Txt>
            ) : null}
          </>
        )}

        {step === 'activity' && (
          <>
            <Heading title="Ton activité" subtitle="Sur une semaine typique." />
            <View style={{ gap: Spacing.three }}>
              {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                <OptionRow
                  key={a}
                  title={ACTIVITY_LABELS[a]}
                  subtitle={ACTIVITY_HINTS[a]}
                  selected={profile.activity === a}
                  onPress={() => patch({ activity: a })}
                />
              ))}
            </View>
          </>
        )}

        {step === 'goal' && (
          <>
            <Heading title="Ton objectif" subtitle="On ajustera les calories en conséquence." />
            <View style={{ gap: Spacing.three }}>
              {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                <OptionRow
                  key={g}
                  title={GOAL_LABELS[g]}
                  selected={profile.goal === g}
                  onPress={() => patch({ goal: g })}
                />
              ))}
            </View>

            {profile.goal !== 'maintain' && (
              <Card style={{ gap: Spacing.four }}>
                <SectionTitle>
                  Rythme visé ({profile.goal === 'lose' ? 'perte' : 'prise'})
                </SectionTitle>
                <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
                  {PACES.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => patch({ paceKgPerWeek: p })}
                      style={{
                        paddingVertical: Spacing.two,
                        paddingHorizontal: Spacing.four,
                        borderRadius: Radius.pill,
                        backgroundColor: profile.paceKgPerWeek === p ? t.accent : t.cardAlt,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: profile.paceKgPerWeek === p ? t.accent : t.border,
                      }}>
                      <Txt
                        variant="label"
                        color={profile.paceKgPerWeek === p ? t.accentText : t.text}>
                        {p} kg / sem.
                      </Txt>
                    </Pressable>
                  ))}
                </Row>
              </Card>
            )}
          </>
        )}

        {step === 'targets' && (
          <>
            <Heading title="Tes objectifs" subtitle="Calculés avec la formule Mifflin-St Jeor." />
            <Card style={{ gap: Spacing.five }}>
              <TargetInput
                label="Calories par jour"
                suffix="kcal"
                value={overrides.calorieGoal ?? String(suggested.calorieGoal)}
                onChange={(v) => setOverrides((o) => ({ ...o, calorieGoal: v }))}
              />
              <TargetInput
                label="Protéines par jour"
                suffix="g"
                color={t.protein}
                value={overrides.proteinGoal ?? String(suggested.proteinGoal)}
                onChange={(v) => setOverrides((o) => ({ ...o, proteinGoal: v }))}
              />
            </Card>
            <Txt variant="caption" muted>
              Suggestion : {suggested.calorieGoal} kcal et {suggested.proteinGoal} g de protéines.
              Tu peux ajuster librement.
            </Txt>
          </>
        )}
      </ScrollView>

      <View
        style={{
          padding: Spacing.five,
          paddingBottom: insets.bottom + Spacing.four,
          gap: Spacing.three,
        }}>
        {step === 'targets' ? (
          <Button title="C'est parti" onPress={finish} disabled={calorieGoal <= 0} />
        ) : (
          <Button title="Continuer" onPress={() => go(1)} disabled={step === 'body' && !bodyValid} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <Txt variant="title">{title}</Txt>
      <Txt variant="body" muted>
        {subtitle}
      </Txt>
    </View>
  );
}

function StatInput({
  label,
  suffix,
  value,
  onChange,
  allowDecimal,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (value: number) => void;
  allowDecimal?: boolean;
}) {
  const t = useTheme();
  const [text, setText] = useState(String(value));

  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt variant="heading">{label}</Txt>
      <Row gap={Spacing.two} style={{ alignItems: 'baseline' }}>
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            const parsed = allowDecimal
              ? parseFloat(next.replace(',', '.'))
              : parseInt(next, 10);
            if (Number.isFinite(parsed)) onChange(parsed);
          }}
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          style={{
            fontFamily: Fonts.rounded,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.6,
            color: t.text,
            textAlign: 'right',
            minWidth: 70,
            paddingVertical: 0,
          }}
        />
        <Txt variant="label" muted>
          {suffix}
        </Txt>
      </Row>
    </Row>
  );
}

function TargetInput({
  label,
  suffix,
  value,
  onChange,
  color,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
  color?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: Spacing.two }}>
      <SectionTitle>{label}</SectionTitle>
      <Row gap={Spacing.two} style={{ alignItems: 'baseline' }}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
          keyboardType="number-pad"
          selectTextOnFocus
          style={{
            fontFamily: Fonts.rounded,
            fontSize: 40,
            fontWeight: '800',
            letterSpacing: -1.2,
            color: color ?? t.text,
            paddingVertical: 0,
            minWidth: 100,
          }}
        />
        <Txt variant="heading" muted>
          {suffix}
        </Txt>
      </Row>
    </View>
  );
}
