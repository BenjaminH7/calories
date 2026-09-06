import type { ACTIVITY_FACTORS } from '@/lib/nutrition';
import type { DayKey } from '@/lib/date';

export type Activity = keyof typeof ACTIVITY_FACTORS;
export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';

/** Unités de saisie. `g`/`ml` sont ramenées à une base 100. */
export type Unit = 'g' | 'ml' | 'piece' | 'serving';

export const UNIT_LABELS: Record<Unit, string> = {
  g: 'g',
  ml: 'ml',
  piece: 'pièce',
  serving: 'portion',
};

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Ordre d'affichage dans le journal. */
export const MEAL_ORDER: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Petit-déj.',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Snack',
};

export const MEAL_EMOJI: Record<Meal, string> = {
  breakfast: '🥐',
  lunch: '🍽️',
  dinner: '🌙',
  snack: '🍎',
};

/** Repas proposé par défaut selon l'heure de saisie. */
export function mealForHour(hour: number): Meal {
  if (hour >= 4 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 18 && hour < 23) return 'dinner';
  return 'snack';
}

export const defaultMeal = (): Meal => mealForHour(new Date().getHours());

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  /** Rythme visé en kg/semaine (perte ou prise). */
  paceKgPerWeek: number;
};

/** Valeurs nutritionnelles pour 100 g / 100 ml, ou par pièce/portion. */
export type NutritionBasis = {
  kcal: number;
  protein: number;
  /** `100` pour g/ml, `1` pour pièce/portion. */
  per: number;
  unit: Unit;
};

export type FoodEntry = {
  id: string;
  day: DayKey;
  meal: Meal;
  name: string;
  brand?: string;
  barcode?: string;
  quantity: number;
  unit: Unit;
  /** Totaux réellement consommés, déjà multipliés par la quantité. */
  kcal: number;
  protein: number;
  /** Base conservée pour pouvoir modifier la quantité après coup. */
  basis: NutritionBasis;
  createdAt: number;
};

export type CalorieEvent = {
  id: string;
  name: string;
  emoji: string;
  /** Jour de l'événement. */
  date: DayKey;
  /** Calories supplémentaires débloquées le jour J. */
  budget: number;
  /** Nombre de jours d'épargne avant l'événement. */
  spreadDays: number;
  createdAt: number;
};
