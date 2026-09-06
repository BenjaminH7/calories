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
entrée existante : champ numérique large, boutons ±, bascule d'unité et
raccourcis (30, 50, 100, 150 g…).

**Unités** — g, ml, cuillère à soupe, cuillère à café, et portion quand
OpenFoodFacts en connaît la taille. Les cuillères sont des mesures de volume
(15 ml et 5 ml) ; quand l'étiquette est au poids, la conversion passe par une
densité de 0,92 g/ml (celle des huiles, cas de loin le plus fréquent pour une
saisie à la cuillère). L'équivalence est toujours affichée sous la quantité
(« ≈ 13,8 g »), donc l'approximation reste visible et on peut basculer en
grammes pour être exact. Voir [`src/lib/units.ts`](src/lib/units.ts).

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

**Export** — Réglages → « Exporter mon journal ». On choisit une période (7 / 14
/ 30 / 90 jours) et un format, puis on copie ou on partage. Le Markdown est
pensé pour être collé tel quel dans une conversation avec un LLM : profil,
objectifs, résumé de la période, puis le détail repas par repas. Le JSON sert
quand le modèle doit calculer dessus. Voir [`src/lib/export.ts`](src/lib/export.ts).

## Widget iOS (écran d'accueil)

Le widget affiche les calories restantes, les protéines du jour (vertes une fois
l'objectif atteint) et, en taille moyenne, un bouton **Scanner** qui ouvre
directement la caméra via le lien profond `kcal:///add/scan`.

Il repose sur `@bacons/apple-targets` : c'est du code natif, donc **il ne
fonctionne pas dans Expo Go**. Il faut un development build.

```bash
# 1. Renseigne ton Apple Team ID dans app.json (expo.ios.appleTeamId)
# 2. Génère le projet natif
npx expo prebuild -p ios --clean
# 3. Compile et installe sur ton appareil
npx expo run:ios --device
```

Puis, sur le téléphone : appui long sur l'écran d'accueil → **+** → « Kcal ».

Comment ça circule :

| Étage | Fichier |
| --- | --- |
| Écriture de l'instantané + rechargement du widget | [`src/lib/widget.ts`](src/lib/widget.ts) |
| Déclaration de la cible et de l'App Group | [`targets/widget/expo-target.config.js`](targets/widget/expo-target.config.js) |
| Interface SwiftUI | [`targets/widget/index.swift`](targets/widget/index.swift) |

L'App Group `group.com.benjamin.kcal` est déclaré à trois endroits qui doivent
rester d'accord : `app.json`, `expo-target.config.js` et `index.swift`. Si tu
changes le bundle identifier, change les trois.

`startWidgetSync()` est branché sur le store depuis le layout racine : chaque
ajout d'aliment réécrit l'instantané et appelle `reloadWidget()`. Sur Android,
sur le web et dans Expo Go, l'appel est simplement ignoré.

## Structure

```
targets/widget/        widget iOS (SwiftUI + config de la cible)
src/
  app/                 routes expo-router
    (tabs)/            accueil, stats, épargne, réglages
    add/               scan, recherche, portion, saisie manuelle
    event/new.tsx      création d'une épargne
    onboarding.tsx
  components/          UI (anneau, barre protéines, bandeau semaine, tab bar…)
  lib/
    date.ts            manipulation des jours `YYYY-MM-DD` et des semaines
    nutrition.ts       Mifflin-St Jeor + calcul de l'épargne
    openfoodfacts.ts   client API + conversion des portions
    widget.ts          pont vers le widget iOS (App Group)
  store/               état zustand persisté (expo-sqlite/kv-store)
```

## Données

Tout est stocké localement sur le téléphone (`expo-sqlite/kv-store`), aucun
compte ni serveur. Les valeurs nutritionnelles proviennent d'OpenFoodFacts,
publiées sous licence ODbL.
