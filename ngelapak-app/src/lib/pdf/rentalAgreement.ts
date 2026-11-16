import {
  PDFDocument,
  StandardFonts,
  rgb,
  PageSizes,
  PDFName,
  PDFString,
} from "pdf-lib";

export interface AgreementData {
  id: string;
  tenant: string;
  nim?: string;
  fakultas?: string;
  telepon?: string;
  email?: string;
  namaUsaha?: string;
  jenisUsaha?: string;
  spot: string;
  spotKode?: string;
  lokasi?: string;
  zonaLabel?: string;
  ukuran?: string;
  daya?: number;
  start: string;
  end: string;
  jumlahHari?: number;
  amount: number;
  metodePembayaran?: string;
  paidAt: string;
  googleMapsUrl?: string;
  lat?: number;
  lng?: number;
}

export function cleanWinAnsi(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/[•●]/g, "-")
    .replace(/[★☆]/g, "")
    .replace(/[–—―]/g, "-")
    .replace(/[↑▲]/g, "")
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTanggalIndo(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return cleanWinAnsi(dateStr);
  return cleanWinAnsi(
    parsed.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar",
    })
  );
}

// ============================================================================
// GENERATOR PETA PNG DARI TILE 
// ============================================================================

const ZONA_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  rektorat: { lat: -8.79635, lng: 115.17635, zoom: 17 },
  boulevard: { lat: -8.7982, lng: 115.1755, zoom: 17 },
  sc: { lat: -8.7995, lng: 115.1742, zoom: 17 },
  agrokompleks: { lat: -8.8012, lng: 115.1728, zoom: 17 },
  default: { lat: -8.79635, lng: 115.17635, zoom: 17 },
};

function resolveCoordinates(order: AgreementData): {
  lat: number;
  lng: number;
  zoom: number;
} {
  if (typeof order.lat === "number" && typeof order.lng === "number") {
    return { lat: order.lat, lng: order.lng, zoom: 17 };
  }

  // Cek apakah googleMapsUrl memiliki koordinat lat,lng
  if (order.googleMapsUrl) {
    const match = order.googleMapsUrl.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
        zoom: 17,
      };
    }
  }

  const keyText = `${order.zonaLabel || ""} ${order.spot || ""} ${order.lokasi || ""}`.toLowerCase();
  if (keyText.includes("boulevard")) return ZONA_COORDS.boulevard;
  if (keyText.includes("student center") || /\bsc\b/.test(keyText))
    return ZONA_COORDS.sc;
  if (keyText.includes("agro")) return ZONA_COORDS.agrokompleks;
  return ZONA_COORDS.rektorat;
}

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n;
  return { x, y };
}

