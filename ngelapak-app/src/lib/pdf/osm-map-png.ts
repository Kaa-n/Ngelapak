// Koordinat zona kampus Universitas Udayana (Bukit Jimbaran)
export const ZONA_COORDINATES: Record<
    string,
    { lat: number; lng: number; zoom: number }
> = {
    rektorat: { lat: -8.79635, lng: 115.17635, zoom: 17 },
    boulevard: { lat: -8.7982, lng: 115.1755, zoom: 17 },
    sc: { lat: -8.7995, lng: 115.1742, zoom: 17 },
    agrokompleks: { lat: -8.8012, lng: 115.1728, zoom: 17 },
    default: { lat: -8.79635, lng: 115.17635, zoom: 17 },
};

function latLngToTile(lat: number, lng: number, zoom: number) {
    const n = Math.pow(2, zoom);
    const x = ((lng + 180) / 360) * n;
    const latRad = (lat * Math.PI) / 180;
    const y =
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        n;
    return { x, y };
}

function loadTileImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

/**
 * Menghasilkan gambar PNG (base64 dataURL) dari tile OpenStreetMap
 * lengkap dengan pin lokasi, label spot, skala, dan atribusi resmi OSM.
 */
export async function generateOsmMapPng(options: {
    zona?: string;
    lat?: number;
    lng?: number;
    spotKode: string;
    spotNama: string;
    width?: number;
    height?: number;
}): Promise<string> {
    const {
        zona = "rektorat",
        spotKode,
        spotNama,
        width = 760,
        height = 300,
    } = options;

    const preset =
        ZONA_COORDINATES[zona.toLowerCase()] ?? ZONA_COORDINATES.default;
    const lat = options.lat ?? preset.lat;
    const lng = options.lng ?? preset.lng;
    const zoom = preset.zoom;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Background fallback
    ctx.fillStyle = "#e8eef5";
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

    const tilePromises: Promise<void>[] = [];

    for (let tx = startTileX; tx <= endTileX; tx++) {
        for (let ty = startTileY; ty <= endTileY; ty++) {
            const url = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
            const drawX = Math.round(tx * tileSize - topLeftPixelX);
            const drawY = Math.round(ty * tileSize - topLeftPixelY);

            tilePromises.push(
                loadTileImage(url).then((img) => {
                    if (img) {
                        ctx.drawImage(img, drawX, drawY, tileSize, tileSize);
                    }
                })
            );
        }
    }

    await Promise.all(tilePromises);

    // Overlay subtle vignette border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    const cx = width / 2;
    const cy = height / 2;

    // Radius area kavling (pulsing halo)
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 52, 102, 0.16)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(0, 52, 102, 0.45)";
    ctx.stroke();

    // Pin Marker (Teardrop merah-navy resmi)
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.35)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(cx, cy - 18, 12, Math.PI * 0.8, Math.PI * 0.2, false);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();
    ctx.restore();

    // Titik putih di tengah pin
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Badge label di atas pin
    const labelText = `${spotKode} • ${spotNama}`;
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    const textMetrics = ctx.measureText(labelText);
    const badgeW = textMetrics.width + 20;
    const badgeH = 26;
    const badgeX = cx - badgeW / 2;
    const badgeY = cy - 62;

    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.2)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#003466";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, cx, badgeY + badgeH / 2);

    // Kompas kecil di pojok kanan atas
    const compX = width - 28;
    const compY = 28;
    ctx.beginPath();
    ctx.arc(compX, compY, 16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#003466";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("U", compX, compY + 1);

    // Kotak atribusi resmi OpenStreetMap di pojok kanan bawah
    const attrText = `© OpenStreetMap contributors | ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    ctx.font = "10px sans-serif";
    const attrW = ctx.measureText(attrText).width + 12;
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fillRect(width - attrW - 4, height - 20, attrW, 16);
    ctx.fillStyle = "#334155";
    ctx.textAlign = "right";
    ctx.fillText(attrText, width - 10, height - 11);

    return canvas.toDataURL("image/png");
}