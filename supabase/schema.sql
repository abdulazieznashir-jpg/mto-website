-- Jalankan sekali di Supabase: SQL Editor → New query → Run.

-- Tabel peserta. Satu baris per email.
create table if not exists public.peserta (
  email       text primary key,
  nama        text not null default '',
  status      text not null default 'terdaftar'
              check (status in ('terdaftar', 'menunggu', 'aktif')),
  created_at  timestamptz not null default now()
);

alter table public.peserta enable row level security;

-- Peserta hanya bisa membaca baris miliknya sendiri.
create policy "peserta_baca_sendiri"
  on public.peserta for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Peserta hanya bisa mendaftarkan emailnya sendiri, dengan status awal 'terdaftar'.
create policy "peserta_daftar_sendiri"
  on public.peserta for insert to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email') and status = 'terdaftar');

-- Tidak ada policy UPDATE atau DELETE untuk peserta.
-- Status 'menunggu' dan 'aktif' hanya diubah oleh admin dari dashboard Supabase (Table Editor).
