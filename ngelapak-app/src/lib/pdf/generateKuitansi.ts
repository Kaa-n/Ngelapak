"use client";

import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import type { Booking } from "@/lib/mock-data";

// ============================================================
// Utility functions
// ============================================================

function cleanWinAnsi(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/[•●]/g, "-")
    .replace(/[★☆]/g, "")
    .replace(/[–—―]/g, "-")
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
  return cleanWinAnsi(formatted);
}

function formatTanggal(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return cleanWinAnsi(dateStr);
  return cleanWinAnsi(
    date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar",
    })
  );
}

function formatTanggalWaktu(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return cleanWinAnsi(dateStr);
  return (
    cleanWinAnsi(
      date.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Makassar",
      })
    ) + " WITA"
  );
}

// ============================================================
// PDF Generator (1 Halaman A4 Resmi & Presisi)
// ============================================================

export async function generateKuitansiPdf(
  booking: Booking
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const fontSerif = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontSerifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const fontSans = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Palet Warna Resmi Universitas Udayana
  const cNavy = rgb(0.0, 0.204, 0.4); // #003466
  const cInk = rgb(0.08, 0.11, 0.18); // #141c2e
  const cMuted = rgb(0.38, 0.43, 0.51); // #616e82
  const cBorder = rgb(0.83, 0.87, 0.93); // #d4deed
  const cSurface = rgb(0.97, 0.98, 1.0); // #f7faff
  const cEmeraldBg = rgb(0.92, 0.99, 0.95);
  const cEmeraldBorder = rgb(0.45, 0.82, 0.65);
  const cEmeraldText = rgb(0.04, 0.48, 0.26);
  const cGold = rgb(0.98, 0.78, 0.18);
  const cWhite = rgb(1, 1, 1);

  const page = pdf.addPage(PageSizes.A4); // 595.28 x 841.89 pt
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2; // 499.28 pt

  const safeId = cleanWinAnsi(booking.id);
  pdf.setTitle(`Kuitansi-${safeId}`);
  pdf.setAuthor("Biro Pengelolaan Aset Universitas Udayana");
  pdf.setSubject("Kuitansi Pembayaran Sewa Lapak");

  function drawText(
    raw: string,
    opts: {
      x: number;
      y: number;
      size: number;
      font: any;
      color: any;
      align?: "left" | "center" | "right";
    }
  ) {
    const text = cleanWinAnsi(raw);
    let drawX = opts.x;
    const textW = opts.font.widthOfTextAtSize(text, opts.size);
    if (opts.align === "center") drawX = opts.x - textW / 2;
    else if (opts.align === "right") drawX = opts.x - textW;

    page.drawText(text, {
      x: drawX,
      y: opts.y,
      size: opts.size,
      font: opts.font,
      color: opts.color,
    });
  }

  function drawSectionBar(title: string, yTop: number): number {
    const h = 21;
    page.drawRectangle({
      x: marginX,
      y: yTop - h,
      width: contentWidth,
      height: h,
      color: cNavy,
    });
    drawText(title, {
      x: marginX + 10,
      y: yTop - 14,
      size: 8.5,
      font: fontSansBold,
      color: cWhite,
    });
    return yTop - h;
  }

  // =========================================================================
  // 1. KOP SURAT RESMI
  // =========================================================================
  let y = pageHeight - 44;

  const emblemSize = 44;
  page.drawRectangle({
    x: marginX,
    y: y - emblemSize + 4,
    width: emblemSize,
    height: emblemSize,
    color: cNavy,
  });
  page.drawRectangle({
    x: marginX + 2.5,
    y: y - emblemSize + 6.5,
    width: emblemSize - 5,
    height: emblemSize - 5,
    borderColor: rgb(0.75, 0.83, 0.95),
    borderWidth: 0.7,
  });
  drawText("UNUD", {
    x: marginX + emblemSize / 2,
    y: y - 22,
    size: 11.5,
    font: fontSansBold,
    color: cWhite,
    align: "center",
  });

  const headerCenterX = marginX + emblemSize + (contentWidth - emblemSize) / 2;
  drawText("KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI", {
    x: headerCenterX,
    y: y - 4,
    size: 8.5,
    font: fontSansBold,
    color: cMuted,
    align: "center",
  });
  drawText("UNIVERSITAS UDAYANA", {
    x: headerCenterX,
    y: y - 17,
    size: 14,
    font: fontSerifBold,
    color: cNavy,
    align: "center",
  });
  drawText("BIRO PENGELOLAAN ASET DAN SARANA PRASARANA", {
    x: headerCenterX,
    y: y - 29,
    size: 9.5,
    font: fontSansBold,
    color: cInk,
    align: "center",
  });
  drawText(
    "Kampus Bukit Jimbaran / Jl. PB. Sudirman, Bali  |  Telp. (0361) 701954  |  www.unud.ac.id",
    {
      x: headerCenterX,
      y: y - 40,
      size: 7.5,
      font: fontSans,
      color: cMuted,
      align: "center",
    }
  );

  y -= 50;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1.8,
    color: cNavy,
  });
  page.drawLine({
    start: { x: marginX, y: y - 2.5 },
    end: { x: pageWidth - marginX, y: y - 2.5 },
    thickness: 0.5,
    color: cNavy,
  });

  // =========================================================================
  // 2. JUDUL KUITANSI & LENCANA LUNAS
  // =========================================================================
  y -= 22;
  drawText("KUITANSI PEMBAYARAN SEWA LAPAK", {
    x: pageWidth / 2,
    y,
    size: 13.5,
    font: fontSerifBold,
    color: cInk,
    align: "center",
  });

  y -= 15;
  drawText(`Nomor Referensi: ${safeId}`, {
    x: pageWidth / 2,
    y,
    size: 9,
    font: fontSansBold,
    color: cNavy,
    align: "center",
  });

  y -= 24;
  const badgeW = 148;
  const badgeH = 20;
  const badgeX = (pageWidth - badgeW) / 2;
  page.drawRectangle({
    x: badgeX,
    y,
    width: badgeW,
    height: badgeH,
    color: cEmeraldBg,
    borderColor: cEmeraldBorder,
    borderWidth: 1,
  });
  drawText("STATUS: LUNAS TERVERIFIKASI", {
    x: pageWidth / 2,
    y: y + 6.5,
    size: 8,
    font: fontSansBold,
    color: cEmeraldText,
    align: "center",
  });

  // =========================================================================
  // 3. NOTICE BOX RESMI
  // =========================================================================
  y -= 36;
  const noticeH = 28;
  page.drawRectangle({
    x: marginX,
    y,
    width: contentWidth,
    height: noticeH,
    color: cSurface,
    borderColor: cBorder,
    borderWidth: 0.8,
  });
  drawText(
    "Dokumen Resmi - Kuitansi ini merupakan bukti pembayaran sah yang diterbitkan secara digital oleh",
    {
      x: marginX + 12,
      y: y + 17,
      size: 8,
      font: fontSansBold,
      color: cNavy,
    }
  );
  drawText(
    "Biro Pengelolaan Aset Universitas Udayana melalui Sistem Ngelapak. Simpan dokumen ini sebagai bukti transaksi.",
    {
      x: marginX + 12,
      y: y + 6.5,
      size: 7.8,
      font: fontSans,
      color: cMuted,
    }
  );

  // =========================================================================
  // 4. INFORMASI PENYEWA & DETAIL LAPAK (2 KOLOM SEJAJAR AGAR COMPACT 1 HALAMAN)
  // =========================================================================
  y -= 16;
  const colGap = 14;
  const colW = (contentWidth - colGap) / 2;
  const cardH = 142;

  // --- Kolom Kiri: Informasi Penyewa ---
  page.drawRectangle({
    x: marginX,
    y: y - cardH,
    width: colW,
    height: cardH,
    color: cWhite,
    borderColor: cBorder,
    borderWidth: 0.8,
  });
  page.drawRectangle({
    x: marginX,
    y: y - 21,
    width: colW,
    height: 21,
    color: cNavy,
  });
  drawText("A. INFORMASI PENYEWA", {
    x: marginX + 10,
    y: y - 14,
    size: 8.2,
    font: fontSansBold,
    color: cWhite,
  });

  const penyewaRows = [
    ["Nama", booking.penyewa?.nama || "-"],
    ["NIM / ID", booking.penyewa?.nim || "-"],
    ["Fakultas", booking.penyewa?.fakultas || "Universitas Udayana"],
    ["Telepon", booking.penyewa?.telepon || "-"],
    ["Email", booking.penyewa?.email || "-"],
    ["Usaha", booking.jenisUsaha || "-"],
  ];

  let rowY = y - 35;
  penyewaRows.forEach(([lbl, val]) => {
    drawText(lbl, {
      x: marginX + 10,
      y: rowY,
      size: 8.2,
      font: fontSans,
      color: cMuted,
    });
    drawText(`: ${cleanWinAnsi(val).slice(0, 28)}`, {
      x: marginX + 62,
      y: rowY,
      size: 8.2,
      font: fontSansBold,
      color: cInk,
    });
    rowY -= 18;
  });

  // --- Kolom Kanan: Detail Lapak ---
  const rightX = marginX + colW + colGap;
  page.drawRectangle({
    x: rightX,
    y: y - cardH,
    width: colW,
    height: cardH,
    color: cWhite,
    borderColor: cBorder,
    borderWidth: 0.8,
  });
  page.drawRectangle({
    x: rightX,
    y: y - 21,
    width: colW,
    height: 21,
    color: cNavy,
  });
  drawText("B. DETAIL LAPAK & PERIODE", {
    x: rightX + 10,
    y: y - 14,
    size: 8.2,
    font: fontSansBold,
    color: cWhite,
  });

  const lapakRows = [
    ["Nama Spot", booking.spotNama || "-"],
    ["Kode Spot", booking.spotKode || "-"],
    ["Mulai Sewa", formatTanggal(booking.tanggalMulai)],
    ["Selesai Sewa", formatTanggal(booking.tanggalSelesai)],
    ["Durasi Sewa", `${booking.jumlahHari || 1} Hari Kalender`],
    ["Jam Buka", "08.00 - 21.00 WITA"],
  ];

  rowY = y - 35;
  lapakRows.forEach(([lbl, val], idx) => {
    drawText(lbl, {
      x: rightX + 10,
      y: rowY,
      size: 8.2,
      font: fontSans,
      color: cMuted,
    });
    drawText(`: ${cleanWinAnsi(val).slice(0, 27)}`, {
      x: rightX + 70,
      y: rowY,
      size: 8.2,
      font: fontSansBold,
      color: idx === 1 ? cNavy : cInk,
    });
    rowY -= 18;
  });

  y -= cardH + 18;

  // =========================================================================
  // 5. TABEL RINCIAN PEMBAYARAN
  // =========================================================================
  y = drawSectionBar("C. RINCIAN TRANSAKSI & TOTAL PEMBAYARAN", y);

  const payRows = [
    ["Nomor Transaksi / Kuitansi", safeId, true],
    ["Metode Pembayaran", (booking.metodePembayaran || "Midtrans").toUpperCase(), false],
    ["Waktu Transaksi", formatTanggalWaktu(booking.createdAt), false],
    ["Status Verifikasi Keuangan", "LUNAS TERVERIFIKASI", true],
  ] as const;

  const payRowH = 21;
  payRows.forEach(([lbl, val, isBold], idx) => {
    page.drawRectangle({
      x: marginX,
      y: y - payRowH,
      width: contentWidth,
      height: payRowH,
      color: idx % 2 === 0 ? cWhite : cSurface,
      borderColor: cBorder,
      borderWidth: 0.5,
    });
    drawText(lbl, {
      x: marginX + 12,
      y: y - 14,
      size: 8.5,
      font: fontSans,
      color: cMuted,
    });
    drawText(":", {
      x: marginX + 165,
      y: y - 14,
      size: 8.5,
      font: fontSansBold,
      color: cInk,
    });
    drawText(val, {
      x: marginX + 176,
      y: y - 14,
      size: 8.5,
      font: isBold ? fontSansBold : fontSans,
      color: idx === 3 ? cEmeraldText : cInk,
    });
    y -= payRowH;
  });

  // Baris Total Pembayaran (Highlight Navy + Emas)
  const totalRowH = 28;
  page.drawRectangle({
    x: marginX,
    y: y - totalRowH,
    width: contentWidth,
    height: totalRowH,
    color: cNavy,
  });
  drawText("TOTAL PEMBAYARAN DITERIMA", {
    x: marginX + 12,
    y: y - 18,
    size: 9.5,
    font: fontSansBold,
    color: cWhite,
  });
  drawText(formatRupiah(booking.totalBayar), {
    x: pageWidth - marginX - 14,
    y: y - 18,
    size: 12,
    font: fontSansBold,
    color: cGold,
    align: "right",
  });

  y -= totalRowH + 26;

  // =========================================================================
  // 6. AREA PENGESAHAN & TANDA TANGAN DUA PIHAK
  // =========================================================================
  const sigGap = 20;
  const sigW = (contentWidth - sigGap) / 2;
  const sigH = 128;
  const sigLeftX = marginX;
  const sigRightX = marginX + sigW + sigGap;

  // --- Kiri: Penyewa ---
  page.drawRectangle({
    x: sigLeftX,
    y: y - sigH,
    width: sigW,
    height: sigH,
    color: cWhite,
    borderColor: cBorder,
    borderWidth: 0.8,
  });
  drawText("Penyewa / Penyetor,", {
    x: sigLeftX + sigW / 2,
    y: y - 16,
    size: 8.5,
    font: fontSansBold,
    color: cInk,
    align: "center",
  });
  drawText(`Denpasar, ${formatTanggal(booking.createdAt)}`, {
    x: sigLeftX + sigW / 2,
    y: y - 28,
    size: 8,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  page.drawLine({
    start: { x: sigLeftX + 34, y: y - 84 },
    end: { x: sigLeftX + sigW - 34, y: y - 84 },
    thickness: 0.7,
    color: cBorder,
  });
  drawText("(Tanda Tangan Penyewa)", {
    x: sigLeftX + sigW / 2,
    y: y - 78,
    size: 7,
    font: fontSerifItalic,
    color: cMuted,
    align: "center",
  });

  drawText(booking.penyewa?.nama || "-", {
    x: sigLeftX + sigW / 2,
    y: y - 99,
    size: 9.5,
    font: fontSerifBold,
    color: cInk,
    align: "center",
  });
  drawText(`NIM. ${booking.penyewa?.nim || "-"}`, {
    x: sigLeftX + sigW / 2,
    y: y - 112,
    size: 8,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  // --- Kanan: Pejabat Biro Aset ---
  page.drawRectangle({
    x: sigRightX,
    y: y - sigH,
    width: sigW,
    height: sigH,
    color: cSurface,
    borderColor: cBorder,
    borderWidth: 0.8,
  });
  drawText("Hormat Kami,", {
    x: sigRightX + sigW / 2,
    y: y - 16,
    size: 8.5,
    font: fontSansBold,
    color: cNavy,
    align: "center",
  });
  drawText("Biro Pengelolaan Aset Universitas Udayana", {
    x: sigRightX + sigW / 2,
    y: y - 28,
    size: 8,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  // Lencana Stempel Digital Resmi
  const stampW = 162;
  const stampH = 34;
  const stampX = sigRightX + (sigW - stampW) / 2;
  const stampY = y - 74;
  page.drawRectangle({
    x: stampX,
    y: stampY,
    width: stampW,
    height: stampH,
    color: rgb(0.92, 0.95, 1.0),
    borderColor: cNavy,
    borderWidth: 0.9,
  });
  drawText("TERVERIFIKASI DIGITAL - BIRO ASET UNUD", {
    x: sigRightX + sigW / 2,
    y: stampY + 21,
    size: 6.6,
    font: fontSansBold,
    color: cNavy,
    align: "center",
  });
  drawText(`REF: ${safeId.slice(0, 24)}`, {
    x: sigRightX + sigW / 2,
    y: stampY + 9,
    size: 6.3,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  drawText("Kepala Biro Pengelolaan Aset", {
    x: sigRightX + sigW / 2,
    y: y - 99,
    size: 9.5,
    font: fontSerifBold,
    color: cInk,
    align: "center",
  });
  drawText("Universitas Udayana", {
    x: sigRightX + sigW / 2,
    y: y - 112,
    size: 8,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  // =========================================================================
  // 7. FOOTER RESMI (DI BAGIAN BAWAH HALAMAN 1)
  // =========================================================================
  const tanggalCetak = formatTanggalWaktu(new Date().toISOString());
  page.drawLine({
    start: { x: marginX, y: 46 },
    end: { x: pageWidth - marginX, y: 46 },
    thickness: 0.6,
    color: cBorder,
  });
  drawText(
    `Dicetak pada: ${tanggalCetak}  |  No. Referensi: ${safeId}`,
    {
      x: pageWidth / 2,
      y: 34,
      size: 7.5,
      font: fontSansBold,
      color: cMuted,
      align: "center",
    }
  );
  drawText(
    "Dokumen ini diterbitkan secara digital oleh Sistem Ngelapak - Biro Pengelolaan Aset Universitas Udayana.",
    {
      x: pageWidth / 2,
      y: 23,
      size: 7.2,
      font: fontSans,
      color: cMuted,
      align: "center",
    }
  );

  return pdf.save();
}

// ============================================================
// Direct PDF Download Function 
// ============================================================

export async function printKuitansi(booking: Booking): Promise<void> {
  const pdfBytes = await generateKuitansiPdf(booking);
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `Kuitansi-${cleanWinAnsi(booking.id)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}