-- Daftar murid untuk halaman admin baru (read-only).
-- Hanya Owner (mahkota.to3@gmail.com) yang boleh memanggil.
-- Mengambil murid yang sudah diterima dari tabel pendaftaran.

create or replace function public.admin_daftar_murid()
returns table (
  id bigint,
  email text,
  nama text,
  wa text,
  jenis_kelamin text,
  kelas text,
  durasi integer,
  status text,
  pengampu_nama text,
  gelombang text,
  periode_label text,
  jeda_sejak date,
  tanggal_halaqah date,
  link_grup text,
  sumber text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'mahkota.to3@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar murid';
  end if;

  return query
  select p.id, p.email, p.nama, p.wa, p.jenis_kelamin, p.kelas, p.durasi,
         p.status, p.pengampu_nama, p.gelombang, p.periode_label,
         p.jeda_sejak, p.tanggal_halaqah, p.link_grup, p.sumber
  from pendaftaran p
  where p.status = 'diterima'
  order by p.nama;
end;
$$;

revoke all on function public.admin_daftar_murid() from public;
revoke all on function public.admin_daftar_murid() from anon;
grant execute on function public.admin_daftar_murid() to authenticated;
