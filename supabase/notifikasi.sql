-- Notifikasi peserta. Jalankan sekali di Supabase → SQL Editor → New query → Run,
-- SETELAH supabase/schema.sql.

-- 1. Jenis kelamin peserta, untuk target notifikasi ('P' perempuan, 'L' laki-laki).
--    Peserta tidak punya policy UPDATE, jadi hanya admin yang mengisi kolom ini
--    (lewat Table Editor).
alter table public.peserta
  add column if not exists jenis_kelamin text
  check (jenis_kelamin in ('P', 'L'));

-- 2. Tabel notifikasi. Satu baris per penerima.
create table if not exists public.notifikasi (
  id          bigserial primary key,
  email       text not null,
  judul       text not null,
  isi         text not null default '',
  dibuat_at   timestamptz not null default now(),
  dibaca_at   timestamptz
);

alter table public.notifikasi enable row level security;

-- Peserta hanya bisa membaca notifikasinya sendiri.
create policy "notifikasi_baca_sendiri"
  on public.notifikasi for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Peserta hanya boleh mengubah kolom dibaca_at, dan hanya pada notifikasinya sendiri.
create policy "notifikasi_tandai_sendiri"
  on public.notifikasi for update to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

revoke update on public.notifikasi from authenticated;
grant update (dibaca_at) on public.notifikasi to authenticated;

-- Tidak ada policy INSERT dan DELETE untuk peserta.

-- 3. Jumlah belum dibaca dan daftar notifikasi terbaru (30 teratas).
create or replace function public.notifikasi_saya()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'belum_dibaca', (
      select count(*) from public.notifikasi
      where lower(email) = lower(auth.jwt() ->> 'email') and dibaca_at is null
    ),
    'daftar', coalesce((
      select json_agg(x) from (
        select id, judul, isi, dibuat_at, dibaca_at
        from public.notifikasi
        where lower(email) = lower(auth.jwt() ->> 'email')
        order by dibuat_at desc
        limit 30
      ) x
    ), '[]'::json)
  );
$$;

grant execute on function public.notifikasi_saya() to authenticated;

-- 4. Tandai semua notifikasi milik peserta sebagai sudah dibaca.
create or replace function public.tandai_notifikasi_dibaca()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update public.notifikasi
  set dibaca_at = now()
  where lower(email) = lower(auth.jwt() ->> 'email') and dibaca_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function public.tandai_notifikasi_dibaca() to authenticated;

-- 5. Kirim notifikasi. Hanya admin (dari SQL Editor), tidak bisa dipanggil peserta.
--    Target: 'semua', 'perempuan', atau 'laki-laki'.
--    Contoh: select kirim_notifikasi('Judul', 'Isi pesan', 'perempuan');
create or replace function public.kirim_notifikasi(
  p_judul text,
  p_isi text default '',
  p_target text default 'semua'
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if p_target not in ('semua', 'perempuan', 'laki-laki') then
    raise exception 'Target tidak dikenal: %', p_target;
  end if;

  insert into public.notifikasi (email, judul, isi)
  select p.email, p_judul, p_isi
  from public.peserta p
  where p_target = 'semua'
     or (p_target = 'perempuan' and p.jenis_kelamin = 'P')
     or (p_target = 'laki-laki' and p.jenis_kelamin = 'L');

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.kirim_notifikasi(text, text, text) from public, anon, authenticated;
