-- Daftar jadwal (penugasan) untuk halaman admin baru (read-only).
-- Hanya Owner (abdulaziez.nashir@gmail.com) yang boleh memanggil.
-- Nama murid diambil dari pendaftaran, nama pengajar dari pengajar.

create or replace function public.admin_daftar_jadwal()
returns table (
  hari smallint,
  jam time,
  menit integer,
  pengajar_email text,
  pengajar_nama text,
  peserta_email text,
  peserta_nama text,
  link_meet text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'abdulaziez.nashir@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar jadwal';
  end if;

  return query
  select t.hari, t.jam, t.menit,
         t.pengajar_email, g.nama,
         t.peserta_email, p.nama,
         t.link_meet
  from penugasan t
  left join pengajar g on g.email = t.pengajar_email
  left join lateral (
    select d.nama from pendaftaran d
    where d.email = t.peserta_email
    order by d.id desc limit 1
  ) p on true
  order by t.hari, t.jam, t.pengajar_email;
end;
$$;

revoke all on function public.admin_daftar_jadwal() from public;
revoke all on function public.admin_daftar_jadwal() from anon;
grant execute on function public.admin_daftar_jadwal() to authenticated;
