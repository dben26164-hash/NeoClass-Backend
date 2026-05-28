# Maquettes & Mockups Dashboards - NeoClass

## Architecture des Dashboards

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER / TOP NAV                        │
│  Logo │ Platform Name │ Search │ Notifications │ Profile        │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────┬─────────────────────────────────────────────┐
│                  │                                             │
│   SIDEBAR        │         MAIN CONTENT AREA                   │
│   (280px)        │         (Responsive)                        │
│                  │                                             │
│   ├─ Dashboard   │                                             │
│   ├─ Classes     │                                             │
│   ├─ Users       │                                             │
│   ├─ Finance     │                                             │
│   ├─ Reports     │                                             │
│   ├─ Settings    │                                             │
│   └─ Help        │                                             │
│                  │                                             │
└──────────────────┴─────────────────────────────────────────────┘
```

---

## 1. DASHBOARD ADMIN (Super Admin)

**Rôle** : Gestion globale de l'ensemble du système

### Vue principale

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Dashboard Admin                                        🔔 🌐 👤   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────────────────────────────┐
│ NAVIGATION           │ │ WELCOME BACK, ADMIN                        │
│                      │ │ Last login: Today 09:30 AM                 │
│ ├─ Dashboard (○)     │ │                                             │
│ ├─ Schools           │ │ ┌─ QUICK STATS ─────────────────────────┐ │
│ ├─ Users             │ │ │                                        │ │
│ ├─ Finance           │ │ │ 📍 Active Schools    │  1,245          │ │
│ ├─ Reports           │ │ │ 👥 Total Users       │  45,678         │ │
│ ├─ System            │ │ │ 💰 Monthly Revenue   │  $234,567       │ │
│ ├─ Support           │ │ │ 📈 Growth Rate (MoM) │  +12.5%        │ │
│ └─ Settings          │ │ └────────────────────────────────────────┘ │
│                      │ │                                             │
│                      │ │ ┌─ HEALTH CHECK ───────────────────────────┐ │
│                      │ │ │ Database:      ✓ Operational            │ │
│                      │ │ │ API Gateway:   ✓ Operational            │ │
│                      │ │ │ All Services:  ✓ Online                 │ │
│                      │ │ │ Average Uptime: 99.98%                  │ │
│                      │ │ └────────────────────────────────────────┘ │
│                      │ └──────────────────────────────────────────────┘
│                      │
│                      │ ┌─ SCHOOLS TOP ─────────────────────────────┐
│                      │ │ School Name    │ Users │ Status │ Plan    │
│                      │ ├────────────────┼───────┼────────┼─────────┤
│                      │ │ Poly Abidjan   │ 2,450 │ ✓ Act. │ Premium │
│                      │ │ Lycée Yamousso │ 1,890 │ ✓ Act. │ Premium │
│                      │ │ EPT Douala     │ 1,230 │ ✓ Act. │ Basic   │
│                      │ │ INPHB Yamousso │ 980   │ ⚠ Low  │ Basic   │
│                      │ │ VIEW ALL →                                  │
│                      │ └───────────────────────────────────────────┘
│                      │
│                      │ ┌─ ALERTS & ACTIONS ───────────────────────┐
│                      │ │ • 3 schools near storage limit           │
│                      │ │ • 2 subscription renewals due today      │
│                      │ │ • 1 payment failed (needs resolution)    │
│                      │ │ • System backup completed successfully   │
│                      │ └───────────────────────────────────────────┘
└──────────────────────┘ └──────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ 📈 REVENUE & GROWTH (Last 12 months)   │ 🌍 GEOGRAPHIC DISTRIBUTION      │
│ [Line Chart showing growth trend]      │ [Map with distribution points] │
│ Peak: March 2026 ($45K)                │ Nigeria: 450 schools           │
│ Growth Rate: Steady ↗                  │ Côte d'Ivoire: 320 schools     │
│                                         │ Kenya: 280 schools             │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ 🔍 SYSTEM ANALYTICS                                                       │
│ API Response Time: 145ms (avg) │ Database Load: 35% │ Cache Hit: 87.5%  │
│ Active Sessions: 12,456        │ Requests/sec: 450  │ Error Rate: 0.02%  │
└───────────────────────────────────────────────────────────────────────────┘
```

### Sections détaillées

