-- Pengumuman / promo ke murid, khusus admin. Jalankan sekali di Supabase → SQL Editor.
-- Fungsi kirim_notifikasi tetap tertutup untuk semua orang; admin lewat fungsi ini.

create or replace function public.admin_kirim_pengumuman(p_judul text, p_isi text, p_target text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  judul text := trim(coalesce(p_judul, ''));
  isi text := trim(coalesce(p_isi, ''));
  n int;
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'abdulaziez.nashir@gmail.com' then
    raise exception 'Akses khusus admin';
  end if;
  if judul = '' or length(judul) > 80 then raise exception 'Judul wajib diisi (maksimal 80 karakter)'; end if;
  if isi = '' or length(isi) > 500 then raise exception 'Isi wajib diisi (maksimal 500 karakter)'; end if;
  n := public.kirim_notifikasi(judul, isi, p_target);
  return n;
end;
$$;

revoke all on function public.admin_kirim_pengumuman(text, text, text) from public, anon;
grant execute on function public.admin_kirim_pengumuman(text, text, text) to authenticated;
