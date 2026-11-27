# Forge — project routing (written by /forge-init, edit freely)

```yaml
version: 1
name: maevidoo-forge
profiles:
  ceremony_default: auto
  worker_tier: fast
packs:
  enabled:
    - core
    - angular
    - java
    - visual-qa
visual_qa: optional
docs:
  language: fr
areas:
  decision: mapped   # zones acceptées le 2026-11-27 : recettes, catalogue, cuisine, nutrition — map, check, boundary et test créés par la première tâche
notes: Projet sans code au moment de l'init (2026-11-27) : aucune commande détectée, à compléter dans `commands` quand l'app Angular et l'API Spring existeront.
```