**1. Schools Management**
- Tableau : nom, utilisateurs, statut, plan, revenu
- Actions : créer école, gérer licence, support prioritaire
- Filtres : pays, état, plan, activité

**2. User Management**
- Listage global : tous les utilisateurs de toutes écoles
- Rôles : créer super admin, admin école, support
- Audits : logs de connexion, actions effectuées

**3. Financial Dashboard**
- Revenu mensuel/annuel
- Statistiques par plan
- Taux de churn
- Transactions échouées

**4. System Monitoring**
- Santé des services
- Performance (latence, erreurs)
- Utilisation ressources
- Alertes críticas

---

## 2. DASHBOARD DIRECTEUR D'ÉCOLE (School Admin)

**Rôle** : Gestion complète d'une école (académique + finance + staff)

### Vue principale

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 Poly Abidjan - Dashboard             🔔 👤   École | Paramètres     │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────────────────────────────┐
│ NAVIGATION           │ │ 🎓 ANNÉE 2024-2025                          │
│                      │ │                                             │
│ ├─ Dashboard (○)     │ │ ┌─ RÉSUMÉ ÉCOLE ─────────────────────────┐ │
│ ├─ Classes           │ │ │                                        │ │
│ ├─ Élèves            │ │ │ 👥 Total Élèves: 2,450                │ │
│ ├─ Enseignants       │ │ │ 👨‍🏫 Enseignants: 145                  │ │
│ ├─ Emploi du Temps   │ │ │ 📚 Classes: 87                         │ │
│ ├─ Matières          │ │ │ ✓ Année Active: Début Sept 2024       │ │
│ ├─ Finance           │ │ └────────────────────────────────────────┘ │
│ ├─ LMS               │ │                                             │
│ ├─ Communication     │ │ ┌─ INDICATEURS CLÉS ────────────────────┐ │
│ ├─ Rapports          │ │ │                                        │ │
│ ├─ Staff             │ │ │ 📊 Taux de présence:  92.3%           │ │
│ └─ Paramètres        │ │ │ 📈 Moyenne générale:  13.8/20         │ │
│                      │ │ │ 🎯 Taux de réussite:  89.5%           │ │
│                      │ │ │ ⚠️ Redoublements:     87 élèves       │ │
│                      │ │ └────────────────────────────────────────┘ │
│                      │ └──────────────────────────────────────────────┘
│                      │
│                      │ ┌─ TÂCHES IMPORTANTES ──────────────────────┐
│                      │ │ □ Valider les permissions des 15 nouveaux │
│                      │ │   enseignants                             │
│                      │ │ □ Approuver modification 3 emplois du tps │
│                      │ │ □ Réviser budget maintenance T1 2024      │
│                      │ │ □ Confirmer inscription 234 nouveaux élèves
│                      │ │                                           │
│                      │ │ Priorité: Haute   Date limite: Demain     │
│                      │ └───────────────────────────────────────────┘
│                      │
│                      │ ┌─ ALERTES ────────────────────────────────┐
│                      │ │ ⚠️ 5 élèves avec moyenne < 10            │
│                      │ │ 💰 Factures impayées: 45,670 $          │
│                      │ │ 📋 Documents manquants: 12 élèves       │
│                      │ │ 👤 Enseignant absent: M. Kouassi (3j)   │
│                      │ │ 🔧 Support LMS: 2 tickets en attente    │
│                      │ └───────────────────────────────────────────┘
└──────────────────────┘ └──────────────────────────────────────────────┘

┌────────────────────────────────────────┬─────────────────────────────────┐
│ 📈 PERFORMANCE PAR CLASSE (Moyennes)  │ 💰 FINANCE AU COMPTANT           │
│                                        │                                 │
│ 6ème A:     13.2/20 ✓                 │ Revenu Mensuel: 78,500 $        │
│ 6ème B:     12.8/20 ✓                 │ Dépenses:      -32,100 $        │
│ 5ème A:     14.5/20 ✓                 │ Bénéfice Net:  +46,400 $        │
│ 5ème B:     11.9/20 ⚠                 │                                 │
│ 4ème A:     15.2/20 ✓                 │ Impayé: 45,670 $ (5.8% factures)│
│ 4ème B:     13.7/20 ✓                 │ Prévisions T3: +89,000 $        │
│ Moyenne:    13.8/20 ↑                 │                                 │
│                                        │ Facturation Automatique: Activé │
└────────────────────────────────────────┴─────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 📅 CALENDRIER SCOLAIRE & ÉVÉNEMENTS                                       │
│                                                                            │
│ 29 Mai: Conseil de classe 6ème A          [Voir détails]                 │
│ 31 Mai: Fin du trimestre académique       [Rappeler aux profs]            │
│  2 Jun: Rémunération des enseignants      [Générer prélèvements]         │
│  5 Jun: Début vacances d'été              [Notifications]                 │
│ 15 Jun: Mariage (vacances de Jean) - Absence autorisée                   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Sections détaillées

