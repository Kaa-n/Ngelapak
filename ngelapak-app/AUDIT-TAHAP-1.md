# Audit fondasi Supabase Ngelapak

Lingkup audit mengikuti tugas Anggota 1 di roadmap awal. Workspace pada saat audit berada di `guna-dev`, commit `2b89a85`, sama dengan referensi `origin/main` yang terakhir diambil.

## Hasil pemeriksaan

| Bagian | Temuan | Status |
| --- | --- | --- |
| Koneksi | URL aplikasi cocok dengan project ref yang tercatat oleh Supabase CLI. Endpoint Auth dan REST merespons HTTP 200. | Terverifikasi melalui API |
| Tabel | Proyeksi kolom yang diuji pada `profiles`, `spots`, `bookings`, `payments`, `cancellations`, dan `product_captions` diterima. Permintaan memakai `limit=0`. | Terverifikasi melalui API, sebagian kolom |
| Selisih skema | Cloud memiliki `profiles.nim`, `profiles.fakultas`, `profiles.telepon`, `bookings.nama_usaha`, dan `bookings.kategori_penjual`. Kolom tersebut belum didefinisikan di migrasi `001`. | Perlu diselaraskan |
| Fungsi database | Aplikasi memanggil `create_booking_with_payment`. Migrasi `001` berisi `cancel_booking_as_tenant`, `validate_booking_ticket`, dan `is_admin`, tetapi tidak mendefinisikan `create_booking_with_payment`. | Definisi dan hak eksekusi di cloud belum terverifikasi |
| RLS | Permintaan anonim tidak menemukan baris terlihat pada `profiles`, `bookings`, `payments`, dan `cancellations`. Hasil ini juga mungkin terjadi jika tabel kosong. | Kebijakan aktif dan perilaku untuk akun penyewa serta admin belum terverifikasi |
| Storage | API dengan publishable key mengembalikan `NoSuchBucket` untuk `payment-proofs`, `spot-images`, dan `refund-proofs`. Migrasi repo belum mendefinisikan ketiganya. | Keberadaan dan kebijakan bucket perlu dikonfirmasi di dashboard |
| Autentikasi dan admin | Login dan register sudah terhubung ke Supabase di kode. Dasbor masih memakai mock dan verifikasi masih memakai demo store. | Dasar UI dan Auth bisa dipakai untuk tahap berikutnya |

## Prioritas Tahap 2

1. Ambil metadata cloud dan bandingkan dengan migrasi. Pertahankan enam tabel tim. Catat selisih lewat migrasi tambahan agar lingkungan baru dapat mereproduksi skema yang dipakai aplikasi, lalu hasilkan tipe database.
2. Audit ulang trigger dan hak akses cloud. Di migrasi repo, role awal dibaca dari metadata pendaftaran dan aturan update profil sendiri hanya memeriksa ID. Aturan tulis booking, pembayaran, dan pembatalan juga berbasis kepemilikan tanpa membatasi kolom atau nilai status. Uji bahwa penyewa tidak dapat menentukan role admin, memverifikasi booking sendiri, atau mengubah status pembayaran dan refund lewat API. Audit hak eksekusi fungsi `SECURITY DEFINER`. Fungsi pembatalan lokal perlu memeriksa sesi dan kepemilikan secara eksplisit, termasuk ketika ID pengguna atau pemilik bernilai NULL.
3. Selaraskan status dengan anggota pemesanan dan pesanan. Constraint lokal ikut menahan booking berstatus menunggu. Fungsi pembatalan lokal langsung membatalkan booking sebelum admin menyelesaikan refund. Pastikan persetujuan pembayaran mengunci rentang tanggal secara konsisten dan persetujuan refund melepasnya setelah bukti tersimpan. Sepakati sumber bukti bayar di antara `bookings.bukti_bayar` dan `payments.bukti_url`.
4. Tambahkan bucket yang belum tersedia. Batasi bukti pembayaran dan refund ke penyewa pemilik dan admin sesuai operasinya. Sesuaikan izin baca foto lapak dengan kebutuhan katalog. Pada RLS caption, periksa status disetujui, pemilik, spot, dan tanggal sewa yang mencakup hari ini di zona Asia/Makassar.

## Kueri lanjutan untuk Supabase SQL Editor

Dashboard di browser audit meminta login. Jalankan kueri berikut pada proyek tim untuk mengonfirmasi metadata yang belum terverifikasi. Kueri mengambil definisi skema, bukan baris pelanggan. Periksa definisi fungsi sebelum membagikan hasilnya jika proyek menyimpan nilai internal di dalam fungsi.

```sql
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'profiles', 'spots', 'bookings', 'payments', 'cancellations', 'product_captions'
  ]) AS name
)
SELECT jsonb_build_object(
  'tables', (
    SELECT jsonb_agg(jsonb_build_object('name', c.relname, 'rls_enabled', c.relrowsecurity))
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN (SELECT name FROM target_tables)
  ),
  'columns', (
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.table_name, c.ordinal_position)
    FROM (
      SELECT table_name, ordinal_position, column_name, data_type,
             is_nullable, column_default, generation_expression
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN (SELECT name FROM target_tables)
    ) c
  ),
  'constraints', (
    SELECT jsonb_agg(jsonb_build_object(
      'table', c.relname, 'name', k.conname, 'definition', pg_get_constraintdef(k.oid)
    ))
    FROM pg_constraint k
    JOIN pg_class c ON c.oid = k.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN (SELECT name FROM target_tables)
  ),
  'table_grants', (
    SELECT jsonb_agg(to_jsonb(g))
    FROM (
      SELECT table_name, grantee, privilege_type
      FROM information_schema.table_privileges
      WHERE table_schema = 'public' AND table_name IN (SELECT name FROM target_tables)
        AND grantee IN ('anon', 'authenticated', 'PUBLIC')
    ) g
  ),
  'policies', (
    SELECT jsonb_agg(to_jsonb(p))
    FROM pg_policies p
    WHERE (schemaname = 'public' AND tablename IN (SELECT name FROM target_tables))
       OR (schemaname = 'storage' AND tablename IN ('objects', 'buckets'))
  ),
  'functions', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'definition', pg_get_functiondef(p.oid),
      'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE')
    ))
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname IN (
        'handle_new_user', 'is_admin', 'create_booking_with_payment',
        'cancel_booking_as_tenant', 'validate_booking_ticket'
      )
  ),
  'buckets', (
    SELECT coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
    FROM (
      SELECT id, public, file_size_limit, allowed_mime_types
      FROM storage.buckets
      WHERE id IN ('payment-proofs', 'spot-images', 'refund-proofs')
    ) b
  )
) AS audit_metadata;
```
