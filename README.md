# Abonda

Application mobile (Expo, iOS et Android) de visualisation et de manifestation : elle affiche un solde symbolique choisi par l'utilisateur, comme rituel quotidien de gratitude et d'abondance. Ce n'est pas une banque et aucun argent réel n'est manipulé. Toutes les données restent sur l'appareil.

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
