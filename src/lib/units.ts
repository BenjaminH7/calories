import { UNIT_LABELS, type NutritionBasis, type Unit } from '@/store/types';

/**
 * Contenance des cuillères, en millilitres (standard métrique).
 * Ce sont des mesures de volume : pour un produit dont les valeurs sont
 * données au poids, on applique une densité approchée (voir `DENSITY`).
 */
export const ML_PER_SPOON: Record<'tbsp' | 'tsp', number> = { tbsp: 15, tsp: 5 };

/**
 * Densité g/ml utilisée pour convertir une cuillère en grammes quand
 * l'étiquette est au poids. 0,92 correspond aux huiles, cas de très loin le
 * plus fréquent pour une saisie à la cuillère.
 */
const DENSITY = 0.92;

export const isSpoon = (unit: Unit): unit is 'tbsp' | 'tsp' => unit === 'tbsp' || unit === 'tsp';

/** Une unité « à la pièce » porte sa valeur pour 1, pas pour 100. */
export const isPerOne = (unit: Unit): boolean => unit !== 'g' && unit !== 'ml';

/** Quantité de base (g ou ml) que représente une unité de saisie. */
export function baseAmountFor(unit: Unit, baseUnit: 'g' | 'ml'): number | null {
  if (!isSpoon(unit)) return null;
  const ml = ML_PER_SPOON[unit];
  return baseUnit === 'ml' ? ml : Math.round(ml * DENSITY * 10) / 10;
}

/**
 * Base nutritionnelle pour une unité de saisie, à partir des valeurs pour 100.
 * `servingSize` est la taille d'une portion en g/ml quand elle est connue.
 */
export function basisForUnit(
  per100: { kcal: number; protein: number },
  baseUnit: 'g' | 'ml',
  unit: Unit,
  servingSize?: number,
): NutritionBasis {
  const scale = (factor: number): NutritionBasis => ({
    kcal: Math.round(per100.kcal * factor * 10) / 10,
    protein: Math.round(per100.protein * factor * 10) / 10,
    per: 1,
    unit,
  });

  if (isSpoon(unit)) return scale((baseAmountFor(unit, baseUnit) ?? 0) / 100);
  if (unit === 'serving' && servingSize) return scale(servingSize / 100);

  // g / ml : on garde la base 100 telle quelle.
  return {
    kcal: per100.kcal,
    protein: per100.protein,
    per: 100,
    unit: unit === 'g' || unit === 'ml' ? unit : baseUnit,
  };
}

/** « ≈ 30 ml » — affiché sous la quantité pour lever toute ambiguïté. */
export function equivalentLabel(
  unit: Unit,
  quantity: number,
  baseUnit: 'g' | 'ml',
  servingSize?: number,
): string | null {
  if (isSpoon(unit)) {
    const amount = (baseAmountFor(unit, baseUnit) ?? 0) * quantity;
    return `≈ ${Math.round(amount * 10) / 10} ${baseUnit}`;
  }
  if (unit === 'serving' && servingSize) {
    return `≈ ${Math.round(servingSize * quantity * 10) / 10} ${baseUnit}`;
  }
  return null;
}

/** Totaux consommés pour une quantité donnée. */
export function totalsFor(basis: NutritionBasis, quantity: number) {
  const factor = quantity / basis.per;
  return {
    kcal: Math.round(basis.kcal * factor),
    protein: Math.round(basis.protein * factor * 10) / 10,
  };
}

/** « pour 100 g » ou « par c. à soupe », selon la base. */
export function referenceLabelFor(basis: NutritionBasis): string {
  return basis.per === 1
    ? `par ${UNIT_LABELS[basis.unit]}`
    : `pour 100 ${UNIT_LABELS[basis.unit]}`;
}
