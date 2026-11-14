This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Panel admin dan Supabase

Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` di `.env.local`. Untuk proyek Supabase baru, jalankan migrasi `001` sampai `006` secara berurutan. Untuk proyek tim yang sudah punya tabel, bandingkan skema aktual dengan [audit](AUDIT-TAHAP-1.md), lalu terapkan migrasi `002` sampai `006` setelah diuji di proyek pengembangan. Migrasi `002` mengganti RPC pemesanan lama dengan `submit_booking_with_payment`. Rilis perubahan database dan aplikasi secara terkoordinasi.

| Akses | Tamu | Penyewa | Admin |
| --- | --- | --- | --- |
| Katalog dan detail lapak | Ya | Ya | Ya |
| Mengajukan sewa | Masuk dahulu | Ya | Tidak |
| Pesanan Saya | Tidak | Milik sendiri | Tidak |
| Kelola Lapak dan Verifikasi | Tidak | Tidak | Ya |

Tambahkan URL aplikasi dan `/auth/callback` ke konfigurasi redirect Supabase Auth untuk konfirmasi email. Gunakan akun yang sudah diberikan role `admin` oleh pengelola database untuk mengakses `/admin`. Pendaftaran umum membuat akun penyewa.

Untuk mencoba verifikasi, buat pesanan dengan akun penyewa dan unggah bukti transfer uji. Masuk dengan akun admin, buka **Verifikasi Pembayaran**, dan setujui atau tolak. Buat pesanan lain untuk mencoba pengajuan pembatalan sebelum verifikasi. Selama pengajuan menunggu, tanggal tetap ditahan. Persetujuan dengan bukti refund melepas tanggal. Penolakan menyimpan catatan yang terlihat di detail pesanan penyewa.

Pembayaran dan transfer refund dilakukan di luar aplikasi. Panel admin menyimpan bukti serta statusnya. Total pendapatan dasbor adalah pendapatan bruto dari pembayaran yang terverifikasi. Tren memakai tanggal verifikasi, sehingga pembayaran lama tanpa tanggal verifikasi hanya masuk ke total. Okupansi dihitung untuk hari ini di WITA.

**Masuk dengan Akun Demo** menyediakan Ayu dan Bayu untuk mencoba alur penyewa di browser. Pesanan demo tersimpan di `localStorage`.

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
