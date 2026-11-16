-- Tambahan kolom grup admin pada pendaftaran_admin (admin saja)
create or replace function public.pendaftaran_admin()
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if lower(coalesce(auth.jwt() ->> 'email','')) not in ('abdulaziez.nashir@gmail.com') then raise exception 'Akses khusus admin'; end if;
  return (select coalesce(json_agg(x order by x.dibuat_at desc), '[]'::json) from (
    select id, nama, email, wa, jenis_kelamin, tanggal_lahir, kota, kelas, durasi, peserta, total, ringkasan, hari_diminta, jam_diminta, gelombang, dibuat_at, bukti_at, bukti_path, bukti_nama, diterima_at, tanggal_halaqah, link_grup, batas_bayar,
      pengampu_nama, tipe_pendaftar, periode_label, program, opsi_waktu, sumber,
      case when status = 'menunggu_bayar' and now() > batas_bayar then 'kedaluwarsa' else status end as status
    from public.pendaftaran) x);
end $function$;
