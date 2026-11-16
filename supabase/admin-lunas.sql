-- B3: kolom penanda lunas dan fungsi admin (owner-only). Kolom baru nullable; data lama tidak diubah.
alter table public.pendaftaran add column if not exists lunas_at timestamptz;

create or replace function public.admin_daftar_lunas()
returns table(id bigint, email text, nama text, kelas text, gelombang text, total bigint, batas_bayar timestamptz, bukti_at timestamptz, lunas_at timestamptz)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'mahkota.to3@gmail.com' then
    raise exception 'Hanya admin yang boleh membuka daftar lunas';
  end if;
  return query
  select p.id, p.email, p.nama, p.kelas, p.gelombang, p.total, p.batas_bayar, p.bukti_at, p.lunas_at
  from pendaftaran p where p.status = 'diterima'
  order by (p.lunas_at is null), p.nama;
end;
$function$;

create or replace function public.admin_konfirmasi_lunas(p_id bigint)
returns void
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'mahkota.to3@gmail.com' then
    raise exception 'Hanya admin yang boleh mengonfirmasi pembayaran';
  end if;
  update pendaftaran set lunas_at = now()
  where id = p_id and status = 'diterima' and lunas_at is null;
  if not found then
    raise exception 'Pendaftar tidak ditemukan atau sudah lunas';
  end if;
end;
$function$;

revoke all on function public.admin_daftar_lunas() from public, anon;
grant execute on function public.admin_daftar_lunas() to authenticated;
revoke all on function public.admin_konfirmasi_lunas(bigint) from public, anon;
grant execute on function public.admin_konfirmasi_lunas(bigint) to authenticated;
