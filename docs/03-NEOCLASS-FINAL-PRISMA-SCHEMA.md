# NeoClass Final Prisma Schema Summary

Ce schéma Prisma couvre les quatre produits clés de NeoClass :

- **NeoClass School** : gestion scolaire des écoles, classes, étudiants, enseignants, parents.
- **NeoClass Learn** : parcours pédagogique structuré avec matières, chapitres, leçons, progressions, quiz.
- **NeoClass Finance** : paiements, revenus, dépenses, abonnements et support comptable évolutif.
- **NeoAI** : rapports et recommandations pédagogiques basés sur le contenu éducatif.

## Principaux modèles

- `School`, `User`, `Student`, `Parent`, `Teacher`
- `Class`, `Subject`, `Chapter`, `Lesson`, `LessonProgress`
- `Quiz`, `QuizAttempt`, `Grade`, `Attendance`
- `Payment`, `Revenue`, `Expense`, `Subscription`
- `Notification`, `Message`
- `AIReport`, `AIRecommendation`
- `SalaryPayment` pour la gestion des salaires enseignants

## Long terme

- Le modèle `Subscription` permet de gérer l’accès aux modules NeoClass School, Learn, Finance et NeoAI.
- `resources` et `metadata` en JSON offrent une flexibilité pour ajouter des formats riches (PDF, vidéo, images, documents).
- Les relations et index principaux sont conçus pour les recherches rapides par école, étudiant, classe et état.
- L’architecture resta évolutive pour l’adoption de nouveaux pays, d’universités ou de centres de formation.
