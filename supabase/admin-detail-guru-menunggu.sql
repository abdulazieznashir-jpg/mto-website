-- Detail halaqoh: murid yang belum punya penugasan (menunggu jadwal) ikut tampil di tab Jadwal,
-- lengkap dengan hari dan jam yang diminta saat pendaftaran.

create or replace function public.admin_detail_guru(p_email text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare g record; res json;
begin
  if coalesce(auth.jwt() ->> 'email', '') not in ('abdulaziez.nashir@gmail.com', 'mahkota.to3@gmail.com') then
    raise exception 'Hanya admin yang boleh membuka detail guru';
  end if;
  select * into g from public.pengajar where lower(email) = lower(p_email);
  if not found then return null; end if;

  select json_build_object(
    'email', g.email,
    'nama', g.nama,
    'jenis_kelamin', g.jenis_kelamin,
    'slot_sen_jum', (select count(distinct j.jam) from public.jadwal_kosong j
        where lower(j.pengajar_email) = lower(g.email) and j.hari between 1 and 5
          and not exists (select 1 from public.penugasan t where lower(t.pengajar_email) = lower(g.email)
              and t.hari = j.hari and public.menit_dari(t.jam) <= public.menit_dari(j.jam)
              and public.menit_dari(j.jam) < public.menit_dari(t.jam) + t.menit)),
    'blok', (select coalesce(json_agg(b order by b.jam), '[]'::json) from (
        select distinct on (t.peserta_email) t.peserta_email as email,
               to_char(t.jam, 'HH24:MI') as jam, t.menit,
               (case when bool_or(t.hari between 1 and 5) over (partition by t.peserta_email) then 'weekday' else 'weekend' end) as blok,
               d.nama, d.kelas
          from public.penugasan t
          left join public.pendaftaran d on d.email = t.peserta_email
         where lower(t.pengajar_email) = lower(g.email)
         order by t.peserta_email, t.jam
    ) b),
    'murid', (select coalesce(json_agg(m order by m.menunggu desc, m.nama), '[]'::json) from (
        select d.id, d.nama, d.kelas, d.durasi, d.jenis_kelamin, d.wa,
               (d.jeda_sejak is not null) as jeda,
               d.jeda_sejak,
               (select to_char(min(t.jam), 'HH24:MI') from public.penugasan t where t.peserta_email = d.email) as jam,
               (select case when bool_or(t.hari between 1 and 5) then 'weekday' when count(*) > 0 then 'weekend' end
                  from public.penugasan t where t.peserta_email = d.email) as blok,
               not exists (select 1 from public.penugasan t where t.peserta_email = d.email) as menunggu,
               d.hari_diminta::text as hari_diminta,
               to_char(d.jam_diminta, 'HH24:MI') as jam_diminta,
               case when d.tanggal_halaqah is not null or d.masuk_grup_at is not null or d.lunas_at is not null
                    then (coalesce(d.tanggal_halaqah::timestamptz, d.masuk_grup_at, d.lunas_at)::date + (d.durasi || ' months')::interval)::date - current_date
               end as sisa_hari
          from public.pendaftaran d
         where d.status = 'diterima'
           and lower(trim(regexp_replace(coalesce(d.pengampu_nama, ''), '^\s*ustadzah?\s+', '', 'i'))) = lower(trim(regexp_replace(coalesce(g.nama, ''), '^\s*ustadzah?\s+', '', 'i')))
    ) m)
  ) into res;
  return res;
end;
$function$;

revoke all on function public.admin_detail_guru(text) from public, anon;
grant execute on function public.admin_detail_guru(text) to authenticated;
