-- Ajoute la Styliste (agent « styliste », rapport et mission de type « style »).
-- Non destructif : on élargit seulement les listes de valeurs autorisées.

-- 1. Retire les anciennes règles sur ces colonnes, quel que soit leur nom.
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.contype = 'c'
      and c.connamespace = 'public'::regnamespace
      and (
        (c.conrelid::regclass::text in ('agent_runs', 'rapports', 'decisions', 'carnets') and a.attname = 'agent')
        or (c.conrelid::regclass::text = 'rapports' and a.attname = 'type')
        or (c.conrelid::regclass::text = 'agent_runs' and a.attname = 'mission')
      )
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

-- 2. Nouvelles règles, avec la Styliste.
alter table public.agent_runs add constraint agent_runs_agent_check
  check (agent in ('redacteur', 'chef-cabinet', 'styliste'));
alter table public.agent_runs add constraint agent_runs_mission_check
  check (mission in ('journal', 'recap', 'style'));
alter table public.rapports add constraint rapports_agent_check
  check (agent in ('redacteur', 'chef-cabinet', 'styliste'));
alter table public.rapports add constraint rapports_type_check
  check (type in ('journal', 'recap', 'style'));
alter table public.decisions add constraint decisions_agent_check
  check (agent in ('redacteur', 'chef-cabinet', 'styliste'));
alter table public.carnets add constraint carnets_agent_check
  check (agent in ('redacteur', 'chef-cabinet', 'styliste'));
