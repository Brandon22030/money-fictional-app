# Maquette Abonda

`index.html` est une maquette statique et autonome (CSS et SVG inline). Elle s'ouvre par double-clic dans un navigateur, sans serveur.

- Police : Manrope via Google Fonts (optionnelle), repli Inter, SF Pro, system-ui.
- Section "Tokens" : toutes les valeurs du plan sous forme de variables CSS (`--colors-skyTop`, `--radius-lg`, `--spacing-2xl`, etc.), mêmes noms et valeurs que `src/theme/tokens.ts`.
- Écrans en cadres 390 x 844 : Accueil, Carte (recto et verso), Abondance, Clavier (mode Envoyer), Historique avec recherche, Réglages.
- La carte et le solde sont fictifs, sans valeur ni lien avec une banque. Le réseau "AURÉA" et la marque "Abonda" sont inventés. La mention "FICTIF - SIMULATION" figure au recto et au verso.
- `mockup.png` : capture de la page complète.
- Section "Logo et icône" : mascotte Abonda (pièce dorée souriante sur fond ciel vers marine). Sources et exports dans `assets/brand/`.
- Barre de navigation : pilule flottante marine, onglet actif en pilule bleu ciel (icône + libellé), onglets inactifs en boutons ronds icône seule.
- Carte : base marine avec touches or (tokens `colors.goldLight`, `goldBase`, `goldDeep`, `gradients.gold`).
