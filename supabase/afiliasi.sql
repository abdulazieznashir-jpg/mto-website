-- Program afiliasi. Jalankan sekali di Supabase: SQL Editor → New query → Run.

-- Satu baris per afiliator. Nomor rekening hanya bisa dibaca pemiliknya.
create table if not exists public.afiliasi (
  email           text primary key,
  kode            text not null unique,
  nama_rekening   text not null,
  bank            text not null,
  nomor_rekening  text not null,
  status          text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  created_at      timestamptz not null default now()
);

alter table public.afiliasi enable row level security;

create policy "afiliasi_baca_sendiri"
  on public.afiliasi for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Gabung afiliasi. Hanya peserta yang statusnya 'aktif' (pembayaran sudah diverifikasi).
create or replace function public.gabung_afiliasi(p_nama text, p_bank text, p_nomor text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_kode text;
  v_base text;
  v_ada public.afiliasi%rowtype;
begin
  if v_email is null then
    raise exception 'belum masuk';
  end if;

  if not exists (select 1 from public.peserta where lower(email) = v_email and status = 'aktif') then
    raise exception 'akun belum aktif';
  end if;

  select * into v_ada from public.afiliasi where lower(email) = v_email;
  if found then
    return json_build_object('kode', v_ada.kode, 'baru', false);
  end if;

  if length(trim(coalesce(p_nama, ''))) < 3
     or length(trim(coalesce(p_bank, ''))) < 2
     or coalesce(p_nomor, '') !~ '^[0-9]{5,20}$' then
    raise exception 'data rekening tidak valid';
  end if;

  -- Kode: 4 huruf pertama dari nama (huruf saja) + 3 angka acak, misalnya ABDU482.
  v_base := upper(left(rpad(regexp_replace(trim(p_nama), '[^A-Za-z]', '', 'g'), 4, 'X'), 4));

  loop
    v_kode := v_base || lpad(floor(random() * 1000)::int::text, 3, '0');
    exit when not exists (select 1 from public.afiliasi where kode = v_kode);
  end loop;

  insert into public.afiliasi (email, kode, nama_rekening, bank, nomor_rekening)
  values (v_email, v_kode, trim(p_nama), trim(p_bank), p_nomor);

  return json_build_object('kode', v_kode, 'baru', true);
end;
$$;

revoke all on function public.gabung_afiliasi(text, text, text) from public, anon;
grant execute on function public.gabung_afiliasi(text, text, text) to authenticated;
