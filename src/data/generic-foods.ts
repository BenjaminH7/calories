/**
 * Aliments génériques — table CIQUAL 2020 (ANSES).
 *
 * OpenFoodFacts est une base de produits *emballés* : y chercher « riz » ou
 * « huile d'olive » renvoie des dizaines de fiches contributives de qualité
 * inégale. Pour les aliments bruts, on interroge d'abord cette table, mesurée
 * en laboratoire et curée : une entrée par aliment.
 *
 * Valeurs pour 100 g, énergie au sens du règlement UE 1169/2011. Les quelques
 * aliments liquides (huiles, laits) sont convertis en valeurs pour 100 ml avec
 * leur densité réelle, car c'est ainsi qu'on les dose.
 * Source : https://ciqual.anses.fr — Licence Ouverte (Etalab).
 * Généré depuis le jeu XML officiel, ne pas éditer à la main.
 */

export type GenericCategory =
  | 'viande'
  | 'poisson'
  | 'feculent'
  | 'legume'
  | 'fruit'
  | 'laitier'
  | 'gras'
  | 'oleagineux'
  | 'sucre'
  | 'divers';

export type GenericFood = {
  /** Code CIQUAL, stable et traçable jusqu'à la source. */
  id: string;
  name: string;
  category: GenericCategory;
  /** Unité de référence des valeurs pour 100. */
  unit: 'g' | 'ml';
  kcal: number;
  protein: number;
  /** Termes de recherche, déjà normalisés (minuscules, sans accents). */
  keywords: string;
};

