import { addDays, daysBetween, type DayKey } from '@/lib/date';
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

/**
 * Rang chronologique d'un jour dans la fenêtre d'épargne : 1 pour le premier
 * jour de prélèvement, `spreadDays` pour la veille de l'événement.
 */
function savingDayIndex(event: CalorieEvent, day: DayKey): number {
  return Math.max(1, event.spreadDays) - daysBetween(day, event.date) + 1;
}

/**
 * Total mis de côté après `n` jours d'épargne.
 *
 * On arrondit le **cumul**, jamais le prélèvement quotidien : c'est ce qui
 * garantit que la somme des prélèvements vaut exactement le budget. Arrondir
 * chaque jour puis multiplier laissait un écart pouvant atteindre plusieurs
 * dizaines de kcal, dans un sens comme dans l'autre.
 */
function savedThrough(event: CalorieEvent, n: number): number {
  const days = Math.max(1, event.spreadDays);
  const clamped = Math.min(Math.max(n, 0), days);
  // Le dernier jour solde le compte au centime près.
  if (clamped >= days) return event.budget;
  return round5((event.budget * clamped) / days);
}

/**
 * Prélèvement pour un jour donné. Sans `day`, renvoie la moyenne indicative
 * (utilisée pour annoncer une épargne qui n'a pas encore commencé).
 */
export function dailySaving(event: CalorieEvent, day?: DayKey): number {
  const days = Math.max(1, event.spreadDays);
  if (!day) return round5(event.budget / days);

  const index = savingDayIndex(event, day);
  return savedThrough(event, index) - savedThrough(event, index - 1);
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
  return savedThrough(event, savingDayIndex(event, day));
}

export function adjustmentsFor(events: CalorieEvent[], day: DayKey): DayAdjustment {
  const savingFor = events.filter((e) => isSavingDay(e, day));
  const happeningToday = events.filter((e) => e.date === day);
  return {
    saved: savingFor.reduce((sum, e) => sum + dailySaving(e, day), 0),
    released: happeningToday.reduce((sum, e) => sum + e.budget, 0),
    savingFor,
    happeningToday,
  };
}

/**
 * Série de jours consécutifs où l'objectif calories a été tenu, en remontant
 * depuis aujourd'hui. Une journée sans rien de consigné n'entre pas dans la
 * série, mais le jour en cours ne la casse pas tant qu'il n'est pas terminé.
 */
export function calorieStreak(
  totalsFor: (day: DayKey) => number,
  baseGoal: number,
  events: CalorieEvent[],
  from: DayKey,
): number {
  const held = (day: DayKey) => {
    const kcal = totalsFor(day);
    const { goal } = dailyGoal(totalsFor, baseGoal, events, day);
    return kcal > 0 && kcal <= goal + debtBuffer(goal);
  };

  let streak = held(from) ? 1 : 0;
  let day = addDays(from, -1);

  // Garde-fou : on ne remonte pas au-delà d'un an.
  for (let i = 0; i < 366 && held(day); i += 1) {
    streak += 1;
    day = addDays(day, -1);
  }

  return streak;
}

/**
 * Plancher de sécurité pour l'objectif ajusté par les événements : en dessous,
 * un déficit prolongé devient dangereux pour la plupart des adultes.
 */
export const MIN_SAFE_DAILY_CALORIES = 1200;

/**
 * Baisse maximale autorisée par rapport à l'objectif de base : un plancher
 * absolu seul est trop laxiste pour un gros objectif (25 % de moins sur
 * 3000 kcal reste énorme) et trop strict pour un petit objectif déjà proche
 * du minimum. On applique donc le plus restrictif des deux.
 */
export const MAX_EVENT_REDUCTION_RATIO = 0.25;

/**
 * Plancher réel pour un objectif de base donné : jamais au-dessus de
 * l'objectif lui-même — les événements ne doivent qu'empêcher de descendre
 * plus bas, jamais forcer une hausse.
 */
export function safeGoalFloor(baseGoal: number): number {
  const percentFloor = baseGoal * (1 - MAX_EVENT_REDUCTION_RATIO);
  return Math.min(baseGoal, Math.max(MIN_SAFE_DAILY_CALORIES, percentFloor));
}

