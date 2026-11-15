import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Agreement = {
  id: string; tenant: string; spot: string; start: string; end: string;
  amount: number; paidAt: string;
};

export async function rentalAgreementPdf(order: Agreement) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.01, 0.20, 0.40);
  const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  const paymentTime = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Makassar",
  }).format(new Date(order.paidAt));
  let page = pdf.addPage([595.28, 841.89]);
  let y = 782;
  pdf.setTitle(`Perjanjian sewa - ${order.id}`);

  function paragraph(text: string, size = 11, emphasis = false) {
    const face = emphasis ? bold : font;
    const safeText = text.normalize("NFC").replace(/[^\x20-\x7e\xa0-\xff]/g, " ");
    let line = "";
    function drawLine() {
      if (y < 52) {
        page = pdf.addPage([595.28, 841.89]);
        y = 782;
      }
      page.drawText(line, { x: 50, y, size, font: face, color: blue });
      y -= size + 6;
      line = "";
    }
    for (const word of safeText.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (face.widthOfTextAtSize(next, size) <= 495) {
        line = next;
        continue;
      }
      if (line) drawLine();
      for (const character of word) {
        if (face.widthOfTextAtSize(line + character, size) > 495) drawLine();
        line += character;
      }
    }
    if (line) drawLine();
    y -= 5;
  }

  paragraph("NGELAPAK | UNIVERSITAS UDAYANA", 11, true);
  paragraph("MOU Pemanfaatan Lapak (SPPLA)", 22, true);
  paragraph("Draf dokumen sewa dari Ngelapak");
  y -= 15;
  paragraph(`No. pesanan: ${order.id}`);
  paragraph(`Penyewa: ${order.tenant}`);
  paragraph(`Lapak: ${order.spot}`);
  paragraph(`Masa sewa: ${order.start} sampai ${order.end}. Sewa mulai pukul 08.00 WITA.`);
  paragraph(`Pembayaran: ${currency.format(order.amount)}. Lunas pada ${paymentTime} WITA.`);
  y -= 12;
  paragraph("Pemanfaatan lapak", 13, true);
  paragraph("Penyewa menggunakan titik dan periode sewa yang tercatat. Batas area stan, kebersihan, penggunaan listrik, dan ketentuan operasional mengikuti syarat sewa yang disetujui di Ngelapak.");
  paragraph("Pengajuan pembatalan", 13, true);
  paragraph("Penyewa dapat mengajukan pembatalan dalam 24 jam setelah pembayaran lunas, paling lambat 24 jam sebelum sewa mulai. Pengelola meninjau setiap pengajuan.");
  return pdf.save();
}
