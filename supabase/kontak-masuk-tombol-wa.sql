-- Tombol WhatsApp di panel tanya (pojok kanan bawah): peserta memilih pertanyaan, mengisi nama dan nomor,
-- data masuk ke antrean Follow Up (sumber "kontak"), lalu tombol WhatsApp mengarah ke PIC yang ditugaskan.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic dalam tiga migrasi:
--   kontak_masuk_tombol_wa  : tabel kontak_masuk, rotasi PIC lintas pendaftaran dan kontak,
--                             daftar_kontak (anon), admin_hapus_kontak
--   dm_daftar_lead_kontak   : dm_daftar_lead menyertakan kontak_masuk sebagai sumber "kontak"
-- Definisi lengkap ada di database; file ini mencatat tabel dan fungsi utamanya.

create table if not exists public.kontak_masuk (
  id bigserial primary key,
  nama text not null,
  wa text not null,
  program text,
  kelas text,
  durasi int,
  dealmaker_email text,
  dibuat_at timestamptz not null default now()
);
alter table public.kontak_masuk enable row level security;
revoke all on public.kontak_masuk from anon, authenticated;

create or replace function public.daftar_kontak(p_nama text, p_wa text, p_program text, p_kelas text, p_durasi int)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare
  w text := regexp_replace(coalesce(p_wa, ''), '\D', '', 'g');
  n text := trim(coalesce(p_nama, ''));
  baru public.kontak_masuk;
  pic record;
begin
  if char_length(n) < 2 or char_length(n) > 100 then raise exception 'Nama wajib diisi'; end if;
  if char_length(w) < 9 or char_length(w) > 15 then raise exception 'Nomor WhatsApp belum valid'; end if;
  insert into public.kontak_masuk (nama, wa, program, kelas, durasi)
  values (n, w, left(coalesce(p_program, ''), 60), left(coalesce(p_kelas, ''), 30), p_durasi)
  returning * into baru;
  select nama, wa into pic from public.deal_maker_pic where lower(email) = lower(baru.dealmaker_email) and aktif;
  return json_build_object('id', baru.id, 'wa_admin', coalesce(pic.wa, '6285727533000'), 'pic_nama', pic.nama);
end $$;
grant execute on function public.daftar_kontak(text, text, text, text, int) to anon, authenticated;

create or replace function public.admin_hapus_kontak(p_id bigint)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare me text := lower(coalesce(auth.jwt() ->> 'email', '')); r public.kontak_masuk;
begin
  if not (public.dm_izin(me) or me = 'mahkota.to3@gmail.com') then
    raise exception 'Akses khusus admin dan Deal Maker';
  end if;
  select * into r from public.kontak_masuk where id = p_id;
  if not found then raise exception 'Kontak tidak ditemukan'; end if;
  delete from public.kontak_masuk where id = p_id;
  return json_build_object('id', p_id, 'nama', r.nama);
end $$;
revoke all on function public.admin_hapus_kontak(bigint) from public, anon;
grant execute on function public.admin_hapus_kontak(bigint) to authenticated;