/** Objectif calorique effectif du jour, épargne comprise. */
export function effectiveCalorieGoal(
  baseGoal: number,
  events: CalorieEvent[],
  day: DayKey,
): { goal: number; adjustment: DayAdjustment } {
  const adjustment = adjustmentsFor(events, day);
  const floor = safeGoalFloor(baseGoal);
  const goal = Math.max(floor, baseGoal - adjustment.saved + adjustment.released);
  return { goal, adjustment };
}

// ---------------------------------------------------------------------------
// Dette de dépassement
// ---------------------------------------------------------------------------

/**
 * Un dépassement franc (au-delà du tampon de bruit) n'est pas juste affiché
 * puis oublié : il réduit légèrement l'objectif des jours suivants, pour
 * revenir en douceur vers l'équilibre sans punir le jour même où il a eu
 * lieu. Toujours un seul compteur fusionné (jamais plusieurs dettes
 * empilées), toujours plafonné, et qui s'éteint tout seul si non résorbé —
 * jamais de spirale qui s'aggrave indéfiniment.
 */
export const DEBT_SPREAD_DAYS = 3;
export const DEBT_CAP = 500;
export const DEBT_BUFFER_MIN = 150;
export const DEBT_BUFFER_RATIO = 0.1;

/** Fenêtre de recalcul : largement suffisante, le plafond et la fusion des
 * dettes ramènent toujours à un état stable en quelques jours. */
const DEBT_LOOKBACK_DAYS = 14;

/**
 * Tampon de bruit sous lequel un dépassement n'est pas compté : une whey
 * post-séance ou un resto occasionnel ne doivent pas créer de dette.
 */
export function debtBuffer(goal: number): number {
  return Math.max(DEBT_BUFFER_MIN, Math.round(goal * DEBT_BUFFER_RATIO));
}

type DebtState = { remaining: number; daysLeft: number };

/**
 * Réduction de dette applicable un jour donné, et nouvel état après ce jour.
 * Les remboursements sont répartis en tranches égales sur `daysLeft` jours.
 */
function stepDebt(state: DebtState): { reduction: number; next: DebtState } {
  if (state.daysLeft <= 0 || state.remaining <= 0) return { reduction: 0, next: { remaining: 0, daysLeft: 0 } };
  const reduction = Math.min(state.remaining, Math.ceil(state.remaining / state.daysLeft));
  return {
    reduction,
    next: { remaining: state.remaining - reduction, daysLeft: state.daysLeft - 1 },
  };
}

/**
 * Dette active un jour donné, recalculée à partir de l'historique plutôt que
 * stockée. On rejoue les derniers jours en partant d'une dette nulle : le
 * plafond et la fusion des dettes effacent toute erreur d'initialisation en
 * quelques itérations.
 */
export function activeDebt(
  totalsFor: (day: DayKey) => number,
  baseGoal: number,
  events: CalorieEvent[],
  day: DayKey,
): number {
  let state: DebtState = { remaining: 0, daysLeft: 0 };

  for (let i = DEBT_LOOKBACK_DAYS; i >= 0; i -= 1) {
    const d = addDays(day, -i);
    const { reduction, next } = stepDebt(state);
    state = next;

    if (d === day) return reduction;

    const epargneGoal = effectiveCalorieGoal(baseGoal, events, d).goal;
    const displayedGoal = Math.max(safeGoalFloor(baseGoal), epargneGoal - reduction);
    const overage = Math.max(0, totalsFor(d) - (displayedGoal + debtBuffer(displayedGoal)));

    if (overage > 0) {
      state = { remaining: Math.min(DEBT_CAP, state.remaining + overage), daysLeft: DEBT_SPREAD_DAYS };
    }
  }

  return 0;
}

/** Objectif du jour, épargne et dette comprises, jamais sous le plancher de sécurité. */
export function dailyGoal(
  totalsFor: (day: DayKey) => number,
  baseGoal: number,
  events: CalorieEvent[],
  day: DayKey,
): { goal: number; adjustment: DayAdjustment; debt: number } {
  const { goal: epargneGoal, adjustment } = effectiveCalorieGoal(baseGoal, events, day);
  const debt = activeDebt(totalsFor, baseGoal, events, day);
  const goal = Math.max(safeGoalFloor(baseGoal), epargneGoal - debt);
  return { goal, adjustment, debt };
}
