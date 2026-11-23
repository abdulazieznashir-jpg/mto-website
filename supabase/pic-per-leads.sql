-- Penugasan PIC per leads: pendaftar baru (pendaftaran dan kontak) diberikan ke PIC aktif dengan
-- total leads paling sedikit. Seri: urutan, lalu email. Penjadwal per jam (pg_cron) sudah dihapus.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi pic_per_leads).

create or replace function public.pilih_pic_untuk_pendaftar()
returns text language sql stable security definer set search_path to 'public'
as $$
  select d.email
  from public.deal_maker_pic d
  left join (
    select em, count(*) as n from (
      select lower(dealmaker_email) as em from public.pendaftaran where dealmaker_email is not null
      union all
      select lower(dealmaker_email) from public.kontak_masuk where dealmaker_email is not null
    ) x group by em
  ) c on c.em = lower(d.email)
  where d.aktif
  order by coalesce(c.n, 0), d.urutan, d.email
  limit 1
$$;
