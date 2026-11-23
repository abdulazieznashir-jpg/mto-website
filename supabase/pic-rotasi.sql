-- Penugasan Deal Maker (PIC) bergiliran: pendaftar baru diberikan ke PIC aktif yang
-- terakhir kali menerima pendaftar paling lama (atau belum pernah). Seri: urutan, lalu email.
-- Pendaftar lama tidak diubah.

create or replace function public.pilih_pic_untuk_pendaftar()
returns text language sql stable security definer set search_path to 'public'
as $$
  select d.email
  from public.deal_maker_pic d
  left join (
    select lower(dealmaker_email) as em, max(id) as terakhir
    from public.pendaftaran
    where dealmaker_email is not null
    group by 1
  ) b on b.em = lower(d.email)
  where d.aktif
  order by coalesce(b.terakhir, 0), d.urutan, d.email
  limit 1
$$;

-- Urutan giliran (sudah diterapkan): Rahadi 1, Zikri 2, Nuru 3, Nafa 4.
update public.deal_maker_pic set urutan = 1 where lower(email) = 'mahkota.to15@gmail.com';
update public.deal_maker_pic set urutan = 2 where lower(email) = 'dzikrymaoelana@gmail.com';
