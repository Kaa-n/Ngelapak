-- Expose only the product caption belonging to the public operating booking.
-- The owner UUID remains private; the home page needs only the rendered text.
create or replace function public.get_public_operational_schedule(
  p_start date,
  p_end date
)
returns table (
  booking_id text,
  spot_id uuid,
  nama_usaha text,
  jenis_usaha text,
  tanggal_mulai date,
  tanggal_selesai date,
  product_caption text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id,
    b.spot_id,
    b.nama_usaha,
    b.jenis_usaha,
    b.tanggal_mulai,
    b.tanggal_selesai,
    c.konten
  from public.bookings as b
  left join public.product_captions as c
    on c.spot_id = b.spot_id and c.owner_id = b.owner_id
  where p_start is not null
    and p_end is not null
    and p_end >= p_start
    and p_start >= ((now() at time zone 'Asia/Makassar')::date - 1)
    and p_end <= ((now() at time zone 'Asia/Makassar')::date + 90)
    and b.status = 'aktif'
    and b.status_verifikasi = 'disetujui'
    and b.tanggal_selesai >= p_start
    and b.tanggal_mulai <= p_end
  order by b.tanggal_mulai;
$$;

revoke all on function public.get_public_operational_schedule(date, date) from public;
grant execute on function public.get_public_operational_schedule(date, date) to anon, authenticated;
