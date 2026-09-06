import { GENERIC_FOODS, type GenericFood } from '@/data/generic-foods';
import { basisForUnit } from '@/lib/units';
import type { NutritionBasis, Unit } from '@/store/types';

const ACCENTS = 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿœæ';
const PLAIN = 'aaaaaaceeeeiiiinooooouuuuyyoa';

/**
 * Minuscules sans accents. On évite `String.normalize('NFD')`, dont le support
 * n'est pas garanti sur Hermes ; les mots-clés de la table sont déjà normalisés
 * à la génération, seule la requête passe ici.
 */
export function deaccent(input: string): string {
  let out = '';
  for (const char of input.toLowerCase()) {
    const i = ACCENTS.indexOf(char);
    out += i === -1 ? char : PLAIN[i];
  }
  return out;
}

/**
 * Recherche dans la table CIQUAL. Tous les termes doivent être trouvés, et un
 * terme qui commence le nom pèse plus qu'un simple mot-clé : « riz » remonte
 * « Riz blanc cru » avant « Galette de riz ».
 */
const WORDS = /[^a-z0-9%]+/;

export function searchGenericFoods(query: string, limit = 8): GenericFood[] {
  // Même découpage que pour les noms, sinon « huile d'olive » chercherait le
  // mot « d'olive », qui n'existe nulle part.
  const terms = deaccent(query).split(WORDS).filter((t) => t.length > 1);
  if (terms.length === 0) return [];

  const scored: { food: GenericFood; score: number }[] = [];

  for (const food of GENERIC_FOODS) {
    const name = deaccent(food.name);
    // On compare mot à mot : sans ça « oeuf » remonterait « bœuf », et
    // « riz » remonterait « chorizo ».
    const words = name.split(WORDS).filter(Boolean);
    const keywords = food.keywords.split(' ');
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      // Le mot exact prime : « lait » doit remonter « Lait écrémé » avant
      // « Laitue crue », qui ne correspond que par préfixe.
      if (words.includes(term)) score += 14;
      else if (name.startsWith(term)) score += 10;
      else if (words.some((w) => w.startsWith(term))) score += 6;
      else if (keywords.some((k) => k.startsWith(term))) score += 3;
      else {
        matchedAll = false;
        break;
      }
    }

    // À score égal, le nom le plus court est le plus générique.
    if (matchedAll) scored.push({ food, score: score * 100 - food.name.length });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.food);
}

export function findGenericFood(id: string): GenericFood | undefined {
  return GENERIC_FOODS.find((f) => f.id === id);
}

/** Unités proposées : l'unité de référence, plus les cuillères. */
export function unitsForGeneric(food: GenericFood): Unit[] {
  return [food.unit, 'tbsp', 'tsp'];
}

export function basisForGeneric(food: GenericFood, unit: Unit): NutritionBasis {
  return basisForUnit({ kcal: food.kcal, protein: food.protein }, food.unit, unit);
}

export type { GenericFood };
