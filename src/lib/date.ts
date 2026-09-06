/** Toutes les dates de l'app sont des chaînes locales `YYYY-MM-DD`. */
export type DayKey = string;

export function toDayKey(d: Date): DayKey {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): DayKey {
  return toDayKey(new Date());
}

export function addDays(key: DayKey, delta: number): DayKey {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + delta);
  return toDayKey(d);
}

/** Nombre de jours entiers entre deux jours (b - a). */
export function daysBetween(a: DayKey, b: DayKey): number {
  const ms = fromDayKey(b).getTime() - fromDayKey(a).getTime();
  return Math.round(ms / 86_400_000);
}

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = [
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

export function weekdayLetter(key: DayKey): string {
  return WEEKDAYS[fromDayKey(key).getDay()];
}

export function dayNumber(key: DayKey): number {
  return fromDayKey(key).getDate();
}

/** « Aujourd'hui », « Hier », sinon « 13 septembre ». */
export function humanDay(key: DayKey): string {
  const diff = daysBetween(today(), key);
  if (diff === 0) return "Aujourd'hui";
  if (diff === -1) return 'Hier';
  if (diff === 1) return 'Demain';
  const d = fromDayKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function shortDate(key: DayKey): string {
  const d = fromDayKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4)}.`;
}

/** Les 7 jours se terminant à `end` (inclus). */
export function weekEndingAt(end: DayKey): DayKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
}

/** Lundi de la semaine contenant `key`. */
export function mondayOf(key: DayKey): DayKey {
  const d = fromDayKey(key);
  const offset = (d.getDay() + 6) % 7; // dimanche = 6
  return addDays(key, -offset);
}

/** Les 7 jours de la semaine commençant au lundi `monday`. */
export function weekFrom(monday: DayKey): DayKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** « 1 – 7 septembre » ou « 29 sept. – 5 oct. » si la semaine est à cheval. */
export function weekRangeLabel(monday: DayKey): string {
  const start = fromDayKey(monday);
  const end = fromDayKey(addDays(monday, 6));
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 4)}. – ${end.getDate()} ${MONTHS[
    end.getMonth()
  ].slice(0, 4)}.`;
}

/** « Cette semaine », « Semaine dernière », sinon la plage de dates. */
export function humanWeek(monday: DayKey): string {
  const current = mondayOf(today());
  const diff = daysBetween(monday, current) / 7;
  if (diff === 0) return 'Cette semaine';
  if (diff === 1) return 'Semaine dernière';
  return weekRangeLabel(monday);
}
