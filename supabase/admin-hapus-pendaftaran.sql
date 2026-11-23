-- Hapus pendaftaran secara manual oleh admin, owner, after-sales, dan Deal Maker (PIC aktif).
-- Follow up ikut terhapus (cascade); case_admin dikosongkan (set null). Bukti transfer dihapus lewat Storage API dari admin.html.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi admin_hapus_pendaftaran_v2).

create or replace function public.admin_hapus_pendaftaran(p_id bigint)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me text := lower(coalesce(auth.jwt() ->> 'email', ''));
  r public.pendaftaran;
begin
  if not (public.dm_izin(me) or me = 'mahkota.to3@gmail.com') then
    raise exception 'Akses khusus admin dan Deal Maker';
  end if;
  select * into r from public.pendaftaran where id = p_id;
  if not found then raise exception 'Pendaftar tidak ditemukan'; end if;
  delete from public.pendaftaran where id = p_id;
  return json_build_object('id', p_id, 'nama', r.nama, 'bukti_path', r.bukti_path);
end $function$;

revoke all on function public.admin_hapus_pendaftaran(bigint) from public, anon;
grant execute on function public.admin_hapus_pendaftaran(bigint) to authenticated;

drop policy if exists bukti_hapus_admin on storage.objects;
create policy bukti_hapus_admin on storage.objects for delete to authenticated
  using (bucket_id = 'bukti-transfer' and (public.dm_izin(lower(coalesce(auth.jwt() ->> 'email', ''))) or lower(coalesce(auth.jwt() ->> 'email', '')) = 'mahkota.to3@gmail.com'));
