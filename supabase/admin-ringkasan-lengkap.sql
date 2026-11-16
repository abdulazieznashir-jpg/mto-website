-- Ringkasan lengkap untuk dashboard admin baru (read-only).
-- Hanya Owner (mahkota.to3@gmail.com) yang boleh memanggil.

create or replace function public.admin_ringkasan_lengkap()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  hasil json;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'mahkota.to3@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka ringkasan';
  end if;

  select json_build_object(
    'murid_diterima', (select count(*) from pendaftaran where status = 'diterima'),
    'murid_tanpa_gelombang', (select count(*) from pendaftaran where status = 'diterima' and gelombang is null),
    'murid_jeda', (select count(*) from pendaftaran where status = 'diterima' and jeda_sejak is not null),
    'permintaan_keluar', (select count(*) from permintaan_keluar where diputuskan_at is null),
    'permintaan_ganti', (select count(*) from permintaan_ganti where diputuskan_at is null),
    'usulan_jadwal', (select count(*) from usulan_jadwal where diputuskan_at is null),
    'pengajar_aktif', (select count(*) from pengajar where aktif = true)
  ) into hasil;

  return hasil;
end;
$$;

revoke all on function public.admin_ringkasan_lengkap() from public;
revoke all on function public.admin_ringkasan_lengkap() from anon;
grant execute on function public.admin_ringkasan_lengkap() to authenticated;
