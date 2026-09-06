import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DayKey } from '@/lib/date';
import { mealForHour, type CalorieEvent, type FoodEntry, type Profile } from '@/store/types';

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

type State = {
  hydrated: boolean;
  onboarded: boolean;
  profile: Profile;
  calorieGoal: number;
  proteinGoal: number;
  entries: FoodEntry[];
  events: CalorieEvent[];
};

type Actions = {
  completeOnboarding: (profile: Profile, calorieGoal: number, proteinGoal: number) => void;
  setProfile: (patch: Partial<Profile>) => void;
  setGoals: (calorieGoal: number, proteinGoal: number) => void;

  addEntry: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, patch: Partial<FoodEntry>) => void;
  removeEntry: (id: string) => void;

  addEvent: (event: Omit<CalorieEvent, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, patch: Partial<CalorieEvent>) => void;
  removeEvent: (id: string) => void;

  resetAll: () => void;
};

export const DEFAULT_PROFILE: Profile = {
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  activity: 'light',
  goal: 'lose',
  paceKgPerWeek: 0.5,
};

const initialState: State = {
  hydrated: false,
  onboarded: false,
  profile: DEFAULT_PROFILE,
  calorieGoal: 2000,
  proteinGoal: 140,
  entries: [],
  events: [],
};

export const useAppStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,

      completeOnboarding: (profile, calorieGoal, proteinGoal) =>
        set({ profile, calorieGoal, proteinGoal, onboarded: true }),

      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      setGoals: (calorieGoal, proteinGoal) => set({ calorieGoal, proteinGoal }),

      addEntry: (entry) =>
        set((s) => ({
          entries: [...s.entries, { ...entry, id: uid(), createdAt: Date.now() }],
        })),

      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      addEvent: (event) =>
        set((s) => ({
          events: [...s.events, { ...event, id: uid(), createdAt: Date.now() }],
        })),

      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      resetAll: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: 'kcal-store-v1',
      version: 2,
      storage: createJSONStorage(() => Storage),
      partialize: ({ hydrated, ...rest }) => rest,
      // v2 : les entrées gagnent un repas, déduit de l'heure de saisie.
      migrate: (persisted, version) => {
        const state = persisted as State;
        if (version < 2 && state?.entries) {
          state.entries = state.entries.map((e) => ({
            ...e,
            meal: e.meal ?? mealForHour(new Date(e.createdAt).getHours()),
          }));
        }
        return state;
      },
    },
  ),
);

// `persist` ne peut pas appeler une action pendant la réhydratation : on marque
// l'état prêt juste après, ce qui évite un flash d'onboarding au démarrage.
useAppStore.persist.onFinishHydration(() => useAppStore.setState({ hydrated: true }));
if (useAppStore.persist.hasHydrated()) useAppStore.setState({ hydrated: true });

// --- sélecteurs ------------------------------------------------------------

export function entriesForDay(entries: FoodEntry[], day: DayKey): FoodEntry[] {
  return entries.filter((e) => e.day === day).sort((a, b) => a.createdAt - b.createdAt);
}

export function totalsForDay(entries: FoodEntry[], day: DayKey) {
  return entriesForDay(entries, day).reduce(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein }),
    { kcal: 0, protein: 0 },
  );
}

/** Aliments récemment enregistrés, dédupliqués, pour un ré-ajout en un tap. */
export function recentFoods(entries: FoodEntry[], limit = 12): FoodEntry[] {
  const seen = new Set<string>();
  const out: FoodEntry[] = [];
  for (const e of [...entries].sort((a, b) => b.createdAt - a.createdAt)) {
    const key = e.barcode ?? e.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/** Événements à venir ou du jour, du plus proche au plus lointain. */
export function upcomingEvents(events: CalorieEvent[], from: DayKey): CalorieEvent[] {
  return events.filter((e) => e.date >= from).sort((a, b) => a.date.localeCompare(b.date));
}

export function pastEvents(events: CalorieEvent[], from: DayKey): CalorieEvent[] {
  return events.filter((e) => e.date < from).sort((a, b) => b.date.localeCompare(a.date));
}
