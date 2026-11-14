

-- =============================================================================
-- EKSTENSI POSTGRESQL
-- =============================================================================

-- Mengaktifkan ekstensi untuk pembuatan UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mengaktifkan ekstensi kriptografi (gen_random_bytes, gen_random_uuid, dll.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Mengaktifkan ekstensi untuk constraint EXCLUDE (mencegah booking tumpang tindih)
CREATE EXTENSION IF NOT EXISTS "btree_gist";


-- =============================================================================
-- TABEL: profiles
-- Menyimpan data profil pengguna yang terhubung dengan auth.users Supabase
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid not null,
  nama text not null,
  email text not null,
  role text not null default 'penyewa'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_role_check check (
    (
      role = any (array['admin'::text, 'penyewa'::text])
    )
  )
) tablespace pg_default;

-- Komentar tabel dan kolom
COMMENT ON TABLE  public.profiles                   IS 'Profil pengguna aplikasi Ngelapak (penyewa dan admin)';
COMMENT ON COLUMN public.profiles.id                IS 'UUID dari auth.users Supabase';
COMMENT ON COLUMN public.profiles.nama              IS 'Nama lengkap pengguna';
COMMENT ON COLUMN public.profiles.email             IS 'Email pengguna';
COMMENT ON COLUMN public.profiles.role              IS 'Peran pengguna: admin atau penyewa';


