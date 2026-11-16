-- Daftar murid yang belum punya guru (baca saja). Hanya owner.
create or replace function public.admin_daftar_belum_guru()
returns table(email text, nama text, status text, paket text, pengampu text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'abdulaziez.nashir@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar murid tanpa guru';
  end if;
  return query
  select p.email, p.nama, p.status, p.paket, p.pengampu
  from peserta p
  where not exists (select 1 from penugasan t where t.peserta_email = p.email)
  order by p.nama;
end;
$function$;
revoke all on function public.admin_daftar_belum_guru() from public;
revoke all on function public.admin_daftar_belum_guru() from anon;
grant execute on function public.admin_daftar_belum_guru() to authenticated;