**1. Classe Management**
- Liste des classes avec effectifs
- Emploi du temps (vue calendrier)
- Changements enseignants
- Doubling/redoublement

**2. Student Management**
- Inscriptions/radiations
- Moyennes et rankings
- Présence/absences
- Dossiers complets

**3. Finance Dashboard**
- Factures générées
- Paiements reçus
- Impayés
- Trésorerie

**4. LMS Management**
- Courses activés
- Content uploaded
- Student engagement metrics
- Problèmes techniques

**5. Communication**
- Annonces à tous les stakeholders
- Messages du système
- Documents à partager

---

## 3. DASHBOARD ENSEIGNANT (Teacher)

**Rôle** : Gestion des classes, notes, absences, communications

### Vue principale

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📚 Mes Classes - Enseignant             🔔 👤   M. Kouassi | Déconnexion│
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────────────────────────────┐
│ NAVIGATION           │ │ 📅 AUJOURD'HUI, MERCREDI 23 MAI 2024        │
│                      │ │                                             │
│ ├─ Dashboard (○)     │ │ ┌─ MON EMPLOI DU TEMPS ──────────────────┐ │
│ ├─ Mes Classes       │ │ │                                        │ │
│ ├─ Absence / Présence│ │ │ 09:00-10:00 │ Maths    │ 6ème A        │ │
│ ├─ Notes & Évaluation│ │ │ 10:15-11:15 │ Maths    │ 6ème B        │ │
│ ├─ Ressources LMS    │ │ │ 11:30-12:30 │ Géométrie│ 5ème A        │ │
│ ├─ Messages          │ │ │ 13:30-14:30 │ Maths    │ 4ème A        │ │
│ ├─ Documents         │ │ │ 14:45-15:45 │ Algèbre  │ 4ème B        │ │
│ └─ Paramètres        │ │ │ Suivant: 09:00 Maths 6ème A            │ │
│                      │ │ └────────────────────────────────────────┘ │
│                      │ │                                             │
│                      │ │ ┌─ TÂCHES URGENTES ─────────────────────┐ │
│                      │ │ │ 📝 Entrer notes Quiz Maths (6ème B)    │ │
│                      │ │ │ 📋 Valider absences (5 à confirmer)    │ │
│                      │ │ │ 💬 Répondre messages: 3 non lus        │ │
│                      │ │ │ 📊 Générer feuille de présence         │ │
│                      │ │ └────────────────────────────────────────┘ │
│                      │ └──────────────────────────────────────────────┘
│                      │
│                      │ ┌─ MES CLASSES (En bref) ─────────────────────┐
│                      │ │ 6ème A │ 42 élèves │ 3 absents │ ⚠ 2 alertes│
│                      │ │ 6ème B │ 38 élèves │ 1 absent  │ 0 alertes │
│                      │ │ 5ème A │ 40 élèves │ 2 absents │ ⚠ 1 alerte│
│                      │ │ 4ème A │ 39 élèves │ 0 absents │ 0 alertes │
│                      │ │ 4ème B │ 41 élèves │ 2 absents │ ⚠ 3 alertes
│                      │ │                                           │
│                      │ │ Total: 200 élèves │ Moyennes: Bonnes ✓   │
│                      │ │                                           │
│                      │ │ [Modifier horaire]  [Voir détails...]    │
│                      │ └───────────────────────────────────────────┘
│                      │
│                      │ ┌─ NOTIFICATIONS ───────────────────────────┐
│                      │ │ 📨 Message De M. DIALLO: "Reunion avant  │
│                      │ │    fin semaine pour réviser le curricul"│
│                      │ │ 📧 Admin: "Rappel: Saisie notes avant   │
│                      │ │    01/06/2024"                          │
│                      │ │ ✓ Absence justifiée de Jean (23/05)     │
│                      │ │    Documents reçus                       │
│                      │ └───────────────────────────────────────────┘
└──────────────────────┘ └──────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 🎯 GESTION DES ÉVALUATIONS & NOTES                                        │
│                                                                            │
│ Classe     │ Sujet         │ Type       │ Date Limite │ Soumis │ Reste  │
├────────────┼───────────────┼────────────┼─────────────┼────────┼────────┤
│ 6ème A     │ Quiz Algèbre  │ Continuous │ 25/05/2024  │ 38/42  │ ⚠ 4/42│
│ 6ème B     │ Examen Périod │ Exam       │ 30/05/2024  │ 0/38   │ Demain │
│ 5ème A     │ Devoir Maison │ Homework   │ 20/05/2024  │ 40/40  │ ✓ Fini │
│ 4ème A,B   │ Projet Groupe │ Project    │ 31/05/2024  │ 20/80  │ En crs │
│                                                                            │
│ [Ajouter évaluation] [Vue détaillée]                                      │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 📚 MES RESSOURCES LMS                                                      │
│                                                                            │
│ [Créer cours]  Cours actifs: 5  │  Matériel uploadé: 234 fichiers       │
│                                                                            │
│ ├─ Maths - 6ème A & B (125 fichiers)          [Voir] [Éditer]           │
│ ├─ Géométrie - 5ème A (45 fichiers)           [Voir] [Éditer]           │
│ ├─ Algèbre - 4ème A & B (64 fichiers)         [Voir] [Éditer]           │
│ └─ Sujets d'examen (Anciens annales)          [Voir] [Éditer]           │
│                                                                            │
│ Contenus à valider: 3 vidéos, 2 PDF, 1 quiz (En attente approbation)     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Sections détaillées