-- =============================================================================
-- TABEL: spots
-- Menyimpan data lapak/lahan yang tersedia untuk disewa di lingkungan kampus
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.spots (
    -- Kunci utama
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identifikasi lapak
    kode            TEXT UNIQUE NOT NULL,
    nama            TEXT NOT NULL,

    -- Lokasi dan zona
    zona            TEXT NOT NULL
                        CHECK (zona IN ('rektorat', 'boulevard', 'sc', 'agrokompleks')),
    zona_label      TEXT,
    lokasi          TEXT,

    -- Spesifikasi fisik
    ukuran          TEXT NOT NULL
                        CHECK (ukuran IN ('2x2', '3x3', '4x4')),
    ukuran_label    TEXT,
    daya            INTEGER,            -- Daya listrik tersedia (Watt)

    -- Tarif dan status
    tarif_per_hari  INTEGER NOT NULL,   -- Tarif sewa per hari (Rupiah)
    status          TEXT NOT NULL DEFAULT 'tersedia'
                        CHECK (status IN ('tersedia', 'dipesan', 'pemeliharaan')),

    -- Fasilitas dan tag (array teks)
    fasilitas       TEXT[],
    tags            TEXT[],

    -- Koordinat pada peta kampus
    koordinat_x     NUMERIC,
    koordinat_y     NUMERIC,

    -- Media dan statistik
    gambar          TEXT,               -- URL foto lapak
    rating          NUMERIC(3, 2),      -- Rating rata-rata (0.00 - 5.00)
    total_sewa      INTEGER NOT NULL DEFAULT 0, -- Jumlah total penyewaan

    -- Deskripsi dan rekomendasi jenis usaha
    deskripsi       TEXT,
    jenis_usaha     TEXT,

    -- Metadata waktu
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.spots              IS 'Daftar lapak/lahan aset yang dapat disewa di lingkungan Universitas Udayana';
COMMENT ON COLUMN public.spots.kode         IS 'Kode unik lapak (mis. LAP-RKT-001)';
COMMENT ON COLUMN public.spots.zona         IS 'Zona lokasi lapak di kampus';
COMMENT ON COLUMN public.spots.daya         IS 'Kapasitas daya listrik tersedia dalam Watt';
COMMENT ON COLUMN public.spots.tarif_per_hari IS 'Biaya sewa per hari dalam Rupiah';
COMMENT ON COLUMN public.spots.total_sewa   IS 'Akumulasi jumlah kali lapak telah disewa';


-- =============================================================================
-- FUNGSI: generate_booking_id()
-- Menghasilkan ID pemesanan unik dengan format: BKG-YYYYMMDD-XXXXXX
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_booking_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_date_part TEXT;
    v_random_part TEXT;
BEGIN
    -- Bagian tanggal: format YYYYMMDD
    v_date_part := TO_CHAR(NOW() AT TIME ZONE 'Asia/Makassar', 'YYYYMMDD');

    -- Bagian acak: 6 karakter huruf kapital + angka
    v_random_part := UPPER(
        SUBSTRING(
            REPLACE(
                REPLACE(
                    ENCODE(gen_random_bytes(6), 'base64'),
                    '+', 'A'
                ),
                '/', 'B'
            ),
            1, 6
        )
    );

    RETURN 'BKG-' || v_date_part || '-' || v_random_part;
END;
$$;

COMMENT ON FUNCTION public.generate_booking_id IS 'Menghasilkan ID pemesanan unik format BKG-YYYYMMDD-XXXXXX';


-- =============================================================================
-- TABEL: bookings
-- Menyimpan data pemesanan lapak oleh penyewa
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
    -- Kunci utama: ID teks dengan format BKG-YYYYMMDD-XXXXXX
    id              TEXT PRIMARY KEY DEFAULT public.generate_booking_id(),

    -- Referensi pengguna dan lapak
    owner_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    spot_id         UUID REFERENCES public.spots(id) ON DELETE RESTRICT,

    -- Snapshot data lapak saat pemesanan (denormalisasi untuk histori)
    spot_nama       TEXT,
    spot_kode       TEXT,

    -- Snapshot data penyewa saat pemesanan (denormalisasi untuk histori)
    penyewa_nama        TEXT,
    penyewa_nim         TEXT,
    penyewa_fakultas    TEXT,
    penyewa_telepon     TEXT,
    penyewa_email       TEXT,
    penyewa_avatar      TEXT,

    -- Periode sewa
    tanggal_mulai   DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jumlah_hari     INTEGER GENERATED ALWAYS AS (
                        (tanggal_selesai - tanggal_mulai) + 1
                    ) STORED,

    -- Informasi pembayaran
    total_bayar         INTEGER,
    metode_pembayaran   TEXT,
    bukti_bayar         TEXT,   -- URL bukti pembayaran

    -- Status pemesanan dan verifikasi
    status              TEXT NOT NULL DEFAULT 'menunggu'
                            CHECK (status IN ('aktif', 'selesai', 'dibatalkan', 'menunggu')),
    status_verifikasi   TEXT NOT NULL DEFAULT 'menunggu'
                            CHECK (status_verifikasi IN ('menunggu', 'disetujui', 'ditolak')),

    -- Informasi tambahan
    catatan         TEXT,
    jenis_usaha     TEXT,

    -- Metadata waktu
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- -------------------------------------------------------------------------
    -- CONSTRAINT: Mencegah booking tumpang tindih untuk lapak yang sama
    -- Menggunakan EXCLUDE dengan GiST index pada rentang tanggal
    -- Pengecualian: pemesanan yang sudah dibatalkan tidak dihitung
    -- -------------------------------------------------------------------------
    CONSTRAINT no_overlapping_bookings
        EXCLUDE USING GIST (
            spot_id WITH =,
            DATERANGE(tanggal_mulai, tanggal_selesai, '[]') WITH &&
        )
        WHERE (status <> 'dibatalkan'),

    -- Validasi tanggal: tanggal selesai harus setelah tanggal mulai
    CONSTRAINT valid_booking_dates
        CHECK (tanggal_selesai >= tanggal_mulai)
);

COMMENT ON TABLE  public.bookings                   IS 'Data pemesanan lapak oleh penyewa';
COMMENT ON COLUMN public.bookings.id                IS 'ID pemesanan unik format BKG-YYYYMMDD-XXXXXX';
COMMENT ON COLUMN public.bookings.owner_id          IS 'UUID profil penyewa yang melakukan pemesanan';
COMMENT ON COLUMN public.bookings.jumlah_hari       IS 'Dihitung otomatis: (tanggal_selesai - tanggal_mulai) + 1';
COMMENT ON COLUMN public.bookings.status            IS 'Status pemesanan: menunggu, aktif, selesai, dibatalkan';
COMMENT ON COLUMN public.bookings.status_verifikasi IS 'Status verifikasi admin: menunggu, disetujui, ditolak';
COMMENT ON COLUMN public.bookings.bukti_bayar       IS 'URL file bukti transfer pembayaran';


