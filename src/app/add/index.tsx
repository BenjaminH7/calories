import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { ModalHeader } from '@/components/ModalHeader';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Card, Row, SectionTitle, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useModalTopInset } from '@/hooks/use-modal-inset';
import { useTheme } from '@/hooks/use-theme';
import { humanDay, today } from '@/lib/date';
import { searchGenericFoods, type GenericFood } from '@/lib/generic-foods';
import { searchProducts, type OffProduct } from '@/lib/openfoodfacts';
import type { Meal } from '@/store/types';
import { recentFoods, useAppStore } from '@/store/useAppStore';

/**
 * Une seule liste de résultats. Les aliments CIQUAL, mesurés en laboratoire,
 * passent devant les fiches OpenFoodFacts, contributives, et portent une
 * pastille verte — mais aucune section ne sépare les deux origines.
 */
type Result =
  | { kind: 'generic'; key: string; food: GenericFood }
  | { kind: 'off'; key: string; product: OffProduct };

export default function AddScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = useModalTopInset();
  const params = useLocalSearchParams<{ day?: string; meal?: Meal }>();
  const day = params.day ?? today();
  const meal = params.meal;

  const entries = useAppStore((s) => s.entries);
  const recents = useMemo(() => recentFoods(entries), [entries]);

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<OffProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = query.trim();
    abortRef.current?.abort();

    if (term.length < 3) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        setProducts(await searchProducts(term, controller.signal));
      } catch {
        if (!controller.signal.aborted) setError('Recherche indisponible. Vérifie ta connexion.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const showRecents = query.trim().length < 3;

  const results = useMemo<Result[]>(() => {
    if (showRecents) return [];
    return [
      ...searchGenericFoods(query.trim()).map<Result>((food) => ({
        kind: 'generic',
        key: `c-${food.id}`,
        food,
      })),
      ...products.map<Result>((product, i) => ({
        kind: 'off',
        key: `o-${product.barcode}-${i}`,
        product,
      })),
    ];
  }, [query, products, showRecents]);

  const open = (extra: Record<string, string>) =>
    router.push({ pathname: '/add/portion', params: { day, meal, ...extra } });

  return (
    <View style={{ flex: 1, paddingTop: topInset }}>
      <ModalHeader title="Ajouter un aliment" subtitle={humanDay(day)} />

      <View style={{ paddingHorizontal: Spacing.five, gap: Spacing.four }}>
        <Row gap={Spacing.three}>
          <BigAction
            icon="barcode"
            label="Scanner"
            hint="Code-barres"
            onPress={() => router.push({ pathname: '/add/scan', params: { day, meal } })}
          />
          <BigAction
            icon="pencil"
            label="Manuel"
            hint="kcal & prot."
            onPress={() => router.push({ pathname: '/add/manual', params: { day, meal } })}
          />
        </Row>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.three,
            backgroundColor: t.cardAlt,
            borderRadius: Radius.pill,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            paddingHorizontal: Spacing.four,
            height: 48,
          }}>
          <Icon name="search" size={18} color={t.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Poulet, riz, huile d'olive…"
            placeholderTextColor={t.textSecondary}
            autoCorrect={false}
            returnKeyType="search"
            style={{
              flex: 1,
              fontFamily: Fonts.rounded,
              fontSize: 15,
              fontWeight: '500',
              color: t.text,
            }}
          />
          {loading ? <ActivityIndicator color={t.textSecondary} /> : null}
          {!loading && query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close" size={16} color={t.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: Spacing.five,
          paddingBottom: insets.bottom + Spacing.seven,
          gap: Spacing.two,
        }}
        ListHeaderComponent={
          showRecents ? (
            <RecentsSection recents={recents} error={error} onPick={(id) => open({ repeatId: id })} />
          ) : error ? (
            <Txt variant="caption" color={t.danger} style={{ marginBottom: Spacing.three }}>
              {error}
            </Txt>
          ) : null
        }
        ListEmptyComponent={
          showRecents || loading ? null : (
            <Card style={{ alignItems: 'center', paddingVertical: Spacing.six, gap: Spacing.three }}>
              <Txt variant="body" muted style={{ textAlign: 'center' }}>
                Aucun résultat pour « {query.trim()} ».
              </Txt>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/add/manual', params: { day, meal, name: query.trim() } })
                }>
                <Txt variant="label" color={t.text}>
                  Le créer à la main →
                </Txt>
              </Pressable>
            </Card>
          )
        }
        renderItem={({ item }) => {
          const verified = item.kind === 'generic';
          const name = verified ? item.food.name : item.product.name;
          const subtitle = verified
            ? `${item.food.kcal} kcal · ${item.food.protein} g prot. / 100 ${item.food.unit}`
            : `${item.product.brand ? `${item.product.brand} · ` : ''}` +
              `${item.product.kcalPer100} kcal · ${item.product.proteinPer100} g prot. / 100 ${item.product.baseUnit}`;

          return (
            <Pressable
              onPress={() =>
                open(verified ? { genericId: item.food.id } : { barcode: item.product.barcode })
              }
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                backgroundColor: t.card,
                borderRadius: Radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.border,
                padding: Spacing.four,
                opacity: pressed ? 0.6 : 1,
              })}>
              <View style={{ flex: 1 }}>
                <Row gap={Spacing.two}>
                  <Txt variant="heading" style={{ flexShrink: 1, fontSize: 15 }} numberOfLines={1}>
                    {name}
                  </Txt>
                  {verified ? <VerifiedBadge /> : null}
                </Row>
                <Txt variant="caption" muted numberOfLines={1}>
                  {subtitle}
                </Txt>
              </View>
              <Icon name="chevronRight" size={16} color={t.textSecondary} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function RecentsSection({
  recents,
  error,
  onPick,
}: {
  recents: ReturnType<typeof recentFoods>;
  error: string | null;
  onPick: (entryId: string) => void;
}) {
  const t = useTheme();

  return (
    <View style={{ gap: Spacing.three }}>
      {error ? (
        <Txt variant="caption" color={t.danger}>
          {error}
        </Txt>
      ) : null}
      <SectionTitle>Récents</SectionTitle>

      {recents.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: Spacing.six }}>
          <Txt variant="body" muted style={{ textAlign: 'center' }}>
            Tes aliments déjà enregistrés apparaîtront ici{'\n'}pour les rajouter en un tap.
          </Txt>
        </Card>
      ) : (
        <Card padded={false}>
          {recents.map((entry, i) => (
            <Pressable
              key={entry.id}
              onPress={() => onPick(entry.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                padding: Spacing.four,
                borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: t.border,
                opacity: pressed ? 0.6 : 1,
              })}>
              <View style={{ flex: 1 }}>
                <Txt variant="heading" style={{ fontSize: 15 }} numberOfLines={1}>
                  {entry.name}
                </Txt>
                <Txt variant="caption" muted numberOfLines={1}>
                  {entry.basis.kcal} kcal · {entry.basis.protein} g prot. /{' '}
                  {entry.basis.per === 1 ? '1' : '100'} {entry.basis.unit}
                </Txt>
              </View>
              <Icon name="plus" size={18} color={t.textSecondary} />
            </Pressable>
          ))}
        </Card>
      )}
    </View>
  );
}

function BigAction({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: 'barcode' | 'pencil';
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: t.card,
        borderRadius: Radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
        padding: Spacing.five,
        gap: Spacing.three,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Icon name={icon} size={26} />
      <View>
        <Txt variant="heading" style={{ fontSize: 16 }}>
          {label}
        </Txt>
        <Txt variant="caption" muted>
          {hint}
        </Txt>
      </View>
    </Pressable>
  );
}
