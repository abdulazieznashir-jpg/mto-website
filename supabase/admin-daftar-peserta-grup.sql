-- Daftar peserta yang menunggu pengajar, diurutkan dari yang paling lama masuk grup.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi peserta_grup_urut_masuk).
-- Kolom masuk_grup_at ditambahkan agar admin bisa mengurutkan berdasarkan waktu masuk grup.

drop function if exists public.admin_daftar_peserta_grup();

create function public.admin_daftar_peserta_grup()
returns table(id bigint, email text, nama text, kelas text, jenis_kelamin text, durasi integer, link_grup text, hari_diminta text, jam_diminta text, masuk_grup_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') not in ('abdulaziez.nashir@gmail.com', 'mahkota.to3@gmail.com') then
    raise exception 'Hanya admin yang boleh membuka daftar peserta';
  end if;
  return query
  select d.id, d.email, d.nama, d.kelas, d.jenis_kelamin, d.durasi, d.link_grup,
         d.hari_diminta::text, d.jam_diminta::text, d.masuk_grup_at
    from pendaftaran d
   where d.status = 'diterima'
     and d.email is not null
     and d.masuk_grup_at is not null
     and coalesce(trim(d.pengampu_nama), '') = ''
   order by d.masuk_grup_at asc nulls last, d.nama;
end;
$function$;

revoke all on function public.admin_daftar_peserta_grup() from public, anon;
grant execute on function public.admin_daftar_peserta_grup() to authenticated;
