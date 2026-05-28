# Importation du programme national guinéen dans NeoClass

## Objectif

Transformer les fichiers Word du programme scolaire officiel de Guinée en une structure pédagogique normalisée, intégrée à NeoClass et prête pour NeoAI.

L'objectif n'est pas de stocker les documents bruts, mais de convertir chaque contenu en un curriculum exploitable avec :

- `Curriculum`
- `Subject`
- `Chapter`
- `Lesson`
- `SubLesson`
- `LearningObjective`
- `LessonContent`
- `Exercise`
- `Quiz`
- `Flashcard`
- `AIContent`

## Structure ciblée

Niveau scolaire → Matière → Chapitre → Leçon → Sous-leçon (si nécessaire)

Pour chaque leçon, on doit extraire automatiquement :

- Titre
- Objectifs pédagogiques
- Notions importantes
- Définitions
- Exemples
- Formules
- Mots-clés

Puis générer :

- Résumé court (max 10 lignes)
- Résumé détaillé
- Points clés à retenir
- Flashcards
- Quiz (min. 10 questions, QCM / Vrai-Faux / Réponse courte)
- Exercices supplémentaires (facile / moyen / difficile)

## Modèle de données Prisma

Le schéma `schema.prisma` a été enrichi avec les entités suivantes :

- `Curriculum`
- `CurriculumSubject`
- `CurriculumChapter`
- `CurriculumLesson`
- `LearningObjective`
- `LessonContent`
- `Exercise`
- `Flashcard`
- `AIContent`
- `LessonDependency`

## Pipeline de traitement

1. **Ingestion**
   - Convertir les fichiers Word en texte structuré (docx -> markdown/text).
   - Extraire la hiérarchie : niveaux, matières, chapitres, leçons, sous-leçons.

2. **Analyse sémantique**
   - Détecter les blocs d’objectifs pédagogiques.
   - Identifier les sections de cours, définitions, exemples et formules.
   - Extraire les mots-clés et notions importantes.

3. **Génération NeoAI**
   - Créer un résumé court et un résumé détaillé.
   - Extraire des points clés structurés.
   - Générer flashcards questions/réponses.
   - Générer quiz avec des types QCM, Vrai/Faux et réponses courtes.
   - Créer des exercices faciles, moyens et difficiles.

4. **Persistation**
   - Créer ou mettre à jour les enregistrements dans NeoClass :
     - `Curriculum`
     - `CurriculumSubject`
     - `CurriculumChapter`
     - `CurriculumLesson`
     - `LearningObjective`
     - `LessonContent`
     - `Exercise`
     - `Quiz`
     - `Flashcard`
     - `AIContent`
     - `LessonDependency`

5. **Ordonnancement**
   - Associer les leçons par ordre de progression.
   - Générer des dépendances de déblocage entre leçons via `LessonDependency`.
   - Garantir que chaque leçon suit : lire le cours → exercices → quiz → lecture de la leçon suivante.

## Compatibilité NeoAI et RAG

- Chaque leçon est pré-indexée avec :
  - `title`
  - `learningObjectives`
  - `lessonContents`
  - `AIContent`
  - `keywords`
  - `flashcards`

- Les modèles NeoAI pourront ainsi :
  - expliquer une notion
  - résumer une leçon
  - répondre aux questions
  - générer des exercices
  - détecter les difficultés

- Les données structurées permettent une recherche sémantique efficace pour RAG.

## Interface enseignant

- Lorsqu’un enseignant sélectionne : `Classe → Matière`, le programme officiel doit apparaître automatiquement.
- L’enseignant peut ensuite :
  - ajouter des documents
  - ajouter des vidéos
  - ajouter des exercices
  - ajouter des quiz

Sans recréer le programme officiel.

## Interface élève

L’élève doit voir :

- Classe
- Matière
- Progression
- Chapitres
- Leçons
- Quiz
- Badges
- Pourcentage de réussite

## Résultat attendu

Créer une bibliothèque pédagogique numérique intelligente, intégrée à NeoClass, prête à être utilisée sur :

- Web
- Android
- iOS

et exploitée par NeoAI pour l’apprentissage personnalisé.

## Prochaines étapes

- Développer un service d’import Word → curriculum.
- Construire un moteur de segmentation et d’extraction sémantique.
- Implémenter une API d’écriture dans les tables Prisma ajoutées.
- Créer des pages enseignants/élèves pour afficher le curriculum national.
- Ajouter une couche RAG pour la recherche de notions et la génération NeoAI.