export const GENERIC_FOODS: GenericFood[] = [
  { id: '36017', name: "Poulet, filet cru", category: 'viande', unit: 'g', kcal: 110.0, protein: 23.4, keywords: "blanc cru filet peau poulet sans" },
  { id: '36018', name: "Poulet, filet poêlé", category: 'viande', unit: 'g', kcal: 141.0, protein: 30.1, keywords: "blanc cuit filet peau poele poulet sans saute" },
  { id: '36003', name: "Poulet, viande crue", category: 'viande', unit: 'g', kcal: 113.0, protein: 20.0, keywords: "crue poulet viande" },
  { id: '36005', name: "Poulet, rôti (avec peau)", category: 'viande', unit: 'g', kcal: 213.0, protein: 28.9, keywords: "avec cuit four peau poulet roti viande" },
  { id: '28963', name: "Blanc de poulet en tranche", category: 'viande', unit: 'g', kcal: 106.0, protein: 20.7, keywords: "blanc jambon poulet tranche" },
  { id: '36301', name: "Dinde, viande crue", category: 'viande', unit: 'g', kcal: 110.0, protein: 22.4, keywords: "crue dinde viande" },
  { id: '28964', name: "Blanc de dinde en tranche", category: 'viande', unit: 'g', kcal: 104.0, protein: 20.9, keywords: "blanc dinde jambon tranche" },
  { id: '6250', name: "Steak haché 5% MG, cru", category: 'viande', unit: 'g', kcal: 130.0, protein: 21.9, keywords: "boeuf cru hache steak" },
  { id: '6251', name: "Steak haché 5% MG, cuit", category: 'viande', unit: 'g', kcal: 155.0, protein: 25.5, keywords: "boeuf cuit hache steak" },
  { id: '6255', name: "Steak haché 15% MG, cuit", category: 'viande', unit: 'g', kcal: 239.0, protein: 23.6, keywords: "15% boeuf cuit hache steak" },
  { id: '6200', name: "Steak / bifteck grillé", category: 'viande', unit: 'g', kcal: 128.0, protein: 27.6, keywords: "bifteck boeuf grille steak" },
  { id: '6100', name: "Bœuf, entrecôte grillée", category: 'viande', unit: 'g', kcal: 198.0, protein: 25.5, keywords: "boeuf bœuf entrecote grillee maigre partie poelee" },
  { id: '28201', name: "Porc, filet maigre cru", category: 'viande', unit: 'g', kcal: 117.0, protein: 21.2, keywords: "cru filet maigre porc" },
  { id: '28204', name: "Porc, filet mignon cru", category: 'viande', unit: 'g', kcal: 123.0, protein: 21.2, keywords: "cru filet mignon porc" },
  { id: '28900', name: "Jambon cuit supérieur", category: 'viande', unit: 'g', kcal: 125.0, protein: 20.8, keywords: "blanc cuit jambon superieur" },
  { id: '28502', name: "Poitrine de porc fumée", category: 'viande', unit: 'g', kcal: 303.0, protein: 15.6, keywords: "crue fumee lardons poitrine porc" },
  { id: '6522', name: "Veau, escalope crue", category: 'viande', unit: 'g', kcal: 111.0, protein: 21.8, keywords: "crue escalope noix veau" },
  { id: '22000', name: "Œuf cru", category: 'viande', unit: 'g', kcal: 140.0, protein: 12.7, keywords: "cru oeuf œuf" },
  { id: '22010', name: "Œuf dur", category: 'viande', unit: 'g', kcal: 134.0, protein: 13.5, keywords: "dur oeuf œuf" },
  { id: '26036', name: "Saumon cru (élevage)", category: 'poisson', unit: 'g', kcal: 194.0, protein: 20.5, keywords: "cru elevage saumon" },
  { id: '26038', name: "Saumon cuit vapeur", category: 'poisson', unit: 'g', kcal: 195.0, protein: 23.0, keywords: "cuit saumon vapeur" },
  { id: '26037', name: "Saumon fumé", category: 'poisson', unit: 'g', kcal: 178.0, protein: 22.0, keywords: "fume saumon" },
  { id: '26043', name: "Cabillaud cru", category: 'poisson', unit: 'g', kcal: 77.6, protein: 18.1, keywords: "cabillaud cru morue" },
  { id: '26023', name: "Cabillaud au four", category: 'poisson', unit: 'g', kcal: 94.6, protein: 22.3, keywords: "cabillaud cuit four morue roti" },
  { id: '26039', name: "Thon au naturel, égoutté", category: 'poisson', unit: 'g', kcal: 111.0, protein: 26.8, keywords: "appertise boite conserve egoutte naturel thon" },
  { id: '26053', name: "Thon cru", category: 'poisson', unit: 'g', kcal: 144.0, protein: 24.0, keywords: "cru thon" },
  { id: '26040', name: "Sardine à l'huile, égouttée", category: 'poisson', unit: 'g', kcal: 202.0, protein: 24.3, keywords: "appertisee boite conserve egouttee huile olive sardine" },
  { id: '10007', name: "Crevette cuite", category: 'poisson', unit: 'g', kcal: 93.8, protein: 19.0, keywords: "crevette cuite" },
  { id: '10021', name: "Crevette crue", category: 'poisson', unit: 'g', kcal: 99.0, protein: 19.7, keywords: "crevette crue" },
  { id: '9100', name: "Riz blanc cru", category: 'feculent', unit: 'g', kcal: 352.0, protein: 7.0, keywords: "blanc cru riz" },
  { id: '9104', name: "Riz blanc cuit", category: 'feculent', unit: 'g', kcal: 145.0, protein: 2.9, keywords: "blanc cuit non riz sale" },
  { id: '9102', name: "Riz complet cru", category: 'feculent', unit: 'g', kcal: 350.0, protein: 7.0, keywords: "complet cru riz" },
  { id: '9103', name: "Riz complet cuit", category: 'feculent', unit: 'g', kcal: 158.0, protein: 3.2, keywords: "complet cuit non riz sale" },
  { id: '9810', name: "Pâtes sèches crues", category: 'feculent', unit: 'g', kcal: 336.0, protein: 11.5, keywords: "crues pates penne seches spaghetti standard" },
  { id: '9811', name: "Pâtes cuites", category: 'feculent', unit: 'g', kcal: 126.0, protein: 4.0, keywords: "cuites non pates penne salees seches spaghetti standard" },
  { id: '9870', name: "Pâtes complètes crues", category: 'feculent', unit: 'g', kcal: 353.0, protein: 11.8, keywords: "ble complet completes crues pates seches" },
  { id: '9610', name: "Semoule de blé crue", category: 'feculent', unit: 'g', kcal: 352.0, protein: 10.9, keywords: "ble couscous crue dur semoule" },
  { id: '9611', name: "Semoule de blé cuite", category: 'feculent', unit: 'g', kcal: 122.0, protein: 3.4, keywords: "ble couscous cuite dur non salee semoule" },
  { id: '9690', name: "Boulgour cru", category: 'feculent', unit: 'g', kcal: 351.0, protein: 11.5, keywords: "ble boulgour cru" },
  { id: '9691', name: "Boulgour cuit", category: 'feculent', unit: 'g', kcal: 111.0, protein: 3.7, keywords: "ble boulgour cuit non sale" },
  { id: '9340', name: "Quinoa cru", category: 'feculent', unit: 'g', kcal: 358.0, protein: 13.2, keywords: "cru quinoa" },
  { id: '9341', name: "Quinoa cuit", category: 'feculent', unit: 'g', kcal: 149.0, protein: 4.7, keywords: "bouilli cuit eau non quinoa sale" },
  { id: '9310', name: "Avoine crue", category: 'feculent', unit: 'g', kcal: 378.0, protein: 16.9, keywords: "avoine crue" },
  { id: '9311', name: "Flocons d'avoine", category: 'feculent', unit: 'g', kcal: 367.0, protein: 13.3, keywords: "avoine flocon flocons porridge" },
  { id: '9313', name: "Flocons d'avoine cuits", category: 'feculent', unit: 'g', kcal: 75.5, protein: 2.5, keywords: "avoine bouillis cuits eau flocons porridge" },
  { id: '20587', name: "Lentille verte cuite", category: 'feculent', unit: 'g', kcal: 127.0, protein: 10.1, keywords: "bouillie cuite eau lentille verte" },
  { id: '20507', name: "Pois chiche cuit", category: 'feculent', unit: 'g', kcal: 147.0, protein: 8.3, keywords: "bouilli chiche cuit eau pois" },
  { id: '20503', name: "Haricot rouge cuit", category: 'feculent', unit: 'g', kcal: 116.0, protein: 9.6, keywords: "bouilli cuit eau haricot rouge" },
  { id: '20037', name: "Petits pois cuits", category: 'feculent', unit: 'g', kcal: 49.8, protein: 5.8, keywords: "cuits petits pois" },
  { id: '20066', name: "Maïs doux, égoutté", category: 'feculent', unit: 'g', kcal: 106.0, protein: 2.8, keywords: "appertise doux egoutte mais" },
  { id: '7001', name: "Pain baguette", category: 'feculent', unit: 'g', kcal: 287.0, protein: 8.3, keywords: "baguette courante pain" },
  { id: '7110', name: "Pain complet", category: 'feculent', unit: 'g', kcal: 244.0, protein: 8.4, keywords: "complet farine integral pain t150" },
  { id: '7200', name: "Pain de mie courant", category: 'feculent', unit: 'g', kcal: 278.0, protein: 7.1, keywords: "courant mie pain" },
  { id: '7111', name: "Pain de mie complet", category: 'feculent', unit: 'g', kcal: 262.0, protein: 8.5, keywords: "complet mie pain" },
  { id: '4008', name: "Pomme de terre crue", category: 'feculent', unit: 'g', kcal: 80.5, protein: 2.2, keywords: "crue peau pomme sans terre" },
  { id: '4003', name: "Pomme de terre à l'eau", category: 'feculent', unit: 'g', kcal: 80.5, protein: 1.8, keywords: "bouillie cuite eau pomme terre" },
  { id: '4002', name: "Pomme de terre au four", category: 'feculent', unit: 'g', kcal: 91.9, protein: 2.0, keywords: "cuite four peau pomme rotie sans terre" },
  { id: '4101', name: "Patate douce crue", category: 'feculent', unit: 'g', kcal: 86.3, protein: 1.5, keywords: "crue douce patate" },
  { id: '4102', name: "Patate douce cuite", category: 'feculent', unit: 'g', kcal: 62.8, protein: 1.7, keywords: "cuite douce patate" },
  { id: '19041', name: "Lait demi-écrémé", category: 'laitier', unit: 'ml', kcal: 48.4, protein: 3.5, keywords: "demi ecreme lait uht" },
  { id: '19050', name: "Lait écrémé", category: 'laitier', unit: 'ml', kcal: 34.4, protein: 3.6, keywords: "ecreme lait uht" },
  { id: '19546', name: "Yaourt nature", category: 'laitier', unit: 'g', kcal: 64.5, protein: 3.8, keywords: "bifidus fermente lait laitiere nature specialite type yaourt" },
  { id: '19544', name: "Yaourt nature maigre", category: 'laitier', unit: 'g', kcal: 43.3, protein: 4.4, keywords: "bifidus fermente lait laitiere maigre nature specialite type yaourt" },
  { id: '19550', name: "Yaourt à la grecque (brebis)", category: 'laitier', unit: 'g', kcal: 69.1, protein: 3.8, keywords: "brebis grecque lait yaourt" },
  { id: '19644', name: "Fromage blanc 0% MG", category: 'laitier', unit: 'g', kcal: 49.4, protein: 8.0, keywords: "blanc fromage nature" },
  { id: '19646', name: "Fromage blanc 3% MG", category: 'laitier', unit: 'g', kcal: 76.9, protein: 8.0, keywords: "blanc environ fromage nature" },
  { id: '12115', name: "Emmental", category: 'laitier', unit: 'g', kcal: 373.0, protein: 27.9, keywords: "emmental emmenthal gruyere rape" },
  { id: '12110', name: "Comté", category: 'laitier', unit: 'g', kcal: 418.0, protein: 27.2, keywords: "comte" },
  { id: '12120', name: "Parmesan", category: 'laitier', unit: 'g', kcal: 406.0, protein: 31.1, keywords: "parmesan" },
  { id: '19590', name: "Mozzarella", category: 'laitier', unit: 'g', kcal: 227.0, protein: 16.5, keywords: "lait mozzarella vache" },
  { id: '12066', name: "Feta", category: 'laitier', unit: 'g', kcal: 285.0, protein: 15.1, keywords: "aop feta" },
  { id: '12001', name: "Camembert", category: 'laitier', unit: 'g', kcal: 280.0, protein: 19.5, keywords: "camembert precision sans" },
  { id: '12812', name: "Fromage de chèvre bûche", category: 'laitier', unit: 'g', kcal: 285.0, protein: 18.8, keywords: "buche chevre fromage" },
  { id: '16400', name: "Beurre doux 82% MG", category: 'gras', unit: 'g', kcal: 753.0, protein: 0.7, keywords: "82% beurre doux" },
  { id: '17270', name: "Huile d'olive vierge extra", category: 'gras', unit: 'ml', kcal: 828.0, protein: 0.5, keywords: "extra huile olive vierge" },
  { id: '17130', name: "Huile de colza", category: 'gras', unit: 'ml', kcal: 828.0, protein: 0.0, keywords: "colza huile" },
  { id: '17440', name: "Huile de tournesol", category: 'gras', unit: 'ml', kcal: 828.9, protein: 0.5, keywords: "huile tournesol" },
  { id: '15000', name: "Amande", category: 'oleagineux', unit: 'g', kcal: 574.9, protein: 18.8, keywords: "amande avec peau" },
  { id: '15004', name: "Noisette", category: 'oleagineux', unit: 'g', kcal: 598.3, protein: 14.4, keywords: "noisette" },
  { id: '15001', name: "Cacahuète", category: 'oleagineux', unit: 'g', kcal: 592.3, protein: 22.8, keywords: "arachide cacahuete" },
  { id: '20047', name: "Tomate crue", category: 'legume', unit: 'g', kcal: 19.3, protein: 0.9, keywords: "crue tomate" },
  { id: '20020', name: "Courgette crue", category: 'legume', unit: 'g', kcal: 16.5, protein: 1.2, keywords: "courgette crue peau pulpe" },
  { id: '20021', name: "Courgette cuite", category: 'legume', unit: 'g', kcal: 15.5, protein: 0.9, keywords: "courgette cuite peau pulpe" },
  { id: '20302', name: "Brocoli cuit", category: 'legume', unit: 'g', kcal: 23.5, protein: 2.5, keywords: "bouilli brocoli croquant cuit eau" },
  { id: '20030', name: "Haricot vert cuit", category: 'legume', unit: 'g', kcal: 29.4, protein: 2.0, keywords: "cuit haricot vert" },
  { id: '20009', name: "Carotte crue", category: 'legume', unit: 'g', kcal: 40.2, protein: 0.6, keywords: "carotte crue" },
  { id: '20336', name: "Épinard cuit", category: 'legume', unit: 'g', kcal: 28.1, protein: 3.4, keywords: "bouilli cuit eau epinard" },
  { id: '20270', name: "Épinard, jeunes pousses", category: 'legume', unit: 'g', kcal: 18.3, protein: 2.1, keywords: "cru epinard jeunes pour pousses salade salades" },
  { id: '20087', name: "Poivron rouge cru", category: 'legume', unit: 'g', kcal: 36.6, protein: 1.1, keywords: "cru poivron rouge" },
  { id: '20239', name: "Oignon jaune cru", category: 'legume', unit: 'g', kcal: 37.8, protein: 1.2, keywords: "cru jaune oignon" },
  { id: '20056', name: "Champignon de Paris cru", category: 'legume', unit: 'g', kcal: 28.0, protein: 2.6, keywords: "champignon couche cru paris" },
  { id: '20019', name: "Concombre cru", category: 'legume', unit: 'g', kcal: 15.6, protein: 0.6, keywords: "concombre cru peau pulpe" },
  { id: '20031', name: "Laitue crue", category: 'legume', unit: 'g', kcal: 12.3, protein: 1.3, keywords: "crue laitue salade verte" },
  { id: '20099', name: "Mâche crue", category: 'legume', unit: 'g', kcal: 16.8, protein: 2.0, keywords: "crue mache salade" },
  { id: '13004', name: "Avocat", category: 'legume', unit: 'g', kcal: 205.0, protein: 1.6, keywords: "avocat cru pulpe" },
  { id: '13005', name: "Banane", category: 'fruit', unit: 'g', kcal: 90.5, protein: 1.1, keywords: "banane crue pulpe" },
  { id: '13086', name: "Pomme Golden", category: 'fruit', unit: 'g', kcal: 54.9, protein: 0.5, keywords: "crue golden pomme pulpe" },
  { id: '13034', name: "Orange", category: 'fruit', unit: 'g', kcal: 45.5, protein: 0.8, keywords: "crue orange pulpe" },
  { id: '13014', name: "Fraise", category: 'fruit', unit: 'g', kcal: 38.6, protein: 0.6, keywords: "crue fraise" },
  { id: '13028', name: "Myrtille", category: 'fruit', unit: 'g', kcal: 57.7, protein: 0.9, keywords: "crue myrtille" },
  { id: '31074', name: "Chocolat noir 70%", category: 'sucre', unit: 'g', kcal: 591.0, protein: 10.4, keywords: "70% cacao chocolat degustation extra minimum noir tablette" },
  { id: '31016', name: "Sucre blanc", category: 'sucre', unit: 'g', kcal: 399.2, protein: 0.0, keywords: "blanc sucre" },
  { id: '31008', name: "Miel", category: 'sucre', unit: 'g', kcal: 329.0, protein: 0.6, keywords: "miel" },
  { id: '31024', name: "Confiture de fraise", category: 'sucre', unit: 'g', kcal: 251.0, protein: 0.5, keywords: "classique confiture extra fraise" },
  { id: '11008', name: "Ketchup", category: 'divers', unit: 'g', kcal: 99.0, protein: 1.3, keywords: "ketchup preemballe" },
];