**1. Présence & Absences**
- Marquer présence/absence
- Justifier absences
- Exports pour archive

**2. Notes & Évaluations**
- Entrer notes par classe/matière
- Consultations moyennes
- Grille d'évaluation
- Commentaires détaillés

**3. LMS Content**
- Uploader supports de cours
- Créer quiz/devoirs
- Voir engagement étudiant
- Feedback sur soumission

**4. Communication**
- Messages avec élèves/parents
- Annonces aux classes
- Documents à partager
- Notifications de lectures

**5. Reports**
- Bulletin scolaire
- Rapport de performance classe
- Rapport d'assiduité

---

## 4. DASHBOARD ÉLÈVE (Student)

**Rôle** : Consultation notes, emploi du temps, ressources pédagogiques

### Vue principale

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📖 Mon Espace Étudiant - NeoClass          🔔 👤   Jean KOUADIO | Quitter│
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────────────────────────────┐
│ NAVIGATION           │ │ 🎓 BIENVENUE JEAN!                          │
│                      │ │                                             │
│ ├─ Dashboard (○)     │ │ Classe: 6ème A                              │
│ ├─ Emploi du Temps   │ │ Année Scolaire: 2024-2025                  │
│ ├─ Mes Notes         │ │                                             │
│ ├─ Mes Matières      │ │ ┌─ MON RÉSUMÉ ──────────────────────────┐ │
│ ├─ Devoirs           │ │ │                                        │ │
│ ├─ Ressources        │ │ │ 📊 Moyenne Générale: 14.2/20   ✓      │ │
│ ├─ Messages          │ │ │ 📚 Cours Suivis: 8 matières           │ │
│ ├─ Absences          │ │ │ 📋 Présence: 94.5%   Excellent        │ │
│ ├─ Certificats       │ │ │ 🎯 Rang de Classe: 12ème / 42 élèves  │ │
│ └─ Paramètres        │ │ └────────────────────────────────────────┘ │
│                      │ │                                             │
│                      │ │ ┌─ BIENTÔT ─────────────────────────────┐ │
│                      │ │ │ • 25 Mai: Examen Maths (09:00)        │ │
│                      │ │ │ • 28 Mai: Devoir Maths (à rendre)     │ │
│                      │ │ │ • 30 Mai: Test Orthographe (quiz)     │ │
│                      │ │ │ • 31 Mai: Fin de Trimestre            │ │
│                      │ │ └────────────────────────────────────────┘ │
│                      │ └──────────────────────────────────────────────┘
│                      │
│                      │ ┌─ MES NOTES (Dernier mois) ────────────────┐
│                      │ │                                           │
│                      │ │ Maths:              14.5/20  ↑ +0.8      │
│                      │ │ Français:           13.8/20  (stable)    │
│                      │ │ Anglais:            15.2/20  ↑ +1.2     │
│                      │ │ Histoire-Géo:       14.0/20  ↓ -0.3      │
│                      │ │ Sciences:           12.9/20  ↓ -1.5  ⚠  │
│                      │ │ Dessin:             16.0/20  ✓ Excellent│
│                      │ │ EPS:                17.5/20  ✓ Excellent│
│                      │ │ Informatique:       15.8/20  ✓ Bon      │
│                      │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                      │ │ Moyenne:            14.2/20  ↑ +0.4     │
│                      │ │                                           │
│                      │ │ [Voir détails des notes]                  │
│                      │ │ [Imprimer bulletin]                       │
│                      │ └───────────────────────────────────────────┘
│                      │
│                      │ ┌─ MESSAGES (5 non lus) ─────────────────────┐
│                      │ │                                           │
│                      │ │ De M. Kouassi (Maths):                   │
│                      │ │ "Jean, bonne amélioration. Continue!"    │
│                      │ │                                           │
│                      │ │ De Maman:                                 │
│                      │ │ "Comment se passe tes études? ❤️"       │
│                      │ │                                           │
│                      │ │ Admin École:                              │
│                      │ │ "Rappel: Examen 25/05 - Bonne chance!"  │
│                      │ └───────────────────────────────────────────┘
└──────────────────────┘ └──────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 📅 MON EMPLOI DU TEMPS CETTE SEMAINE                                      │
│                                                                            │
│ Lundi    │ Mardi    │ Mercredi │ Jeudi    │ Vendredi  │ Samedi │ Dimanche│
├──────────┼──────────┼──────────┼──────────┼───────────┼────────┼─────────┤
│ Maths    │ Français │ Français │ Sciences │ Anglais   │ Repo   │ Repo    │
│ 09:00-10 │ 09-10    │ 09:00-10 │ 09:00-10 │ 09:00-10  │        │         │
│ ────────┼──────────┼──────────┼──────────┼───────────┤        │         │
│ Anglais  │ Maths    │ Maths    │ Français │ Maths     │        │         │
│ 10:15-11 │ 10:15-11 │ 10:15-11 │ 10:15-11 │ 10:15-11  │        │         │
│ ────────┼──────────┼──────────┼──────────┼───────────┤        │         │
│ Histo-Geo│ Histo-Geo│ Informatiq│ Anglais  │ Histo-Geo │        │         │
│ 13:00-14 │ 13:00-14 │ 13:00-14  │ 13:00-14 │ 13:00-14  │        │         │
│ ────────┼──────────┼──────────┼──────────┼───────────┤        │         │
│ EPS (15) │ Sciences │ EPS      │ Dessin   │ Français  │        │         │
│ 14:30-15 │ 14:30-15 │ 14:30-15 │ 14:30-15 │ 14:30-15  │        │         │
│ ────────┼──────────┼──────────┼──────────┼───────────┤        │         │
│         │          │          │          │ Allemand  │        │         │
│         │          │          │          │ 15:45-16  │        │         │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 📚 RESSOURCES DE COURS & RÉVISIONS                                        │
│                                                                            │
│ Maths - 6ème A (M. Kouassi)                                               │
│ • Chapitre 5: Géométrie (10 fichiers)      [Voir] [Télécharger]          │
│ • Quiz: Révisions Chapitre 4               [Démarrer] ⏱️ 45 min           │
│ • Examen blanc                             [Faire le quiz]               │
│ • Corrected exam & Feedback                [Lire]                        │
│                                                                            │
│ Anglais - 6ème A (Mme Adeyemi)                                            │
│ • Speaking practice videos (5)             [Regarder]                    │
│ • Grammaire: Present Continuous           [Réviser]                     │
│ • Devoir audio: Enregistrer réponses       [Soumettre] ⏱️ Dû demain      │
│                                                                            │
│ [Voir tous les cours...]                                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Sections détaillées

