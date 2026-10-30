-- =====================================================================
-- FXON: Custom ("Other Component") spareparts schema migration
-- Run once in the Supabase SQL Editor. Idempotent (safe to re-run).
-- =====================================================================

-- 1. Store user-defined part names on the vehicle_sparepart row itself,
--    so custom names survive reinstall, device change, and multi-device sync,
--    and never pollute the shared master_data catalog.
alter table public.vehicle_sparepart
  add column if not exists custom_name text;

-- 2. Replace any blanket unique constraint/index on (vehicle_id, master_data_id)
--    with two partial unique indexes:
--      a) Official catalog parts: at most one per (vehicle_id, master_data_id).
--      b) Custom parts: multiple per vehicle allowed, unique by (vehicle_id, lower(custom_name)).
do $$
declare
  rec record;
begin
  -- Drop table constraints whose columns are exactly (vehicle_id, master_data_id)
  for rec in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'vehicle_sparepart'
      and c.contype = 'u'
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
      ) = array['master_data_id', 'vehicle_id']
  loop
    execute format('alter table public.vehicle_sparepart drop constraint %I', rec.conname);
  end loop;

  -- Drop standalone unique indexes on (vehicle_id, master_data_id) that are not partial
  for rec in
    select i.relname as idxname
    from pg_index ix
    join pg_class i on i.oid = ix.indexrelid
    join pg_class t on t.oid = ix.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'vehicle_sparepart'
      and ix.indisunique
      and ix.indpred is null
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(ix.indkey) as k(attnum)
        join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
      ) = array['master_data_id', 'vehicle_id']
  loop
    execute format('drop index if exists public.%I', rec.idxname);
  end loop;
end $$;

create unique index if not exists vehicle_sparepart_official_unique
  on public.vehicle_sparepart (vehicle_id, master_data_id)
  where custom_name is null;

create unique index if not exists vehicle_sparepart_custom_name_unique
  on public.vehicle_sparepart (vehicle_id, lower(btrim(custom_name)))
  where custom_name is not null;

-- 3. Seed one shared internal catalog row that all custom parts point to
--    (satisfies the master_data_id foreign key without writing to master_data from the client).
insert into public.master_data (sparepart_name, default_interval, category, icon_name)
select 'Custom Component', 5000, 'Other', 'default'
where not exists (
  select 1 from public.master_data where sparepart_name = 'Custom Component'
);

-- 4. Lock master_data against client writes (official catalog is read-only for users).
alter table public.master_data enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'master_data'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy if exists %I on public.master_data', pol.policyname);
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'master_data' and cmd = 'SELECT'
  ) then
    create policy master_data_read_all on public.master_data for select using (true);
  end if;
end $$;
