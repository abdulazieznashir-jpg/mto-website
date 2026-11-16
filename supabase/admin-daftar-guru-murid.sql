-- Daftar penugasan guru dan murid untuk admin (baca saja). Hanya owner.
create or replace function public.admin_daftar_guru_murid()
returns table(pengajar_email text, pengajar_nama text, pengajar_aktif boolean, peserta_email text, peserta_nama text, hari smallint, jam time, menit integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'abdulaziez.nashir@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar guru dan murid';
  end if;
  return query
  select t.pengajar_email, g.nama, g.aktif, t.peserta_email, p.nama, t.hari, t.jam, t.menit
  from penugasan t
  left join pengajar g on g.email = t.pengajar_email
  left join peserta p on p.email = t.peserta_email
  order by g.nama, t.hari, t.jam;
end;
$function$;
revoke all on function public.admin_daftar_guru_murid() from public;
revoke all on function public.admin_daftar_guru_murid() from anon;
grant execute on function public.admin_daftar_guru_murid() to authenticated;
