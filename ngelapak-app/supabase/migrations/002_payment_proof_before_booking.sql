-- Booking baru wajib memiliki bukti pembayaran dan menyimpan tenggat 24 jam.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- Beri tenggat historis yang aman untuk baris lama agar mudah dibedakan.
UPDATE public.bookings
SET payment_deadline = created_at + INTERVAL '24 hours'
WHERE payment_deadline IS NULL;

CREATE OR REPLACE FUNCTION public.create_booking_with_payment(
  p_spot_kode TEXT,
  p_tanggal_mulai DATE,
  p_jumlah_hari INTEGER,
  p_total_bayar INTEGER,
  p_metode_pembayaran TEXT,
  p_jenis_usaha TEXT,
  p_nama_usaha TEXT,
  p_kategori_penjual TEXT,
  p_catatan TEXT,
  p_bukti_bayar TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_spot public.spots%ROWTYPE;
  v_booking_id TEXT;
  v_file_path TEXT := p_bukti_bayar;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk sebelum membuat pesanan.';
  END IF;
  IF v_file_path IS NOT NULL AND v_file_path NOT LIKE v_user_id::TEXT || '/%' THEN
    RAISE EXCEPTION 'Path bukti pembayaran harus berada di folder akun Anda.';
  END IF;
  SELECT * INTO v_spot FROM public.spots WHERE kode = p_spot_kode FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lapak tidak ditemukan.'; END IF;
  IF p_jumlah_hari < 1 OR p_jumlah_hari > 30 THEN RAISE EXCEPTION 'Durasi sewa tidak valid.'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.spot_id = v_spot.id
      AND b.status <> 'dibatalkan'
      AND b.status_verifikasi <> 'ditolak'
      AND tstzrange(b.tanggal_mulai::timestamptz, (b.tanggal_selesai + 1)::timestamptz, '[)')
          && tstzrange(p_tanggal_mulai::timestamptz, (p_tanggal_mulai + p_jumlah_hari)::timestamptz, '[)')
  ) THEN RAISE EXCEPTION 'Tanggal tersebut baru saja dipesan pengguna lain.'; END IF;
  v_booking_id := public.generate_booking_id();
  INSERT INTO public.bookings (
    id, owner_id, spot_id, spot_nama, spot_kode, penyewa_nama, penyewa_email,
    tanggal_mulai, tanggal_selesai, total_bayar, metode_pembayaran,
    bukti_bayar, payment_deadline, status, status_verifikasi, jenis_usaha, catatan
  )
  SELECT v_booking_id, v_user_id, v_spot.id, v_spot.nama, v_spot.kode,
    COALESCE(p.nama, ''), COALESCE(p.email, ''), p_tanggal_mulai,
    p_tanggal_mulai + p_jumlah_hari - 1, p_total_bayar, p_metode_pembayaran,
    v_file_path, NOW() + INTERVAL '24 hours', 'menunggu', 'menunggu', p_jenis_usaha, p_catatan
  FROM public.profiles p WHERE p.id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil pengguna tidak ditemukan.'; END IF;
  RETURN v_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_with_payment(TEXT, DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_with_payment(TEXT, DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Batas ukuran file 6 MB dan tipe dokumen yang diterima.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 6291456, ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 6291456,
  allowed_mime_types = ARRAY['image/jpeg','image/png','application/pdf'];

DROP POLICY IF EXISTS "payment_proofs_insert_own" ON storage.objects;
CREATE POLICY "payment_proofs_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "payment_proofs_read_own" ON storage.objects;
CREATE POLICY "payment_proofs_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Expire unpaid pending bookings. Supabase projects must have pg_cron available.
CREATE OR REPLACE FUNCTION public.cancel_expired_unpaid_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.bookings
  SET status = 'dibatalkan'
  WHERE status = 'menunggu'
    AND status_verifikasi = 'menunggu'
    AND bukti_bayar IS NULL
    AND payment_deadline <= NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cancel-expired-unpaid-bookings';
SELECT cron.schedule('cancel-expired-unpaid-bookings', '*/5 * * * *',
  'SELECT public.cancel_expired_unpaid_bookings()');
