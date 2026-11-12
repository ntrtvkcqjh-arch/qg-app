# Contrat de sortie — comment chaque agent rend son travail

Le site lit ta réponse finale et l'enregistre. Respecte exactement ce
format, sinon ton travail est perdu.

Ta réponse finale contient, dans cet ordre, uniquement ces blocs :

<<<RAPPORT type="journal|recap|style" date="AAAA-MM-JJ" titre="...">>>
(le document HTML complet et autonome, conforme à la charte rapport-design)
<<<FIN_RAPPORT>>>

<<<CARNET>>>
[
  {"date": "AAAA-MM-JJ", "entree": "...", "origine": "suggere_agent"}
]
<<<FIN_CARNET>>>

<<<DECISIONS>>>
[
  {"date": "AAAA-MM-JJ", "decision": "...", "raison": "...", "annulation": "..."}
]
<<<FIN_DECISIONS>>>

<<<INCIDENTS>>>
[
  {"type": "outil_en_echec|instruction_suspecte|source_inaccessible", "detail": "..."}
]
<<<FIN_INCIDENTS>>>

Règles :
- Les blocs CARNET, DECISIONS et INCIDENTS contiennent un tableau JSON
  valide, vide (`[]`) s'il n'y a rien.
- `origine` vaut `suggere_agent`, ou `decide_marjana` seulement si Marjana
  l'a explicitement décidé dans les retours fournis.
- Seul le Chef de cabinet remplit DECISIONS. Les autres rendent `[]`.
- Rien en dehors de ces blocs.
