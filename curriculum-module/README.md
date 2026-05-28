# NeoClass Curriculum Module

Le module NeoClass Curriculum est conçu pour devenir le cœur pédagogique de la plateforme.

## But

- Importer et structurer automatiquement les programmes officiels de Guinée
- Transformer les programmes en une bibliothèque pédagogique intelligente
- Alimenter NeoAI pour l'apprentissage personnalisé
- Fournir une progression séquentielle pour les élèves
- Offrir des interfaces dédiées pour élèves et enseignants

## Contenu prévu

- Import DOCX / PDF / texte
- Analyse sémantique du contenu pédagogique
- Génération de résumés, quiz, flashcards et exercices via NeoAI
- Progression par leçon avec verrouillage/déblocage
- Dashboard élèves et enseignants
- Modèles Prisma pour Curriculum, GradeLevel, Subject, Chapter, Lesson, Exercises, Quiz, AIContent

## Fichiers clés

- `../schema.prisma`
- `docs/05-NEOCLASS-CURRICULUM-MASTER-PROMPT.md`
- `docs/04-NEOCLASS-GUINEAN-CURRICULUM-IMPORT.md`

## Prochaines étapes

1. Construire le service d'import Word/PDF/texte
2. Développer le module d'analyse IA
3. Implémenter l'API Prisma et les routes de création de contenu
4. Créer l'interface enseignant et élève
5. Ajouter la synchronisation mobile React Native
