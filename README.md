# Abonda

Application mobile (Expo, iOS et Android) de visualisation et de manifestation : elle affiche un solde symbolique choisi par l'utilisateur, comme rituel quotidien de gratitude et d'abondance. Ce n'est pas une banque et aucun argent réel n'est manipulé. Toutes les données restent sur l'appareil.

## Positionnement

Abonda est un outil de visualisation et de manifestation. L'utilisateur choisit lui-même son solde symbolique et le consulte comme un rituel quotidien de gratitude et d'abondance. L'application n'est pas une banque : elle ne se connecte à aucun service financier et ne déplace aucun argent réel.

## Fonctionnalités

- Accueil : carte de solde, intentions favorites, intentions récentes et affirmation du jour
- Carte : carte symbolique recto et verso, titulaire modifiable, solde modifiable
- Clavier : saisie d'une intention avec montant symbolique (recevoir, envoyer, retirer, payer)
- Historique : liste des intentions par jour, avec recherche
- Abondance : statistiques et répartition des intentions, vue mois par mois
- Écoute : lecture à voix haute des affirmations
- Réglages : devise (EUR, FCFA, USD), langue (français, anglais), réinitialisation
- Données stockées uniquement sur l'appareil

## Stack

- Expo (SDK 58), React Native et React, TypeScript
- expo-router pour la navigation par onglets et la modale clavier
- zustand pour l'état, AsyncStorage pour la persistance locale
- react-native-reanimated, react-native-svg, expo-linear-gradient, expo-blur
- expo-localization, expo-speech, expo-haptics
- Tests avec jest-expo

## Démarrage

```
npm install
npm start
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm start` / `npm run ios` / `npm run android` | Lancer l'application |
| `npm test` | Tests (jest-expo) |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run doctor` | Vérifier l'alignement des dépendances avec le SDK Expo |
| `npm run add -- <paquet>` | Ajouter une dépendance compatible avec le SDK |

## Structure

- `app/` : routes expo-router (onglets et modal clavier)
- `src/theme/` : tokens de design (source unique, partagés avec la maquette)
- `src/config/` : devises, langues, marque
- `src/i18n/` : traductions fr / en, un fichier par espace de noms
- `src/components/ui/` : composants de base

## Régénérer les assets de marque

Les icônes, l'image du splash (`splash-icon.png`, le logo en 1024 px sur fond transparent, posé sur `#0B1F40` par `expo-splash-screen`) et le logo sont générés depuis des SVG par `assets/brand/build.mjs`, qui rend les PNG avec Playwright. Playwright n'est volontairement pas dans les `devDependencies` du projet : il faut le fournir à part.

```
PLAYWRIGHT_PATH=<dossier contenant node_modules/playwright> \
CHROMIUM_PATH=<binaire chromium, optionnel> \
node assets/brand/build.mjs
```

- `PLAYWRIGHT_PATH` : dossier dans lequel `node_modules/playwright` est installé
- `CHROMIUM_PATH` : chemin d'un binaire Chromium existant, utile si les navigateurs Playwright ne sont pas téléchargés

Le script réécrit les SVG et les PNG de `assets/brand/`. Dans `assets/brand/explorations/`, seule la piste retenue (`b-coin`) garde un export PNG.

## Banc de comparaison visuelle (app vs maquette)

`scripts/visual/capture.mjs` capture les 7 écrans de `docs/mockup/index.html` (390x844, sans le cadre téléphone) et les routes correspondantes de l'app (export web Expo, viewport 390x844, facteur 2, état de démo injecté dans `localStorage`), puis assemble une image `mockup | app` par écran. Comme pour les assets de marque, Playwright n'est pas une dépendance du projet.

```
PLAYWRIGHT_PATH=<dossier contenant node_modules/playwright> \
CHROMIUM_PATH=<binaire chromium, optionnel> \
npm run visual:capture            # ajouter -- --skip-export pour réutiliser /tmp/mfa004-web
```

L'export du banc est fait avec `EXPO_PUBLIC_VISUAL_FIXTURE=1` : le module `src/dev/visualFixture.ts` expose alors les chiffres de la maquette (transactions, variation du jour, parts, barres mensuelles) injectés par le script, et l'horloge est figée au 19 octobre 2026 09:45. Sans cette variable (builds normaux), la fixture est inactive. Après un changement de source, relancer sans `--skip-export`.

Sortie : `.agents/tasks/MFA-004/shots/{mockup,app,compare}-<écran>.png`. Le rendu web ne sert qu'à la mesure, la cible reste le rendu natif. Écarts de rendu web connus : `expo-blur` et les ombres sont approximés par le navigateur, les polices et le crénage diffèrent légèrement, la barre d'état système (9:41, wifi, batterie) n'existe pas sur le web, et les safe areas sont nulles.

## Lien permanent (EAS Update)

L'app est publiée sur EAS Update (compte Expo `brownlock`, projet `abonda`) et s'ouvre dans Expo Go sans le Mac, y compris en 4G. Lien permanent à mettre dans un raccourci iOS (action "Ouvrir les URL") :

```
exp://u.expo.dev/e67cb40f-d16e-47c5-8bf0-d4d7bbe66f72?channel-name=production
```

Le lien charge toujours la dernière update du channel `production`. Après chaque fusion sur `main`, republier (uniquement depuis `main` à jour : `git checkout main && git pull`) :

```
npm run publish:update
```

Prérequis : être connecté à Expo (`npx eas-cli@^25 login`). Ne jamais avoir de variable `EXPO_PUBLIC_*` (par exemple `EXPO_PUBLIC_VISUAL_FIXTURE`) définie dans le shell au moment de publier, elle serait embarquée dans l'update. La `runtimeVersion` suit le SDK (`exposdk:58.0.0`) : une mise à jour de SDK demande de republier et d'utiliser un Expo Go compatible. Aucun build natif ni soumission store n'est utilisé. Avant tout build natif (EAS Build ou dev client), passer `runtimeVersion.policy` à `appVersion` ou `fingerprint` dans `app.json`.

## Maquette

`docs/mockup/index.html` est la maquette statique des écrans et des tokens (voir `docs/mockup/README.md`).
