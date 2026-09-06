import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { MealPicker } from '@/components/MealPicker';
import { ModalHeader } from '@/components/ModalHeader';
import { QuantityField } from '@/components/QuantityField';
import { Button, Card, Row, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { humanDay, today } from '@/lib/date';
import { totalsFor } from '@/lib/openfoodfacts';
import { defaultMeal, UNIT_LABELS, type Meal, type NutritionBasis, type Unit } from '@/store/types';
import { useAppStore } from '@/store/useAppStore';

/**
 * Deux façons de saisir un aliment à la main :
 * - « total » : on connaît directement ce qu'a apporté le plat (resto, recette) ;
 * - « étiquette » : on recopie les valeurs pour 100 g/ml et on dit combien on en a mangé.
 * L'écran ne montre que les champs de la voie choisie.
 */
type Source = 'total' | 'label';

export default function ManualScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    day?: string;
    name?: string;
    barcode?: string;
    meal?: Meal;
  }>();
  const day = params.day ?? today();

  const addEntry = useAppStore((s) => s.addEntry);

  const [name, setName] = useState(params.name ?? '');
  const [meal, setMeal] = useState<Meal>(params.meal ?? defaultMeal());
  const [source, setSource] = useState<Source | null>(null);
  const [unit, setUnit] = useState<Unit>('g');
  const [quantity, setQuantity] = useState(100);
  const [kcalInput, setKcalInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');

  const kcal = parseNumber(kcalInput);
  const protein = parseNumber(proteinInput);

  const basis: NutritionBasis =
    source === 'label'
      ? { kcal, protein, per: 100, unit }
      : { kcal, protein, per: 1, unit: 'serving' };

  const totals = source === 'label' ? totalsFor(basis, quantity) : { kcal, protein };
  const canSave =
    name.trim().length > 0 && kcal > 0 && source !== null && (source === 'total' || quantity > 0);

  const save = () => {
    if (!canSave) return;
    addEntry({
      day,
      meal,
      name: name.trim(),
      barcode: params.barcode || undefined,
      quantity: source === 'label' ? quantity : 1,
      unit: basis.unit,
      kcal: Math.round(totals.kcal),
      protein: Math.round(totals.protein * 10) / 10,
      basis,
    });
    router.dismissAll();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingTop: insets.top + Spacing.three }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Spacing.four}>
      <ModalHeader title="Saisie manuelle" subtitle={humanDay(day)} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.five,
          paddingBottom: Spacing.seven,
          gap: Spacing.four,
        }}
        keyboardShouldPersistTaps="handled">
        {/* 1 — Nom */}
        <Step number={1} title="Qu'est-ce que tu as mangé ?">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Poulet rôti, pâtes bolo, burger…"
            placeholderTextColor={t.textSecondary}
            autoFocus={!params.name}
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
        </Step>

        {/* 2 — Repas */}
        <Step number={2} title="À quel repas ?">
          <MealPicker value={meal} onChange={setMeal} />
        </Step>

        {/* 3 — D'où viennent les chiffres */}
        <Step number={3} title="Tu as quelles infos ?">
          <SourceOption
            selected={source === 'total'}
            title="Le total du plat"
            hint="Un repas au resto, une recette maison : tu connais les calories de la portion entière."
            onPress={() => setSource('total')}
          />
          <SourceOption
            selected={source === 'label'}
            title="Une étiquette pour 100 g / 100 ml"
            hint="Les valeurs au dos de l'emballage. On te demandera ensuite la quantité mangée."
            onPress={() => setSource('label')}
          />
        </Step>

        {/* 4 — Les chiffres */}
        {source === 'total' && (
          <Step number={4} title="Ce que contient la portion">
            <Row gap={Spacing.three} style={{ alignItems: 'flex-start' }}>
              <NumberBox label="Calories" suffix="kcal" value={kcalInput} onChangeText={setKcalInput} autoFocus />
              <NumberBox
                label="Protéines"
                suffix="g"
                value={proteinInput}
                onChangeText={setProteinInput}
                color={t.protein}
              />
            </Row>
            <Txt variant="caption" muted>
              Laisse les protéines à 0 si tu ne les connais pas.
            </Txt>
          </Step>
        )}

        {source === 'label' && (
          <>
            <Step number={4} title={`Sur l'étiquette, pour 100 ${UNIT_LABELS[unit]}`}>
              <Row gap={Spacing.two}>
                {(['g', 'ml'] as Unit[]).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: Spacing.two,
                      borderRadius: Radius.pill,
                      backgroundColor: unit === u ? t.accent : t.cardAlt,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: unit === u ? t.accent : t.border,
                    }}>
                    <Txt variant="label" color={unit === u ? t.accentText : t.text}>
                      {u === 'g' ? 'Solide (100 g)' : 'Liquide (100 ml)'}
                    </Txt>
                  </Pressable>
                ))}
              </Row>
              <Row gap={Spacing.three} style={{ alignItems: 'flex-start' }}>
                <NumberBox label="Calories" suffix="kcal" value={kcalInput} onChangeText={setKcalInput} autoFocus />
                <NumberBox
                  label="Protéines"
                  suffix="g"
                  value={proteinInput}
                  onChangeText={setProteinInput}
                  color={t.protein}
                />
              </Row>
            </Step>

            <Step number={5} title="Tu en as mangé combien ?">
              <QuantityField
                quantity={quantity}
                unit={unit}
                units={[]}
                onChangeQuantity={setQuantity}
                onChangeUnit={setUnit}
              />
            </Step>
          </>
        )}

        {/* Résultat */}
        {source !== null && (
          <Card style={{ gap: Spacing.three, backgroundColor: t.cardAlt }}>
            <Txt variant="caption" muted style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Ce que ça ajoute à ta journée
            </Txt>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <Txt variant="title">{Math.round(totals.kcal)}</Txt>
                <Txt variant="caption" muted>
                  calories
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt variant="title" color={t.protein}>
                  {Math.round(totals.protein * 10) / 10} g
                </Txt>
                <Txt variant="caption" muted>
                  protéines
                </Txt>
              </View>
            </Row>
          </Card>
        )}

        <Button title="Ajouter au journal" onPress={save} disabled={!canSave} />

        {!canSave && source !== null ? (
          <Txt variant="caption" muted style={{ textAlign: 'center' }}>
            {name.trim().length === 0 ? 'Il manque le nom.' : 'Il manque les calories.'}
          </Txt>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function parseNumber(text: string): number {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Bloc numéroté : le titre porte la question, en langage courant. */
function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Card style={{ gap: Spacing.four }}>
      <Row gap={Spacing.three}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Txt variant="caption" color={t.accentText} style={{ fontSize: 11 }}>
            {number}
          </Txt>
        </View>
        <Txt variant="heading" style={{ flex: 1, fontSize: 16 }}>
          {title}
        </Txt>
      </Row>
      {children}
    </Card>
  );
}

function SourceOption({
  title,
  hint,
  selected,
  onPress,
}: {
  title: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        borderRadius: Radius.md,
        borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        borderColor: selected ? t.accent : t.border,
        backgroundColor: selected ? t.cardAlt : 'transparent',
        padding: Spacing.four,
        opacity: pressed ? 0.75 : 1,
      })}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: selected ? 0 : 1.5,
          borderColor: t.border,
          backgroundColor: selected ? t.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {selected ? <Icon name="check" size={12} color={t.accentText} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="heading" style={{ fontSize: 15 }}>
          {title}
        </Txt>
        <Txt variant="caption" muted>
          {hint}
        </Txt>
      </View>
    </Pressable>
  );
}

function NumberBox({
  label,
  suffix,
  value,
  onChangeText,
  color,
  autoFocus,
}: {
  label: string;
  suffix: string;
  value: string;
  onChangeText: (v: string) => void;
  color?: string;
  autoFocus?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: Spacing.two }}>
      <Txt variant="caption" muted>
        {label}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: Spacing.two,
          backgroundColor: t.cardAlt,
          borderRadius: Radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.border,
          paddingHorizontal: Spacing.four,
          paddingVertical: Spacing.three,
        }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={t.textSecondary}
          selectTextOnFocus
          autoFocus={autoFocus}
          style={{
            flex: 1,
            fontFamily: Fonts.rounded,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.6,
            color: color ?? t.text,
            paddingVertical: 0,
          }}
        />
        <Txt variant="caption" muted>
          {suffix}
        </Txt>
      </View>
    </View>
  );
}
