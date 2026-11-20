-- Papan skor: username dan avatar peserta tampil di papan skor dan di ringkasan profil.
-- Sudah berlaku di database (bvltmjurkgnzmwtgdaic). File ini menyamakan repo dengan database.

create or replace function public.atur_profil_papan(p_username text, p_avatar text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  e text := lower(auth.jwt() ->> 'email');
  u text := lower(nullif(trim(p_username), ''));
begin
  if e is null then raise exception 'Belum masuk'; end if;
  if not exists (select 1 from public.peserta where lower(email) = e) then
    raise exception 'Akun belum terdaftar sebagai peserta';
  end if;
  if p_avatar is not null and p_avatar not in
     ('bintang','hati','bulan','api','lampu','buku','pena','target','mahkota','kompas') then
    raise exception 'Avatar tidak dikenal';
  end if;
  if u is not null and u !~ '^[a-z0-9_.]{3,20}$' then
    raise exception 'Username 3-20 karakter: huruf kecil, angka, titik, atau garis bawah';
  end if;

  begin
    update public.peserta
       set username   = coalesce(u, username),
           avatar_key = coalesce(p_avatar, avatar_key)
     where lower(email) = e;
  exception when unique_violation then
    raise exception 'Username sudah dipakai, coba yang lain';
  end;

  return (select json_build_object('username', username, 'avatar_key', avatar_key)
            from public.peserta where lower(email) = e);
end;
$function$;

create or replace function public.ringkasan_mahkota()
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
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
  uname   text;
  akey    text;
begin
  if e is null then raise exception 'Belum masuk'; end if;

  select coalesce(sum(jumlah), 0) into total
    from public.mahkota where lower(email) = e;

  select coalesce(sum(jumlah), 0) into bulan
    from public.mahkota
    where lower(email) = e and date_trunc('month', tanggal) = date_trunc('month', hari);

  sudah := exists (select 1 from public.mahkota
                   where lower(email) = e and tanggal = hari and kode = 'login');

  cur := case when sudah then hari else hari - 1 end;
  while exists (select 1 from public.mahkota
                where lower(email) = e and tanggal = cur and kode = 'login') loop
    streak := streak + 1;
    cur := cur - 1;
  end loop;

  select username, avatar_key into uname, akey
    from public.peserta where lower(email) = e;

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
           pe.username,
           pe.avatar_key as avatar,
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
    'username', uname,
    'avatar_key', akey,
    'papan', papan,
    'riwayat', riwayat
  );
end;
$function$;

revoke all on function public.atur_profil_papan(text, text) from public, anon;
grant execute on function public.atur_profil_papan(text, text) to authenticated;
revoke all on function public.ringkasan_mahkota() from public, anon;
grant execute on function public.ringkasan_mahkota() to authenticated;