-- =============================================================================
-- TABEL: cancellations
-- Menyimpan pengajuan pembatalan pemesanan oleh penyewa
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cancellations (
    -- Kunci utama
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referensi pemesanan yang dibatalkan
    booking_id      TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

    -- Data pengaju pembatalan (snapshot dari penyewa)
    nama            TEXT,
    nim             TEXT,
    telepon         TEXT,

    -- Informasi rekening untuk refund
    bank            TEXT,
    nomor_rekening  TEXT,
    nama_rekening   TEXT,

    -- Detail pembatalan
    alasan          TEXT,
    diajukan_pada   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Status dan catatan admin
    status          TEXT NOT NULL DEFAULT 'menunggu'
                        CHECK (status IN ('menunggu', 'disetujui', 'ditolak')),
    admin_catatan   TEXT,

    -- Bukti refund dan waktu penyelesaian
    bukti_refund    TEXT,
    resolved_at     TIMESTAMPTZ
);

COMMENT ON TABLE  public.cancellations              IS 'Pengajuan pembatalan dan pengembalian dana (refund) oleh penyewa';
COMMENT ON COLUMN public.cancellations.booking_id   IS 'ID pemesanan yang dibatalkan';
COMMENT ON COLUMN public.cancellations.nomor_rekening IS 'Nomor rekening tujuan refund';
COMMENT ON COLUMN public.cancellations.admin_catatan IS 'Catatan admin terkait keputusan refund';
COMMENT ON COLUMN public.cancellations.resolved_at  IS 'Waktu admin memproses pengajuan pembatalan';


-- =============================================================================
-- TABEL: product_captions
-- Menyimpan deskripsi/caption produk yang ditulis oleh penyewa untuk lapak mereka
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.product_captions (
    -- Kunci utama
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referensi lapak dan pemilik caption
    spot_id     UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
    owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Konten caption/deskripsi produk
    konten      TEXT,

    -- Waktu terakhir diperbarui
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Setiap penyewa hanya boleh memiliki satu caption per lapak
    CONSTRAINT uq_product_caption_spot_owner UNIQUE (spot_id, owner_id)
);

COMMENT ON TABLE  public.product_captions           IS 'Deskripsi produk/usaha yang ditulis penyewa untuk lapak yang mereka sewa';
COMMENT ON COLUMN public.product_captions.spot_id   IS 'Lapak yang dideskripsikan';
COMMENT ON COLUMN public.product_captions.owner_id  IS 'Penyewa yang menulis caption (harus memiliki booking aktif)';
COMMENT ON COLUMN public.product_captions.konten    IS 'Konten deskripsi produk atau usaha';


-- =============================================================================
-- TABEL: payments
-- Menyimpan catatan pembayaran terkait pemesanan
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    -- Kunci utama
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referensi pemesanan
    booking_id  TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

    -- Detail pembayaran
    bukti_url   TEXT,           -- URL bukti transfer/pembayaran
    nominal     INTEGER,        -- Jumlah yang dibayarkan (Rupiah)
    metode      TEXT,           -- Metode pembayaran (transfer, tunai, dll.)

    -- Status pembayaran
    status      TEXT NOT NULL DEFAULT 'menunggu'
                    CHECK (status IN ('menunggu', 'lunas', 'gagal')),

    -- Metadata waktu
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.payments               IS 'Catatan transaksi pembayaran sewa lapak';
COMMENT ON COLUMN public.payments.bukti_url     IS 'URL file bukti transfer pembayaran';
COMMENT ON COLUMN public.payments.nominal       IS 'Jumlah nominal pembayaran dalam Rupiah';
COMMENT ON COLUMN public.payments.status        IS 'Status pembayaran: menunggu, lunas, gagal';


