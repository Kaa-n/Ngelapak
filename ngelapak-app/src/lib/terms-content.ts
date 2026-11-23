"use client";

import { useSyncExternalStore } from "react";

/**
 * Konten Syarat & Ketentuan Ngelapak.
 * Bisa dioverride dari localStorage oleh admin melalui halaman /admin/ketentuan.
 */

export interface TermsSection {
  title: string;
  items: string[];
}

export interface TermsContent {
  intro: string;
  sections: TermsSection[];
  closing: string;
}

export const DEFAULT_TERMS: TermsContent = {
  intro:
    "Syarat dan Ketentuan ini mengatur penggunaan platform Ngelapak sebagai sarana pengajuan dan pengelolaan penyewaan lapak usaha di lingkungan Universitas Udayana. Dengan menggunakan layanan dan mengajukan pemesanan melalui Ngelapak, pengguna dianggap telah membaca, memahami, dan bersedia mematuhi ketentuan yang berlaku.",
  sections: [
    {
      title: "Pasal 1 - Ketentuan Umum",
      items: [
        "1. Ngelapak merupakan platform yang memfasilitasi proses pencarian informasi, pengajuan pemesanan, dan pengelolaan penggunaan lapak usaha di lingkungan Universitas Udayana.",
        "2. Pengguna adalah setiap individu atau pihak yang mengakses dan menggunakan layanan Ngelapak, termasuk calon penyewa dan pengelola lapak.",
        "3. Penyewa adalah pengguna yang mengajukan permohonan penggunaan lapak untuk kegiatan usaha atau kegiatan lain yang diperbolehkan.",
        "4. Pengelola adalah pihak yang memiliki kewenangan untuk mengelola ketersediaan lapak, memeriksa pengajuan, dan melakukan verifikasi sesuai ketentuan yang berlaku.",
      ],
    },
    {
      title: "Pasal 2 - Pendaftaran dan Keakuratan Informasi",
      items: [
        "1. Pengguna wajib menggunakan akun yang terdaftar dan memberikan informasi identitas serta informasi usaha secara benar, lengkap, dan dapat dipertanggungjawabkan.",
        "2. Informasi mengenai nama usaha, kategori penjual, jenis usaha, dan kebutuhan penggunaan lapak harus sesuai dengan kegiatan yang akan dilaksanakan.",
        "3. Pengguna bertanggung jawab atas keakuratan dan keabsahan informasi maupun dokumen yang disampaikan melalui platform.",
        "4. Pengelola berhak meminta klarifikasi apabila terdapat informasi yang tidak lengkap, tidak sesuai, atau memerlukan pemeriksaan lebih lanjut.",
      ],
    },
    {
      title: "Pasal 3 - Pengajuan dan Penggunaan Lapak",
      items: [
        "1. Pengajuan pemesanan dilakukan dengan memilih lapak, menentukan tanggal dan durasi penggunaan, serta melengkapi informasi yang dipersyaratkan dalam formulir pemesanan.",
        "2. Tanggal mulai sewa ditetapkan paling cepat H+2 (dua hari kalender setelah tanggal pengajuan), untuk memberi waktu pemrosesan dan verifikasi oleh pengelola.",
        "3. Pengajuan pemesanan belum merupakan persetujuan final atas penggunaan lapak dan tetap mengikuti proses pemeriksaan serta verifikasi oleh pengelola.",
        "4. Penyewa hanya diperkenankan menggunakan lapak sesuai lokasi, periode, jenis kegiatan, dan informasi usaha yang diajukan serta disetujui.",
        "5. Perubahan jadwal, jenis kegiatan, atau informasi pemesanan harus dikomunikasikan kepada pengelola dan memperoleh persetujuan apabila diperlukan.",
      ],
    },
    {
      title: "Pasal 4 - Tarif dan Pembayaran",
      items: [
        "1. Tarif penggunaan lapak mengikuti informasi harga yang ditampilkan pada halaman detail lapak ketika pengajuan pemesanan dilakukan.",
        "2. Total biaya dihitung berdasarkan tarif penggunaan dan durasi sewa yang dipilih oleh penyewa, dengan memperhatikan biaya tambahan apabila ditetapkan oleh pengelola.",
        "3. Penyewa wajib melakukan pembayaran melalui metode pembayaran yang disediakan pada platform dan memastikan informasi transaksi yang digunakan benar.",
        "4. Bukti atau informasi pembayaran dapat digunakan sebagai dasar pemeriksaan oleh pengelola. Status pemesanan mengikuti hasil verifikasi pembayaran dan pengajuan.",
      ],
    },
    {
      title: "Pasal 5 - Hak dan Kewajiban Penyewa",
      items: [
        "1. Penyewa berhak menggunakan lapak sesuai periode dan peruntukan yang telah memperoleh persetujuan.",
        "2. Penyewa wajib menjaga kebersihan, ketertiban, keamanan, serta kondisi fasilitas selama masa penggunaan lapak.",
        "3. Penyewa wajib mematuhi peraturan kampus, ketentuan keselamatan, serta arahan pengelola yang berkaitan dengan kegiatan di lokasi.",
        "4. Penyewa dilarang mengalihkan penggunaan lapak kepada pihak lain tanpa persetujuan pengelola.",
        "5. Penyewa bertanggung jawab atas kerusakan atau kerugian yang timbul akibat kelalaian maupun tindakan penyewa dan pihak yang berada di bawah tanggung jawabnya.",
      ],
    },
    {
      title: "Pasal 6 - Pembatalan dan Perubahan Pemesanan",
      items: [
        "1. Permohonan pembatalan atau perubahan pemesanan disampaikan melalui mekanisme yang tersedia pada platform atau melalui pengelola.",
        "2. Ajukan pembatalan maksimal 24 jam setelah lunas dan paling lambat 24 jam sebelum sewa mulai (08.00 WITA). Admin meninjau setiap pengajuan.",
        "3. Pengembalian dana, apabila memenuhi persyaratan, dilaksanakan berdasarkan kebijakan pembatalan dan pengembalian dana yang ditetapkan oleh pengelola.",
        "4. Penyewa wajib memastikan kembali tanggal, durasi, dan informasi pemesanan sebelum menyelesaikan pengajuan.",
      ],
    },
    {
      title: "Pasal 7 - Larangan dan Penegakan Ketentuan",
      items: [
        "1. Penyewa dilarang menggunakan lapak untuk kegiatan yang bertentangan dengan hukum, peraturan kampus, norma kesusilaan, atau ketertiban lingkungan.",
        "2. Penyewa dilarang memberikan informasi palsu, menyalahgunakan akun, atau melakukan tindakan yang mengganggu operasional platform maupun kegiatan di lingkungan kampus.",
        "3. Pengelola dapat melakukan pemeriksaan dan mengambil tindakan sesuai kewenangannya apabila ditemukan dugaan pelanggaran terhadap ketentuan penggunaan lapak.",
      ],
    },
    {
      title: "Pasal 8 - Data dan Informasi Pengguna",
      items: [
        "1. Informasi yang diberikan pengguna digunakan untuk mendukung proses pendaftaran, pemesanan, verifikasi, dan pengelolaan layanan Ngelapak.",
        "2. Pengguna bertanggung jawab untuk menjaga kerahasiaan informasi akun dan tidak membagikan kredensial maupun informasi transaksi kepada pihak yang tidak berwenang.",
        "3. Pengelolaan data pengguna dilaksanakan dengan memperhatikan ketentuan perlindungan data pribadi dan kebijakan yang berlaku.",
      ],
    },
    {
      title: "Pasal 9 - Penutup",
      items: [
        "1. Dengan mencentang pernyataan persetujuan pada halaman pemesanan, pengguna menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini.",
        "2. Hal-hal yang belum diatur dalam dokumen ini akan mengikuti kebijakan dan ketentuan resmi Universitas Udayana serta keputusan pengelola yang berwenang.",
        "3. Apabila terdapat perubahan ketentuan, pengguna diharapkan membaca versi terbaru sebelum melakukan pengajuan pemesanan berikutnya.",
      ],
    },
  ],
  closing:
    "Dengan melanjutkan proses pemesanan dan mencentang persetujuan, penyewa menyatakan telah memahami serta bersedia mematuhi ketentuan penggunaan lapak yang berlaku di lingkungan Universitas Udayana.",
};

const STORAGE_KEY = "ngelapak_terms_content";

function getStoredTerms() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribeToTerms(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  }
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function useTermsContent(): TermsContent {
  const raw = useSyncExternalStore(subscribeToTerms, getStoredTerms, () => null);
  if (!raw) return DEFAULT_TERMS;
  try {
    return (JSON.parse(raw) as TermsContent | null) ?? DEFAULT_TERMS;
  } catch {
    return DEFAULT_TERMS;
  }
}

/** Menyimpan konten yang diedit admin ke localStorage. */
export function saveTermsContent(content: TermsContent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

/** Mereset konten ke default. */
export function resetTermsContent() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}
