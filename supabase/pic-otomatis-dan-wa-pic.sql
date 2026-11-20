-- Penugasan Deal Maker (PIC) per pendaftar: otomatis bergiliran, nomor WhatsApp PIC di halaman pembayaran,
-- dan akses Deal Maker untuk semua PIC aktif (bukan hanya satu email).
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi pic_otomatis_dan_wa_pic, status_pendaftaran_akses_anon, dm_akses_semua_pic).

alter table public.deal_maker_pic
  add column if not exists wa text,
  add column if not exists aktif boolean not null default true,
  add column if not exists urutan int not null default 0;

update public.deal_maker_pic set wa = '6285722366003', urutan = 1 where lower(email) = 'azieznashir@gmail.com';

-- PIC dengan beban lead terbuka paling sedikit yang dipilih lebih dulu (urutan untuk seri).
create or replace function public.pilih_pic_untuk_pendaftar()
returns text language sql stable security definer set search_path to 'public'
as $$
  select d.email
  from public.deal_maker_pic d
  left join (
    select lower(dealmaker_email) as em, count(*) as n
    from public.pendaftaran
    where dealmaker_email is not null and status <> 'diterima'
    group by 1
  ) b on b.em = lower(d.email)
  where d.aktif
  order by coalesce(b.n, 0), d.urutan, d.email
  limit 1
$$;

create or replace function public.trg_tetapkan_pic()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if new.dealmaker_email is null then
    new.dealmaker_email := public.pilih_pic_untuk_pendaftar();
  end if;
  return new;
end $$;

drop trigger if exists tetapkan_pic on public.pendaftaran;
create trigger tetapkan_pic before insert on public.pendaftaran
  for each row execute function public.trg_tetapkan_pic();

-- Pendaftar yang masih berjalan (bukan uji) dan belum punya PIC dibagi bergiliran.
do $$
declare r record;
begin
  for r in
    select id from public.pendaftaran
    where dealmaker_email is null
      and status in ('menunggu_bayar','menunggu_verifikasi')
      and email not like 'uji-e2e@%'
    order by id
  loop
    update public.pendaftaran set dealmaker_email = public.pilih_pic_untuk_pendaftar() where id = r.id;
  end loop;
end $$;

-- Halaman pembayaran: nomor WhatsApp PIC yang ditugaskan (cadangan: nomor admin umum).
create or replace function public.status_pendaftaran(p_id bigint, p_email text)
returns json language plpgsql security definer set search_path to 'public'
as $function$
declare r public.pendaftaran; pic record;
begin
  select * into r from public.pendaftaran where id = p_id and lower(email) = lower(trim(p_email));
  if not found then raise exception 'Pendaftaran tidak ditemukan'; end if;
  select nama, wa into pic from public.deal_maker_pic where lower(email) = lower(r.dealmaker_email) and aktif;
  return json_build_object('id', r.id, 'nama', r.nama, 'email', r.email, 'wa', r.wa, 'kelas', r.kelas,
    'durasi', r.durasi, 'peserta', r.peserta, 'total', r.total, 'ringkasan', r.ringkasan,
    'status', case when r.status = 'menunggu_bayar' and now() > r.batas_bayar then 'kedaluwarsa' else r.status end,
    'batas_bayar', r.batas_bayar, 'bukti_at', r.bukti_at, 'bukti_nama', r.bukti_nama,
    'diterima_at', r.diterima_at, 'tanggal_halaqah', r.tanggal_halaqah, 'link_grup', r.link_grup,
    'pic_nama', pic.nama, 'wa_admin', coalesce(pic.wa, '6285727533000'));
end $function$;
grant execute on function public.status_pendaftaran(bigint, text) to anon, authenticated;

-- Daftar PIC aktif untuk dropdown Owner.
create or replace function public.daftar_deal_maker()
returns json language plpgsql stable security definer set search_path to 'public'
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') not in ('abdulaziez.nashir@gmail.com', 'mahkota.to3@gmail.com')
     and not exists (select 1 from public.deal_maker_pic where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))) then
    raise exception 'Akses khusus admin dan Deal Maker';
  end if;
  return coalesce((select json_agg(json_build_object('email', lower(email), 'nama', nama) order by urutan, nama)
                   from public.deal_maker_pic where aktif), '[]'::json);
end $$;

-- Penetapan Deal Maker untuk satu pendaftar, hanya Owner.
create or replace function public.admin_set_dealmaker(p_pendaftaran_id bigint, p_email text)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'abdulaziez.nashir@gmail.com' then
    raise exception 'Hanya owner yang dapat menetapkan Deal Maker';
  end if;
  if p_email is not null and not exists (select 1 from public.deal_maker_pic where lower(email) = lower(p_email) and aktif) then
    raise exception 'Deal Maker tidak dikenal';
  end if;
  update public.pendaftaran set dealmaker_email = lower(p_email) where id = p_pendaftaran_id;
  if not found then raise exception 'Pendaftar tidak ditemukan'; end if;
end $$;

-- Akses Deal Maker: owner atau PIC aktif (tidak lagi hardcode satu email).
create or replace function public.dm_izin(p text)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select lower(coalesce(p,'')) = 'abdulaziez.nashir@gmail.com'
    or exists (select 1 from public.deal_maker_pic d where lower(d.email) = lower(coalesce(p,'')) and d.aktif)
$$;
revoke all on function public.dm_izin(text) from public, anon;
grant execute on function public.dm_izin(text) to authenticated;

revoke all on function public.pilih_pic_untuk_pendaftar() from public, anon, authenticated;
revoke all on function public.trg_tetapkan_pic() from public, anon, authenticated;
revoke all on function public.daftar_deal_maker() from public, anon;
grant execute on function public.daftar_deal_maker() to authenticated;
revoke all on function public.admin_set_dealmaker(bigint, text) from public, anon;
grant execute on function public.admin_set_dealmaker(bigint, text) to authenticated;