-- =============================================================================
-- INDEKS
-- Meningkatkan performa query yang sering digunakan
-- =============================================================================

-- Indeks untuk tabel bookings
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id
    ON public.bookings(owner_id);

CREATE INDEX IF NOT EXISTS idx_bookings_spot_id
    ON public.bookings(spot_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON public.bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_status_verifikasi
    ON public.bookings(status_verifikasi);

CREATE INDEX IF NOT EXISTS idx_bookings_tanggal_mulai
    ON public.bookings(tanggal_mulai);

-- Indeks untuk tabel cancellations
CREATE INDEX IF NOT EXISTS idx_cancellations_booking_id
    ON public.cancellations(booking_id);

CREATE INDEX IF NOT EXISTS idx_cancellations_status
    ON public.cancellations(status);

-- Indeks untuk tabel payments
CREATE INDEX IF NOT EXISTS idx_payments_booking_id
    ON public.payments(booking_id);

-- Indeks untuk tabel product_captions
CREATE INDEX IF NOT EXISTS idx_product_captions_spot_id
    ON public.product_captions(spot_id);

COMMENT ON INDEX public.idx_bookings_owner_id       IS 'Mempercepat query pemesanan berdasarkan pemilik';
COMMENT ON INDEX public.idx_bookings_spot_id        IS 'Mempercepat query pemesanan berdasarkan lapak';
COMMENT ON INDEX public.idx_bookings_status         IS 'Mempercepat filter berdasarkan status pemesanan';
COMMENT ON INDEX public.idx_cancellations_booking_id IS 'Mempercepat pencarian pembatalan berdasarkan ID pemesanan';


-- =============================================================================
-- FUNGSI & TRIGGER: Auto-create profile saat user baru mendaftar
-- =============================================================================

-- Fungsi yang dipanggil oleh trigger saat user baru dibuat di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, nama, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        -- Ambil nama dari metadata jika ada, fallback ke bagian email sebelum '@'
        COALESCE(
            NEW.raw_user_meta_data->>'nama',
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.email,
        -- Default role 'penyewa', bisa diubah admin setelahnya
        COALESCE(NEW.raw_user_meta_data->>'role', 'penyewa'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Hindari duplikasi jika trigger terpanggil dua kali

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Membuat entri profil otomatis saat pengguna baru mendaftar via Supabase Auth';

-- Trigger yang memanggil fungsi di atas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- FUNGSI HELPER: Mengecek apakah pengguna saat ini adalah admin
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;

COMMENT ON FUNCTION public.is_admin IS 'Mengembalikan TRUE jika pengguna yang sedang login memiliki role admin';


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Kebijakan akses data di level baris untuk setiap tabel
-- =============================================================================


-- -----------------------------------------------------------------------------
-- RLS: profiles
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Penyewa dapat melihat profil mereka sendiri
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Admin dapat melihat semua profil
CREATE POLICY "profiles_select_admin"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Penyewa hanya dapat memperbarui profil mereka sendiri
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admin dapat memperbarui profil siapa pun (mis. mengubah role)
CREATE POLICY "profiles_update_admin"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Sistem dapat membuat profil baru (dipanggil oleh trigger SECURITY DEFINER)
CREATE POLICY "profiles_insert_system"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());


-- -----------------------------------------------------------------------------
-- RLS: spots
-- -----------------------------------------------------------------------------

ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

-- Semua orang (termasuk yang belum login) dapat melihat data lapak
CREATE POLICY "spots_select_public"
    ON public.spots
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Hanya admin yang dapat menambah lapak baru
CREATE POLICY "spots_insert_admin"
    ON public.spots
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Hanya admin yang dapat mengubah data lapak
CREATE POLICY "spots_update_admin"
    ON public.spots
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Hanya admin yang dapat menghapus lapak
CREATE POLICY "spots_delete_admin"
    ON public.spots
    FOR DELETE
    TO authenticated
    USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- RLS: bookings
-- -----------------------------------------------------------------------------

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Penyewa hanya melihat pemesanan milik mereka sendiri
CREATE POLICY "bookings_select_own"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

-- Admin dapat melihat semua pemesanan
CREATE POLICY "bookings_select_admin"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Penyewa yang sudah login dapat membuat pemesanan baru atas nama mereka sendiri
CREATE POLICY "bookings_insert_own"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

-- Penyewa dapat memperbarui pemesanan milik mereka (mis. upload bukti bayar)
CREATE POLICY "bookings_update_own"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Admin dapat memperbarui semua pemesanan (verifikasi, ubah status, dll.)
CREATE POLICY "bookings_update_admin"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- RLS: cancellations
-- -----------------------------------------------------------------------------

ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;

-- Penyewa dapat melihat pembatalan dari pemesanan milik mereka sendiri
CREATE POLICY "cancellations_select_own"
    ON public.cancellations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = cancellations.booking_id
              AND b.owner_id = auth.uid()
        )
    );

