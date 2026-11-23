# Brief diskusi demo Ngelapak

Ngelapak adalah prototipe marketplace sewa lapak temporer di kampus Universitas Udayana. Penyewa mencari spot, membayar, lalu memakai lapak. Admin mengurus pengajuan dan pembatalan. Data yang tampil di demo masih mock di browser. Paket Supabase dan Postgres sudah ada, tetapi belum dipakai.

Akun demo: admin (I Made Ariawan), penyewa Ayu, dan penyewa Bayu. Tamu hanya bisa melihat katalog. Kata sandi demo bersama: `ngelapak123`.

## Yang diminta saat demo

Revisi ini datang dari catatan Guna. Intinya ada di tampilan lapak, pembayaran, dan halaman setelah bayar.

Kartu lapak di beranda ditukar perannya. Tombol utama menjadi **Deskripsi Produk** (sebelumnya Deskripsi Menu). **Lihat Detail** turun menjadi tautan kecil.

Panel Deskripsi Produk dibagi dua. Kiri peta lokasi spot itu saja. Kanan dokumen. Header dokumen tetap otomatis (nama stan, kode, zona, lokasi, status beroperasi). Isi dokumen satu teks caption yang bisa diedit penyewa yang sedang masuk, lalu disimpan di browser per spot. Tamu hanya membaca. Caption tidak diisi konten jadi.

Setelah penyewa menekan **Saya Sudah Bayar**, pembayaran demo dianggap berhasil, setara notifikasi lunas dari Midtrans. Tidak ada API Midtrans sungguhan di tahap ini. Tombol sukses tidak lagi membuka daftar Pesanan Saya. Ia membuka halaman **Detail Pesanan**.

Di halaman itu ada slot PDF panduan: cara datang, cara mengenali lapak, dan kontak. Isi berkasnya tidak dikerjakan. Yang disiapkan hanya penanda bahwa PDF sudah terkirim. PDF hanya muncul kalau sewa lunas dan tidak sedang dibatalkan. Begitu pembatalan diajukan, kotak PDF hilang.

## Verifikasi pembayaran

Kesimpulan demo: admin tidak perlu memverifikasi ulang bahwa uang sudah masuk. Midtrans yang menyatakan lunas. Tab **Verifikasi Pembayaran** sempat tertinggal di halaman admin karena masih menampilkan antrean data lama, dan itu yang bikin alurnya terasa dobel. Keputusan akhirnya, tab itu dihapus. Yang tersisa di admin: **Pengajuan Lapak**, **Pembatalan**, dan **Riwayat & Audit**.

## Mekanisme pembatalan

Pembatalan tidak boleh selesai dalam satu klik, dan tidak langsung mengembalikan uang atau melepas lapak.

1. Tombol batal hanya ada selama 1x24 jam setelah pembayaran. Lewat itu, penyewa menghubungi contact person. Nomor di demo masih placeholder `0812-0000-0000`.
2. Penyewa mengisi identitas (nama, NIM, telepon), rekening (bank, nomor, nama pemilik), dan alasan. Ia juga mencentang bahwa pengajuan tidak bisa ditarik, refund baru selesai setelah admin memproses, dan lapak tetap terkunci sampai status berhasil.
3. Status awal **Menunggu**. Lapak masih terkunci. PDF panduan langsung hilang.
4. Admin membuka tab **Pembatalan**, sejajar dengan Pengajuan Lapak, lalu menandai **Sudah berhasil**. Baru saat itu pesanan dibatalkan dan jadwal lapak kosong.

Satu pesanan hanya bisa diajukan pembatalannya sekali.

## Syarat saat memesan

Teks syarat dibuka dari centang di form sewa, bukan halaman hukum terpisah. Isinya:

- Setelah pembayaran tercatat, sewa langsung lunas. Admin tidak memeriksa ulang bukti bayar.
- PDF panduan ada di detail pesanan selama pesanan belum dibatalkan.
- Pembatalan 1x24 jam lewat detail pesanan, dengan identitas, rekening, dan alasan. Statusnya menunggu sampai admin menuntaskan refund.
- ID pesanan tidak dibagikan. Tunjukkan ID itu jika petugas lokasi bertanya.
- Usaha sesuai data saat memesan. Kerusakan fasilitas menjadi tanggung jawab penyewa.

## Catatan implementasi

Diskusi di atas adalah keputusan demo. Setelah itu, perubahan mekanisme pembatalan yang belum di-commit dikembalikan ke commit `678a48c` (`revisi: pembatalan, card, detail pemesanan`) di branch `rev/guna`. Commit itu masih menyimpan form pembatalan versi lebih awal, kartu Deskripsi Produk, dan halaman detail pesanan. Tab verifikasi pembayaran dan status menunggu/berhasil yang dibahas belakangan belum masuk ke commit itu.