function loadOsmTile(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function generateOsmPngBytes(options: {
  lat: number;
  lng: number;
  zoom: number;
  spotKode: string;
  spotNama: string;
}): Promise<Uint8Array | null> {
  if (typeof document === "undefined") return null;

  const { lat, lng, zoom, spotKode, spotNama } = options;
  const width = 920;
  const height = 340;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Latar fallback lembut
  ctx.fillStyle = "#eef3f9";
  ctx.fillRect(0, 0, width, height);

  const tileSize = 256;
  const centerTile = latLngToTile(lat, lng, zoom);
  const centerPixelX = centerTile.x * tileSize;
  const centerPixelY = centerTile.y * tileSize;

  const topLeftPixelX = centerPixelX - width / 2;
  const topLeftPixelY = centerPixelY - height / 2;

  const startTileX = Math.floor(topLeftPixelX / tileSize);
  const startTileY = Math.floor(topLeftPixelY / tileSize);
  const endTileX = Math.floor((topLeftPixelX + width) / tileSize);
  const endTileY = Math.floor((topLeftPixelY + height) / tileSize);

  const tasks: Promise<void>[] = [];
  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      const url = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
      const dx = Math.round(tx * tileSize - topLeftPixelX);
      const dy = Math.round(ty * tileSize - topLeftPixelY);
      tasks.push(
        loadOsmTile(url).then((img) => {
          if (img) ctx.drawImage(img, dx, dy, tileSize, tileSize);
        })
      );
    }
  }

  await Promise.all(tasks);

  const cx = width / 2;
  const cy = height / 2;

  // Lingkaran radius zona kavling
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 52, 102, 0.16)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0, 52, 102, 0.5)";
  ctx.stroke();

  // Pin Marker Lokasi
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(cx, cy - 22, 14, Math.PI * 0.8, Math.PI * 0.2, false);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = "#dc2626";
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy - 22, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Badge label kavling di atas pin
  const labelText = cleanWinAnsi(`${spotKode} - ${spotNama}`).slice(0, 42);
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  const textW = ctx.measureText(labelText).width;
  const badgeW = textW + 24;
  const badgeH = 30;
  const badgeX = cx - badgeW / 2;
  const badgeY = cy - 72;

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#003466";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 7);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelText, cx, badgeY + badgeH / 2);

  // Indikator Utara (U) di kanan atas
  ctx.beginPath();
  ctx.arc(width - 32, 32, 18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#003466";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("U", width - 32, 33);

  // Atribusi OpenStreetMap resmi
  const attr = `© OpenStreetMap contributors | ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  ctx.font = "11px sans-serif";
  const attrW = ctx.measureText(attr).width + 14;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(width - attrW - 6, height - 24, attrW, 18);
  ctx.fillStyle = "#334155";
  ctx.textAlign = "right";
  ctx.fillText(attr, width - 12, height - 14);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
  if (!blob) return null;
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

// ============================================================================
// GENERATOR DOKUMEN PDF SPPLA 
// ============================================================================

export async function rentalAgreementPdf(
  order: AgreementData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const fontSerif = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontSerifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const fontSans = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Palet Warna Korporat & Akademik
  const cNavy = rgb(0.0, 0.204, 0.4); // #003466
  const cInk = rgb(0.08, 0.11, 0.18); // #141c2e
  const cMuted = rgb(0.38, 0.43, 0.51); // #616e82
  const cBorder = rgb(0.83, 0.87, 0.93); // #d4deed
  const cSurface = rgb(0.97, 0.98, 1.0); // #f7faff
  const cEmeraldBg = rgb(0.93, 0.99, 0.96);
  const cEmeraldBorder = rgb(0.55, 0.85, 0.72);
  const cEmeraldText = rgb(0.03, 0.45, 0.28);
  const cWhite = rgb(1, 1, 1);

  const formattedAmount = cleanWinAnsi(
    "Rp " + Number(order.amount || 0).toLocaleString("id-ID").replace(/\s/g, "")
  );

  const paymentTime = cleanWinAnsi(
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Makassar",
    }).format(new Date(order.paidAt || Date.now()))
  );

  const coords = resolveCoordinates(order);
  const osmPngBytes = await generateOsmPngBytes({
    lat: coords.lat,
    lng: coords.lng,
    zoom: coords.zoom,
    spotKode: order.spotKode || "STAN",
    spotNama: order.spot || "Kavling Kampus",
  });

  const pageWidth = PageSizes.A4[0]; // 595.28
  const pageHeight = PageSizes.A4[1]; // 841.89
  const marginX = 46;
  const contentWidth = pageWidth - marginX * 2; // 503.28

  pdf.setTitle(`MOU-SPPLA-${cleanWinAnsi(order.id)}`);
  pdf.setAuthor("Biro Pengelolaan Aset Universitas Udayana");
  pdf.setSubject("Surat Perjanjian Pemanfaatan Lahan Aset (SPPLA)");

  function drawText(
    page: any,
    raw: string,
    opts: {
      x: number;
      y: number;
      size: number;
      font: any;
      color: any;
      align?: "left" | "center" | "right";
      maxWidth?: number;
    }
  ) {
    const text = cleanWinAnsi(raw);
    let drawX = opts.x;
    const textW = opts.font.widthOfTextAtSize(text, opts.size);
    if (opts.align === "center") {
      drawX = opts.x - textW / 2;
    } else if (opts.align === "right") {
      drawX = opts.x - textW;
    }
    page.drawText(text, {
      x: drawX,
      y: opts.y,
      size: opts.size,
      font: opts.font,
      color: opts.color,
    });
  }

  function drawSectionHeader(page: any, title: string, yTop: number): number {
    const barH = 20;
    page.drawRectangle({
      x: marginX,
      y: yTop - barH,
      width: contentWidth,
      height: barH,
      color: cNavy,
    });
    drawText(page, title, {
      x: marginX + 10,
      y: yTop - 13.5,
      size: 8.5,
      font: fontSansBold,
      color: cWhite,
    });
    return yTop - barH;
  }

  function drawFooter(page: any, pageNum: number, totalPages: number) {
    page.drawLine({
      start: { x: marginX, y: 40 },
      end: { x: pageWidth - marginX, y: 40 },
      thickness: 0.6,
      color: cBorder,
    });
    drawText(
      page,
      "Dokumen Resmi Sistem Ngelapak  |  Biro Pengelolaan Aset Universitas Udayana",
      {
        x: marginX,
        y: 28,
        size: 7.5,
        font: fontSans,
        color: cMuted,
      }
    );
    drawText(page, `Halaman ${pageNum} dari ${totalPages}`, {
      x: pageWidth - marginX,
      y: 28,
      size: 7.5,
      font: fontSansBold,
      color: cMuted,
      align: "right",
    });
  }

  function drawJustifiedParagraph(
    page: any,
    rawText: string,
    x: number,
    startY: number,
    maxWidth: number,
    size: number,
    lineHeight: number,
    font: any,
    color: any
  ): number {
    const words = cleanWinAnsi(rawText).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    let y = startY;
    lines.forEach((line, index) => {
      const isLastLine = index === lines.length - 1;
      const lineWords = line.split(" ");

      if (isLastLine || lineWords.length <= 1) {
        page.drawText(line, { x, y, size, font, color });
      } else {
        const wordsWidth = lineWords.reduce(
          (sum, w) => sum + font.widthOfTextAtSize(w, size),
          0
        );
        const spaceWidth = (maxWidth - wordsWidth) / (lineWords.length - 1);
        let cursorX = x;
        for (const w of lineWords) {
          page.drawText(w, { x: cursorX, y, size, font, color });
          cursorX += font.widthOfTextAtSize(w, size) + spaceWidth;
        }
      }
      y -= lineHeight;
    });

    return y;
  }

  // ===========================================================================
  // HALAMAN 1: KOP RESMI, PARA PIHAK (2 KOLOM), SPESIFIKASI & PETA OSM
  // ===========================================================================
  const p1 = pdf.addPage(PageSizes.A4);
  let y = pageHeight - 42;

  // --- KOP SURAT RESMI ---
  const emblemSize = 44;
  p1.drawRectangle({
    x: marginX,
    y: y - emblemSize + 4,
    width: emblemSize,
    height: emblemSize,
    color: cNavy,
  });
  p1.drawRectangle({
    x: marginX + 2.5,
    y: y - emblemSize + 6.5,
    width: emblemSize - 5,
    height: emblemSize - 5,
    borderColor: rgb(0.75, 0.83, 0.95),
    borderWidth: 0.7,
  });
  drawText(p1, "UNUD", {
    x: marginX + emblemSize / 2,
    y: y - 22,
    size: 11.5,
    font: fontSansBold,
    color: cWhite,
    align: "center",
  });

  const headerCenterX = marginX + emblemSize + (contentWidth - emblemSize) / 2;
  drawText(p1, "KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI", {
    x: headerCenterX,
    y: y - 4,
    size: 8.5,
    font: fontSansBold,
    color: cMuted,
    align: "center",
  });
  drawText(p1, "UNIVERSITAS UDAYANA", {
    x: headerCenterX,
    y: y - 17,
    size: 13.5,
    font: fontSerifBold,
    color: cNavy,
    align: "center",
  });
  drawText(p1, "BIRO PENGELOLAAN ASET DAN SARANA PRASARANA", {
    x: headerCenterX,
    y: y - 29,
    size: 9.5,
    font: fontSansBold,
    color: cInk,
    align: "center",
  });
  drawText(
    p1,
    "Gedung Rektorat Kampus Bukit Jimbaran, Badung - Bali 80361  |  Telp: (0361) 701954  |  aset@unud.ac.id",
    {
      x: headerCenterX,
      y: y - 40,
      size: 7.2,
      font: fontSans,
      color: cMuted,
      align: "center",
    }
  );

  y -= 50;
  // Garis Kop Ganda
  p1.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1.8,
    color: cNavy,
  });
  p1.drawLine({
    start: { x: marginX, y: y - 2.5 },
    end: { x: pageWidth - marginX, y: y - 2.5 },
    thickness: 0.5,
    color: cNavy,
  });

  // --- JUDUL PERJANJIAN ---
  y -= 20;
  drawText(p1, "SURAT PERJANJIAN PEMANFAATAN LAHAN ASET (SPPLA)", {
    x: pageWidth / 2,
    y,
    size: 12,
    font: fontSerifBold,
    color: cInk,
    align: "center",
  });
  y -= 14;
  drawText(
    p1,
    `Nomor: SPPLA/UNUD/2026/${order.id}   |   PERIKATAN IZIN OPERASIONAL STAN`,
    {
      x: pageWidth / 2,
      y,
      size: 8.2,
      font: fontSansBold,
      color: cNavy,
      align: "center",
    }
  );

  y -= 16;
  y = drawJustifiedParagraph(
    p1,
    "Pada hari ini bertempat di Kampus Universitas Udayana, telah disepakati Perjanjian Pemanfaatan Lahan Aset (SPPLA) untuk kegiatan usaha temporer kampus antara pihak-pihak sebagai berikut:",
    marginX,
    y,
    contentWidth,
    8.8,
    12.5,
    fontSerif,
    cInk
  );
  y -= 4;

  // --- IDENTITAS PARA PIHAK (2 KOLOM SEJAJAR) ---
  const partyGap = 12;
  const partyColW = (contentWidth - partyGap) / 2;
  const partyBoxH = 112;

  // Kiri: Pihak Pertama
  p1.drawRectangle({
    x: marginX,
    y: y - partyBoxH,
    width: partyColW,
    height: partyBoxH,
    color: cSurface,
    borderColor: cBorder,
    borderWidth: 0.8,
  });
  drawText(p1, "I. PIHAK PERTAMA (PENGELOLA ASET)", {
    x: marginX + 10,
    y: y - 14,
    size: 8,
    font: fontSansBold,
    color: cNavy,
  });
  p1.drawLine({
    start: { x: marginX + 10, y: y - 18 },
    end: { x: marginX + partyColW - 10, y: y - 18 },
    thickness: 0.5,
    color: cBorder,
  });

  const p1Items = [
    ["Pejabat", "Dr. Ir. I Ketut Suartana, M.T."],
    ["Jabatan", "Kepala Biro Pengelolaan Aset"],
    ["Instansi", "Universitas Udayana"],
    ["Wewenang", "Kuasa Pengguna Aset Kampus"],
  ];
  let py = y - 31;
  p1Items.forEach(([k, v]) => {
    drawText(p1, k, {
      x: marginX + 10,
      y: py,
      size: 8.2,
      font: fontSans,
      color: cMuted,
    });
    drawText(p1, `: ${v}`, {
      x: marginX + 64,
      y: py,
      size: 8.2,
      font: fontSansBold,
      color: cInk,
    });
    py -= 16;
  });

  // Kanan: Pihak Kedua
  const p2X = marginX + partyColW + partyGap;
  p1.drawRectangle({
    x: p2X,
    y: y - partyBoxH,
    width: partyColW,
    height: partyBoxH,
    color: cSurface,
    borderColor: cBorder,
    borderWidth: 0.8,
  });
  drawText(p1, "II. PIHAK KEDUA (PENYEWA STAN)", {
    x: p2X + 10,
    y: y - 14,
    size: 8,
    font: fontSansBold,
    color: cNavy,
  });
  p1.drawLine({
    start: { x: p2X + 10, y: y - 18 },
    end: { x: p2X + partyColW - 10, y: y - 18 },
    thickness: 0.5,
    color: cBorder,
  });

  const p2Items = [
    ["Nama", order.tenant || "-"],
    ["NIM / ID", order.nim || "Civitas Udayana"],
    ["Unit / Fak.", order.fakultas || "Universitas Udayana"],
    ["No. WA", order.telepon || "-"],
    [
      "Nama Stan",
      `${order.namaUsaha || "-"} (${order.jenisUsaha || "Kuliner"})`.slice(
        0,
        32
      ),
    ],
  ];
  py = y - 31;
  p2Items.forEach(([k, v]) => {
    drawText(p1, k, {
      x: p2X + 10,
      y: py,
      size: 8.2,
      font: fontSans,
      color: cMuted,
    });
    drawText(p1, `: ${v}`, {
      x: p2X + 62,
      y: py,
      size: 8.2,
      font: fontSansBold,
      color: cInk,
    });
    py -= 14.5;
  });

  y -= partyBoxH + 14;

  // --- BAGIAN A: TABEL SPESIFIKASI LAPAK ---
  y = drawSectionHeader(
    p1,
    "BAGIAN A. DETAIL SPESIFIKASI TITIK LAPAK & JADWAL SEWA",
    y
  );

  const periodeFormatted = `${formatTanggalIndo(order.start)} s/d ${formatTanggalIndo(
    order.end
  )} (${order.jumlahHari || 1} Hari Kalender)`;

  const specRows = [
    [
      "Nama & Kode Spot",
      `${order.spot} (${order.spotKode || "-"})`,
      true,
    ],
    [
      "Zona / Kawasan",
      order.zonaLabel || "Kampus Bukit Jimbaran",
      false,
    ],
    [
      "Alamat Lokasi Stan",
      order.lokasi || "Kampus Bukit Jimbaran, Badung - Bali",
      false,
    ],
    [
      "Dimensi & Daya Listrik",
      `Kavling ${order.ukuran || "2x2"} m   |   Daya Listrik ${order.daya || 450
      } Watt (Penerangan & Kasir)`,
      false,
    ],
    ["Periode Masa Sewa", periodeFormatted, true],
    ["Jam Operasional Stan", "08.00 WITA - 21.00 WITA", false],
  ] as const;

  const rowH = 19;
  specRows.forEach(([label, val, highlight], idx) => {
    const rowTop = y;
    const rowBottom = y - rowH;
    p1.drawRectangle({
      x: marginX,
      y: rowBottom,
      width: contentWidth,
      height: rowH,
      color: idx % 2 === 0 ? cWhite : cSurface,
      borderColor: cBorder,
      borderWidth: 0.4,
    });
    drawText(p1, label, {
      x: marginX + 10,
      y: rowTop - 13,
      size: 8.3,
      font: fontSans,
      color: cMuted,
    });
    drawText(p1, ":", {
      x: marginX + 135,
      y: rowTop - 13,
      size: 8.3,
      font: fontSansBold,
      color: cInk,
    });
    drawText(p1, val, {
      x: marginX + 145,
      y: rowTop - 13,
      size: 8.4,
      font: highlight ? fontSansBold : fontSans,
      color: highlight ? cNavy : cInk,
    });
    y -= rowH;
  });

  y -= 14;

  // --- BAGIAN B: PETA PNG OPENSTREETMAP & NAVIGASI ---
  y = drawSectionHeader(
    p1,
    "BAGIAN B. PETA LOKASI SPASIAL (OPENSTREETMAP) & PANDUAN NAVIGASI",
    y
  );

  const mapFrameH = 186;
  const mapImgH = 186;
  p1.drawRectangle({
    x: marginX,
    y: y - mapFrameH,
    width: contentWidth,
    height: mapFrameH,
    color: cSurface,
    borderColor: cBorder,
    borderWidth: 0.8,
  });

  if (osmPngBytes) {
    const osmImage = await pdf.embedPng(osmPngBytes);
    p1.drawImage(osmImage, {
      x: marginX,
      y: y - mapImgH,
      width: contentWidth,
      height: mapImgH,
    });
  } else {
    drawText(
      p1,
      `Koordinat Lokasi: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (${order.spot})`,
      {
        x: pageWidth / 2,
        y: y - 95,
        size: 9,
        font: fontSansBold,
        color: cNavy,
        align: "center",
      }
    );
  }

  y -= mapFrameH + 8;

  // Kotak Panduan Akses & Link Klik Google Maps
  const guideH = 58;
  p1.drawRectangle({
    x: marginX,
    y: y - guideH,
    width: contentWidth,
    height: guideH,
    color: cSurface,
    borderColor: cBorder,
    borderWidth: 0.8,
  });

  drawText(p1, "Panduan Akses Lapangan:", {
    x: marginX + 10,
    y: y - 13,
    size: 8.2,
    font: fontSansBold,
    color: cInk,
  });
  drawText(
    p1,
    `1. Masuki gerbang utama Kampus Bukit Jimbaran menuju ${order.zonaLabel || "zona terdaftar"
    } kavling ${order.spotKode || "-"}.`,
    {
      x: marginX + 10,
      y: y - 25,
      size: 8,
      font: fontSans,
      color: cMuted,
    }
  );
  drawText(
    p1,
    "2. Tunjukkan dokumen SPPLA / kode verifikasi ini kepada Petugas Satpam / Pengawas Lapangan saat loading.",
    {
      x: marginX + 10,
      y: y - 36.5,
      size: 8,
      font: fontSans,
      color: cMuted,
    }
  );

  const gmapsUrl =
    order.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  const linkLabel = `Buka Titik Koordinat di Google Maps (${coords.lat.toFixed(
    5
  )}, ${coords.lng.toFixed(5)}) ->`;
  const linkX = marginX + 10;
  const linkY = y - 49.5;
  const linkW = fontSansBold.widthOfTextAtSize(linkLabel, 8.2);

  drawText(p1, linkLabel, {
    x: linkX,
    y: linkY,
    size: 8.2,
    font: fontSansBold,
    color: cNavy,
  });
  p1.drawLine({
    start: { x: linkX, y: linkY - 1.5 },
    end: { x: linkX + linkW, y: linkY - 1.5 },
    thickness: 0.6,
    color: cNavy,
  });

  // Buat hyperlink aktif yang bisa diklik langsung di PDF viewer
  const linkAnnotation = pdf.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: [linkX, linkY - 3, linkX + linkW, linkY + 9],
    Border: [0, 0, 0],
    A: {
      Type: PDFName.of("Action"),
      S: PDFName.of("URI"),
      URI: PDFString.of(gmapsUrl),
    },
  });
  p1.node.set(PDFName.of("Annots"), pdf.context.obj([linkAnnotation]));

  drawFooter(p1, 1, 2);

  // ===========================================================================
  // HALAMAN 2: BUKTI BAYAR, PASAL SYARAT & KETENTUAN, PENGESAHAN
  // ===========================================================================
  const p2 = pdf.addPage(PageSizes.A4);
  y = pageHeight - 42;

  // Header Mini Halaman 2
  drawText(p2, "UNIVERSITAS UDAYANA  |  SISTEM NGELAPAK", {
    x: marginX,
    y,
    size: 8,
    font: fontSansBold,
    color: cNavy,
  });
  drawText(p2, `Lampiran SPPLA No: SPPLA/UNUD/2026/${order.id}`, {
    x: pageWidth - marginX,
    y,
    size: 8,
    font: fontSans,
    color: cMuted,
    align: "right",
  });
  y -= 6;
  p2.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 0.7,
    color: cBorder,
  });
  y -= 14;

  // --- BAGIAN C: BUKTI PEMBAYARAN ---
  y = drawSectionHeader(
    p2,
    "BAGIAN C. BUKTI PEMBAYARAN & STATUS PENYELESAIAN BIAYA",
    y
  );

  const receiptH = 54;
  p2.drawRectangle({
    x: marginX,
    y: y - receiptH,
    width: contentWidth,
    height: receiptH,
    color: cEmeraldBg,
    borderColor: cEmeraldBorder,
    borderWidth: 0.9,
  });

  drawText(p2, "STATUS KEUANGAN: LUNAS TERVERIFIKASI (OFFICIAL RECEIPT)", {
    x: marginX + 12,
    y: y - 16,
    size: 9,
    font: fontSansBold,
    color: cEmeraldText,
  });
  drawText(
    p2,
    `Total Biaya: ${formattedAmount}   |   Metode: ${(
      order.metodePembayaran || "Midtrans"
    ).toUpperCase()}   |   Waktu Lunas: ${paymentTime} WITA`,
    {
      x: marginX + 12,
      y: y - 31,
      size: 8.3,
      font: fontSans,
      color: cInk,
    }
  );
  drawText(
    p2,
    `ID Transaksi / Verifikasi Sah: ${order.id} (Disetujui oleh Kuasa Pengguna Aset UNUD)`,
    {
      x: marginX + 12,
      y: y - 44,
      size: 8,
      font: fontSansBold,
      color: cMuted,
    }
  );

  y -= receiptH + 16;

  // --- BAGIAN D: SYARAT & KETENTUAN ---
  y = drawSectionHeader(
    p2,
    "BAGIAN D. SYARAT, KETENTUAN & TATA TERTIB LAPANGAN",
    y
  );
  y -= 12;

  const pasalList = [
    [
      "Pasal 1 (Batas Lahan & Pemanfaatan):",
      "PIHAK KEDUA berhak menggunakan kavling titik lahan sesuai dimensi resmi yang tertera dan dilarang memperluas area, mendirikan bangunan permanen, atau memindahtangankan hak sewa stan kepada pihak ketiga tanpa izin tertulis dari PIHAK PERTAMA.",
    ],
    [
      "Pasal 2 (Tata Tertib Kebersihan & Pengelolaan Limbah):",
      "PIHAK KEDUA wajib menyediakan tempat sampah mandiri tertutup. Dilarang membuang sisa minyak jelantah, air cucian berlemak, atau bahan kimia ke resapan taman maupun drainase kampus. Area radius 3 meter wajib dibersihkan sebelum stan ditutup setiap hari.",
    ],
    [
      "Pasal 3 (Kelistrikan & Keselamatan Operasional):",
      "Daya listrik dibatasi maksimum sesuai kapasitas kavling untuk keperluan penerangan dan perangkat kasir. Penggunaan alat masak berdaya tinggi (>1000W) dilarang kecuali mengantongi izin instalasi khusus. Seluruh instalasi kabel wajib standar SNI.",
    ],
    [
      "Pasal 4 (Larangan Khusus & Norma Civitas):",
      "Stan dilarang keras memperjualbelikan minuman beralkohol, rokok konvensional maupun elektrik di Kawasan Tanpa Rokok UNUD, zat psikotropika, bahan berbahaya, atau konten yang melanggar norma susila dan ketertiban akademik.",
    ],
    [
      "Pasal 5 (Kebijakan Pembatalan & Pengembalian Dana):",
      "Pengajuan pembatalan sewa mandiri tunduk pada aturan portal Ngelapak selambat-lambatnya H-1 (24 jam) sebelum masa sewa aktif dimulai. Biaya sewa yang telah terverifikasi tidak dapat dikembalikan apabila periode kalender sewa telah berjalan.",
    ],
    [
      "Pasal 6 (Pengawasan Lapangan & Penindakan):",
      "Satuan Pengamanan (Satpam) dan Tim Pengawas Ketertiban Aset Kampus berwenang melakukan inspeksi sewaktu-waktu dan menghentikan operasional stan tanpa ganti rugi apabila terbukti melanggar pasal-pasal dalam perjanjian ini.",
    ],
  ];

  pasalList.forEach(([judul, isi]) => {
    drawText(p2, judul, {
      x: marginX,
      y,
      size: 8.6,
      font: fontSansBold,
      color: cNavy,
    });
    y -= 12;
    y = drawJustifiedParagraph(
      p2,
      isi,
      marginX,
      y,
      contentWidth,
      8.5,
      11.8,
      fontSerif,
      cInk
    );
    y -= 6;
  });

  y -= 4;

  // --- BAGIAN E: PENGESAHAN & TANDA TANGAN DUA PIHAK ---
  y = drawSectionHeader(
    p2,
    "BAGIAN E. PENGESAHAN DOKUMEN & TANDA TANGAN PARA PIHAK",
    y
  );
  y -= 12;

  y = drawJustifiedParagraph(
    p2,
    "Demikian Surat Perjanjian Pemanfaatan Lahan Aset (SPPLA) ini disepakati secara sadar tanpa paksaan, serta berlaku sah sebagai bukti perikatan izin operasional di lingkungan Universitas Udayana.",
    marginX,
    y,
    contentWidth,
    8.5,
    12,
    fontSerif,
    cInk
  );
  y -= 8;

  const sigGap = 16;
  const sigW = (contentWidth - sigGap) / 2;
  const sigH = 122;
  const sigLeftX = marginX;
  const sigRightX = marginX + sigW + sigGap;

  // Kotak Pihak Pertama
  p2.drawRectangle({
    x: sigLeftX,
    y: y - sigH,
    width: sigW,
    height: sigH,
    color: cSurface,
    borderColor: cBorder,
    borderWidth: 0.9,
  });

  drawText(p2, "PIHAK PERTAMA (PENGELOLA ASET)", {
    x: sigLeftX + sigW / 2,
    y: y - 15,
    size: 8,
    font: fontSansBold,
    color: cNavy,
    align: "center",
  });
  drawText(p2, "Kepala Biro Pengelolaan Aset UNUD", {
    x: sigLeftX + sigW / 2,
    y: y - 26,
    size: 7.5,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  // Lencana Verifikasi Digital Resmi
  const badgeW = 164;
  const badgeH = 34;
  const badgeX = sigLeftX + (sigW - badgeW) / 2;
  const badgeY = y - 72;
  p2.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: rgb(0.92, 0.95, 1.0),
    borderColor: cNavy,
    borderWidth: 0.9,
  });
  drawText(p2, "TERVERIFIKASI DIGITAL - BIRO ASET UNUD", {
    x: sigLeftX + sigW / 2,
    y: badgeY + 21,
    size: 6.7,
    font: fontSansBold,
    color: cNavy,
    align: "center",
  });
  drawText(p2, `KODE VALIDASI: ${cleanWinAnsi(order.id).slice(0, 22)}`, {
    x: sigLeftX + sigW / 2,
    y: badgeY + 9,
    size: 6.3,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  drawText(p2, "Dr. Ir. I Ketut Suartana, M.T.", {
    x: sigLeftX + sigW / 2,
    y: y - 96,
    size: 9.2,
    font: fontSerifBold,
    color: cInk,
    align: "center",
  });
  drawText(p2, "NIP. 197405121999031002", {
    x: sigLeftX + sigW / 2,
    y: y - 108,
    size: 7.5,
    font: fontSans,
    color: cMuted,
    align: "center",
  });

  // Kotak Pihak Kedua
  p2.drawRectangle({
    x: sigRightX,
    y: y - sigH,
    width: sigW,
    height: sigH,
    color: cWhite,
    borderColor: cBorder,
    borderWidth: 0.9,
  });

  drawText(p2, "PIHAK KEDUA (PENYEWA / PENGELOLA)", {
    x: sigRightX + sigW / 2,
    y: y - 15,
    size: 8,
    font: fontSansBold,
    color: cInk,
    align: "center",
  });
  drawText(
    p2,
    order.namaUsaha || order.jenisUsaha || "Pengelola Stan Wirausaha",
    {
      x: sigRightX + sigW / 2,
      y: y - 26,
      size: 7.5,
      font: fontSans,
      color: cMuted,
      align: "center",
    }
  );

  // Garis Tanda Tangan Penyewa
  p2.drawLine({
    start: { x: sigRightX + 36, y: y - 80 },
    end: { x: sigRightX + sigW - 36, y: y - 80 },
    thickness: 0.7,
    color: cBorder,
  });
  drawText(p2, "(Tanda Tangan & Nama Terang)", {
    x: sigRightX + sigW / 2,
    y: y - 74,
    size: 6.8,
    font: fontSerifItalic,
    color: cMuted,
    align: "center",
  });

  drawText(p2, order.tenant || "-", {
    x: sigRightX + sigW / 2,
    y: y - 96,
    size: 9.2,
    font: fontSerifBold,
    color: cInk,
    align: "center",
  });
  drawText(
    p2,
    `NIM/ID: ${order.nim || "-"}  |  ${order.fakultas || "Civitas Udayana"}`,
    {
      x: sigRightX + sigW / 2,
      y: y - 108,
      size: 7.5,
      font: fontSans,
      color: cMuted,
      align: "center",
    }
  );

  drawFooter(p2, 2, 2);

  return pdf.save();
}