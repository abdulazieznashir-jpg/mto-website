-- Deal Maker: Beranda dan Follow Up membaca pendaftaran dan lead sheet (deal_maker_lead).
-- Menambah badge status FU, harga dari kelas (dm_harga_kelas), tanggal closing, dan tahap FU terakhir.
-- Signature dm_beranda(p_email) dipertahankan untuk Switch Account owner.

create or replace function public.dm_daftar_lead(p_filter text default 'semua')
returns json language plpgsql security definer set search_path to 'public'
as $function$
declare hasil json; me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if me not in ('abdulaziez.nashir@gmail.com', 'azieznashir@gmail.com') then
    raise exception 'Akses khusus Deal Maker dan Owner';
  end if;
  with pend as (
    select p.id::text as id, p.nama, p.wa, p.kelas, p.status, p.dibuat_at, p.dealmaker_email,
      coalesce(array(select f.tahap from follow_up f where f.pendaftaran_id = p.id order by f.tahap), '{}'::int[]) as tahap_sudah,
      null::text as tahap_fu, 'pendaftaran'::text as sumber
    from pendaftaran p
    where p.email not like 'uji-e2e@%'
  ), sheet as (
    select d.sheet_id as id, d.nama, d.hp as wa, d.kelas,
      case when d.status_closing = 'Closing' then 'diterima'
           when d.status_terakhir = 'Menunggu Pembayaran' then 'menunggu_bayar'
           else 'belum_closing' end as status,
      coalesce(d.tanggal_masuk::timestamptz, d.dibuat_at) as dibuat_at,
      d.pic_email as dealmaker_email,
      case when d.tahap_fu ~ '^FU[0-9]$' then array(select generate_series(1, substr(d.tahap_fu, 3)::int - 1)) else '{}'::int[] end as tahap_sudah,
      d.tahap_fu, 'sheet'::text as sumber
    from deal_maker_lead d
  ), lead as (
    select x.*,
      coalesce((select max(t) from unnest(x.tahap_sudah) t), 0) as fu_terakhir,
      case when x.status = 'diterima' then 'closing'
           when cardinality(x.tahap_sudah) = 0 then 'belum'
           else 'sudah' end as badge
    from (select * from pend union all select * from sheet) x
    where me = 'abdulaziez.nashir@gmail.com' or lower(x.dealmaker_email) = me
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
    'daftar', coalesce((select json_agg(json_build_object(
        'id', id, 'nama', nama, 'wa', wa, 'kelas', kelas, 'harga', dm_harga_kelas(kelas),
        'status', status, 'badge', badge, 'fu_terakhir', fu_terakhir, 'tahap_fu', tahap_fu,
        'dibuat_at', dibuat_at, 'dealmaker_email', dealmaker_email,
        'tahap_sudah', tahap_sudah, 'sumber', sumber) order by dibuat_at desc)
      from (select * from dipilih order by dibuat_at desc limit 500) d), '[]'::json))
  into hasil;
  return hasil;
end $function$;

create or replace function public.dm_beranda(p_email text default null::text)
returns json language plpgsql security definer set search_path to 'public'
as $function$
declare asli text := lower(coalesce(auth.jwt() ->> 'email', '')); me text;
begin
  me := asli;
  if asli not in ('abdulaziez.nashir@gmail.com', 'azieznashir@gmail.com') then
    raise exception 'Akses khusus Deal Maker dan Owner';
  end if;
  if asli = 'abdulaziez.nashir@gmail.com' and p_email is not null then me := lower(p_email); end if;
  return (
    with pend as (
      select p.id::text as id, p.nama, p.kelas, p.status, p.dibuat_at, p.dealmaker_email,
        coalesce(p.diterima_at, p.dibuat_at) as tgl_closing,
        coalesce(array(select f.tahap from follow_up f where f.pendaftaran_id = p.id order by f.tahap), '{}'::int[]) as tahap_sudah,
        null::text as tahap_fu
      from pendaftaran p
      where p.email not like 'uji-e2e@%'
    ), sheet as (
      select d.sheet_id as id, d.nama, d.kelas,
        case when d.status_closing = 'Closing' then 'diterima'
             when d.status_terakhir = 'Menunggu Pembayaran' then 'menunggu_bayar'
             else 'belum_closing' end as status,
        coalesce(d.tanggal_masuk::timestamptz, d.dibuat_at) as dibuat_at,
        d.pic_email as dealmaker_email,
        coalesce(d.tanggal_closing::timestamptz, coalesce(d.tanggal_masuk::timestamptz, d.dibuat_at)) as tgl_closing,
        case when d.tahap_fu ~ '^FU[0-9]$' then array(select generate_series(1, substr(d.tahap_fu, 3)::int - 1)) else '{}'::int[] end as tahap_sudah,
        d.tahap_fu
      from deal_maker_lead d
    ), lead as (
      select x.*,
        coalesce((select max(t) from unnest(x.tahap_sudah) t), 0) as fu_terakhir,
        case when x.status = 'diterima' then 'closing'
             when cardinality(x.tahap_sudah) = 0 then 'belum'
             else 'sudah' end as badge
      from (select * from pend union all select * from sheet) x
      where lower(x.dealmaker_email) = me
    ), perlu as (
      select * from lead where status <> 'diterima'
      order by (cardinality(tahap_sudah) = 0) desc, dibuat_at asc
      limit 3
    )
    select json_build_object(
      'nama', coalesce((select d.nama from deal_maker_pic d where lower(d.email) = me), me),
      'target', 17000000,
      'omset_bulan_ini', coalesce((select sum(dm_harga_kelas(l.kelas)) from lead l
          where l.status = 'diterima' and date_trunc('month', l.tgl_closing) = date_trunc('month', now())), 0),
      'lead_baru_24j', (select count(*) from lead where dibuat_at >= now() - interval '24 hours'),
      'belum_bayar', (select count(*) from lead where status = 'menunggu_bayar'),
      'closing', (select count(*) from lead where status = 'diterima'),
      'belum_closing', (select count(*) from lead where status <> 'diterima'),
      'total_lead', (select count(*) from lead),
      'perlu_tindakan', coalesce((select json_agg(json_build_object(
          'id', id, 'nama', nama, 'kelas', kelas, 'harga', dm_harga_kelas(kelas),
          'status', status, 'badge', badge, 'fu_terakhir', fu_terakhir, 'tahap_fu', tahap_fu,
          'dibuat_at', dibuat_at, 'tahap_sudah', tahap_sudah)
          order by (cardinality(tahap_sudah) = 0) desc, dibuat_at asc) from perlu), '[]'::json)
    )
  );
end $function$;

revoke all on function public.dm_daftar_lead(text) from public, anon;
grant execute on function public.dm_daftar_lead(text) to authenticated;
revoke all on function public.dm_beranda(text) from public, anon;
grant execute on function public.dm_beranda(text) to authenticated;
