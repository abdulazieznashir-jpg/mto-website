-- Dm_verifikasi_bukti: jika email sudah punya pendaftaran terkonfirmasi, tampilkan pesan yang jelas
-- (sebelumnya muncul error unik mentah pendaftaran_satu_diterima_per_email).
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi dm_verifikasi_pesan_email_ganda).
-- Definisi lengkap fungsi (versi yang berlaku):
create or replace function public.dm_verifikasi_bukti(p_id bigint)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me text := lower(coalesce(auth.jwt() ->> 'email', ''));
  r public.pendaftaran;
  lain public.pendaftaran;
begin
  if not public.dm_izin(me) and me <> 'mahkota.to3@gmail.com' then
    raise exception 'Akses khusus Deal Maker dan Owner';
  end if;
  select * into r from public.pendaftaran where id = p_id;
  if not found then raise exception 'Pendaftar tidak ditemukan'; end if;
  if me not in ('abdulaziez.nashir@gmail.com', 'mahkota.to3@gmail.com')
     and lower(coalesce(r.dealmaker_email, '')) <> me then
    raise exception 'Pendaftar ini bukan lead Anda';
  end if;
  if r.status <> 'menunggu_verifikasi' then
    raise exception 'Bukti transfer tidak sedang menunggu verifikasi';
  end if;
  select * into lain from public.pendaftaran
    where lower(email) = lower(r.email) and status = 'diterima' and id <> p_id
    order by id limit 1;
  if found then
    raise exception 'Email % sudah punya pendaftaran yang terkonfirmasi (ID %). Satu email hanya boleh satu pendaftaran terkonfirmasi.', r.email, lain.id;
  end if;
  update public.pendaftaran set status = 'diterima', diterima_at = now() where id = p_id;
  insert into public.notifikasi (email, judul, isi) values
    ('mahkota.to3@gmail.com', 'Bukti transfer diverifikasi',
     r.nama || ' · ' || coalesce(r.kelas, '-') || ' · diverifikasi oleh ' || me || ', siap dikonfirmasi lunas');
  return json_build_object('id', p_id, 'status', 'diterima');
end $function$;
