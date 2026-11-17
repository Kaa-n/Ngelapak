"use client";

import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import type { Booking } from "@/lib/mock-data";

function cleanWinAnsi(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/[•●]/g, "-")
    .replace(/[–—―]/g, "-")
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRupiah(amount: number): string {
  return cleanWinAnsi(
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0),
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
      }),
    ) + " WITA"
  );
}

function formatTanggal(dateStr: string): string {
  const date = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return cleanWinAnsi(dateStr);
  return cleanWinAnsi(
    date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar",
    }),
  );
}

function decisionLabel(booking: Booking): string {
  const status = booking.pembatalan?.status ?? "menunggu";
  if (status === "disetujui") {
    return booking.pembatalan?.refundCompleted
      ? "Disetujui - Refund selesai"
      : "Disetujui - Menunggu pengembalian dana";
  }
  if (status === "ditolak") return "Ditolak";
  return "Menunggu - Disetujui / Ditolak";
}

export async function generateBuktiPembatalanPdf(booking: Booking): Promise<Uint8Array> {
  const pembatalan = booking.pembatalan;
  if (!pembatalan) {
    throw new Error("Data pengajuan pembatalan tidak ditemukan.");
  }

  const pdf = await PDFDocument.create();
  const fontSerifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontSans = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const cNavy = rgb(0.0, 0.204, 0.4);
  const cInk = rgb(0.08, 0.11, 0.18);
  const cMuted = rgb(0.38, 0.43, 0.51);
  const cBorder = rgb(0.83, 0.87, 0.93);
  const cSurface = rgb(0.97, 0.98, 1.0);
  const cOrangeBg = rgb(1, 0.96, 0.92);
  const cOrangeBorder = rgb(0.98, 0.75, 0.45);
  const cOrangeText = rgb(0.55, 0.27, 0.07);
  const cWhite = rgb(1, 1, 1);

  const page = pdf.addPage(PageSizes.A4);
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;

  const safeId = cleanWinAnsi(booking.id);
  pdf.setTitle(`Bukti-Pembatalan-${safeId}`);
  pdf.setAuthor("Biro Pengelolaan Aset Universitas Udayana");
  pdf.setSubject("Bukti Pengajuan Pembatalan & Pengembalian Dana");

  function drawText(
    raw: string,
    opts: {
      x: number;
      y: number;
      size: number;
      font: typeof fontSans;
      color: ReturnType<typeof rgb>;
      align?: "left" | "center" | "right";
    },
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

  function drawRow(
    label: string,
    value: string,
    yTop: number,
    opts?: { emphasize?: boolean },
  ): number {
    const rowH = 22;
    page.drawRectangle({
      x: marginX,
      y: yTop - rowH,
      width: contentWidth,
      height: rowH,
      borderColor: cBorder,
      borderWidth: 0.6,
      color: cSurface,
    });
    drawText(label, {
      x: marginX + 10,
      y: yTop - 14,
      size: 8,
      font: fontSans,
      color: cMuted,
    });
    drawText(value || "-", {
      x: marginX + 180,
      y: yTop - 14,
      size: opts?.emphasize ? 9.5 : 8.5,
      font: opts?.emphasize ? fontSansBold : fontSans,
      color: opts?.emphasize ? cNavy : cInk,
    });
    return yTop - rowH;
  }

  let y = pageHeight - 44;

  const emblemSize = 44;
  page.drawRectangle({
    x: marginX,
    y: y - emblemSize + 4,
    width: emblemSize,
    height: emblemSize,
    color: cNavy,
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
  drawText("Sistem Ngelapak - Bukti Pengajuan Pembatalan Sewa Lapak", {
    x: headerCenterX,
    y: y - 42,
    size: 8,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  y -= 58;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1.4,
    color: cNavy,
  });

  y -= 28;
  drawText("BUKTI PENGAJUAN PEMBATALAN", {
    x: pageWidth / 2,
    y,
    size: 13,
    font: fontSansBold,
    color: cNavy,
    align: "center",
  });
  y -= 16;
  drawText(`Nomor Pesanan: ${safeId}`, {
    x: pageWidth / 2,
    y,
    size: 9,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  y -= 24;
  const refundBoxH = 54;
  page.drawRectangle({
    x: marginX,
    y: y - refundBoxH,
    width: contentWidth,
    height: refundBoxH,
    color: cOrangeBg,
    borderColor: cOrangeBorder,
    borderWidth: 1,
  });
  drawText("Jumlah uang yang harus dikembalikan", {
    x: marginX + 14,
    y: y - 18,
    size: 8,
    font: fontSans,
    color: cOrangeText,
  });
  drawText(formatRupiah(booking.totalBayar), {
    x: marginX + 14,
    y: y - 38,
    size: 16,
    font: fontSansBold,
    color: cNavy,
  });
  drawText(decisionLabel(booking), {
    x: pageWidth - marginX - 14,
    y: y - 30,
    size: 8.5,
    font: fontSansBold,
    color: cOrangeText,
    align: "right",
  });
  y -= refundBoxH + 16;

  y = drawSectionBar("DATA PENGAJUAN PEMBATALAN", y) - 0;
  y = drawRow("Nama lengkap", pembatalan.nama, y);
  y = drawRow("NIM", pembatalan.nim, y);
  y = drawRow("Nomor telepon", pembatalan.telepon, y);
  y = drawRow("Bank tujuan refund", pembatalan.bank, y);
  y = drawRow("Nomor rekening", pembatalan.nomorRekening, y);
  y = drawRow("Nama pemilik rekening", pembatalan.namaRekening, y);
  y = drawRow("Alasan pembatalan", pembatalan.alasan, y);
  y = drawRow("Diajukan pada", formatTanggalWaktu(pembatalan.diajukanPada), y);
  if (pembatalan.adminNote) {
    y = drawRow("Catatan admin", pembatalan.adminNote, y);
  }
  y -= 14;

  y = drawSectionBar("RINGKASAN PESANAN", y);
  y = drawRow("Nama usaha", booking.namaUsaha || booking.jenisUsaha || "-", y);
  y = drawRow("Lapak", `${booking.spotNama} (${booking.spotKode})`, y);
  y = drawRow(
    "Periode sewa",
    `${formatTanggal(booking.tanggalMulai)} s.d. ${formatTanggal(booking.tanggalSelesai)}`,
    y,
  );
  y = drawRow("Durasi", `${booking.jumlahHari} hari`, y);
  y = drawRow("Metode pembayaran", booking.metodePembayaran || "-", y);
  y = drawRow("Total pembayaran", formatRupiah(booking.totalBayar), y, {
    emphasize: true,
  });
  y = drawRow("Jumlah refund diajukan", formatRupiah(booking.totalBayar), y, {
    emphasize: true,
  });
  y -= 18;

  page.drawRectangle({
    x: marginX,
    y: y - 70,
    width: contentWidth,
    height: 70,
    borderColor: cBorder,
    borderWidth: 0.8,
    color: cSurface,
  });
  drawText("Keterangan", {
    x: marginX + 12,
    y: y - 16,
    size: 8,
    font: fontSansBold,
    color: cNavy,
  });
  drawText(
    "Dokumen ini merangkum data form pembatalan yang diisi penyewa, termasuk rekening tujuan",
    {
      x: marginX + 12,
      y: y - 32,
      size: 7.5,
      font: fontSans,
      color: cMuted,
    },
  );
  drawText(
    "dan jumlah pengembalian dana sesuai total pembayaran pesanan. Proses refund menunggu",
    {
      x: marginX + 12,
      y: y - 44,
      size: 7.5,
      font: fontSans,
      color: cMuted,
    },
  );
  drawText(
    "keputusan admin Biro Pengelolaan Aset Universitas Udayana.",
    {
      x: marginX + 12,
      y: y - 56,
      size: 7.5,
      font: fontSans,
      color: cMuted,
    },
  );

  drawText(
    "Dokumen diterbitkan secara digital oleh Sistem Ngelapak - Biro Pengelolaan Aset Universitas Udayana.",
    {
      x: pageWidth / 2,
      y: 28,
      size: 7,
      font: fontSans,
      color: cMuted,
      align: "center",
    },
  );

  return pdf.save();
}

export async function printBuktiPembatalan(booking: Booking): Promise<void> {
  const pdfBytes = await generateBuktiPembatalanPdf(booking);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Bukti-Pembatalan-${cleanWinAnsi(booking.id)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
