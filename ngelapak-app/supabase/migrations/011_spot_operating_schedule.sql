-- Jadwal operasional publik dari booking yang sudah berhasil bayar / tervalidasi.

begin;

create or replace function public.get_spot_operating_schedule(p_spot_id uuid)
returns table (
  booking_id text,
  penjual text,
  kategori text,
  tanggal_mulai date,
  tanggal_selesai date
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id,
    coalesce(nullif(b.nama_usaha, ''), 'Penyewa terkonfirmasi'),
    coalesce(nullif(b.kategori_penjual, ''), 'UMKM Umum'),
    b.tanggal_mulai,
    b.tanggal_selesai
  from public.bookings b
  where b.spot_id = p_spot_id
    and b.status_verifikasi = 'disetujui'
    and b.status in ('aktif', 'selesai')
    and b.tanggal_selesai + 3 >= (now() at time zone 'Asia/Makassar')::date
  order by b.tanggal_mulai;
$$;

revoke execute on function public.get_spot_operating_schedule(uuid) from public;
grant execute on function public.get_spot_operating_schedule(uuid) to anon, authenticated;

commit;
