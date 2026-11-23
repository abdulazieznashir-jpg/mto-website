-- Penerima leads per jam (pg_cron). Setiap jam menit ke-0, PIC yang menerima di jam sebelumnya
-- tidak menerima di jam berikutnya (kecuali hanya dia yang aktif), dan giliran dioper ke PIC
-- dengan total leads (pendaftaran + kontak) paling sedikit. Seri: urutan, lalu email.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi pic_gilir_per_jam).

create table if not exists public.pic_penerima_jam (
  id int primary key check (id = 1),
  email text,
  sejak timestamptz not null default now()
);
revoke all on public.pic_penerima_jam from anon, authenticated;
insert into public.pic_penerima_jam (id, email) values (1, null) on conflict (id) do nothing;

create or replace function public.pilih_pic_untuk_pendaftar()
returns text language sql stable security definer set search_path to 'public'
as $$
  select coalesce(
    (select d.email from public.pic_penerima_jam p
       join public.deal_maker_pic d on lower(d.email) = lower(p.email)
     where p.id = 1 and d.aktif),
    (select d.email from public.deal_maker_pic d where d.aktif order by d.urutan, d.email limit 1)
  )
$$;

create or replace function public.gilir_pic_per_jam()
returns text language plpgsql security definer set search_path to 'public'
as $$
declare cur text; nxt text;
begin
  select email into cur from public.pic_penerima_jam where id = 1;
  select d.email into nxt
  from public.deal_maker_pic d
  left join (
    select em, count(*) as n from (
      select lower(dealmaker_email) as em from public.pendaftaran where dealmaker_email is not null
      union all
      select lower(dealmaker_email) from public.kontak_masuk where dealmaker_email is not null
    ) x group by em
  ) c on c.em = lower(d.email)
  where d.aktif
    and (lower(d.email) <> lower(coalesce(cur, ''))
         or not exists (select 1 from public.deal_maker_pic e where e.aktif and lower(e.email) <> lower(coalesce(cur, ''))))
  order by coalesce(c.n, 0), d.urutan, d.email
  limit 1;
  if nxt is null then return null; end if;
  insert into public.pic_penerima_jam (id, email, sejak) values (1, nxt, now())
  on conflict (id) do update set email = excluded.email, sejak = excluded.sejak;
  return nxt;
end $$;

revoke all on function public.gilir_pic_per_jam() from public, anon, authenticated;

-- Jadwal (pg_cron): setiap jam menit ke-0.
select cron.schedule('gilir-pic-per-jam', '0 * * * *', 'select public.gilir_pic_per_jam()');
