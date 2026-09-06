# Kcal

Compteur de calories et de protéines en React Native / Expo (SDK 57), avec
scan de codes-barres OpenFoodFacts, saisie manuelle et **épargne de calories**
avant un événement.

## Démarrer

```bash
npm install
npx expo start
```

Puis `i` (iOS), `a` (Android) ou scanne le QR code avec Expo Go.

Le scan de codes-barres utilise `expo-camera` : il fonctionne dans Expo Go sur
un vrai téléphone, pas sur le simulateur (pas de caméra) ni sur le web.

## Ce que fait l'app

**Onboarding** — sexe, âge, taille, poids, activité, objectif et rythme visé.
Les objectifs calories / protéines sont calculés avec Mifflin-St Jeor
(`src/lib/nutrition.ts`) puis restent modifiables à la main.

**Accueil** — anneau des calories restantes, barre de protéines qui **passe au
vert** quand l'objectif est atteint, et bandeau des 7 derniers jours : un
anneau par jour, vert si l'objectif calories est tenu, rouge s'il est dépassé,
avec le total de calories sous chaque jour. Le journal est découpé en quatre
repas (petit-déj., déjeuner, dîner, snack) ; toucher l'en-tête d'un repas ouvre
l'ajout directement dans ce repas.

**Ajouter un aliment** — trois entrées, toutes avec le choix du repas
(pré-sélectionné selon l'heure) :

- scan d'un code-barres (EAN/UPC) → fiche OpenFoodFacts ;
- recherche texte dans OpenFoodFacts ;
- saisie manuelle, en quatre ou cinq étapes numérotées : nom, repas, puis
  « le total du plat » ou « une étiquette pour 100 g/ml » — seuls les champs de
  la voie choisie s'affichent.

L'écran de portion (`src/app/add/portion.tsx`) sert aussi à modifier une
entrée existante : champ numérique large, boutons ±, bascule g / ml / portion
et raccourcis (30, 50, 100, 150 g…).

**Corriger OpenFoodFacts** — la base est contributive et parfois fausse. Sur la
fiche produit, « Ces valeurs sont fausses ? » ouvre deux champs pour recopier
l'étiquette. La correction porte toujours sur les valeurs pour 100 g/ml, donc
la conversion en portion reste juste. Elle est mémorisée avec l'entrée : au
prochain scan du même code-barres, l'app repart de la valeur corrigée plutôt
que de celle d'OpenFoodFacts.

**Épargne** — on crée un événement (« Restaurant samedi, +1000 kcal »), on
choisit sur combien de jours étaler l'effort, et l'objectif quotidien baisse
automatiquement d'ici là. Le jour J, le budget est débloqué en une fois.

Exemple avec 2000 kcal/jour, un resto à +1000 kcal étalé sur 7 jours :

| Jour | Objectif | Épargné |
| --- | --- | --- |
| J-7 → J-1 | 1855 kcal | +145 kcal / jour |
| Jour J | 3000 kcal | 1000 kcal débloquées |

## Structure

```
src/
  app/                 routes expo-router
    (tabs)/            accueil, épargne, réglages
    add/               scan, recherche, portion, saisie manuelle
    event/new.tsx      création d'une épargne
    onboarding.tsx
  components/          UI (anneau, barre protéines, bandeau semaine, tab bar…)
  lib/
    date.ts            manipulation des jours `YYYY-MM-DD`
    nutrition.ts       Mifflin-St Jeor + calcul de l'épargne
    openfoodfacts.ts   client API + conversion des portions
  store/               état zustand persisté (expo-sqlite/kv-store)
```

## Données

Tout est stocké localement sur le téléphone (`expo-sqlite/kv-store`), aucun
compte ni serveur. Les valeurs nutritionnelles proviennent d'OpenFoodFacts,
publiées sous licence ODbL.
