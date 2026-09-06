import { Platform } from 'react-native';

import { today } from '@/lib/date';
import { dailyGoal, debtBuffer } from '@/lib/nutrition';
import { totalsForDay, useAppStore } from '@/store/useAppStore';

/** Doit rester identique à app.json, expo-target.config.js et index.swift. */
const APP_GROUP = 'group.com.benjamin.kcal';
const SNAPSHOT_KEY = 'snapshot';

type Snapshot = {
  caloriesConsumed: number;
  caloriesGoal: number;
  /** Tampon de bruit au-delà de l'objectif : le widget ne doit jamais afficher de rouge en dessous. */
  caloriesBuffer: number;
  proteinConsumed: number;
  proteinGoal: number;
  day: string;
};

/**
 * `@bacons/apple-targets` a un module natif : il n'existe ni sur Android, ni sur
 * le web, ni dans Expo Go. On le charge donc paresseusement et on avale toute
 * erreur — l'app doit continuer à tourner sans widget.
 */
function getStorage(): { set: (k: string, v: string) => void } | null {
  if (Platform.OS !== 'ios') return null;
  try {
    const { ExtensionStorage } = require('@bacons/apple-targets');
    return new ExtensionStorage(APP_GROUP);
  } catch {
    return null;
  }
}

function reloadWidget() {
  try {
    require('@bacons/apple-targets').ExtensionStorage.reloadWidget();
  } catch {
    // Pas de widget disponible : rien à recharger.
  }
}

function buildSnapshot(): Snapshot {
  const { entries, events, calorieGoal, proteinGoal } = useAppStore.getState();
  const day = today();
  const totals = totalsForDay(entries, day);

  // L'objectif exposé est celui du jour, épargne et dette comprises.
  const goal = dailyGoal((d) => totalsForDay(entries, d).kcal, calorieGoal, events, day).goal;

  return {
    caloriesConsumed: Math.round(totals.kcal),
    caloriesGoal: goal,
    caloriesBuffer: debtBuffer(goal),
    proteinConsumed: Math.round(totals.protein * 10) / 10,
    proteinGoal,
    day,
  };
}

let lastPayload: string | null = null;

/** Écrit l'instantané dans l'App Group et rafraîchit le widget si besoin. */
export function syncWidget() {
  const storage = getStorage();
  if (!storage) return;

  const payload = JSON.stringify(buildSnapshot());
  if (payload === lastPayload) return;
  lastPayload = payload;

  try {
    storage.set(SNAPSHOT_KEY, payload);
    reloadWidget();
  } catch {
    // Écriture impossible (App Group absent d'un build de dev) : on ignore.
  }
}

/**
 * Branche la synchronisation sur le store. Renvoie la fonction de
 * désabonnement. À appeler une fois, depuis le layout racine.
 */
export function startWidgetSync(): () => void {
  if (Platform.OS !== 'ios') return () => {};
  syncWidget();
  return useAppStore.subscribe(syncWidget);
}
