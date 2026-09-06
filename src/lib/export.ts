import { addDays, DayKey, fromDayKey, today } from '@/lib/date';
import { ACTIVITY_LABELS, effectiveCalorieGoal, GOAL_LABELS } from '@/lib/nutrition';
import {
  MEAL_LABELS,
  MEAL_ORDER,
  UNIT_LABELS,
  type CalorieEvent,
  type FoodEntry,
  type Profile,
} from '@/store/types';

export type ExportFormat = 'markdown' | 'json';

export type ExportInput = {
  entries: FoodEntry[];
  events: CalorieEvent[];
  profile: Profile;
  calorieGoal: number;
  proteinGoal: number;
  /** Nombre de jours à inclure, en remontant depuis aujourd'hui. */
  days: number;
};

const FULL_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const FULL_WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function longDate(key: DayKey): string {
  const d = fromDayKey(key);
  return `${FULL_WEEKDAYS[d.getDay()]} ${d.getDate()} ${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function quantityLabel(entry: FoodEntry): string {
  const unit = UNIT_LABELS[entry.unit];
  const plural = (entry.unit === 'piece' || entry.unit === 'serving') && entry.quantity > 1 ? 's' : '';
  return `${round1(entry.quantity)} ${unit}${plural}`;
}

/** Les jours de la fenêtre demandée, du plus ancien au plus récent. */
function windowDays(days: number): DayKey[] {
  const end = today();
  return Array.from({ length: days }, (_, i) => addDays(end, i - (days - 1)));
}

type DayBundle = {
  day: DayKey;
  goal: number;
  kcal: number;
  protein: number;
  entries: FoodEntry[];
  events: CalorieEvent[];
};

function collect(input: ExportInput): DayBundle[] {
  return windowDays(input.days).map((day) => {
    const dayEntries = input.entries
      .filter((e) => e.day === day)
      .sort((a, b) => MEAL_ORDER.indexOf(a.meal) - MEAL_ORDER.indexOf(b.meal) || a.createdAt - b.createdAt);

    return {
      day,
      goal: effectiveCalorieGoal(input.calorieGoal, input.events, day).goal,
      kcal: dayEntries.reduce((s, e) => s + e.kcal, 0),
      protein: dayEntries.reduce((s, e) => s + e.protein, 0),
      entries: dayEntries,
      events: input.events.filter((e) => e.date === day),
    };
  });
}

/** Nombre de jours réellement renseignés (utile pour les moyennes). */
export function loggedDayCount(input: ExportInput): number {
  return collect(input).filter((d) => d.entries.length > 0).length;
}

// ---------------------------------------------------------------------------

export function toMarkdown(input: ExportInput): string {
  const bundles = collect(input);
  const logged = bundles.filter((d) => d.entries.length > 0);
  const lines: string[] = [];

  const first = bundles[0]?.day;
  const last = bundles[bundles.length - 1]?.day;

  lines.push(`# Journal alimentaire — ${longDate(first)} → ${longDate(last)}`);
  lines.push('');
  lines.push('## Contexte');
  lines.push(
    `- Profil : ${input.profile.sex === 'male' ? 'homme' : 'femme'}, ${input.profile.age} ans, ` +
      `${input.profile.heightCm} cm, ${round1(input.profile.weightKg)} kg`,
  );
  lines.push(
    `- Activité : ${ACTIVITY_LABELS[input.profile.activity].toLowerCase()} · Objectif : ` +
      `${GOAL_LABELS[input.profile.goal].toLowerCase()}`,
  );
  lines.push(`- Cibles quotidiennes : ${input.calorieGoal} kcal, ${input.proteinGoal} g de protéines`);
  lines.push(
    '- Les objectifs quotidiens ci-dessous peuvent différer de la cible : une « épargne » ' +
      'répartit des calories avant un événement prévu, puis les débloque le jour J.',
  );
  lines.push('');

  if (logged.length > 0) {
    const avgKcal = Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length);
    const avgProt = Math.round(logged.reduce((s, d) => s + d.protein, 0) / logged.length);
    const onTarget = logged.filter((d) => d.kcal <= d.goal).length;
    const proteinHit = logged.filter((d) => input.proteinGoal > 0 && d.protein >= input.proteinGoal).length;

    lines.push('## Résumé');
    lines.push(`- Jours renseignés : ${logged.length} sur ${bundles.length}`);
    lines.push(`- Moyenne : ${avgKcal} kcal et ${avgProt} g de protéines par jour renseigné`);
    lines.push(`- Objectif calories tenu : ${onTarget} jour(s) sur ${logged.length}`);
    lines.push(`- Objectif protéines atteint : ${proteinHit} jour(s) sur ${logged.length}`);
    lines.push('');
  }

  lines.push('## Détail par jour');
  lines.push('');

  for (const bundle of bundles) {
    if (bundle.entries.length === 0) continue;

    lines.push(
      `### ${longDate(bundle.day)} — ${Math.round(bundle.kcal)} / ${bundle.goal} kcal · ` +
        `${round1(bundle.protein)} / ${input.proteinGoal} g de protéines`,
    );

    for (const event of bundle.events) {
      lines.push(`> Événement : ${event.name} (+${event.budget} kcal débloquées ce jour-là)`);
    }

    for (const meal of MEAL_ORDER) {
      const items = bundle.entries.filter((e) => e.meal === meal);
      if (items.length === 0) continue;

      const mealKcal = Math.round(items.reduce((s, e) => s + e.kcal, 0));
      lines.push('');
      lines.push(`**${MEAL_LABELS[meal]}** — ${mealKcal} kcal`);
      for (const entry of items) {
        const brand = entry.brand ? ` (${entry.brand})` : '';
        lines.push(
          `- ${entry.name}${brand} — ${quantityLabel(entry)} — ${Math.round(entry.kcal)} kcal, ` +
            `${round1(entry.protein)} g de protéines`,
        );
      }
    }

    lines.push('');
  }

  if (logged.length === 0) {
    lines.push('_Aucun aliment enregistré sur cette période._');
    lines.push('');
  }

  return lines.join('\n');
}

export function toJson(input: ExportInput): string {
  const bundles = collect(input);

  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      range: { from: bundles[0]?.day, to: bundles[bundles.length - 1]?.day, days: input.days },
      profile: {
        sex: input.profile.sex,
        age: input.profile.age,
        heightCm: input.profile.heightCm,
        weightKg: input.profile.weightKg,
        activity: input.profile.activity,
        goal: input.profile.goal,
      },
      targets: { calories: input.calorieGoal, protein: input.proteinGoal },
      days: bundles
        .filter((d) => d.entries.length > 0)
        .map((d) => ({
          date: d.day,
          calorieGoalForDay: d.goal,
          totals: { calories: Math.round(d.kcal), protein: round1(d.protein) },
          events: d.events.map((e) => ({ name: e.name, extraCalories: e.budget })),
          entries: d.entries.map((e) => ({
            meal: e.meal,
            name: e.name,
            brand: e.brand ?? null,
            quantity: round1(e.quantity),
            unit: e.unit,
            calories: Math.round(e.kcal),
            protein: round1(e.protein),
          })),
        })),
    },
    null,
    2,
  );
}

export function buildExport(input: ExportInput, format: ExportFormat): string {
  return format === 'json' ? toJson(input) : toMarkdown(input);
}
