---
name: journal-du-matin
description: Procédure complète pour produire le Journal du matin de Marjana (édition de semaine ou de week-end). Utilise ce skill dès qu'une tâche demande le Journal, l'édition du jour, le briefing du matin ou la revue de presse, même formulée autrement.
---

# Journal du matin

Date du jour et type d'édition : donnés dans la tâche. Si l'une manque,
déduis le type d'édition de la date (samedi ou dimanche = week-end) et
signale-le en tête du rapport.

## Édition de semaine (10 à 15 min de lecture, environ 2 000 mots maximum)
Ordre et budget :
1. En bref : 3 lignes.
2. Éco & marchés (3 min) : 1 sujet principal + 1 ou 2 brèves.
3. PE · TS · M&A France (3 min) : l'opération ou la levée la plus notable,
   pourquoi c'est un signal.
4. Le deal décortiqué (3 min) : une opération réelle, analysée comme en
   Transaction Services : cible, acquéreur, valeur si publiée, structure de
   financement, et ce qu'un auditeur TS vérifierait (qualité de l'EBITDA et
   retraitements, BFR normatif, dette nette ajustée, dépendances clients ou
   fournisseurs, etc.). Uniquement des données publiques.
   - LUNDI = version active : présente d'abord la situation brute et pose la
     question « Qu'est-ce que tu vérifierais en premier ? ». Mets l'analyse
     dans un bloc repliable `<details>` intitulé « Voir l'analyse ».
   - Autres jours : version classique.
5. Compta · fiscal · réglementaire (2 min) : un texte publié ou en
   préparation, ce qui change, pour qui, à partir de quand, avec la
   référence exacte. Rien de notable : « Rien de majeur aujourd'hui ».
6. Question DEC du jour (1 min) : une question de révision (normes,
   déontologie, cas pratique court). Réponse dans un bloc `<details>`, avec
   la référence. Référence non vérifiée = étiquette À VÉRIFIER.
7. English for deals : une expression du jargon PE/TS, sa définition en
   français et un exemple d'usage.
8. Rubrique perso, en rotation :
   - lundi et jeudi : Tech / IA (ce qui change pour la profession comptable
     et financière) ;
   - mardi et vendredi : Immobilier (marché et annonces notables sur
     Deuil-la-Barre, Enghien-les-Bains et alentours, Val-d'Oise) ;
   - mercredi : Sport / calisthénie (progression, récupération, études
     sérieuses uniquement).
9. Le livre et l'astuce (1 min) : un livre réel (auteur et existence
   vérifiés) lié à ses centres d'intérêt, et une astuce pratique (Excel,
   méthode de travail, outil).
10. Sources, puis « Cette édition t'a servi ? ».

## Édition de week-end (5 min, environ 900 mots)
En bref de la semaine écoulée (5 lignes), une lecture longue recommandée
(article de fond, sourcée), le livre, une sortie culturelle à Paris ou en
Île-de-France si pertinente, et la rubrique perso du samedi : Sport.
Pas de rubrique compta-fiscale, pas de question DEC.

## Méthode
1. Lis le carnet et les retours fournis dans la tâche : applique les
   retours récents.
2. Recherche rubrique par rubrique, sources primaires d'abord
   (voir `sources.md`), en ajoutant la date du jour aux requêtes d'actualité.
3. Ouvre et lis chaque page retenue. Jamais d'extrait de recherche seul.
4. Pour chaque fait important : deux sources concordantes, dont une primaire
   si elle existe. Sinon : PROBABLE ou À VÉRIFIER, avec la raison.
5. Rédige avec tes mots. Pas plus d'une citation courte par source.
6. Applique la charte `rapport-design` et rends le Journal selon
   `contrat-sortie.md` (type : journal).
7. Relis-toi avec cette liste : aucune info inventée ; chaque rubrique
   tient son budget ; chaque niveau de confiance a sa raison ; toutes les
   sources sont datées ; aucune donnée sur les clients de l'employeur de
   Marjana.
8. Si un outil a échoué, écris-le en tête du Journal.
