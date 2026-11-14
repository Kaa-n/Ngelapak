begin;

create function public.get_unavailable_lapak_ids(p_start date, p_end date)
returns table (spot_id uuid)
language sql stable security definer set search_path = ''
as $$
  select distinct b.spot_id from public.bookings b
  where p_start <= p_end and p_end - p_start < 30
    and b.spot_id is not null and b.status <> 'dibatalkan'
    and b.tanggal_mulai <= p_end and b.tanggal_selesai >= p_start;
$$;

revoke execute on function public.get_unavailable_lapak_ids(date,date) from public;
grant execute on function public.get_unavailable_lapak_ids(date,date) to anon, authenticated;

commit;
