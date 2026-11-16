-- Langkah lanjutan (16 Nov 2026): jadwal gelombang tersimpan di sistem, status Jeda, dan Tidak Hadir.
-- Aturan (dari Owner): Gelombang 1 mulai tanggal 12 s.d. 10 bulan berikutnya; Gelombang 2 mulai tanggal 27 s.d. 25 bulan berikutnya.
-- Nomor periode naik 1 setiap bulan. P77 = November 2026.

-- 1. Tanggal mulai gelombang (sumber untuk atur_jadwal_pendaftaran)
update public.gelombang set tanggal_mulai = '2026-11-12' where kode = 'gelombang_1';
update public.gelombang set tanggal_mulai = '2026-11-27' where kode = 'gelombang_2';

-- 2. Jadwal gelombang tersimpan: November 2026 s.d. Desember 2027
create table if not exists public.jadwal_gelombang (
  kode text not null references public.gelombang(kode),
  periode text not null,
  mulai date not null,
  berakhir date not null,
  primary key (kode, mulai)
);
alter table public.jadwal_gelombang enable row level security;

insert into public.jadwal_gelombang (kode, periode, mulai, berakhir)
select 'gelombang_1',
       'P' || (77 + (extract(year from m) - 2026) * 12 + extract(month from m) - 11)::int,
       make_date(extract(year from m)::int, extract(month from m)::int, 12),
       (make_date(extract(year from m)::int, extract(month from m)::int, 10) + interval '1 month')::date
from generate_series(date '2026-11-01', date '2027-12-01', interval '1 month') m
union all
select 'gelombang_2',
       'P' || (77 + (extract(year from m) - 2026) * 12 + extract(month from m) - 11)::int,
       make_date(extract(year from m)::int, extract(month from m)::int, 27),
       (make_date(extract(year from m)::int, extract(month from m)::int, 25) + interval '1 month')::date
from generate_series(date '2026-11-01', date '2027-12-01', interval '1 month') m
on conflict (kode, mulai) do nothing;

create or replace function public.admin_jadwal_gelombang()
returns json language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'mahkota.to3@gmail.com' then raise exception 'Akses khusus admin'; end if;
  return (select coalesce(json_agg(x order by x.mulai, x.kode), '[]'::json) from public.jadwal_gelombang x);
end; $$;
revoke all on function public.admin_jadwal_gelombang() from public, anon;
grant execute on function public.admin_jadwal_gelombang() to authenticated;

-- 3. Status Jeda (kolom baru) dan Tidak Hadir (kolom baru pada pertemuan)
alter table public.pendaftaran add column if not exists jeda_sejak date;
alter table public.pertemuan add column if not exists hadir boolean;

create or replace function public.admin_set_jeda(p_id bigint, p_jeda boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'mahkota.to3@gmail.com' then raise exception 'Akses khusus admin'; end if;
  update public.pendaftaran set jeda_sejak = case when p_jeda then coalesce(jeda_sejak, (now() at time zone 'Asia/Jakarta')::date) else null end where id = p_id;
end; $$;
revoke all on function public.admin_set_jeda(bigint, boolean) from public, anon;
grant execute on function public.admin_set_jeda(bigint, boolean) to authenticated;

create or replace function public.admin_set_hadir(p_pertemuan bigint, p_hadir boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'mahkota.to3@gmail.com' then raise exception 'Akses khusus admin'; end if;
  update public.pertemuan set hadir = p_hadir where id = p_pertemuan;
end; $$;
revoke all on function public.admin_set_hadir(bigint, boolean) from public, anon;
grant execute on function public.admin_set_hadir(bigint, boolean) to authenticated;

-- 4. Murid yang belum punya gelombang: semuanya Gelombang 1 (12 Nov s.d. 10 Des 2026), sesuai keputusan Owner.
update public.pendaftaran
   set gelombang = 'gelombang_1', tanggal_halaqah = '2026-11-12'
 where status = 'diterima' and gelombang is null;

-- 5. pendaftaran_admin ikut mengembalikan jeda_sejak
create or replace function public.pendaftaran_admin()
returns json language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email','')) not in ('mahkota.to3@gmail.com') then raise exception 'Akses khusus admin'; end if;
  return (select coalesce(json_agg(x order by x.dibuat_at desc), '[]'::json) from (
    select id, nama, email, wa, jenis_kelamin, tanggal_lahir, kota, kelas, durasi, peserta, total, ringkasan, hari_diminta, jam_diminta, gelombang, dibuat_at, bukti_at, bukti_path, bukti_nama, diterima_at, tanggal_halaqah, link_grup, batas_bayar,
      pengampu_nama, tipe_pendaftar, periode_label, program, opsi_waktu, sumber, jeda_sejak,
      case when status = 'menunggu_bayar' and now() > batas_bayar then 'kedaluwarsa' else status end as status
    from public.pendaftaran) x);
end; $$;
