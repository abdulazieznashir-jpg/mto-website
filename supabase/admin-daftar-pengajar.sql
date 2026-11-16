-- Daftar pengajar beserta jumlah murid yang ditugaskan (read-only).
-- Hanya Owner (mahkota.to3@gmail.com) yang boleh memanggil.

create or replace function public.admin_daftar_pengajar()
returns table (
  email text,
  nama text,
  aktif boolean,
  jumlah_murid bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'mahkota.to3@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar pengajar';
  end if;

  return query
  select g.email, g.nama, g.aktif,
         (select count(distinct t.peserta_email)
            from penugasan t
           where t.pengajar_email = g.email) as jumlah_murid
  from pengajar g
  order by g.nama;
end;
$$;

revoke all on function public.admin_daftar_pengajar() from public;
revoke all on function public.admin_daftar_pengajar() from anon;
grant execute on function public.admin_daftar_pengajar() to authenticated;
