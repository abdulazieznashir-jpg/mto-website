-- Mahkota peserta. Jalankan sekali di Supabase → SQL Editor → New query → Run,
-- SETELAH supabase/schema.sql.

-- Catatan Mahkota. Satu baris per kejadian.
create table if not exists public.mahkota (
  id          bigserial primary key,
  email       text not null,
  tanggal     date not null,
  kode        text not null,            -- 'login' untuk klaim harian; kode lain diisi admin
  label       text not null,
  jumlah      int  not null check (jumlah > 0),
  created_at  timestamptz not null default now(),
  unique (email, tanggal, kode)
);

alter table public.mahkota enable row level security;

-- Peserta hanya bisa membaca catatannya sendiri.
create policy "mahkota_baca_sendiri"
  on public.mahkota for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Tidak ada policy INSERT, UPDATE, atau DELETE untuk peserta.
-- Aktivitas (kode selain 'login') ditambahkan admin dari Table Editor.
-- Login harian hanya bisa diklaim lewat fungsi klaim_login_harian().

-- Klaim login harian: +1 Mahkota, sekali per hari (tanggal menurut Asia/Jakarta).
create or replace function public.klaim_login_harian()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  e    text := lower(auth.jwt() ->> 'email');
  hari date := (now() at time zone 'Asia/Jakarta')::date;
  n    int;
begin
  if e is null then raise exception 'Belum masuk'; end if;
  insert into public.mahkota (email, tanggal, kode, label, jumlah)
  values (e, hari, 'login', 'Login harian', 1)
  on conflict (email, tanggal, kode) do nothing;
  get diagnostics n = row_count;
  return json_build_object('baru', n = 1);
end;
$$;

-- Ringkasan untuk halaman profil: total, bulan ini, streak, peringkat, papan, dan riwayat.
create or replace function public.ringkasan_mahkota()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  e       text := lower(auth.jwt() ->> 'email');
  hari    date := (now() at time zone 'Asia/Jakarta')::date;
  total   int;
  bulan   int;
  sudah   boolean;
  streak  int := 0;
  cur     date;
  pos     int;
  jml     int;
  papan   json;
  riwayat json;
begin
  if e is null then raise exception 'Belum masuk'; end if;

  select coalesce(sum(jumlah), 0) into total
    from public.mahkota where lower(email) = e;

  select coalesce(sum(jumlah), 0) into bulan
    from public.mahkota
    where lower(email) = e and date_trunc('month', tanggal) = date_trunc('month', hari);

  sudah := exists (select 1 from public.mahkota
                   where lower(email) = e and tanggal = hari and kode = 'login');

  -- Streak: hitung mundur dari hari ini, atau dari kemarin bila hari ini belum diklaim.
  cur := case when sudah then hari else hari - 1 end;
  while exists (select 1 from public.mahkota
                where lower(email) = e and tanggal = cur and kode = 'login') loop
    streak := streak + 1;
    cur := cur - 1;
  end loop;

  -- Peringkat dan papan. Hanya inisial yang ditampilkan untuk peserta lain.
  with tot as (
    select lower(p.email) as em, coalesce(sum(m.jumlah), 0) as t
    from public.peserta p
    left join public.mahkota m on lower(m.email) = lower(p.email)
    group by lower(p.email)
  ),
  ranked as (
    select em, t, row_number() over (order by t desc, em) as p from tot
  )
  select (select p from ranked where em = e), (select count(*) from ranked)
  into pos, jml;

  with tot as (
    select lower(p.email) as em, coalesce(sum(m.jumlah), 0) as t
    from public.peserta p
    left join public.mahkota m on lower(m.email) = lower(p.email)
    group by lower(p.email)
  ),
  ranked as (
    select em, t, row_number() over (order by t desc, em) as p from tot
  )
  select coalesce(json_agg(x order by x.peringkat), '[]'::json)
  into papan
  from (
    select r.p as peringkat,
           coalesce(nullif(upper(left(split_part(pe.nama, ' ', 1), 1))
                         || upper(left(split_part(pe.nama, ' ', 2), 1)), ''), 'P') as inisial,
           r.t as total,
           (r.em = e) as saya
    from ranked r
    left join public.peserta pe on lower(pe.email) = r.em
    where r.p <= 10 or r.em = e
  ) x;

  select coalesce(json_agg(json_build_object(
           'tanggal', h.tanggal, 'label', h.label, 'jumlah', h.jumlah)
           order by h.tanggal desc, h.id desc), '[]'::json)
  into riwayat
  from (select * from public.mahkota where lower(email) = e
        order by tanggal desc, id desc limit 15) h;

  return json_build_object(
    'total', total,
    'bulan_ini', bulan,
    'sudah_login_hari_ini', sudah,
    'streak', streak,
    'peringkat', pos,
    'jumlah_peserta', jml,
    'papan', papan,
    'riwayat', riwayat
  );
end;
$$;

revoke all on function public.klaim_login_harian() from public, anon;
revoke all on function public.ringkasan_mahkota() from public, anon;
grant execute on function public.klaim_login_harian() to authenticated;
grant execute on function public.ringkasan_mahkota() to authenticated;

-- Foto profil: bucket privat. Setiap peserta hanya mengakses folder dengan id-nya sendiri.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatar_baca_sendiri" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_unggah_sendiri" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_ubah_sendiri" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Contoh admin menambah aktivitas bernilai 3 Mahkota (ganti email dan kode):
-- insert into public.mahkota (email, tanggal, kode, label, jumlah)
-- values ('peserta@contoh.com', (now() at time zone 'Asia/Jakarta')::date, 'setoran-1', 'Setoran hafalan', 3);
