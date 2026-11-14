"use client";

import type { Booking } from "@/lib/mock-data";

// ============================================================
// Utility functions (inline to avoid client/server issues)
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
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " WITA";
}

// ============================================================
// HTML Generator
// ============================================================

export function generateKuitansiHTML(booking: Booking): string {
  const now = new Date();
  const tanggalCetak = formatTanggalWaktu(now.toISOString());

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kuitansi Pembayaran - ${booking.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000000;
      background: #ffffff;
      padding: 20mm 20mm;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      border-bottom: 3px solid #003466;
      padding-bottom: 12px;
      margin-bottom: 8px;
    }
    .header-logo {
      width: 70px;
      height: 70px;
      border: 2px solid #003466;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      flex-shrink: 0;
      background: #003466;
      color: #ffffff;
      font-size: 9pt;
      font-weight: bold;
      text-align: center;
      line-height: 1.2;
      padding: 6px;
    }
    .header-text {
      flex: 1;
    }
    .header-univ {
      font-size: 16pt;
      font-weight: bold;
      color: #003466;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-dept {
      font-size: 11pt;
      color: #003466;
      margin-top: 2px;
    }
    .header-addr {
      font-size: 9pt;
      color: #555555;
      margin-top: 3px;
    }
    .header-sub {
      font-size: 8pt;
      color: #777777;
    }
    .sub-border {
      border-bottom: 1px solid #003466;
      margin-bottom: 20px;
      padding-bottom: 4px;
    }

    /* Title */
    .title-section {
      text-align: center;
      margin-bottom: 20px;
    }
    .title-main {
      font-size: 15pt;
      font-weight: bold;
      color: #003466;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .title-sub {
      font-size: 10pt;
      color: #333333;
      margin-top: 4px;
    }

    /* Status badge */
    .status-lunas {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 2px solid #16a34a;
      border-radius: 20px;
      padding: 4px 20px;
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 2px;
      margin-top: 8px;
    }

    /* Detail table */
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11pt;
    }
    .detail-table th {
      background-color: #003466;
      color: #ffffff;
      text-align: left;
      padding: 8px 12px;
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .detail-table td {
      padding: 7px 12px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: top;
    }
    .detail-table tr:nth-child(even) td {
      background-color: #f5f8ff;
    }
    .label-col {
      width: 42%;
      color: #333333;
      font-weight: 600;
    }
    .sep-col {
      width: 3%;
      color: #666666;
      text-align: center;
    }
    .value-col {
      width: 55%;
      color: #111111;
    }
    .total-row td {
      background-color: #003466 !important;
      color: #ffffff !important;
      font-weight: bold;
      font-size: 13pt;
      padding: 10px 12px;
    }
    .total-row .value-col {
      color: #fbbf24 !important;
    }

    /* Section header */
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #003466;
      border-left: 4px solid #003466;
      padding-left: 8px;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Signature area */
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      gap: 20px;
    }
    .signature-block {
      flex: 1;
      text-align: center;
    }
    .signature-label {
      font-size: 10pt;
      color: #333333;
      margin-bottom: 4px;
    }
    .signature-place-date {
      font-size: 10pt;
      color: #555555;
      margin-bottom: 48px;
    }
    .signature-name {
      font-size: 10pt;
      font-weight: bold;
      color: #000000;
      border-top: 1px solid #000000;
      padding-top: 6px;
      margin-top: 4px;
    }
    .signature-title {
      font-size: 9pt;
      color: #555555;
    }

    /* Footer */
    .footer {
      margin-top: 24px;
      border-top: 1px dashed #aaaaaa;
      padding-top: 10px;
      font-size: 8.5pt;
      color: #777777;
      text-align: center;
    }
    .footer strong {
      color: #555555;
    }

    /* Watermark-style notice box */
    .notice-box {
      border: 1px solid #c3dafe;
      background: #eff6ff;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 9pt;
      color: #1e40af;
    }

    @media print {
      body { padding: 0; }
      .page { max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <div class="header-logo">UNUD</div>
      <div class="header-text">
        <div class="header-univ">Universitas Udayana</div>
        <div class="header-dept">Biro Pengelolaan Aset</div>
        <div class="header-addr">Kampus Jl. PB. Sudirman, Denpasar, Bali 80232</div>
        <div class="header-sub">Telp. (0361) 701954 &nbsp;|&nbsp; Website: www.unud.ac.id</div>
      </div>
    </div>
    <div class="sub-border"></div>

    <!-- TITLE -->
    <div class="title-section">
      <div class="title-main">Kuitansi Pembayaran Sewa Lapak</div>
      <div class="title-sub">Nomor: ${booking.id}</div>
      <div>
        <span class="status-lunas">&#10003; LUNAS</span>
      </div>
    </div>

    <!-- NOTICE -->
    <div class="notice-box">
      <strong>Dokumen Resmi</strong> &mdash; Kuitansi ini merupakan bukti pembayaran sah yang diterbitkan oleh
      Biro Pengelolaan Aset Universitas Udayana. Simpan dokumen ini sebagai bukti transaksi Anda.
    </div>

    <!-- INFORMASI PENYEWA -->
    <div class="section-title">Informasi Penyewa</div>
    <table class="detail-table">
      <tr>
        <td class="label-col">Nama Lengkap</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.penyewa.nama}</td>
      </tr>
      <tr>
        <td class="label-col">NIM</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.penyewa.nim}</td>
      </tr>
      <tr>
        <td class="label-col">Fakultas</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.penyewa.fakultas}</td>
      </tr>
      <tr>
        <td class="label-col">Telepon</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.penyewa.telepon}</td>
      </tr>
      <tr>
        <td class="label-col">Email</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.penyewa.email}</td>
      </tr>
      <tr>
        <td class="label-col">Jenis Usaha</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.jenisUsaha}</td>
      </tr>
    </table>

    <!-- DETAIL LAPAK -->
    <div class="section-title">Detail Lapak</div>
    <table class="detail-table">
      <tr>
        <td class="label-col">Nama Lapak</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.spotNama}</td>
      </tr>
      <tr>
        <td class="label-col">Kode Spot</td>
        <td class="sep-col">:</td>
        <td class="value-col"><strong>${booking.spotKode}</strong></td>
      </tr>
      <tr>
        <td class="label-col">Periode Sewa</td>
        <td class="sep-col">:</td>
        <td class="value-col">
          ${formatTanggal(booking.tanggalMulai)} &ndash; ${formatTanggal(booking.tanggalSelesai)}
        </td>
      </tr>
      <tr>
        <td class="label-col">Jumlah Hari</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.jumlahHari} hari</td>
      </tr>
    </table>

    <!-- INFORMASI PEMBAYARAN -->
    <div class="section-title">Informasi Pembayaran</div>
    <table class="detail-table">
      <tr>
        <td class="label-col">Metode Pembayaran</td>
        <td class="sep-col">:</td>
        <td class="value-col">${booking.metodePembayaran}</td>
      </tr>
      <tr>
        <td class="label-col">Tanggal Transaksi</td>
        <td class="sep-col">:</td>
        <td class="value-col">${formatTanggalWaktu(booking.createdAt)}</td>
      </tr>
      <tr>
        <td class="label-col">Status Pembayaran</td>
        <td class="sep-col">:</td>
        <td class="value-col" style="color:#15803d;font-weight:bold;">LUNAS</td>
      </tr>
      <tr class="total-row">
        <td class="label-col">TOTAL PEMBAYARAN</td>
        <td class="sep-col">:</td>
        <td class="value-col">${formatRupiah(booking.totalBayar)}</td>
      </tr>
    </table>

    <!-- SIGNATURE -->
    <div class="signature-section">
      <div class="signature-block">
        <div class="signature-label">Penyewa,</div>
        <div class="signature-place-date">Denpasar, ${formatTanggal(booking.createdAt)}</div>
        <div class="signature-name">${booking.penyewa.nama}</div>
        <div class="signature-title">NIM. ${booking.penyewa.nim}</div>
      </div>
      <div class="signature-block">
        <div class="signature-label">Hormat Kami,</div>
        <div class="signature-place-date" style="font-style:italic;">Biro Pengelolaan Aset<br/>Universitas Udayana</div>
        <div class="signature-name">Kepala Biro Pengelolaan Aset</div>
        <div class="signature-title">Universitas Udayana</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <strong>Dicetak pada:</strong> ${tanggalCetak} &nbsp;&bull;&nbsp;
      <strong>No. Referensi:</strong> ${booking.id} &nbsp;&bull;&nbsp;
      Dokumen ini diterbitkan secara digital oleh Sistem Ngelapak &mdash; Universitas Udayana.<br/>
      Untuk verifikasi, hubungi Biro Pengelolaan Aset Unud.
    </div>

  </div>
</body>
</html>`;
}

// ============================================================
// Print Function
// ============================================================

export function printKuitansi(booking: Booking): void {
  const html = generateKuitansiHTML(booking);
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Popup diblokir. Izinkan popup untuk mencetak kuitansi.");
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
