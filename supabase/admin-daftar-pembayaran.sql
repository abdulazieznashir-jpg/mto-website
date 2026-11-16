-- Daftar pembayaran untuk admin (baca saja). Hanya owner.
create or replace function public.admin_daftar_pembayaran()
returns table(id bigint, email text, nama text, kelas text, gelombang text, total bigint, batas_bayar timestamptz, bukti_at timestamptz, bukti_nama text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'mahkota.to3@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar pembayaran';
  end if;
  return query
  select p.id, p.email, p.nama, p.kelas, p.gelombang, p.total, p.batas_bayar, p.bukti_at, p.bukti_nama
  from pendaftaran p
  where p.status = 'diterima'
  order by (p.bukti_at is null), p.nama;
end;
$function$;
revoke all on function public.admin_daftar_pembayaran() from public;
revoke all on function public.admin_daftar_pembayaran() from anon;
grant execute on function public.admin_daftar_pembayaran() to authenticated;
