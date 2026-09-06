import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MealPicker } from '@/components/MealPicker';
import { ModalHeader } from '@/components/ModalHeader';
import { QuantityField } from '@/components/QuantityField';
import { Button, Card, Row, SectionTitle, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { humanDay, today } from '@/lib/date';
import { basisFor, fetchByBarcode, totalsFor, type OffProduct } from '@/lib/openfoodfacts';
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

  // Entrée existante (modification ou ré-ajout) : tout vient du store.
  useEffect(() => {
    if (!sourceEntry) return;
    const units: Unit[] =
      sourceEntry.basis.per === 1 ? [sourceEntry.basis.unit] : ['g', 'ml'];
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
        const units: Unit[] = ['g', 'ml'];
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
      })
      .catch(() => !cancelled && setError('réseau'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [params.barcode, sourceEntry]);

  const basis = useMemo<NutritionBasis | null>(() => {
    if (!loaded) return null;
    if (loaded.product) return basisFor(loaded.product, unit);
    // Entrée manuelle ou récente : on garde la base, seule l'unité d'affichage change.
    return { ...loaded.basis, unit: loaded.basis.per === 1 ? loaded.basis.unit : unit };
  }, [loaded, unit]);

  const totals = basis ? totalsFor(basis, quantity) : { kcal: 0, protein: 0 };

  const onChangeUnit = (next: Unit) => {
    setUnit(next);
    if (next === 'serving' && loaded?.product?.servingSize) setQuantity(1);
    else if (unit === 'serving') setQuantity(loaded?.product?.servingSize ?? 100);
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
                params: { day, barcode: params.barcode ?? '' },
              })
            }
          />
          <Button title="Réessayer" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const perLabel =
    basis.per === 1 ? `par ${UNIT_LABELS[basis.unit]}` : `pour 100 ${UNIT_LABELS[basis.unit]}`;

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
