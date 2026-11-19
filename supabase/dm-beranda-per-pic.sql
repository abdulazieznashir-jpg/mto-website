-- Deal Maker per PIC: pemetaan email ke nama PIC, Beranda per orang, dan filter lead per Deal Maker.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi dm_beranda_per_pic).

create table if not exists public.deal_maker_pic (
  email text primary key,
  nama text not null,
  dibuat_at timestamptz not null default now()
);
alter table public.deal_maker_pic enable row level security;
revoke all on public.deal_maker_pic from anon, authenticated;
insert into public.deal_maker_pic (email, nama) values ('azieznashir@gmail.com', 'Zikri') on conflict (email) do nothing;

create or replace function public.dm_daftar_lead(p_filter text default 'semua')
returns json language plpgsql security definer set search_path to 'public'
as $function$
declare hasil json; me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if me not in ('abdulaziez.nashir@gmail.com', 'azieznashir@gmail.com') then
    raise exception 'Akses khusus Deal Maker dan Owner';
  end if;
  with lead as (
    select p.id, p.nama, p.wa, p.kelas, p.status, p.dibuat_at, p.dealmaker_email,
      coalesce(array(select f.tahap from follow_up f where f.pendaftaran_id = p.id order by f.tahap), '{}') as tahap_sudah
    from pendaftaran p
    where p.email not like 'uji-e2e@%'
      and (me = 'abdulaziez.nashir@gmail.com' or lower(p.dealmaker_email) = me)
  ), dipilih as (
    select * from lead where
      case p_filter
        when 'belum' then cardinality(tahap_sudah) = 0
        when '1' then 1 = any(tahap_sudah)
        when '2' then 2 = any(tahap_sudah)
        when '3' then 3 = any(tahap_sudah)
        when '4' then 4 = any(tahap_sudah)
        when 'closing' then status = 'diterima'
        when 'belum_closing' then status <> 'diterima'
        else true end
  )
  select json_build_object(
    'jumlah', (select count(*) from dipilih),
    'hitung', json_build_object(
      'semua', (select count(*) from lead),
      'belum', (select count(*) from lead where cardinality(tahap_sudah) = 0),
      'fu1', (select count(*) from lead where 1 = any(tahap_sudah)),
      'fu2', (select count(*) from lead where 2 = any(tahap_sudah)),
      'fu3', (select count(*) from lead where 3 = any(tahap_sudah)),
      'fu4', (select count(*) from lead where 4 = any(tahap_sudah)),
      'closing', (select count(*) from lead where status = 'diterima'),
      'belum_closing', (select count(*) from lead where status <> 'diterima')),
    'daftar', coalesce((select json_agg(json_build_object('id', id, 'nama', nama, 'wa', wa, 'kelas', kelas, 'status', status, 'dibuat_at', dibuat_at, 'dealmaker_email', dealmaker_email, 'tahap_sudah', tahap_sudah) order by dibuat_at desc) from (select * from dipilih order by dibuat_at desc limit 500) d), '[]'::json))
  into hasil;
  return hasil;
end $function$;

create or replace function public.dm_beranda()
returns json language plpgsql security definer set search_path to 'public'
as $function$
declare me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if me not in ('abdulaziez.nashir@gmail.com', 'azieznashir@gmail.com') then
    raise exception 'Akses khusus Deal Maker dan Owner';
  end if;
  return (
    with lead as (
      select p.id, p.nama, p.kelas, p.status, p.dibuat_at,
        coalesce(array(select f.tahap from follow_up f where f.pendaftaran_id = p.id order by f.tahap), '{}') as tahap_sudah
      from pendaftaran p
      where lower(p.dealmaker_email) = me and p.email not like 'uji-e2e@%'
    ), perlu as (
      select * from lead where status <> 'diterima'
      order by (cardinality(tahap_sudah) = 0) desc, dibuat_at asc
      limit 3
    )
    select json_build_object(
      'nama', coalesce((select d.nama from deal_maker_pic d where lower(d.email) = me), me),
      'target', 17000000,
      'omset_bulan_ini', coalesce((select sum(dm_harga_kelas(p.kelas)) from pendaftaran p
          where lower(p.dealmaker_email) = me and p.status = 'diterima'
            and date_trunc('month', coalesce(p.diterima_at, p.dibuat_at)) = date_trunc('month', now())), 0),
      'lead_baru_24j', (select count(*) from lead where dibuat_at >= now() - interval '24 hours'),
      'belum_bayar', (select count(*) from lead where status = 'menunggu_bayar'),
      'closing', (select count(*) from lead where status = 'diterima'),
      'belum_closing', (select count(*) from lead where status <> 'diterima'),
      'total_lead', (select count(*) from lead),
      'perlu_tindakan', coalesce((select json_agg(json_build_object('id', id, 'nama', nama, 'kelas', kelas, 'status', status, 'dibuat_at', dibuat_at, 'tahap_sudah', tahap_sudah) order by (cardinality(tahap_sudah) = 0) desc, dibuat_at asc) from perlu), '[]'::json)
    )
  );
end $function$;

revoke all on function public.dm_beranda() from public, anon;
grant execute on function public.dm_beranda() to authenticated;
