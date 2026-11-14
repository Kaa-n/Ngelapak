"use client";

import type { Booking } from "@/lib/mock-data";

// ============================================================
// Utility helpers
// ============================================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTanggal(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTanggalWaktu(dateStr: string): string {
  const date = new Date(dateStr);
  return (
    date.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WITA"
  );
}

// ============================================================
// SVG QR Code Generator (Standar Visual QR untuk Cetak)
// ============================================================

function renderQRCodeSVG(text: string): string {
  // Menghasilkan representasi visual QR code terstruktur dengan position marker standar
  // Marker di 3 sudut (top-left, top-right, bottom-left) + pattern sync
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="88" height="88" style="display:block; margin: 0 auto;" aria-label="QR Code ${text}">
      <title>${text}</title>
      <!-- Background -->
      <rect width="100" height="100" fill="#ffffff"/>
      
      <!-- Top-Left Finder Pattern -->
      <rect x="6" y="6" width="28" height="28" fill="#003466" rx="2"/>
      <rect x="11" y="11" width="18" height="18" fill="#ffffff" rx="1"/>
      <rect x="15" y="15" width="10" height="10" fill="#003466" rx="1"/>
      
      <!-- Top-Right Finder Pattern -->
      <rect x="66" y="6" width="28" height="28" fill="#003466" rx="2"/>
      <rect x="71" y="11" width="18" height="18" fill="#ffffff" rx="1"/>
      <rect x="75" y="15" width="10" height="10" fill="#003466" rx="1"/>
      
      <!-- Bottom-Left Finder Pattern -->
      <rect x="6" y="66" width="28" height="28" fill="#003466" rx="2"/>
      <rect x="11" y="71" width="18" height="18" fill="#ffffff" rx="1"/>
      <rect x="15" y="75" width="10" height="10" fill="#003466" rx="1"/>
      
      <!-- Timing Lines -->
      <rect x="38" y="18" width="4" height="4" fill="#003466"/>
      <rect x="46" y="18" width="4" height="4" fill="#003466"/>
      <rect x="54" y="18" width="4" height="4" fill="#003466"/>
      <rect x="18" y="38" width="4" height="4" fill="#003466"/>
      <rect x="18" y="46" width="4" height="4" fill="#003466"/>
      <rect x="18" y="54" width="4" height="4" fill="#003466"/>
      
      <!-- Data Pattern Blocks -->
      <rect x="38" y="28" width="5" height="5" fill="#003466"/>
      <rect x="48" y="28" width="5" height="5" fill="#003466"/>
      <rect x="58" y="28" width="5" height="5" fill="#003466"/>
      
      <rect x="30" y="38" width="6" height="6" fill="#003466"/>
      <rect x="42" y="38" width="6" height="6" fill="#003466"/>
      <rect x="54" y="38" width="6" height="6" fill="#003466"/>
      <rect x="66" y="38" width="6" height="6" fill="#003466"/>
      <rect x="78" y="38" width="6" height="6" fill="#003466"/>
      <rect x="88" y="38" width="6" height="6" fill="#003466"/>
      
      <rect x="30" y="50" width="6" height="6" fill="#003466"/>
      <rect x="42" y="48" width="6" height="6" fill="#003466"/>
      <rect x="52" y="50" width="6" height="6" fill="#003466"/>
      <rect x="66" y="48" width="6" height="6" fill="#003466"/>
      <rect x="76" y="52" width="6" height="6" fill="#003466"/>
      <rect x="88" y="50" width="6" height="6" fill="#003466"/>
      
      <rect x="30" y="62" width="6" height="6" fill="#003466"/>
      <rect x="44" y="62" width="6" height="6" fill="#003466"/>
      <rect x="56" y="62" width="6" height="6" fill="#003466"/>
      <rect x="68" y="62" width="6" height="6" fill="#003466"/>
      <rect x="80" y="62" width="6" height="6" fill="#003466"/>
      
      <rect x="38" y="74" width="6" height="6" fill="#003466"/>
      <rect x="50" y="74" width="6" height="6" fill="#003466"/>
      <rect x="62" y="74" width="6" height="6" fill="#003466"/>
      <rect x="74" y="74" width="6" height="6" fill="#003466"/>
      <rect x="86" y="74" width="6" height="6" fill="#003466"/>
      
      <rect x="38" y="86" width="6" height="6" fill="#003466"/>
      <rect x="48" y="86" width="6" height="6" fill="#003466"/>
      <rect x="64" y="86" width="6" height="6" fill="#003466"/>
      <rect x="78" y="86" width="6" height="6" fill="#003466"/>
      <rect x="88" y="86" width="6" height="6" fill="#003466"/>
    </svg>
  `;
}

// ============================================================
// HTML Generator Kontrak SPPLA
// ============================================================

export function generateSPPLAHTML(booking: Booking): string {
  const currentYear = new Date().getFullYear();
  const docNumber = `SPPLA/UNUD/${currentYear}/${booking.id}`;
  const validationUrl = `/validasi/${booking.id}`;
  const qrSvg = renderQRCodeSVG(booking.id);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Surat Perjanjian Sewa Lahan - ${booking.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111111;
      background: #ffffff;
      padding: 16mm 20mm;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
    }

    /* KOP SURAT RESMI UNUD */
    .kop-wrapper {
      display: flex;
      align-items: center;
      border-bottom: 3px double #003466;
      padding-bottom: 10px;
      margin-bottom: 18px;
    }
    .kop-logo {
      width: 68px;
      height: 68px;
      border: 2px solid #003466;
      border-radius: 50%;
      background: #003466;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12pt;
      letter-spacing: 1px;
      margin-right: 18px;
      flex-shrink: 0;
    }
    .kop-text {
      flex: 1;
      text-align: center;
    }
    .kop-instansi {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #003466;
    }
    .kop-univ {
      font-size: 15pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #003466;
    }
    .kop-biro {
      font-size: 12pt;
      font-weight: bold;
      color: #111111;
      margin-top: 1px;
    }
    .kop-alamat {
      font-size: 8.5pt;
      color: #444444;
      margin-top: 3px;
    }

    /* JUDUL SURAT */
    .judul-surat {
      text-align: center;
      margin-bottom: 16px;
    }
    .judul-surat h1 {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #003466;
      text-decoration: underline;
    }
    .judul-surat p {
      font-size: 9.5pt;
      color: #333333;
      margin-top: 3px;
    }

    /* PARAGRAF & PASAL */
    .p-intro {
      text-align: justify;
      margin-bottom: 10px;
      font-size: 10.5pt;
    }
    .pihak-box {
      margin-left: 12px;
      margin-bottom: 10px;
      font-size: 10.5pt;
    }
    .pihak-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2px;
      margin-bottom: 6px;
    }
    .pihak-table td {
      padding: 1.5px 4px;
      vertical-align: top;
    }
    .pihak-table .lbl {
      width: 130px;
      color: #333333;
    }
    .pihak-table .sep {
      width: 15px;
      text-align: center;
    }

    .pasal-title {
      font-weight: bold;
      text-align: center;
      margin-top: 14px;
      margin-bottom: 4px;
      font-size: 10.5pt;
      text-transform: uppercase;
      color: #003466;
    }
    .pasal-sub {
      text-align: center;
      font-weight: bold;
      font-size: 10.5pt;
      margin-bottom: 6px;
    }
    .pasal-content {
      text-align: justify;
      margin-bottom: 10px;
      font-size: 10pt;
    }
    .pasal-list {
      margin-left: 20px;
      margin-bottom: 8px;
      font-size: 10pt;
      text-align: justify;
    }
    .pasal-list li {
      margin-bottom: 4px;
    }

    /* KOTAK RINGKASAN SPOT */
    .spot-highlight {
      background: #f4f7fb;
      border: 1px solid #c9d7ec;
      border-radius: 6px;
      padding: 8px 14px;
      margin: 8px 0;
      font-size: 10pt;
    }

    /* TANDA TANGAN & QR */
    .sign-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .sign-box {
      width: 32%;
      text-align: center;
      font-size: 9.5pt;
    }
    .sign-space {
      height: 60px;
      position: relative;
    }
    .stempel-digital {
      position: absolute;
      top: 5px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 80px;
      border: 2px dashed #003466;
      border-radius: 50%;
      color: #003466;
      font-size: 7.5pt;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      opacity: 0.65;
      pointer-events: none;
      line-height: 1.1;
    }
    .sign-name {
      font-weight: bold;
      border-top: 1px solid #111111;
      padding-top: 4px;
      margin-top: 4px;
    }

    .qr-box {
      width: 30%;
      text-align: center;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 8px;
      background: #fafbfc;
    }
    .qr-title {
      font-size: 8pt;
      font-weight: bold;
      color: #003466;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .qr-code-holder {
      margin: 4px auto;
    }
    .qr-id {
      font-family: monospace;
      font-size: 7.5pt;
      color: #24292f;
      font-weight: bold;
      word-break: break-all;
      margin-top: 3px;
    }
    .qr-desc {
      font-size: 7pt;
      color: #57606a;
      line-height: 1.2;
      margin-top: 2px;
    }

    /* FOOTER */
    .doc-footer {
      margin-top: 20px;
      border-top: 1px solid #d0d7de;
      padding-top: 8px;
      font-size: 7.5pt;
      color: #6e7781;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body {
        padding: 0;
      }
      .page {
        max-width: 100%;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- KOP SURAT RESMI -->
    <div class="kop-wrapper">
      <div class="kop-logo">UNUD</div>
      <div class="kop-text">
        <div class="kop-instansi">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
        <div class="kop-univ">UNIVERSITAS UDAYANA</div>
        <div class="kop-biro">BIRO PENGELOLAAN ASET DAN SARANA PRASARANA</div>
        <div class="kop-alamat">
          Gedung Rektorat Kampus Bukit Jimbaran, Badung - Bali 80361<br />
          Telepon: (0361) 701954 | Surel: pengelola.aset@unud.ac.id | Laman: www.unud.ac.id
        </div>
      </div>
    </div>

    <!-- JUDUL -->
    <div class="judul-surat">
      <h1>SURAT PERJANJIAN PEMANFAATAN LAHAN ASET (SPPLA)</h1>
      <p>Nomor: <strong>${docNumber}</strong></p>
    </div>

    <!-- PEMBUKA -->
    <p class="p-intro">
      Pada hari ini, bertempat di Kampus Universitas Udayana, para pihak yang bertanda tangan di bawah ini:
    </p>

    <!-- PIHAK PERTAMA -->
    <div class="pihak-box">
      <strong>I. PIHAK PERTAMA (Pengelola Lahan Kampus):</strong>
      <table class="pihak-table">
        <tr>
          <td class="lbl">Nama Pejabat</td>
          <td class="sep">:</td>
          <td><strong>Dr. Ir. I Ketut Suartana, M.T.</strong></td>
        </tr>
        <tr>
          <td class="lbl">Jabatan</td>
          <td class="sep">:</td>
          <td>Kepala Biro Pengelolaan Aset Universitas Udayana</td>
        </tr>
        <tr>
          <td class="lbl">Instansi</td>
          <td class="sep">:</td>
          <td>Universitas Udayana (Selaku Kuasa Pengguna Barang Milik Negara)</td>
        </tr>
      </table>
      <p class="p-intro" style="margin-left: 4px; font-style: italic;">
        Dalam hal ini bertindak untuk dan atas nama Universitas Udayana, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.
      </p>
    </div>

    <!-- PIHAK KEDUA -->
    <div class="pihak-box">
      <strong>II. PIHAK KEDUA (Penyewa / Pemanfaat Stan Lapak):</strong>
      <table class="pihak-table">
        <tr>
          <td class="lbl">Nama Lengkap</td>
          <td class="sep">:</td>
          <td><strong>${booking.penyewa.nama}</strong></td>
        </tr>
        <tr>
          <td class="lbl">NIM / Identitas</td>
          <td class="sep">:</td>
          <td>${booking.penyewa.nim}</td>
        </tr>
        <tr>
          <td class="lbl">Fakultas / Unit</td>
          <td class="sep">:</td>
          <td>${booking.penyewa.fakultas}</td>
        </tr>
        <tr>
          <td class="lbl">Nomor Telepon / WA</td>
          <td class="sep">:</td>
          <td>${booking.penyewa.telepon}</td>
        </tr>
        <tr>
          <td class="lbl">Jenis Usaha / Stan</td>
          <td class="sep">:</td>
          <td><strong>${booking.jenisUsaha}</strong></td>
        </tr>
      </table>
      <p class="p-intro" style="margin-left: 4px; font-style: italic;">
        Dalam hal ini bertindak atas nama perseorangan / kelompok wirausaha mahasiswa, selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.
      </p>
    </div>

    <p class="p-intro">
      PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut <strong>PARA PIHAK</strong>, dengan ini menyatakan sepakat untuk mengikatkan diri dalam Surat Perjanjian Pemanfaatan Lahan Aset (SPPLA) dengan ketentuan dan syarat-syarat sebagai berikut:
    </p>

    <!-- PASAL 1 -->
    <div class="pasal-title">Pasal 1</div>
    <div class="pasal-sub">OBJEK DAN JANGKA WAKTU PEMANFAATAN</div>
    <div class="spot-highlight">
      <strong>Titik Lapak:</strong> ${booking.spotNama} (Kode Titik: <strong>${booking.spotKode}</strong>)<br />
      <strong>Masa Berlaku Sewa:</strong> ${formatTanggal(booking.tanggalMulai)} s/d ${formatTanggal(booking.tanggalSelesai)} (${booking.jumlahHari} hari operasional)
    </div>
    <ol class="pasal-list">
      <li>PIHAK PERTAMA mengizinkan PIHAK KEDUA untuk mendirikan dan mengoperasikan stan wirausaha temporer pada titik lokasi yang telah ditetapkan.</li>
      <li>PIHAK KEDUA wajib mematuhi batas wilayah kavling yang telah ditentukan dan tidak diperkenankan memperluas batas titik stan tanpa izin tertulis.</li>
    </ol>

    <!-- PASAL 2 -->
    <div class="pasal-title">Pasal 2</div>
    <div class="pasal-sub">TARIF SEWA DAN TATA CARA PEMBAYARAN</div>
    <ol class="pasal-list">
      <li>Biaya pemanfaatan lahan ditetapkan sebesar <strong>${formatRupiah(booking.totalBayar)}</strong> dan telah dibayarkan lunas oleh PIHAK KEDUA.</li>
      <li>Transaksi pembayaran tercatat resmi melalui sistem Ngelapak dengan metode <strong>${booking.metodePembayaran}</strong> pada tanggal <strong>${formatTanggalWaktu(booking.createdAt)}</strong> (Nomor Transaksi: <code>${booking.id}</code>).</li>
    </ol>

    <!-- PASAL 3 -->
    <div class="pasal-title">Pasal 3</div>
    <div class="pasal-sub">TATA TERTIB KEBERSIHAN DAN PENGGUNAAN DAYA LISTRIK</div>
    <ol class="pasal-list">
      <li><strong>Kebersihan Lingkungan:</strong> PIHAK KEDUA wajib menyediakan kantong/tempat sampah mandiri pada area stan dan membersihkan sampah dalam radius 3 meter sebelum meninggalkan lokasi setiap harinya.</li>
      <li><strong>Limbah & Cairan:</strong> Dilarang keras membuang minyak jelantah, sisa kuah, atau air sabun ke area resapan taman dan saluran drainase permukaan kampus.</li>
      <li><strong>Daya Listrik:</strong> Batas beban daya listrik yang diizinkan adalah maksimal 450 Watt per titik lapak. Dilarang menyambung jalur instalasi secara ilegal tanpa persetujuan teknisi Biro Sarana Prasarana.</li>
    </ol>

    <!-- PASAL 4 -->
    <div class="pasal-title">Pasal 4</div>
    <div class="pasal-sub">SANKSI DAN PEMBATALAN PERJANJIAN</div>
    <ol class="pasal-list">
      <li>Pelanggaran ringan terhadap tata tertib kebersihan dan daya listrik akan dikenakan teguran lisan hingga Surat Peringatan (SP).</li>
      <li>Pelanggaran berat, berupa perusakan fasilitas kampus, penjualan minuman keras, narkotika, atau barang berbahaya, berakibat pada pembatalan izin seketika tanpa pengembalian biaya sewa, serta dilaporkan ke Komisi Etik Universitas Udayana.</li>
    </ol>

    <!-- PASAL 5 -->
    <div class="pasal-title">Pasal 5</div>
    <div class="pasal-sub">VALIDASI DIGITAL DAN PATROLI LAPANGAN</div>
    <p class="pasal-content">
      Surat perjanjian ini diterbitkan secara sah dan dilindungi dengan QR Code validasi resmi. Petugas Satuan Pengamanan (Satpam) dan Pengawas Ketertiban Kampus berhak melakukan inspeksi keabsahan izin stan di lapangan sewaktu-waktu dengan memindai kode validasi digital yang tertera pada dokumen ini.
    </p>

    <!-- PENUTUP & TANDA TANGAN -->
    <p class="p-intro" style="margin-top: 12px;">
      Demikian Surat Perjanjian Pemanfaatan Lahan Aset ini dibuat dan disepakati secara sadar untuk ditaati sepenuhnya oleh PARA PIHAK.
    </p>

    <div class="sign-section">
      <!-- PIHAK PERTAMA -->
      <div class="sign-box">
        <p>PIHAK PERTAMA,</p>
        <p style="font-size: 8pt; color: #555555; margin-bottom: 2px;">Biro Pengelolaan Aset UNUD</p>
        <div class="sign-space">
          <div class="stempel-digital">
            BIRO ASET<br />★ UNUD ★<br />TERVERIFIKASI
          </div>
        </div>
        <p class="sign-name">Dr. Ir. I Ketut Suartana, M.T.</p>
        <p style="font-size: 8pt; color: #666666;">NIP. 197405121999031002</p>
      </div>

      <!-- QR VALIDASI LAPANGAN -->
      <div class="qr-box">
        <div class="qr-title">Validasi Petugas Lapangan</div>
        <div class="qr-code-holder">
          ${qrSvg}
        </div>
        <div class="qr-id">${booking.id}</div>
        <div class="qr-desc">
          Pindai atau akses <code>${validationUrl}</code> untuk verifikasi izin stan aktif di portal pengawas Satpam UNUD.
        </div>
      </div>

      <!-- PIHAK KEDUA -->
      <div class="sign-box">
        <p>PIHAK KEDUA,</p>
        <p style="font-size: 8pt; color: #555555; margin-bottom: 2px;">Penyewa Lahan Mahasiswa</p>
        <div class="sign-space"></div>
        <p class="sign-name">${booking.penyewa.nama}</p>
        <p style="font-size: 8pt; color: #666666;">NIM. ${booking.penyewa.nim}</p>
      </div>
    </div>

    <!-- FOOTER RESMI -->
    <div class="doc-footer">
      <span>Dokumen Resmi Biro Pengelolaan Aset Universitas Udayana &bull; Ngelapak Digital Campus Portal</span>
      <span>Tercetak: ${formatTanggalWaktu(new Date().toISOString())}</span>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// Print Function
// ============================================================

export function printSPPLA(booking: Booking): void {
  const html = generateSPPLAHTML(booking);
  const printWindow = window.open("", "_blank", "width=920,height=720");
  if (!printWindow) {
    alert("Popup diblokir. Izinkan popup pada peramban Anda untuk mencetak kontrak SPPLA.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
