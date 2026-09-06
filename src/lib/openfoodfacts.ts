import { basisForUnit } from '@/lib/units';
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
  'product_name_en',
  'generic_name_fr',
  'brands',
  'image_front_small_url',
  'image_small_url',
  'image_url',
  'quantity',
  'serving_size',
  'serving_quantity',
  'nutriments',
  'nutrition_data_per',
  'completeness',
  'unique_scans_n',
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
  /**
   * Indice de complétude de la fiche OpenFoodFacts (0 à ~1,1). Une fiche à 0,2
   * n'a souvent qu'un nom et une valeur énergétique saisis à la va-vite.
   */
  completeness?: number;
  /** Nombre de scans uniques : une fiche très scannée a été relue par du monde. */
  scans?: number;
};

/** Seuil au-delà duquel on considère la fiche sérieusement renseignée. */
export const WELL_DOCUMENTED = 0.5;

type RawProduct = Record<string, any>;

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : (value as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pickName(p: RawProduct): string {
  return (
    text(p.product_name_fr) ??
    text(p.product_name) ??
    text(p.product_name_en) ??
    text(p.generic_name_fr) ??
    'Produit sans nom'
  );
}

/**
 * `brands` change de forme selon l'endpoint : chaîne « Marque1,Marque2 » via
 * l'API produit, tableau via search-a-licious. On accepte les deux.
 */
function pickBrand(value: unknown): string | undefined {
  if (Array.isArray(value)) return text(value[0]);
  return text(text(value)?.split(',')[0]);
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

  const quantityText = `${text(p.quantity) ?? ''} ${text(p.serving_size) ?? ''}`.toLowerCase();
  const baseUnit: 'g' | 'ml' = /\bml\b|\bcl\b|\bl\b|litre/.test(quantityText) ? 'ml' : 'g';

  return {
    barcode: String(p.code ?? ''),
    name: pickName(p),
    brand: pickBrand(p.brands),
    imageUrl: text(p.image_front_small_url) ?? text(p.image_small_url) ?? text(p.image_url),
    kcalPer100: Math.round(kcal * 10) / 10,
    proteinPer100: Math.round((num(n.proteins_100g) ?? num(n.proteins) ?? 0) * 10) / 10,
    baseUnit,
    servingSize: num(p.serving_quantity),
    servingLabel: text(p.serving_size),
    completeness: num(p.completeness),
    scans: num(p.unique_scans_n),
  };
}

/** Un produit mal formé ne doit jamais faire échouer toute la recherche. */
function safeParse(p: RawProduct): OffProduct | null {
  try {
    return parseProduct(p);
  } catch {
    return null;
  }
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

/**
 * Recherche texte. L'ancien endpoint `cgi/search.pl` de world.openfoodfacts.org
 * renvoie désormais des 503 : on passe par search-a-licious, le service de
 * recherche officiel. Le tri par défaut (pertinence) donne de bien meilleurs
 * résultats que le tri par popularité, qui remonte des produits hors sujet.
 */
export async function searchProducts(query: string, signal?: AbortSignal): Promise<OffProduct[]> {
  const url =
    `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}` +
    `&page_size=50&fields=${FIELDS}`;
  const json = await offFetch(url, signal);
  const products: RawProduct[] = json?.hits ?? [];
  return products.map(safeParse).filter((p): p is OffProduct => p !== null && p.kcalPer100 > 0);
}

/** Convertit un produit OFF en base de calcul pour une unité de saisie. */
export function basisFor(product: OffProduct, unit: Unit): NutritionBasis {
  return basisForUnit(
    { kcal: product.kcalPer100, protein: product.proteinPer100 },
    product.baseUnit,
    unit,
    product.servingSize,
  );
}

export { totalsFor } from '@/lib/units';
