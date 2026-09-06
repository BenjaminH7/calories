import type { NutritionBasis, Unit } from '@/store/types';

/**
 * Client OpenFoodFacts. L'API demande un User-Agent identifiant l'app.
 * Docs : https://openfoodfacts.github.io/openfoodfacts-server/api/
 */
const UA = 'KcalApp/1.0 (expo; contact: app@example.com)';
const FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'generic_name_fr',
  'brands',
  'image_front_small_url',
  'image_small_url',
  'quantity',
  'serving_size',
  'serving_quantity',
  'nutriments',
  'nutrition_data_per',
].join(',');

export type OffProduct = {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  /** Base « pour 100 » telle que fournie par OFF. */
  kcalPer100: number;
  proteinPer100: number;
  /** `g` ou `ml` selon le produit. */
  baseUnit: Extract<Unit, 'g' | 'ml'>;
  /** Taille d'une portion en g/ml quand OFF la connaît (ex. 30 g). */
  servingSize?: number;
  servingLabel?: string;
};

type RawProduct = Record<string, any>;

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : (value as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function pickName(p: RawProduct): string {
  return (
    p.product_name_fr?.trim() ||
    p.product_name?.trim() ||
    p.generic_name_fr?.trim() ||
    'Produit sans nom'
  );
}

/** OFF stocke l'énergie en kJ quand les kcal manquent : on convertit. */
function energyKcal(n: RawProduct): number | undefined {
  const kcal = num(n['energy-kcal_100g']) ?? num(n['energy-kcal']);
  if (kcal !== undefined) return kcal;
  const kj = num(n['energy_100g']) ?? num(n.energy);
  return kj !== undefined ? kj / 4.184 : undefined;
}

export function parseProduct(p: RawProduct): OffProduct | null {
  const n = p.nutriments ?? {};
  const kcal = energyKcal(n);
  if (kcal === undefined) return null;

  const quantityText: string = `${p.quantity ?? ''} ${p.serving_size ?? ''}`.toLowerCase();
  const baseUnit: 'g' | 'ml' = /\bml\b|\bcl\b|\bl\b|litre/.test(quantityText) ? 'ml' : 'g';

  return {
    barcode: String(p.code ?? ''),
    name: pickName(p),
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    imageUrl: p.image_front_small_url ?? p.image_small_url ?? undefined,
    kcalPer100: Math.round(kcal * 10) / 10,
    proteinPer100: Math.round((num(n.proteins_100g) ?? num(n.proteins) ?? 0) * 10) / 10,
    baseUnit,
    servingSize: num(p.serving_quantity),
    servingLabel: p.serving_size?.trim() || undefined,
  };
}

async function offFetch(url: string, signal?: AbortSignal) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`OpenFoodFacts a répondu ${res.status}`);
  return res.json();
}

export async function fetchByBarcode(barcode: string, signal?: AbortSignal): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json?fields=${FIELDS}`;
  const json = await offFetch(url, signal);
  if (json?.status !== 1 || !json.product) return null;
  return parseProduct({ ...json.product, code: json.code ?? barcode });
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<OffProduct[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;
  const json = await offFetch(url, signal);
  const products: RawProduct[] = json?.products ?? [];
  return products.map(parseProduct).filter((p): p is OffProduct => p !== null && p.kcalPer100 > 0);
}

/** Convertit un produit OFF en base de calcul pour une unité donnée. */
export function basisFor(product: OffProduct, unit: Unit): NutritionBasis {
  if (unit === 'serving' && product.servingSize) {
    const ratio = product.servingSize / 100;
    return {
      kcal: Math.round(product.kcalPer100 * ratio * 10) / 10,
      protein: Math.round(product.proteinPer100 * ratio * 10) / 10,
      per: 1,
      unit: 'serving',
    };
  }
  return {
    kcal: product.kcalPer100,
    protein: product.proteinPer100,
    per: 100,
    unit: unit === 'serving' ? product.baseUnit : unit,
  };
}

/** Totaux consommés pour une quantité donnée. */
export function totalsFor(basis: NutritionBasis, quantity: number) {
  const factor = quantity / basis.per;
  return {
    kcal: Math.round(basis.kcal * factor),
    protein: Math.round(basis.protein * factor * 10) / 10,
  };
}
