begin;

-- Pendapatan dasbor dari bookings terverifikasi (Midtrans + legacy),
-- bukan hanya baris payments yang berstatus lunas.
create or replace function public.get_admin_rental_metrics()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  today_wita date := (now() at time zone 'Asia/Makassar')::date;
  this_week date := date_trunc('week', today_wita::timestamp)::date;
begin
  if not public.is_admin() then
    raise exception 'Akses admin diperlukan.' using errcode = '42501';
  end if;

  return (
    with paid as (
      select b.id as booking_id,
        coalesce(b.total_bayar, 0) as amount,
        (b.verified_at at time zone 'Asia/Makassar')::date as verified_date
      from public.bookings b
      where b.status_verifikasi = 'disetujui'
        and b.verified_at is not null
    ),
    occupancy as (
      select s.zona, count(*) as capacity, count(*) filter (
        where exists (
          select 1 from public.bookings b where b.spot_id = s.id
            and b.status = 'aktif' and b.status_verifikasi = 'disetujui'
            and today_wita between b.tanggal_mulai and b.tanggal_selesai
        )
      ) as occupied
      from public.spots s where s.status <> 'pemeliharaan' group by s.zona
    ),
    weeks as (
      select this_week - (n * 7) as week_start from generate_series(0, 7) n
    ),
    trend as (
      select w.week_start, coalesce(sum(p.amount), 0) as amount
        from weeks w left join paid p
          on p.verified_date >= w.week_start and p.verified_date < w.week_start + 7
        group by w.week_start
    )
    select jsonb_build_object(
      'today', today_wita,
      'total_revenue', (select coalesce(sum(amount), 0) from paid),
      'occupancy', (select coalesce(jsonb_agg(to_jsonb(o) order by o.zona), '[]'::jsonb) from occupancy o),
      'trend', (select jsonb_agg(to_jsonb(t) order by t.week_start) from trend t)
    )
  );
end;
$$;

revoke execute on function public.get_admin_rental_metrics() from public, anon;
grant execute on function public.get_admin_rental_metrics() to authenticated;

commit;