**1. Emploi du Temps**
- Vue calendrier/hebdomadaire
- Exportable
- Alertes pour cours (15 min avant)
- Changements notifiés

**2. Notes & Bulletins**
- Moyennes par matière
- Évolution temporelle (graphique)
- Classement dans classe
- Bulletin à télécharger

**3. Devoirs & Évaluations**
- Liste des devoirs à rendre
- Status (não fait, en cours, soumis, noté)
- Feedback des profs
- Dates limites

**4. Ressources & LMS**
- Accès aux contenus uploadés
- Vidéos à regarder
- Quiz à compléter
- Documents à télécharger

**5. Communication**
- Voir messages de profs/parents
- Chat avec profs
- Notifications importantes

---

## 5. DASHBOARD PARENT (Parent)

**Rôle** : Suivi de l'enfant (notes, comportement, communications)

### Vue principale

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 👨‍👩‍👧‍👦 Suivi Scolaire - NeoClass              🔔 👤   M. & Mme KOUADIO  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────────────────────────────┐
│ NAVIGATION           │ │ 👋 BIENVENUE CHEZ NEOCLASS!                 │
│                      │ │                                             │
│ ├─ Dashboard (○)     │ │ Vous suivez: JEAN KOUADIO (6ème A)         │
│ ├─ Profil Enfant     │ │                                             │
│ ├─ Notes & Résultats │ │ ┌─ RÉSUMÉ DE L'ENFANT ──────────────────┐ │
│ ├─ Comportement      │ │ │                                        │ │
│ ├─ Présence          │ │ │ Classe:              6ème A             │ │
│ ├─ Communications    │ │ │ Moyenne générale:    14.2/20 ✓ BIEN    │ │
│ ├─ Budget Scolarité  │ │ │ Rang de classe:      12ème / 42         │ │
│ ├─ Paiements         │ │ │ Taux de présence:    94.5% Excellent   │ │
│ ├─ Documents         │ │ │ Avertissements:      0                 │ │
│ └─ Paramètres        │ │ │ Commentaires:        Très bon travail   │ │
│                      │ │ └────────────────────────────────────────┘ │
│ [Multi-enfants?]     │ │                                             │
│ [Ajouter enfant]     │ │ ┌─ ALERTES IMPORTANTES ─────────────────┐ │
│                      │ │ │ ✓ Présence confirmée (94.5%)          │ │
│                      │ │ │ • Sciences: Notes légèrement basses    │ │
│                      │ │ │ • Examen Maths le 25 Mai (bien préparé)
│                      │ │ │ • Aucun problème de comportement       │ │
│                      │ │ │ • Facture mensuelle: 95,000 CFA        │ │
│                      │ │ │   (Paiement attendu dans 3 jours)      │
│                      │ │ │ 📞 Prof. Sciences suggests tutoring    │
│                      │ │ └────────────────────────────────────────┘ │
│                      │ └──────────────────────────────────────────────┘
│                      │
│                      │ ┌─ COMMUNICATIONS RÉCENTES ──────────────────┐
│                      │ │                                           │
│                      │ │ 📨 M. Kouassi (Prof Maths) - Aujourd'hui │
│                      │ │ "Jean fait d'excellents progrès. À      │
│                      │ │  continuer. Très satisfait."            │
│                      │ │                                           │
│                      │ │ 📨 Directrice - Hier                     │
│                      │ │ "Réunion parents prévue pour le 15 juin │
│                      │ │  Veuillez confirmer votre participation" │
│                      │ │                                           │
│                      │ │ 📨 Vous pouvez aussi envoyer un message │
│                      │ │ [Contacter l'école]                      │
│                      │ └───────────────────────────────────────────┘
│                      │
│                      │ ┌─ PAIEMENTS & FRAIS ────────────────────────┐
│                      │ │                                           │
│                      │ │ Scolarité mai: 95,000 CFA   Dû le 25/05  │
│                      │ │ Matériel didactique: 15,000 CFA (PAYÉ)   │
│                      │ │ Excursion scolaire: 25,000 CFA (EN ATTENTE)
│                      │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                      │ │ Montant total dû: 135,000 CFA            │
│                      │ │                                           │
│                      │ │ [Voir historique] [Payer maintenant]     │
│                      │ │ [Télécharger factures]                   │
│                      │ └───────────────────────────────────────────┘
└──────────────────────┘ └──────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 📊 PERFORMANCE ACADÉMIQUE - JEAN KOUADIO                                  │
│                                                                            │
│ DERNIÈRES NOTES:                                                           │
│ ┌───────────────┬──────────┬──────┬──────┬──────┬──────┬──────┬─────────┐ │
│ │ Matière       │ Dernière │ Mois │ Trim │ Moyen│ Rang │ Trend│ Avis    │ │
│ ├───────────────┼──────────┼──────┼──────┼──────┼──────┼──────┼─────────┤ │
│ │ Maths         │ 14.5/20  │ 14.2 │ 14.0 │ 14.2 │ 10/42│ ↑    │ Bon     │ │
│ │ Français      │ 13.8/20  │ 13.5 │ 13.0 │ 13.5 │ 15/42│ →    │ Moyen   │ │
│ │ Anglais       │ 15.2/20  │ 15.0 │ 14.5 │ 14.9 │ 8/42 │ ↑    │ Excellent│
│ │ Sciences      │ 12.9/20  │ 12.8 │ 12.0 │ 12.6 │ 25/42│ ↓    │ À réviser
│ │ Histo-Géo     │ 14.0/20  │ 13.8 │ 13.5 │ 13.8 │ 18/42│ →    │ Moyen   │ │
│ │ EPS           │ 17.5/20  │ 17.8 │ 17.5 │ 17.6 │ 5/42 │ ↑    │ Excel   │ │
│ │ Dessin        │ 16.0/20  │ 16.0 │ 15.8 │ 15.9 │ 7/42 │ →    │ Bon     │ │
│ │ Informatique  │ 15.8/20  │ 15.5 │ 15.0 │ 15.4 │ 12/42│ ↑    │ Bon     │ │
│ │───────────────┼──────────┼──────┼──────┼──────┼──────┼──────┼─────────│ │
│ │ MOYENNE       │ 14.2/20  │ 14.1 │ 13.8 │ 14.0 │ 12/42│ ↑    │ Bon ✓   │ │
│ └───────────────┴──────────┴──────┴──────┴──────┴──────┴──────┴─────────┘ │
│                                                                            │
│ [Voir détails] [Imprimer bullet]  [Consulter avec profs]                 │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 📋 ABSENTÉISME & COMPORTEMENT                                             │
│                                                                            │
│ Absences totales: 3 jours  (Excusées: 2 | Non excusées: 1)               │
│ Taux de présence: 94.5% (EXCELLENT)                                       │
│ Retards: 0                                                                │
│ Avertissements: 0                                                         │
│ Mesures disciplinaires: Aucune                                            │
│                                                                            │
│ Comportement général: Très satisfaisant ✓                                  │
│ Notes du directeur: "Excellent élève, respectueux, travailleur"           │
│                                                                            │
│ [Voir détails] [Certifier absence]                                        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Sections détaillées

**1. Profil Enfant**
- Classe, enseignants, sections
- Photo de profil
- Documents importants

**2. Notes & Résultats**
- Notes par matière
- Graphiques de progression
- Comparaison moyenne classe
- Bulletin détaillé

**3. Présence & Comportement**
- Taux de présence
- Absences justifiées
- Commentaires directeur/profs
- Discipline & avertissements

**4. Paiements & Frais**
- Factures impayées
- Historique
- Payer en ligne
- Reçus

**5. Communications**
- Recevoir messages des profs
- Envoyer messages école
- Documents importants
- Notifications

---

## 6. Palette Mobile - Responsive

### Breakpoints
```
Mobile:      < 768px
Tablet:      768px - 1024px
Desktop:     > 1024px

Sidebar:     Hidden on mobile (drawer menu)
Cards:       Full width on mobile (16px margin)
Buttons:     Larger touch targets (44px min)
```

### Navigation Mobile
```
Tab Bar (Bottom):
├─ 🏠 Home
├─ 🎓 Classes/Subjects
├─ 📊 Grades
├─ 💬 Messages
└─ 👤 Profile
```

---

## 7. Variations de thème

### Thème clair (Défaut)
- Background: Blanc/Gris-50
- Texte: Gris-900
- Accents: Violet-6

00

### Thème sombre (Optionnel)
- Background: Gris-900
- Texte: Blanc
- Accents: Violet-400
- Cards: Gris-800

---

## 8. Fichiers de maquettes à créer

**À faire (Figma/Adobe XD)**:
- [ ] Dashboard Admin - Full page
- [ ] Dashboard School Admin - Full page
- [ ] Dashboard Teacher - Full page
- [ ] Dashboard Student - Full page
- [ ] Dashboard Parent - Full page
- [ ] Mobile views - All roles
- [ ] Component library (Storybook)
- [ ] Animations & micro-interactions
- [ ] Icones custom set

