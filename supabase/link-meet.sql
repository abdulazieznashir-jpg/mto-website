-- Link Google Meet per murid, diisi admin atau pengajar yang menangani murid tersebut.
alter table public.penugasan add column if not exists link_meet text;

create or replace function public.atur_link_meet(p_peserta_email text, p_link text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  e text := lower(coalesce(auth.jwt() ->> 'email', ''));
  pe text := lower(trim(coalesce(p_peserta_email, '')));
  l text := nullif(trim(coalesce(p_link, '')), '');
begin
  if e not in ('abdulaziez.nashir@gmail.com', 'abdulaziez.nashir@gmail.com')
     and not exists (
       select 1 from public.penugasan t
       join public.pengajar g on lower(g.email) = lower(t.pengajar_email)
       where lower(t.peserta_email) = pe and lower(t.pengajar_email) = e and g.aktif
     ) then
    raise exception 'Anda tidak berhak mengatur link Google Meet murid ini';
  end if;
  if l is not null and l !~* '^https://meet\.google\.com/[a-z0-9-]+' then
    raise exception 'Link harus berupa tautan Google Meet, contoh: https://meet.google.com/abc-defg-hij';
  end if;
  update public.penugasan set link_meet = l where lower(peserta_email) = pe;
  if not found then
    raise exception 'Murid ini belum memiliki penugasan pengajar';
  end if;
end
$fn$;

revoke all on function public.atur_link_meet(text, text) from public, anon;
grant execute on function public.atur_link_meet(text, text) to authenticated;