-- Admin dapat melihat semua pengajuan pembatalan
CREATE POLICY "cancellations_select_admin"
    ON public.cancellations
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Penyewa dapat mengajukan pembatalan untuk pemesanan milik mereka
CREATE POLICY "cancellations_insert_own"
    ON public.cancellations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = cancellations.booking_id
              AND b.owner_id = auth.uid()
        )
    );

-- Admin dapat memperbarui status pembatalan (setujui/tolak, isi catatan)
CREATE POLICY "cancellations_update_admin"
    ON public.cancellations
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- RLS: product_captions
-- -----------------------------------------------------------------------------

ALTER TABLE public.product_captions ENABLE ROW LEVEL SECURITY;

-- Semua orang dapat melihat caption produk (untuk halaman publik lapak)
CREATE POLICY "product_captions_select_public"
    ON public.product_captions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Penyewa hanya dapat menambah caption jika memiliki booking aktif yang disetujui untuk lapak tersebut
CREATE POLICY "product_captions_insert_owner_with_active_booking"
    ON public.product_captions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.spot_id = product_captions.spot_id
              AND b.owner_id = auth.uid()
              AND b.status = 'aktif'
              AND b.status_verifikasi = 'disetujui'
        )
    );

-- Penyewa hanya dapat mengubah caption milik mereka sendiri (jika masih punya booking aktif)
CREATE POLICY "product_captions_update_owner_with_active_booking"
    ON public.product_captions
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (
        owner_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.spot_id = product_captions.spot_id
              AND b.owner_id = auth.uid()
              AND b.status = 'aktif'
              AND b.status_verifikasi = 'disetujui'
        )
    );

-- Admin dapat mengelola semua caption
CREATE POLICY "product_captions_all_admin"
    ON public.product_captions
    FOR ALL
    TO authenticated
    USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- RLS: payments
-- -----------------------------------------------------------------------------

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Penyewa dapat melihat pembayaran dari pemesanan mereka sendiri
CREATE POLICY "payments_select_own"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = payments.booking_id
              AND b.owner_id = auth.uid()
        )
    );

-- Admin dapat melihat semua data pembayaran
CREATE POLICY "payments_select_admin"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Penyewa dapat menambahkan pembayaran untuk pemesanan mereka
CREATE POLICY "payments_insert_own"
    ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = payments.booking_id
              AND b.owner_id = auth.uid()
        )
    );

-- Admin dapat memperbarui data pembayaran (konfirmasi lunas, dll.)
CREATE POLICY "payments_update_admin"
    ON public.payments
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());


-- =============================================================================
-- FUNGSI: Auto-update kolom updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at IS 'Memperbarui kolom updated_at secara otomatis saat baris diubah';

-- Trigger updated_at untuk tabel profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Trigger updated_at untuk tabel spots
DROP TRIGGER IF EXISTS trg_spots_updated_at ON public.spots;
CREATE TRIGGER trg_spots_updated_at
    BEFORE UPDATE ON public.spots
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Trigger updated_at untuk tabel product_captions
DROP TRIGGER IF EXISTS trg_product_captions_updated_at ON public.product_captions;
CREATE TRIGGER trg_product_captions_updated_at
    BEFORE UPDATE ON public.product_captions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- FUNGSI: Validasi Tiket Publik (Untuk Petugas Satpam Lapangan)
