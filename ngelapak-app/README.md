This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Demo role admin dan penyewa

Pilih **Masuk demo** untuk masuk sebagai admin, Ayu, atau Bayu. Demo tidak meminta kata sandi dan tidak menghubungi Supabase. Dependensi Supabase sudah ada, tetapi integrasi autentikasi/database belum tersedia.

| Akses | Tamu | Penyewa | Admin |
| --- | --- | --- | --- |
| Katalog dan detail lapak | Ya | Ya | Ya |
| Mengajukan sewa | Masuk dahulu | Ya | Tidak |
| Pesanan Saya | Tidak | Milik sendiri | Tidak |
| Kelola Lapak dan Verifikasi | Tidak | Tidak | Ya |

Untuk mencoba alur lengkap: masuk sebagai Ayu, buka lapak tersedia, isi jadwal dan jenis usaha, setujui ketentuan, lalu ajukan booking. Buka Pesanan Saya. Keluar dan masuk sebagai admin untuk menyetujui atau menolak di Verifikasi. Masuk kembali sebagai Ayu untuk melihat hasilnya; akun Bayu tidak melihat pesanan Ayu.

Sesi disimpan di `sessionStorage` per tab; pemesanan dan hasil verifikasi di `localStorage` agar tetap ada setelah refresh atau pergantian akun. Menu desktop dan seluler mengikuti role. Pembuatan dan verifikasi pemesanan juga memeriksa role pada fungsi demo. Jadwal lampau, durasi di luar 1–30 hari, lapak tidak tersedia, dan tanggal bertabrakan ditolak.

Semua data dan role masih dapat diubah melalui browser. Ini simulasi UI dan alur akses, **bukan autentikasi atau otorisasi produksi**. Tidak ada pembayaran sungguhan, unggah bukti, email, atau sinkronisasi antarperangkat. Data lapak, statistik dasbor, dan pengajuan lapak tetap menggunakan mock bawaan. Untuk mengulang demo, hapus key `ngelapak-demo-bookings-v1` dari Local Storage dan `ngelapak-demo-session-v1` dari Session Storage melalui DevTools.

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
