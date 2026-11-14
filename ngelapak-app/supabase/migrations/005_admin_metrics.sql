begin;

create function public.get_admin_rental_metrics()
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
      select distinct on (p.booking_id) p.booking_id, coalesce(p.nominal, b.total_bayar, 0) amount,
        (b.verified_at at time zone 'Asia/Makassar')::date verified_date
      from public.payments p join public.bookings b on b.id = p.booking_id
      where p.status = 'lunas' and b.status_verifikasi = 'disetujui'
      order by p.booking_id, p.created_at desc, p.id desc
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
