import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { MealPicker } from '@/components/MealPicker';
import { ModalHeader } from '@/components/ModalHeader';
import { NumberBox, parseNumber } from '@/components/NumberBox';
import { QuantityField } from '@/components/QuantityField';
import { Button, Card, Row, SectionTitle, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { humanDay, today } from '@/lib/date';
import { basisFor, fetchByBarcode, type OffProduct } from '@/lib/openfoodfacts';
import { basisForUnit, equivalentLabel, isPerOne, referenceLabelFor, totalsFor } from '@/lib/units';
import { defaultMeal, UNIT_LABELS, type Meal, type NutritionBasis, type Unit } from '@/store/types';
import { useAppStore } from '@/store/useAppStore';

type Loaded = {
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  basis: NutritionBasis;
  quantity: number;
  units: Unit[];
  product?: OffProduct;
};

/**
 * Écran de portion : sert à la fois pour un produit scanné/recherché,
 * pour re-ajouter un aliment récent et pour modifier une entrée existante.
 */
export default function PortionScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    barcode?: string;
    entryId?: string;
    repeatId?: string;
    day?: string;
    meal?: Meal;
  }>();

  const entries = useAppStore((s) => s.entries);
  const addEntry = useAppStore((s) => s.addEntry);
  const updateEntry = useAppStore((s) => s.updateEntry);
  const removeEntry = useAppStore((s) => s.removeEntry);

  const sourceEntry = useMemo(
    () => entries.find((e) => e.id === (params.entryId ?? params.repeatId)),
    [entries, params.entryId, params.repeatId],
  );
  const isEditing = Boolean(params.entryId && sourceEntry);
  const day = params.day ?? sourceEntry?.day ?? today();

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState<Unit>('g');
  const [meal, setMeal] = useState<Meal>(params.meal ?? defaultMeal());
  const [loading, setLoading] = useState(Boolean(params.barcode));
  const [error, setError] = useState<string | null>(null);

  // Correction des valeurs de référence : OpenFoodFacts est contributif, les
  // chiffres sont parfois faux ou absents. `corrected` bascule dès que
  // l'utilisateur touche un champ.
  const [showCorrection, setShowCorrection] = useState(false);
  const [corrected, setCorrected] = useState(false);
  const [kcalRef, setKcalRef] = useState('');
  const [proteinRef, setProteinRef] = useState('');

  // Entrée existante (modification ou ré-ajout) : tout vient du store.
  useEffect(() => {
    if (!sourceEntry) return;
    // Base au poids/volume : on peut aussi saisir à la cuillère.
    const units: Unit[] =
      sourceEntry.basis.per === 1
        ? [sourceEntry.basis.unit]
        : [sourceEntry.basis.unit, 'tbsp', 'tsp'];
    setLoaded({
      name: sourceEntry.name,
      brand: sourceEntry.brand,
      barcode: sourceEntry.barcode,
      basis: sourceEntry.basis,
      quantity: sourceEntry.quantity,
      units,
    });
    setQuantity(sourceEntry.quantity);
    setUnit(sourceEntry.unit);
    setKcalRef(String(sourceEntry.basis.kcal));
    setProteinRef(String(sourceEntry.basis.protein));
    // On ne reprend le repas que s'il s'agit vraiment de la même entrée ;
    // un ré-ajout part du repas courant.
    if (params.entryId) setMeal(sourceEntry.meal);
    setLoading(false);
  }, [sourceEntry, params.entryId]);

  // Produit OpenFoodFacts.
  useEffect(() => {
    if (!params.barcode || sourceEntry) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchByBarcode(params.barcode)
      .then((product) => {
        if (cancelled) return;
        if (!product) {
          setError('inconnu');
          return;
        }
        // On propose toujours les cuillères : huiles, sauces, miel, purées
        // d'oléagineux se dosent rarement à la balance.
        const units: Unit[] = [product.baseUnit, 'tbsp', 'tsp'];
        if (product.servingSize) units.push('serving');
        const startUnit = product.baseUnit;
        setLoaded({
          name: product.name,
          brand: product.brand,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
          basis: basisFor(product, startUnit),
          quantity: 100,
          units,
          product,
        });
        setUnit(startUnit);
        setQuantity(product.servingSize ?? 100);

        // Si ce code-barres a déjà été corrigé, on repart de la correction
        // plutôt que des valeurs OpenFoodFacts.
        const prior = [...useAppStore.getState().entries]
          .filter((e) => e.barcode === product.barcode && e.basis.per === 100)
          .sort((a, b) => b.createdAt - a.createdAt)[0];
        const differs =
          prior &&
          (prior.basis.kcal !== product.kcalPer100 || prior.basis.protein !== product.proteinPer100);

        setKcalRef(String(differs ? prior.basis.kcal : product.kcalPer100));
        setProteinRef(String(differs ? prior.basis.protein : product.proteinPer100));
        setCorrected(Boolean(differs));
        setShowCorrection(Boolean(differs));
      })
      .catch(() => !cancelled && setError('réseau'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [params.barcode, sourceEntry]);

  const basis = useMemo<NutritionBasis | null>(() => {
    if (!loaded) return null;

    if (loaded.product) {
      // La correction porte toujours sur les valeurs pour 100 g/ml : la
      // conversion en portion reste donc juste.
      const product = corrected
        ? { ...loaded.product, kcalPer100: parseNumber(kcalRef), proteinPer100: parseNumber(proteinRef) }
        : loaded.product;
      return basisFor(product, unit);
    }

    // Entrée manuelle ou récente. Une base « à la pièce » n'est pas
    // convertible ; une base pour 100 g/ml l'est, cuillères comprises.
    const ref = {
      kcal: corrected ? parseNumber(kcalRef) : loaded.basis.kcal,
      protein: corrected ? parseNumber(proteinRef) : loaded.basis.protein,
    };
    if (loaded.basis.per === 1) return { ...ref, per: 1, unit: loaded.basis.unit };
    return basisForUnit(ref, loaded.basis.unit as 'g' | 'ml', unit);
  }, [loaded, unit, corrected, kcalRef, proteinRef]);

  /** Unité dans laquelle sont exprimées les valeurs de référence. */
  const baseUnit: 'g' | 'ml' =
    loaded?.product?.baseUnit ?? (loaded?.basis.unit === 'ml' ? 'ml' : 'g');

  /** Libellé de la correction : toujours la base 100 g/ml, jamais la cuillère. */
  const referenceLabel =
    loaded?.basis.per === 1 && !loaded.product
      ? `par ${UNIT_LABELS[loaded.basis.unit]}`
      : `pour 100 ${UNIT_LABELS[baseUnit]}`;

  const totals = basis ? totalsFor(basis, quantity) : { kcal: 0, protein: 0 };
  const equivalent = equivalentLabel(unit, quantity, baseUnit, loaded?.product?.servingSize);

  const onChangeUnit = (next: Unit) => {
    const previous = unit;
    setUnit(next);
    // Chaque unité a son ordre de grandeur : repartir de 100 g après avoir
    // choisi « c. à soupe » n'aurait aucun sens.
    if (isPerOne(next) && !isPerOne(previous)) setQuantity(1);
    else if (!isPerOne(next) && isPerOne(previous)) {
      setQuantity(loaded?.product?.servingSize ?? 100);
    }
  };

  const save = () => {
    if (!basis || quantity <= 0 || !loaded) return;
    const payload = {
      day,
      meal,
      name: loaded.name,
      brand: loaded.brand,
      barcode: loaded.barcode,
      quantity,
      unit: basis.unit,
      kcal: totals.kcal,
      protein: totals.protein,
      basis,
    };
    if (isEditing && params.entryId) updateEntry(params.entryId, payload);
    else addEntry(payload);
    router.dismissAll();
  };

  const confirmDelete = () => {
    if (!params.entryId) return;
    Alert.alert(loaded?.name ?? 'Aliment', 'Supprimer cette entrée ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          removeEntry(params.entryId!);
          router.dismissAll();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + Spacing.three }}>
        <ModalHeader title="Chargement…" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.textSecondary} />
        </View>
      </View>
    );
  }

  if (error || !loaded || !basis) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + Spacing.three }}>
        <ModalHeader title="Produit introuvable" />
        <View style={{ padding: Spacing.five, gap: Spacing.four }}>
          <Card style={{ gap: Spacing.two }}>
            <Txt variant="heading">
              {error === 'réseau' ? 'Pas de connexion' : 'Ce produit n’est pas dans OpenFoodFacts'}
            </Txt>
            <Txt variant="body" muted>
              {error === 'réseau'
                ? 'Impossible d’interroger OpenFoodFacts pour le moment.'
                : `Code-barres ${params.barcode}. Tu peux le saisir à la main en 10 secondes.`}
            </Txt>
          </Card>
          <Button
            title="Saisir à la main"
            onPress={() =>
              router.replace({
                pathname: '/add/manual',
                params: { day, meal, barcode: params.barcode ?? '' },
              })
            }
          />
          <Button title="Réessayer" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const perLabel = referenceLabelFor(basis);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + Spacing.three }}>
      <ModalHeader
        title={isEditing ? 'Modifier la quantité' : 'Quelle quantité ?'}
        subtitle={humanDay(day)}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.five,
          paddingBottom: Spacing.seven,
          gap: Spacing.four,
        }}
        keyboardShouldPersistTaps="handled">
        <Card style={{ gap: Spacing.three }}>
          <Row gap={Spacing.four}>
            {loaded.imageUrl ? (
              <Image
                source={{ uri: loaded.imageUrl }}
                style={{ width: 56, height: 56, borderRadius: Radius.sm, backgroundColor: t.cardAlt }}
                contentFit="contain"
              />
            ) : null}
            <View style={{ flex: 1 }}>
              <Txt variant="heading" numberOfLines={2}>
                {loaded.name}
              </Txt>
              <Txt variant="caption" muted>
                {loaded.brand ? `${loaded.brand} · ` : ''}
                {basis.kcal} kcal · {basis.protein} g prot. {perLabel}
              </Txt>
            </View>
          </Row>

          <Pressable
            onPress={() => setShowCorrection((v) => !v)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Icon name="pencil" size={14} color={corrected ? t.saving : t.textSecondary} />
            <Txt variant="label" color={corrected ? t.saving : t.textSecondary}>
              {corrected ? 'Valeurs corrigées' : 'Ces valeurs sont fausses ?'}
            </Txt>
            <Icon
              name={showCorrection ? 'close' : 'chevronRight'}
              size={13}
              color={t.textSecondary}
            />
          </Pressable>

          {showCorrection && (
            <View style={{ gap: Spacing.three }}>
              <Txt variant="caption" muted>
                OpenFoodFacts est alimenté par ses contributeurs. Recopie l&apos;étiquette{' '}
                {referenceLabel} si elle ne correspond pas.
              </Txt>
              <Row gap={Spacing.three} style={{ alignItems: 'flex-start' }}>
                <NumberBox
                  label="Calories"
                  suffix="kcal"
                  size={22}
                  value={kcalRef}
                  onChangeText={(v) => {
                    setKcalRef(v);
                    setCorrected(true);
                  }}
                />
                <NumberBox
                  label="Protéines"
                  suffix="g"
                  size={22}
                  color={t.protein}
                  value={proteinRef}
                  onChangeText={(v) => {
                    setProteinRef(v);
                    setCorrected(true);
                  }}
                />
              </Row>
              {corrected ? (
                <Pressable
                  onPress={() => {
                    setCorrected(false);
                    if (loaded.product) {
                      setKcalRef(String(loaded.product.kcalPer100));
                      setProteinRef(String(loaded.product.proteinPer100));
                    } else {
                      setKcalRef(String(loaded.basis.kcal));
                      setProteinRef(String(loaded.basis.protein));
                    }
                  }}>
                  <Txt variant="label" color={t.textSecondary}>
                    Revenir aux valeurs d&apos;origine
                  </Txt>
                </Pressable>
              ) : null}
            </View>
          )}
        </Card>

        <Card style={{ gap: Spacing.four }}>
          <SectionTitle>À quel repas ?</SectionTitle>
          <MealPicker value={meal} onChange={setMeal} />
        </Card>

        <Card style={{ gap: Spacing.five }}>
          <SectionTitle>Quantité</SectionTitle>
          <QuantityField
            quantity={quantity}
            unit={unit}
            units={loaded.units}
            onChangeQuantity={setQuantity}
            onChangeUnit={onChangeUnit}
            equivalent={equivalent}
          />
        </Card>

        <Card style={{ gap: Spacing.three }}>
          <SectionTitle>Ce que ça ajoute</SectionTitle>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Txt variant="title">{totals.kcal}</Txt>
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

        <Button
          title={isEditing ? 'Enregistrer' : 'Ajouter au journal'}
          onPress={save}
          disabled={quantity <= 0}
        />

        {isEditing ? <Button title="Supprimer" variant="danger" onPress={confirmDelete} /> : null}
      </ScrollView>
    </View>
  );
}
