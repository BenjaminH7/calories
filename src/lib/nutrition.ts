import { addDays, daysBetween, DayKey } from '@/lib/date';
import type { CalorieEvent, Profile } from '@/store/types';

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
} as const;

export const ACTIVITY_LABELS: Record<keyof typeof ACTIVITY_FACTORS, string> = {
  sedentary: 'Sédentaire',
  light: 'Légèrement actif',
  moderate: 'Modérément actif',
  active: 'Très actif',
  athlete: 'Athlète',
};

export const ACTIVITY_HINTS: Record<keyof typeof ACTIVITY_FACTORS, string> = {
  sedentary: 'Bureau, peu de marche',
  light: '1 à 3 séances / semaine',
  moderate: '3 à 5 séances / semaine',
  active: '6 à 7 séances / semaine',
  athlete: 'Deux entraînements par jour',
};

export const GOAL_LABELS = {
  lose: 'Perdre du poids',
  maintain: 'Maintenir',
  gain: 'Prendre du muscle',
} as const;

/** Mifflin-St Jeor. */
export function bmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function tdee(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age' | 'activity'>): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity];
}

const round5 = (n: number) => Math.round(n / 5) * 5;
const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Objectifs suggérés : déficit/surplus appliqué au TDEE, protéines
 * proportionnelles au poids (plus hautes en perte pour préserver le muscle).
 */
export function suggestTargets(
  p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age' | 'activity' | 'goal' | 'paceKgPerWeek'>,
): { calorieGoal: number; proteinGoal: number } {
  const maintenance = tdee(p);
  const kcalPerKg = 7700;
  const dailyDelta = ((p.paceKgPerWeek ?? 0.5) * kcalPerKg) / 7;

  let calories = maintenance;
  if (p.goal === 'lose') calories = maintenance - dailyDelta;
  if (p.goal === 'gain') calories = maintenance + dailyDelta * 0.6;

  // Plancher de sécurité : jamais sous le métabolisme de base.
  calories = Math.max(calories, bmr(p) * 1.05, p.sex === 'male' ? 1500 : 1200);

  const proteinPerKg = p.goal === 'lose' ? 2.0 : p.goal === 'gain' ? 1.8 : 1.6;

  return {
    calorieGoal: round10(calories),
    proteinGoal: round5(p.weightKg * proteinPerKg),
  };
}

// ---------------------------------------------------------------------------
// Épargne de calories
// ---------------------------------------------------------------------------

export type DayAdjustment = {
  /** Calories retirées aujourd'hui pour alimenter un ou plusieurs événements. */
  saved: number;
  /** Calories débloquées aujourd'hui parce que c'est le jour d'un événement. */
  released: number;
  /** Événements qui prélèvent aujourd'hui. */
  savingFor: CalorieEvent[];
  /** Événements qui ont lieu aujourd'hui. */
  happeningToday: CalorieEvent[];
};

/** Prélèvement quotidien d'un événement, arrondi à 5 kcal près. */
export function dailySaving(event: CalorieEvent): number {
  const days = Math.max(1, event.spreadDays);
  return round5(event.budget / days);
}

/** Premier jour de prélèvement (inclus). L'événement lui-même ne prélève pas. */
export function savingStart(event: CalorieEvent): DayKey {
  return addDays(event.date, -Math.max(1, event.spreadDays));
}

export function isSavingDay(event: CalorieEvent, day: DayKey): boolean {
  const offset = daysBetween(day, event.date);
  return offset >= 1 && offset <= Math.max(1, event.spreadDays);
}

/** Ce qui a déjà été mis de côté pour un événement à la date `day` (incluse). */
export function savedSoFar(event: CalorieEvent, day: DayKey): number {
  const elapsed = Math.max(1, event.spreadDays) - Math.max(0, daysBetween(day, event.date) - 1);
  const clamped = Math.min(Math.max(elapsed, 0), Math.max(1, event.spreadDays));
  return Math.min(event.budget, clamped * dailySaving(event));
}

export function adjustmentsFor(events: CalorieEvent[], day: DayKey): DayAdjustment {
  const savingFor = events.filter((e) => isSavingDay(e, day));
  const happeningToday = events.filter((e) => e.date === day);
  return {
    saved: savingFor.reduce((sum, e) => sum + dailySaving(e), 0),
    released: happeningToday.reduce((sum, e) => sum + e.budget, 0),
    savingFor,
    happeningToday,
  };
}

/** Objectif calorique effectif du jour, épargne comprise. */
export function effectiveCalorieGoal(
  baseGoal: number,
  events: CalorieEvent[],
  day: DayKey,
): { goal: number; adjustment: DayAdjustment } {
  const adjustment = adjustmentsFor(events, day);
  const goal = Math.max(0, baseGoal - adjustment.saved + adjustment.released);
  return { goal, adjustment };
}
