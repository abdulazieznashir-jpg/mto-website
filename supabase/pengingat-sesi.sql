-- Pengingat sesi 60, 30, dan 5 menit sebelum sesi (murid dan pengajar).
-- Dijalankan tiap menit oleh pg_cron. Pesan tampil di lonceng notifikasi.
create extension if not exists pg_cron;

create or replace function public.kirim_pengingat_sesi()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  lokal timestamp := now() at time zone 'Asia/Jakarta';
  hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  r record;
  mulai timestamp;
  off int;
  jam_txt text;
  isi_murid text;
  isi_pengajar text;
  nama_murid text;
  n int := 0;
begin
  for r in
    select t.pengajar_email, t.peserta_email, t.jam, t.link_meet
    from public.penugasan t
    where t.hari = extract(isodow from hari_ini)::int
      and exists (
        select 1 from public.pendaftaran pd
        where lower(pd.email) = lower(t.peserta_email) and pd.status = 'diterima'
          and public.sudah_mulai(pd.tanggal_halaqah)
      )
  loop
    mulai := hari_ini + r.jam;
    jam_txt := to_char(r.jam, 'HH24:MI');
    select pe.nama into nama_murid from public.peserta pe where lower(pe.email) = lower(r.peserta_email) limit 1;
    nama_murid := coalesce(nama_murid, r.peserta_email);
    foreach off in array array[60, 30, 5] loop
      if lokal >= mulai - make_interval(mins => off) and lokal < mulai - make_interval(mins => off) + interval '1 minute' then
        isi_murid := 'Sesi Anda dimulai pukul ' || jam_txt || ' WIB, ' || off || ' menit lagi.' ||
          case when r.link_meet is not null then ' Link Google Meet: ' || r.link_meet else ' Link Google Meet belum tersedia.' end;
        isi_pengajar := 'Sesi dengan ' || nama_murid || ' dimulai pukul ' || jam_txt || ' WIB, ' || off || ' menit lagi.';
        insert into public.notifikasi (email, judul, isi)
        select lower(r.peserta_email), 'Pengingat sesi', isi_murid
        where not exists (select 1 from public.notifikasi x where x.email = lower(r.peserta_email) and x.judul = 'Pengingat sesi' and x.isi = isi_murid and x.dibuat_at > now() - interval '3 hours');
        if found then n := n + 1; end if;
        insert into public.notifikasi (email, judul, isi)
        select lower(r.pengajar_email), 'Pengingat sesi', isi_pengajar
        where not exists (select 1 from public.notifikasi x where x.email = lower(r.pengajar_email) and x.judul = 'Pengingat sesi' and x.isi = isi_pengajar and x.dibuat_at > now() - interval '3 hours');
        if found then n := n + 1; end if;
      end if;
    end loop;
  end loop;
  return n;
end
$fn$;

revoke all on function public.kirim_pengingat_sesi() from public, anon, authenticated;

select cron.schedule('pengingat-sesi', '* * * * *', 'select public.kirim_pengingat_sesi()');
