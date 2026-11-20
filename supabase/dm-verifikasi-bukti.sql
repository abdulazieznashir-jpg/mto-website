-- Deal Maker (PIC) menandai bukti transfer valid untuk pendaftar yang ditugaskan kepadanya.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi dm_verifikasi_bukti).

create or replace function public.dm_verifikasi_bukti(p_id bigint)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare
  me text := lower(coalesce(auth.jwt() ->> 'email', ''));
  r public.pendaftaran;
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
  update public.pendaftaran set status = 'diterima', diterima_at = now() where id = p_id;
  insert into public.notifikasi (email, judul, isi) values
    ('mahkota.to3@gmail.com', 'Bukti transfer diverifikasi',
     r.nama || ' · ' || coalesce(r.kelas, '-') || ' · diverifikasi oleh ' || me || ', siap dikonfirmasi lunas');
  return json_build_object('id', p_id, 'status', 'diterima');
end $$;

revoke all on function public.dm_verifikasi_bukti(bigint) from public, anon;
grant execute on function public.dm_verifikasi_bukti(bigint) to authenticated;
