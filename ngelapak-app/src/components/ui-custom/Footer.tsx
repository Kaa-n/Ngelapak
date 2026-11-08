import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-white shadow-[0_-1px_8px_rgba(0,0,0,0.04)] mt-auto border-t border-[#e2e7ff] pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#003466] flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[16px]">storefront</span>
              </div>
              <span className="text-[#003466] font-bold text-[15px]">Ngelapak</span>
            </div>
            <p className="text-[13px] text-[#424750] mb-4 leading-relaxed">
              Platform marketplace tata kelola sewa titik dan lapak usaha temporer civitas akademika Universitas Udayana.
            </p>
            <div className="flex items-center gap-2 text-[#424750]">
              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">verified</span>
              <span className="text-[11px]">Sistem Resmi Kampus Udayana</span>
            </div>
          </div>
          {[
            {
              title: "Zonasi Kampus",
              items: ["Kampus Bukit Jimbaran", "Kampus Sudirman Denpasar", "Plaza Fakultas Teknik", "Kantin & Selasar FEB"],
            },
            {
              title: "Layanan & Panduan",
              items: ["Prosedur Izin Usaha Mahasiswa", "Ketentuan Tarif & Kebersihan", "Verifikasi Rekening & Bukti Bayar", "Peta Spasial & Titik Lokasi"],
            },
            {
              title: "Pusat Bantuan",
              items: ["Biro Umum & Pengelolaan Aset", "aset.lapak@unud.ac.id", "(0361) 701954 ext. 202", "Senin–Jumat, 08.00–16.00 WITA"],
            },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="text-[14px] font-bold text-[#131b2e] mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[13px] text-[#424750] hover:text-[#003466] transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-[#e2e7ff] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[#737781]">
            © 2025 Ngelapak – Universitas Udayana. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-4 text-[12px] text-[#737781]">
            <a href="#" className="hover:text-[#003466] transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-[#003466] transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-[#003466] transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

