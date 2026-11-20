-- Pratinjau bukti transfer di Beranda Deal Maker: PIC boleh membaca bukti pendaftar yang ditugaskan kepadanya.
-- Sudah diterapkan ke project bvltmjurkgnzmwtgdaic (migrasi bukti_preview_pic).

create policy "bukti_baca_pic" on storage.objects for select to authenticated
  using (
    bucket_id = 'bukti-transfer'
    and exists (
      select 1 from public.pendaftaran p
      where p.bukti_path = storage.objects.name
        and lower(coalesce(p.dealmaker_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create or replace function public.dm_bukti_path(p_id bigint)
returns text language plpgsql stable security definer set search_path to 'public'
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
  return r.bukti_path;
end $$;

revoke all on function public.dm_bukti_path(bigint) from public, anon;
grant execute on function public.dm_bukti_path(bigint) to authenticated;
