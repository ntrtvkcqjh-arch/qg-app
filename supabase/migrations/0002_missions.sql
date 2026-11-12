-- QG — étape 5 : suivi des missions des agents.
-- Non destructif : ajoute des colonnes et une contrainte d'unicité.

begin;

alter table public.agent_runs
  add column if not exists mission    text check (mission in ('journal', 'recap')),
  add column if not exists date_mission date,
  add column if not exists curseur    text,          -- dernier événement déjà résumé
  add column if not exists cout_cents integer,       -- coût catalogue de la session, en cents USD
  add column if not exists erreur     text;          -- motif d'échec lisible

-- Une seule mission d'un type par jour (évite les doubles lancements).
create unique index if not exists agent_runs_mission_jour_idx
  on public.agent_runs (mission, date_mission)
  where statut in ('en_cours', 'termine');

alter table public.agent_events
  add column if not exists event_id text unique;     -- identifiant Anthropic (dédoublonnage)

-- Le navigateur lit les nouvelles colonnes (lecture seule, comme le reste).
grant select on public.agent_runs, public.agent_events to authenticated;

commit;
