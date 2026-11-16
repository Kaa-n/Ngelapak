
-- =========================================================
-- NGELAPAK: PUBLIC HOME RPC
-- Tujuan:
-- 1. Menghitung transaksi lunas bulan berjalan.
-- 2. Mengambil jadwal operasional publik.
--
-- Tidak mengubah tabel atau menghapus data.
-- Tidak menonaktifkan RLS.
-- =========================================================


-- =========================================================
-- FUNCTION 1: PUBLIC HOME STATISTICS
-- Mengembalikan jumlah pembayaran lunas bulan berjalan.
-- Menggunakan zona waktu Bali (Asia/Makassar).
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_public_home_stats()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH bounds AS (
    SELECT
      date_trunc(
        'month',
        now() AT TIME ZONE 'Asia/Makassar'
      ) AT TIME ZONE 'Asia/Makassar' AS month_start,

      (
        date_trunc(
          'month',
          now() AT TIME ZONE 'Asia/Makassar'
        ) + interval '1 month'
      ) AT TIME ZONE 'Asia/Makassar' AS next_month_start
  )

  SELECT COUNT(*)::bigint
  FROM public.payments AS p
  CROSS JOIN bounds
  WHERE p.status = 'lunas'
    AND p.created_at >= bounds.month_start
    AND p.created_at < bounds.next_month_start;
$function$;


-- =========================================================
-- FUNCTION 2: PUBLIC OPERATIONAL SCHEDULE
-- Hanya mengembalikan data yang dibutuhkan halaman publik.
-- Tidak mengembalikan NIM, email, telepon, atau bukti bayar.
-- Rentang tanggal maksimal 90 hari ke depan.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_public_operational_schedule(
  p_start date,
  p_end date
)
RETURNS TABLE (
  booking_id text,
  spot_id uuid,
  nama_usaha text,
  jenis_usaha text,
  tanggal_mulai date,
  tanggal_selesai date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    b.id,
    b.spot_id,
    b.nama_usaha,
    b.jenis_usaha,
    b.tanggal_mulai,
    b.tanggal_selesai

  FROM public.bookings AS b

  WHERE
    -- Validasi tanggal
    p_start IS NOT NULL
    AND p_end IS NOT NULL
    AND p_end >= p_start

    -- Batas rentang tanggal publik
    AND p_start >= (
      (now() AT TIME ZONE 'Asia/Makassar')::date - 1
    )
    AND p_end <= (
      (now() AT TIME ZONE 'Asia/Makassar')::date + 90
    )

    -- Hanya booking yang aktif dan disetujui
    AND b.status = 'aktif'
    AND b.status_verifikasi = 'disetujui'

    -- Hanya jadwal yang beririsan dengan periode
    AND b.tanggal_selesai >= p_start
    AND b.tanggal_mulai <= p_end

  ORDER BY b.tanggal_mulai;
$function$;


-- =========================================================
-- FUNCTION PERMISSIONS
-- Batasi akses fungsi hanya untuk pengunjung dan pengguna login.
-- =========================================================

REVOKE ALL ON FUNCTION
  public.get_public_home_stats()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.get_public_home_stats()
TO anon, authenticated;


REVOKE ALL ON FUNCTION
  public.get_public_operational_schedule(date, date)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.get_public_operational_schedule(date, date)
TO anon, authenticated;