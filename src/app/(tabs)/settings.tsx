import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Chip, Divider, Row, SectionTitle, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  suggestTargets,
  tdee,
} from '@/lib/nutrition';
import type { Activity, Goal, Sex } from '@/store/types';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const profile = useAppStore((s) => s.profile);
  const calorieGoal = useAppStore((s) => s.calorieGoal);
  const proteinGoal = useAppStore((s) => s.proteinGoal);
  const setProfile = useAppStore((s) => s.setProfile);
  const setGoals = useAppStore((s) => s.setGoals);
  const resetAll = useAppStore((s) => s.resetAll);
  const entries = useAppStore((s) => s.entries);

  const [calorieText, setCalorieText] = useState(String(calorieGoal));
  const [proteinText, setProteinText] = useState(String(proteinGoal));

  const suggested = useMemo(() => suggestTargets(profile), [profile]);
  const maintenance = Math.round(tdee(profile));

  const commitGoals = () => {
    const kcal = parseInt(calorieText, 10);
    const prot = parseInt(proteinText, 10);
    setGoals(
      Number.isFinite(kcal) && kcal > 0 ? kcal : calorieGoal,
      Number.isFinite(prot) && prot > 0 ? prot : proteinGoal,
    );
  };

  const applySuggestion = () => {
    setCalorieText(String(suggested.calorieGoal));
    setProteinText(String(suggested.proteinGoal));
    setGoals(suggested.calorieGoal, suggested.proteinGoal);
  };

  const confirmReset = () =>
    Alert.alert(
      'Tout effacer',
      `${entries.length} aliment(s), tes événements et ton profil seront supprimés. Action définitive.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: resetAll },
      ],
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.three,
        paddingHorizontal: Spacing.five,
        paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing.seven,
        gap: Spacing.four,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Txt variant="title">Réglages</Txt>

      <Card style={{ gap: Spacing.five }}>
        <SectionTitle>Objectifs quotidiens</SectionTitle>

        <GoalInput
          label="Calories"
          suffix="kcal"
          value={calorieText}
          onChangeText={setCalorieText}
          onBlur={commitGoals}
        />
        <Divider />
        <GoalInput
          label="Protéines"
          suffix="g"
          color={t.protein}
          value={proteinText}
          onChangeText={setProteinText}
          onBlur={commitGoals}
        />

        <Txt variant="caption" muted>
          Maintenance estimée : {maintenance} kcal · suggestion pour ton objectif :{' '}
          {suggested.calorieGoal} kcal / {suggested.proteinGoal} g.
        </Txt>
        <Button title="Utiliser la suggestion" variant="secondary" onPress={applySuggestion} />
      </Card>

      <Card style={{ gap: Spacing.five }}>
        <SectionTitle>Profil</SectionTitle>

        <Row gap={Spacing.two}>
          {(['male', 'female'] as Sex[]).map((s) => (
            <Chip
              key={s}
              label={s === 'male' ? 'Homme' : 'Femme'}
              selected={profile.sex === s}
              onPress={() => setProfile({ sex: s })}
            />
          ))}
        </Row>

        <NumberRow label="Âge" suffix="ans" value={profile.age} onChange={(age) => setProfile({ age })} />
        <NumberRow
          label="Taille"
          suffix="cm"
          value={profile.heightCm}
          onChange={(heightCm) => setProfile({ heightCm })}
        />
        <NumberRow
          label="Poids"
          suffix="kg"
          value={profile.weightKg}
          allowDecimal
          onChange={(weightKg) => setProfile({ weightKg })}
        />

        <View style={{ gap: Spacing.two }}>
          <Txt variant="label" muted>
            Activité
          </Txt>
          <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
            {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
              <Chip
                key={a}
                label={ACTIVITY_LABELS[a]}
                selected={profile.activity === a}
                onPress={() => setProfile({ activity: a })}
              />
            ))}
          </Row>
        </View>

        <View style={{ gap: Spacing.two }}>
          <Txt variant="label" muted>
            Objectif
          </Txt>
          <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <Chip
                key={g}
                label={GOAL_LABELS[g]}
                selected={profile.goal === g}
                onPress={() => setProfile({ goal: g })}
              />
            ))}
          </Row>
        </View>
      </Card>

      <Card style={{ gap: Spacing.three }}>
        <SectionTitle>Données</SectionTitle>
        <Txt variant="body" muted>
          Tout est stocké sur ton téléphone. Les valeurs nutritionnelles viennent d&apos;
          OpenFoodFacts (ODbL) quand tu scannes ou recherches un produit.
        </Txt>
        <Txt variant="caption" muted>
          {entries.length} aliment(s) enregistré(s).
        </Txt>
      </Card>

      <Button title="Effacer toutes les données" variant="danger" onPress={confirmReset} />
    </ScrollView>
  );
}

function GoalInput({
  label,
  suffix,
  value,
  onChangeText,
  onBlur,
  color,
}: {
  label: string;
  suffix: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur: () => void;
  color?: string;
}) {
  const t = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt variant="heading">{label}</Txt>
      <Row gap={Spacing.two} style={{ alignItems: 'baseline' }}>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, ''))}
          onBlur={onBlur}
          keyboardType="number-pad"
          selectTextOnFocus
          style={{
            fontFamily: Fonts.rounded,
            fontSize: 30,
            fontWeight: '800',
            letterSpacing: -0.8,
            color: color ?? t.text,
            textAlign: 'right',
            minWidth: 90,
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

function NumberRow({
  label,
  suffix,
  value,
  onChange,
  allowDecimal,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (v: number) => void;
  allowDecimal?: boolean;
}) {
  const t = useTheme();
  const [text, setText] = useState(String(value));

  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt variant="body">{label}</Txt>
      <Row gap={Spacing.two} style={{ alignItems: 'baseline' }}>
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            const parsed = allowDecimal ? parseFloat(next.replace(',', '.')) : parseInt(next, 10);
            if (Number.isFinite(parsed) && parsed > 0) onChange(parsed);
          }}
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          style={{
            fontFamily: Fonts.rounded,
            fontSize: 17,
            fontWeight: '700',
            color: t.text,
            textAlign: 'right',
            minWidth: 60,
            backgroundColor: t.cardAlt,
            borderRadius: Radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            paddingHorizontal: Spacing.three,
            paddingVertical: Spacing.two,
          }}
        />
        <Txt variant="caption" muted>
          {suffix}
        </Txt>
      </Row>
    </Row>
  );
}
