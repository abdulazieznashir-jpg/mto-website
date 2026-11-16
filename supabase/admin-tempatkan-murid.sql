-- C3: penempatan murid ke guru (owner-only). Menolak murid yang sudah punya guru.
create or replace function public.admin_tempatkan_murid(p_pengajar_email text, p_peserta_email text, p_hari smallint, p_jam time, p_menit integer, p_link text)
returns void
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'abdulaziez.nashir@gmail.com' then
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
  if p_link is not null and p_link <> '' and p_link !~* '^https://' then
    raise exception 'Link meet harus diawali https://';
  end if;
  insert into penugasan (pengajar_email, peserta_email, hari, jam, menit, link_meet)
  values (p_pengajar_email, p_peserta_email, p_hari, p_jam, p_menit, nullif(p_link, ''));
end;
$function$;
revoke all on function public.admin_tempatkan_murid(text, text, smallint, time, integer, text) from public, anon;
grant execute on function public.admin_tempatkan_murid(text, text, smallint, time, integer, text) to authenticated;
