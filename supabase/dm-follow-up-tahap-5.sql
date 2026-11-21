-- Tahap follow up 1 sampai 5 (FU5). Diterapkan sebagai migrasi dm_follow_up_tahap_5.
-- dm_catat_follow_up: batas tahap dinaikkan dari 4 ke 5.
-- dm_daftar_lead: filter '5' dan hitungan 'fu5' ditambahkan. Bagian lain tidak berubah.

create or replace function public.dm_catat_follow_up(p_pendaftaran_id bigint, p_tahap smallint, p_catatan text default null::text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') not in ('abdulaziez.nashir@gmail.com', 'azieznashir@gmail.com') then
    raise exception 'Akses khusus Deal Maker dan Owner';
  end if;
  if p_tahap not between 1 and 5 then raise exception 'Tahap follow up harus 1 sampai 5'; end if;
  insert into follow_up (pendaftaran_id, tahap, catatan, dicatat_oleh)
  values (p_pendaftaran_id, p_tahap, nullif(trim(coalesce(p_catatan,'')), ''), auth.jwt() ->> 'email')
  on conflict (pendaftaran_id, tahap) do update set catatan = excluded.catatan, dicatat_at = now(), dicatat_oleh = excluded.dicatat_oleh;
end $function$;

-- dm_daftar_lead: isi lengkap sama dengan versi sebelumnya, ditambah '5' dan 'fu5'.
-- Lihat migrasi dm_follow_up_tahap_5 di Supabase untuk badan fungsi lengkapnya.
