-- Daftar pertemuan untuk halaman admin baru (read-only).
-- Hanya Owner (mahkota.to3@gmail.com) yang boleh memanggil.

create or replace function public.admin_daftar_pertemuan()
returns table (
  id bigint,
  dicatat_at timestamptz,
  peserta_email text,
  peserta_nama text,
  pengajar_email text,
  pengajar_nama text,
  hadir boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'mahkota.to3@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar pertemuan';
  end if;

  return query
  select t.id, t.dicatat_at, t.peserta_email,
         (select d.nama from pendaftaran d where d.email = t.peserta_email order by d.id desc limit 1),
         t.pengajar_email, g.nama, t.hadir
  from pertemuan t
  left join pengajar g on g.email = t.pengajar_email
  order by t.dicatat_at desc nulls last, t.id desc
  limit 500;
end;
$$;

revoke all on function public.admin_daftar_pertemuan() from public;
revoke all on function public.admin_daftar_pertemuan() from anon;
grant execute on function public.admin_daftar_pertemuan() to authenticated;
