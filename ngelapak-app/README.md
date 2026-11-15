This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Panel admin dan Supabase

Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` di `.env.local`. Untuk proyek Supabase baru, jalankan migrasi `001` sampai `008` secara berurutan. Untuk proyek tim, cocokkan skema dengan [audit](AUDIT-TAHAP-1.md) dan terapkan migrasi yang belum terpasang setelah diuji di proyek pengembangan. Rilis perubahan database dan aplikasi secara terkoordinasi.

| Akses | Tamu | Penyewa | Admin |
| --- | --- | --- | --- |
| Katalog dan detail lapak | Ya | Ya | Ya |
| Mengajukan sewa | Masuk dahulu | Ya | Tidak |
| Pesanan Saya | Tidak | Milik sendiri | Tidak |
| Kelola Lapak, Riwayat Pembayaran, dan Refund | Tidak | Tidak | Ya |

Tambahkan URL aplikasi dan `/auth/callback` ke konfigurasi redirect Supabase Auth untuk konfirmasi email. Gunakan akun yang sudah diberikan role `admin` oleh pengelola database untuk mengakses `/admin`. Pendaftaran umum membuat akun penyewa.

Untuk menguji Midtrans, gunakan Server Key dari Sandbox sebagai `MIDTRANS_SERVER_KEY`. Isi `SUPABASE_SERVICE_ROLE_KEY` dengan kredensial proyek pengembangan, `NGELAPAK_APP_URL` dengan URL aplikasi, dan `MIDTRANS_IS_PRODUCTION=false`. Simpan kedua kunci hanya di server. Pasang URL publik HTTPS `/api/midtrans/notification` sebagai Payment Notification URL di dashboard Midtrans Sandbox. Uji pembayaran lalu periksa status **Lunas** dan unduh PDF MOU di Detail Pesanan. Dokumen yang dihasilkan adalah draf berbasis data pesanan.

Pesanan Midtrans menahan slot selama batas bayar satu jam. Jika notifikasi kedaluwarsa tidak diterima, pemeriksaan ulang dilakukan dari Detail Pesanan atau ketika ada percobaan pemesanan pada tanggal yang bertabrakan. Mulai sewa pukul 08.00 WITA dan checkout ditutup satu jam sebelumnya. Pengajuan batal dibuka setelah lunas dan ditutup pada waktu yang lebih awal antara 24 jam setelah lunas atau 24 jam sebelum sewa mulai. Admin menyetujui atau menolak pembatalan. Persetujuan membuka slot dan admin mencatat bukti refund setelah transfer dilakukan.

Riwayat Pembayaran menampilkan status Midtrans serta tautan ke bukti pesanan transfer lama yang masih menunggu. Pendapatan dasbor adalah pembayaran bruto, dengan tren berdasarkan waktu konfirmasi dan okupansi berdasarkan tanggal WITA.

**Masuk dengan Akun Demo** menyediakan Ayu dan Bayu untuk mencoba alur penyewa. Buat pesanan, buka Detail Pesanan, lalu pilih **Simulasikan pembayaran berhasil**. Pilih **Masuk sebagai Admin** untuk melihat transaksi browser yang sama di `/demo/admin/pembayaran` dan memproses pengajuan pembatalan demo. Data demo disimpan di browser.

Pemeriksaan: `npm test`, `npx tsc --noEmit`, `npm run lint`, dan `npm run build`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
