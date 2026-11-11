-- QG de Marjana — migration initiale
-- À exécuter une seule fois dans Supabase > SQL Editor (projet vide).
--
-- Principes :
--  * RLS activée sur TOUTES les tables.
--  * Un seul compte autorisé : son identifiant est stocké dans
--    `proprietaire` (table illisible depuis l'API) et vérifié par
--    la fonction `est_proprietaire()` dans chaque règle.
--  * Le navigateur (rôle `authenticated`) ne reçoit que les droits
--    strictement nécessaires ; le rôle `anon` (non connecté) n'a rien.
--  * Les écritures des agents passent par le serveur avec la clé
--    secrète (rôle `service_role`, qui contourne la RLS).

begin;

-- ---------------------------------------------------------------
-- Compte autorisé
-- ---------------------------------------------------------------
create table public.proprietaire (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.proprietaire enable row level security;
-- Aucune règle : personne ne lit ni n'écrit cette table via l'API.

create or replace function public.est_proprietaire()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.proprietaire where user_id = (select auth.uid())
  );
$$;
revoke all on function public.est_proprietaire() from public, anon;
grant execute on function public.est_proprietaire() to authenticated, service_role;

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------
create table public.agent_runs (
  id           uuid primary key default gen_random_uuid(),
  agent        text not null check (agent in ('redacteur', 'chef-cabinet')),
  session_id   text unique,
  statut       text not null default 'en_cours'
               check (statut in ('en_cours', 'termine', 'echec', 'interrompu')),
  demarre_a    timestamptz not null default now(),
  termine_a    timestamptz,
  incidents    jsonb not null default '[]'::jsonb,
  sortie_brute text            -- réponse brute conservée pour diagnostic
);

create table public.agent_events (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid not null references public.agent_runs (id) on delete cascade,
  type       text not null,
  resume     text,
  created_at timestamptz not null default now()
);
create index agent_events_run_idx on public.agent_events (run_id, created_at);

create table public.rapports (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid references public.agent_runs (id) on delete set null,
  agent      text not null check (agent in ('redacteur', 'chef-cabinet')),
  type       text not null check (type in ('journal', 'recap')),
  date       date not null,
  titre      text,
  html       text,
  statut     text not null default 'en_cours'
             check (statut in ('en_cours', 'publie', 'echec')),
  created_at timestamptz not null default now()
);
create index rapports_date_idx on public.rapports (date desc);

create table public.retours (
  id          uuid primary key default gen_random_uuid(),
  rapport_id  uuid not null references public.rapports (id) on delete cascade,
  valeur      text not null check (valeur in ('utile', 'bof', 'inutile')),
  commentaire text,
  created_at  timestamptz not null default now()
);
create index retours_rapport_idx on public.retours (rapport_id);

create table public.todos (
  id         uuid primary key default gen_random_uuid(),
  texte      text not null check (length(texte) between 1 and 500),
  priorite   smallint not null default 2 check (priorite between 1 and 3), -- 1 = haute
  fait       boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.decisions (
  id         uuid primary key default gen_random_uuid(),
  agent      text not null check (agent in ('redacteur', 'chef-cabinet')),
  date       date not null,
  decision   text not null,
  raison     text,
  annulation text,                  -- comment annuler / effet de l'annulation
  annulee    boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.carnets (
  id         uuid primary key default gen_random_uuid(),
  agent      text not null check (agent in ('redacteur', 'chef-cabinet')),
  date       date not null default current_date,
  entree     text not null,
  origine    text not null check (origine in ('suggere_agent', 'decide_marjana')),
  created_at timestamptz not null default now()
);
create index carnets_agent_idx on public.carnets (agent, date desc);

create table public.idees (
  id         uuid primary key default gen_random_uuid(),
  texte      text not null check (length(texte) between 1 and 2000),
  statut     text not null default 'nouvelle'
             check (statut in ('nouvelle', 'retenue', 'ecartee')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- RLS partout
-- ---------------------------------------------------------------
alter table public.agent_runs   enable row level security;
alter table public.agent_events enable row level security;
alter table public.rapports     enable row level security;
alter table public.retours      enable row level security;
alter table public.todos        enable row level security;
alter table public.decisions    enable row level security;
alter table public.carnets      enable row level security;
alter table public.idees        enable row level security;

-- ---------------------------------------------------------------
-- Droits : on repart de zéro, puis on accorde le strict nécessaire
-- ---------------------------------------------------------------
revoke all on public.proprietaire, public.agent_runs, public.agent_events,
  public.rapports, public.retours, public.todos, public.decisions,
  public.carnets, public.idees
  from anon, authenticated;

-- Le serveur (clé secrète) a besoin des droits de table ; la RLS ne
-- s'applique pas à lui.
grant all on public.proprietaire, public.agent_runs, public.agent_events,
  public.rapports, public.retours, public.todos, public.decisions,
  public.carnets, public.idees
  to service_role;

-- Lecture seule pour le navigateur
grant select on public.agent_runs, public.agent_events, public.rapports
  to authenticated;

-- Retours : lire et ajouter
grant select, insert (rapport_id, valeur, commentaire) on public.retours to authenticated;

-- To-do : tout
grant select, delete on public.todos to authenticated;
grant insert (texte, priorite), update (texte, priorite, fait) on public.todos to authenticated;

-- Décisions : lire, et seulement cocher « annulée »
grant select on public.decisions to authenticated;
grant update (annulee) on public.decisions to authenticated;

-- Carnets : lire, et ajouter ses propres consignes
grant select on public.carnets to authenticated;
grant insert (agent, date, entree, origine) on public.carnets to authenticated;

-- Idées : lire, ajouter, changer le statut
grant select on public.idees to authenticated;
grant insert (texte) on public.idees to authenticated;
grant update (statut) on public.idees to authenticated;

-- ---------------------------------------------------------------
-- Règles RLS (rôle authenticated + compte autorisé uniquement)
-- ---------------------------------------------------------------
create policy "proprio lit" on public.agent_runs
  for select to authenticated using ((select public.est_proprietaire()));
create policy "proprio lit" on public.agent_events
  for select to authenticated using ((select public.est_proprietaire()));
create policy "proprio lit" on public.rapports
  for select to authenticated using ((select public.est_proprietaire()));

create policy "proprio lit" on public.retours
  for select to authenticated using ((select public.est_proprietaire()));
create policy "proprio ajoute" on public.retours
  for insert to authenticated with check ((select public.est_proprietaire()));

create policy "proprio lit" on public.todos
  for select to authenticated using ((select public.est_proprietaire()));
create policy "proprio ajoute" on public.todos
  for insert to authenticated with check ((select public.est_proprietaire()));
create policy "proprio modifie" on public.todos
  for update to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));
create policy "proprio supprime" on public.todos
  for delete to authenticated using ((select public.est_proprietaire()));

create policy "proprio lit" on public.decisions
  for select to authenticated using ((select public.est_proprietaire()));
create policy "proprio annule" on public.decisions
  for update to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

create policy "proprio lit" on public.carnets
  for select to authenticated using ((select public.est_proprietaire()));
create policy "proprio ajoute une consigne" on public.carnets
  for insert to authenticated
  with check ((select public.est_proprietaire()) and origine = 'decide_marjana');

create policy "proprio lit" on public.idees
  for select to authenticated using ((select public.est_proprietaire()));
create policy "proprio ajoute" on public.idees
  for insert to authenticated with check ((select public.est_proprietaire()));
create policy "proprio modifie" on public.idees
  for update to authenticated
  using ((select public.est_proprietaire())) with check ((select public.est_proprietaire()));

commit;

-- ---------------------------------------------------------------
-- APRÈS avoir créé ton compte (Authentication > Users > Add user),
-- exécute séparément, en remplaçant par TON adresse :
--
--   insert into public.proprietaire (user_id)
--   select id from auth.users where email = 'ton-adresse@exemple.com';
--
-- (Ne pas commiter ce fichier avec ton adresse dedans.)
-- ---------------------------------------------------------------
