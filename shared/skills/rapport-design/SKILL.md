---
name: rapport-design
description: Charte graphique de tous les rapports du QG de Marjana (Journal du matin, récap du dimanche, rapports DEC, Style, Quotidien). Utilise ce skill CHAQUE FOIS que tu produis un rapport, une édition, un récap ou une page HTML destinée à Marjana, même si la tâche ne parle pas de design.
---

# Charte des rapports du QG

Style : éditorial classique, façon presse de référence. Lecture sur iPhone
d'abord. Un seul fichier HTML autonome par rapport.

## Règles techniques
- Pars de `template-journal.html` (dans ce dossier) et garde sa structure.
- Fichier autonome : tout le CSS dans la page, aucune police, image, script
  ou feuille de style externe. Polices : Georgia et la pile système.
- Lisible sur un écran de 390 px de large, sans défilement horizontal.
- Texte au moins 15 px, contraste suffisant, liens cliquables.

## Couleurs par rubrique (bandeau du haut et étiquettes)
- Journal : #1F3A5F (bleu nuit)
- DEC / mémoire : #8A1C2B (bordeaux)
- Prépa écrit : #3E4A3A (vert ardoise)
- Coach / quotidien : #8A4F0F (ocre)
- Style : #2F5D50 (vert sapin)
- Chef de cabinet / récap : #4B3A6B (aubergine)
Fond #FBFAF7, encre #121212, texte courant #2B2B2B, filets #D9D6CF.

## Structure de tout rapport
1. Bandeau couleur avec le nom de la rubrique.
2. Date et temps de lecture, titre principal, double filet.
3. Bloc « En bref » : 3 lignes maximum.
4. Les sections, séparées par des filets.
5. Niveaux de confiance en étiquettes texte : CERTAIN, PROBABLE, À VÉRIFIER,
   chacun suivi de sa raison en quelques mots. Jamais d'emoji.
6. Section « Sources » : liste datée et cliquable, plus les sources
   inaccessibles.
7. Pied : « Cette édition t'a servi ? » (les boutons seront branchés par le
   site ; en attendant, texte simple).

## Interdits
- Remplissage, phrases creuses, dégradés, emoji.
- Inventer un contenu pour remplir une section : écris « Rien de majeur
  aujourd'hui » à la place.
