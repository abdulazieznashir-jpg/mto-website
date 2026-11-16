-- Ringkasan angka untuk dashboard admin (langkah 6). Hanya admin.
-- "Menunggu" = belum ada diputuskan_at (permintaan belum direspons).
create or replace function public.admin_ringkasan()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'mahkota.to3@gmail.com' then
    raise exception 'Akses khusus admin';
  end if;
  return json_build_object(
    'murid_diterima', (select count(*) from pendaftaran where status = 'diterima'),
    'belum_gelombang', (select count(*) from pendaftaran where status = 'diterima' and gelombang is null),
    'permintaan_keluar', (select count(*) from permintaan_keluar where diputuskan_at is null),
    'permintaan_ganti', (select count(*) from permintaan_ganti where diputuskan_at is null),
    'usulan_jadwal', (select count(*) from usulan_jadwal where diputuskan_at is null)
  );
end;
$$;

revoke all on function public.admin_ringkasan() from public, anon;
grant execute on function public.admin_ringkasan() to authenticated;
