# NeoClass Curriculum Master Module

## Vision

NeoClass Curriculum est le cœur pédagogique de la plateforme.
Il doit permettre l'import automatique des programmes officiels guinéens depuis Word, PDF ou texte, puis les transformer en contenus structurés, prêts pour les enseignants, les élèves et NeoAI.

## Objectifs

- Importer automatiquement les programmes scolaires officiels de Guinée
- Créer une hiérarchie pédagogique normalisée
- Générer du contenu AI enrichi pour chaque leçon
- Assurer une progression d'apprentissage verrouillée et intelligente
- Fournir des tableaux de bord enseignants et élèves
- Préparer une compatibilité mobile Android/iOS via React Native

## Structure cible

1. Curriculum
2. GradeLevel
3. Subject
4. Chapter
5. Lesson
6. LessonContent
7. LearningObjective
8. Exercise
9. Quiz
10. QuizQuestion
11. QuizAttempt
12. StudentProgress
13. Flashcard
14. AIContent
15. AIRecommendation
16. AIReport

## Importation des programmes

### Formats supportés
- Word (.docx)
- PDF
- Texte brut

### Processus
1. Convertir le document en texte structuré
2. Segmenter la hiérarchie : niveau, matière, chapitre, leçon, sous-leçon
3. Extraire automatiquement :
   - Objectifs pédagogiques
   - Concepts clés
   - Définitions
   - Formules
   - Exemples
   - Mots-clés
4. Créer les enregistrements dans la base NeoClass
5. Générer des contenus NeoAI associés
6. Indexer pour la recherche RAG

## Pipeline IA

Pour chaque leçon importée, NeoAI doit produire :
- Titre et structure
- Résumé rapide (5-10 lignes)
- Résumé détaillé
- Points clés
- Flashcards
- Quiz (min. 10 questions, QCM / Vrai-Faux / réponse courte)
- Exercices supplémentaires (facile / moyen / difficile)

## Progression LMS

Le parcours doit être séquentiel :
- Leçon
- Quiz
- Validation
- Leçon suivante

Une leçon est débloquée uniquement après validation de la précédente.
Le score par défaut est 70 %.
En cas d'échec :
- nouvelle tentative
- révision recommandée
- exercices supplémentaires

## Dashboards

### Élève
- Progression générale
- Progression par matière
- Progression par chapitre
- Temps d'étude
- Quiz réussis / échoués
- Badges
- Niveau

### Enseignant
- Progression des élèves
- Résultats des quiz
- Taux de réussite
- Difficultés détectées
- Élèves en retard

## Gamification

### XP
Récompenses pour :
- lecture du cours
- exercice terminé
- quiz réussi

### Niveaux
- Débutant
- Intermédiaire
- Avancé
- Expert

### Badges
- Premier cours terminé
- 7 jours de connexion
- 100 % à un quiz
- Chapitre terminé

## NeoAI pédagogique

NeoAI doit pouvoir :
- expliquer une leçon
- résumer un chapitre
- répondre aux questions
- générer des exercices
- générer des quiz
- générer des fiches de révision

L'IA doit s'appuyer uniquement sur :
- le programme officiel
- les contenus de l'école
- les ressources autorisées

## Analyse des élèves

NeoAI doit analyser :
- notes
- quiz
- temps d'étude
- exercices réalisés
- progression

Et détecter :
- difficultés
- lacunes
- retards

## Recommandations IA

Exemple :
- difficulté sur le chapitre "Fractions"
- recommandations :
  - revoir la Leçon 3
  - faire l'Exercice 7
  - repasser le Quiz

## Architecture technique

Frontend : Next.js 15, TypeScript, Tailwind CSS, Shadcn UI
Backend : Node.js, Prisma, PostgreSQL
IA : OpenAI, Llama, Mistral
Recherche pédagogique : Vector Database, RAG

## Compatibilité mobile

Préparer une compatibilité complète Android / iOS via React Native.

## Résultat final

Faire de NeoClass la référence numérique de l'éducation en Guinée, puis en Afrique, en offrant :
- gestion scolaire
- apprentissage numérique
- personnalisation IA
- suivi pédagogique
- préparation aux examens
