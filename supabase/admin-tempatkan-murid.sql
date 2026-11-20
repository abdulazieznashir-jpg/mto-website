-- C3: penempatan murid ke guru (admin). Menolak murid yang sudah punya guru, sesi yang melewati pukul 22:00,
-- dan sesi yang bertabrakan dengan murid lain milik guru yang sama (Silver 10, Gold 20, Platinum 30 menit).
create or replace function public.admin_tempatkan_murid(p_pengajar_email text, p_peserta_email text, p_hari smallint, p_jam time, p_menit integer, p_link text)
returns void
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') not in ('abdulaziez.nashir@gmail.com', 'mahkota.to3@gmail.com') then
    raise exception 'Hanya admin yang boleh menempatkan murid';
  end if;
  if not exists (select 1 from pengajar g where g.email = p_pengajar_email and g.aktif) then
    raise exception 'Guru tidak ditemukan atau nonaktif';
  end if;
  if not exists (select 1 from peserta p where p.email = p_peserta_email) then
    raise exception 'Murid tidak ditemukan';
  end if;
  if exists (select 1 from penugasan t where t.peserta_email = p_peserta_email) then
    raise exception 'Murid sudah punya guru';
  end if;
  if p_hari is null or p_hari < 1 or p_hari > 7 then
    raise exception 'Hari harus antara 1 dan 7';
  end if;
  if p_jam is null or p_menit is null or p_menit <= 0 then
    raise exception 'Jam dan durasi wajib diisi';
  end if;
  if public.menit_dari(p_jam) + p_menit > 1320 then
    raise exception 'Sesi melewati pukul 22:00';
  end if;
  if exists (select 1 from penugasan t
              where lower(t.pengajar_email) = lower(p_pengajar_email) and t.hari = p_hari
                and public.menit_dari(t.jam) < public.menit_dari(p_jam) + p_menit
                and public.menit_dari(t.jam) + t.menit > public.menit_dari(p_jam)) then
    raise exception 'Jam ini bertabrakan dengan jadwal murid lain milik guru tersebut';
  end if;
  if p_link is not null and p_link <> '' and p_link !~* '^https://' then
    raise exception 'Link meet harus diawali https://';
  end if;
  insert into penugasan (pengajar_email, peserta_email, hari, jam, menit, link_meet)
  values (p_pengajar_email, p_peserta_email, p_hari, p_jam, p_menit, nullif(p_link, ''));
end;
$function$;
revoke all on function public.admin_tempatkan_murid(text, text, smallint, time, integer, text) from public, anon;
grant execute on function public.admin_tempatkan_murid(text, text, smallint, time, integer, text) to authenticated;