-- Dapat diakses oleh anon dan authenticated tanpa membuka seluruh tabel bookings
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_booking_ticket(p_ticket_id TEXT)
RETURNS TABLE (
    id                  TEXT,
    spot_nama           TEXT,
    spot_kode           TEXT,
    penyewa_nama        TEXT,
    penyewa_nim         TEXT,
    penyewa_fakultas    TEXT,
    jenis_usaha         TEXT,
    tanggal_mulai       DATE,
    tanggal_selesai     DATE,
    status              TEXT,
    status_verifikasi   TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        b.id,
        b.spot_nama,
        b.spot_kode,
        b.penyewa_nama,
        b.penyewa_nim,
        b.penyewa_fakultas,
        b.jenis_usaha,
        b.tanggal_mulai,
        b.tanggal_selesai,
        b.status,
        b.status_verifikasi
    FROM public.bookings b
    WHERE b.id = p_ticket_id;
$$;

COMMENT ON FUNCTION public.validate_booking_ticket(TEXT)
    IS 'Fungsi publik aman untuk validasi izin stan oleh satpam kampus melalui QR Code / Ticket ID';

GRANT EXECUTE ON FUNCTION public.validate_booking_ticket(TEXT) TO anon, authenticated;


-- =============================================================================
-- FUNGSI: Pembatalan Pesanan Sisi Penyewa (Aturan 1x24 Jam Sebelum Verifikasi)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cancel_booking_as_tenant(
    p_booking_id       TEXT,
    p_nama             TEXT,
    p_nim              TEXT,
    p_telepon          TEXT,
    p_bank             TEXT,
    p_nomor_rekening   TEXT,
    p_nama_rekening    TEXT,
    p_alasan           TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Ambil data pemesanan
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pesanan tidak ditemukan.';
    END IF;

    -- Validasi hak milik (harus pemilik pesanan atau admin)
    IF v_booking.owner_id <> auth.uid() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Anda tidak memiliki hak untuk membatalkan pesanan ini.';
    END IF;

    -- Validasi status: hanya pesanan yang menunggu verifikasi yang dapat dibatalkan
    IF v_booking.status_verifikasi <> 'menunggu' THEN
        RAISE EXCEPTION 'Pesanan yang sudah diproses atau diverifikasi tidak dapat dibatalkan mandiri.';
    END IF;

    -- Validasi batas waktu 1x24 jam dari waktu pemesanan
    IF NOW() - v_booking.created_at > INTERVAL '24 hours' THEN
        RAISE EXCEPTION 'Batas waktu pembatalan mandiri (24 jam sejak pemesanan) telah kedaluwarsa.';
    END IF;

    -- Update status pesanan menjadi dibatalkan
    UPDATE public.bookings
    SET status = 'dibatalkan'
    WHERE id = p_booking_id;

    -- Catat pengajuan pembatalan dan detail rekening refund
    INSERT INTO public.cancellations (
        booking_id,
        nama,
        nim,
        telepon,
        bank,
        nomor_rekening,
        nama_rekening,
        alasan,
        diajukan_pada,
        status
    )
    VALUES (
        p_booking_id,
        p_nama,
        p_nim,
        p_telepon,
        p_bank,
        p_nomor_rekening,
        p_nama_rekening,
        p_alasan,
        NOW(),
        'menunggu'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pesanan berhasil dibatalkan dan pengajuan refund telah dicatat.'
    );
END;
$$;

COMMENT ON FUNCTION public.cancel_booking_as_tenant IS 'Membatalkan pemesanan oleh penyewa dalam jendela 24 jam sebelum verifikasi admin';

GRANT EXECUTE ON FUNCTION public.cancel_booking_as_tenant TO authenticated;


-- =============================================================================
-- SELESAI
-- Schema awal Ngelapak berhasil dimuat
-- =============================================================================
