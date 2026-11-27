# Vision — Maevidoo

> Ce document est le tien : modifie-le quand tu veux. Il appartient au projet, pas à Forge.
> Les agents le lisent avant chaque plan et chaque sweep. Ils ne le modifient jamais seuls : s'ils voient un écart avec le code, ils te montrent ce qu'ils changeraient et pourquoi, et te demandent.
> status: draft — unconfirmed

## 1. Le produit
- **Ce que c'est :** un livre de recettes de cuisine sur smartphone. On y garde ses recettes, on les retrouve et on les suit en cuisinant. *(source : Pablo, 2026-11-27)*
- **Pour qui :** une personne qui cuisine chez elle et se sert de son téléphone comme livre de recettes, posé sur le plan de travail, souvent les mains occupées.
- **Inspiré de / comparé à :** —

## 2. La vision
- **Où il va :** dans un an, on peut créer, ranger et retrouver ses recettes en quelques secondes, les suivre pas à pas pendant qu'on cuisine, et connaître la composition nutritionnelle d'un plat en photographiant ses ingrédients.
- **Ce qu'il ne sera pas :** un réseau social, ni un site de recettes public. Les recettes sont celles de la personne.
- **Ce qui compte le plus :**
  1. L'usage d'une main en cuisine : texte lisible de loin, écran qui reste allumé pendant une recette, gros boutons.
  2. La simplicité : chaque écran se comprend sans explication.
  3. La sécurité des recettes : on ne perd jamais une recette ni une saisie.

## 3. Les fonctionnalités, dans les grandes lignes
- **Mes recettes :** créer, modifier et supprimer une recette, avec ses ingrédients, ses étapes, ses portions et ses photos.
- **Ranger et retrouver :** classer les recettes (catégories, étiquettes) et les retrouver par recherche.
- **Mode cuisine :** suivre une recette étape par étape, en grand, avec l'écran qui reste allumé.
- **Photo des ingrédients et composition du plat :** photographier ses ingrédients pour les reconnaître, puis calculer la composition nutritionnelle du plat (glucides, protéines, sucres, lipides, etc.). *(demandé par Pablo, 2026-11-27)*

Le détail vivant des parcours sera dans `docs/features.md`, construit par le premier sweep.

## 4. Architecture et technologies
- **Forme :** application web mobile d'abord (Angular, PWA envisageable) et une API REST (Java/Spring).
- **Technologies :** Angular en front, Java/Spring en back. Base de données, hébergement, authentification et service de reconnaissance d'image ou de données nutritionnelles : à décider.
- **Règles à tenir :** aucune imposée au-delà du choix Angular et Spring. Les règles des packs `angular` et `java` s'appliquent (`forge/packs/angular/rules/`, `forge/packs/java/rules/`).
- **Détail :** —

## 5. Direction UI et UX
- **Ressenti :** sobre et aéré, mobile d'abord.
- **Principes :** lisible à bout de bras, gros boutons utilisables d'une main ou d'un doigt, une action principale par écran, rien de ce qui est saisi n'est perdu.
- **Détail :** `docs/ui-canon.md` § Direction (créé par le premier sweep UX).

## 6. Où vit le reste
| Quoi | Où | Qui le change |
|------|----|---------------|
| Les parcours de l'app telle qu'elle est | `docs/features.md` | les agents proposent, tu acceptes |
| Le look : échelles, motifs, mots, écrans | `docs/ui-canon.md` | le sweep UX ajoute, tu tranches |
| Ce qui a été décidé, et pourquoi | `epics/decisions.md` | chaque tâche clôturée |

## Historique
<!-- une ligne par changement accepté : date · section · ce qui change · pourquoi · qui l'a proposé -->
