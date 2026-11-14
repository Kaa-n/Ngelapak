
"use client";

import { useMemo, useState } from "react";

const faqData = [
  {
    category: "Akun",
    icon: "account_circle",
    questions: [
      {
        question: "Bagaimana cara membuat akun Ngelapak?",
        answer:
          "Pilih menu Masuk, kemudian pilih opsi untuk mendaftar. Lengkapi informasi yang diminta dan ikuti proses pendaftaran hingga selesai.",
      },
      {
        question: "Bagaimana cara mengubah informasi profil?",
        answer:
          "Masuk ke akun Ngelapak, buka menu profil di bagian kanan atas, lalu pilih Edit Profile. Perbarui informasi yang tersedia dan simpan perubahan.",
      },
      {
        question: "Apakah alamat email dapat diubah melalui Edit Profile?",
        answer:
          "Tidak. Alamat email akun digunakan sebagai identitas akun dan tidak dapat diubah melalui halaman Edit Profile.",
      },
    ],
  },
  {
    category: "Penyewaan",
    icon: "storefront",
    questions: [
      {
        question: "Bagaimana cara menyewa lapak?",
        answer:
          "Buka halaman Jelajah Lapak, pilih lapak yang ingin digunakan, kemudian periksa informasi lokasi, fasilitas, dan ketentuan operasional sebelum melanjutkan proses pemesanan.",
      },
      {
        question: "Bagaimana cara melihat informasi lapak?",
        answer:
          "Pilih salah satu lapak pada halaman Jelajah Lapak. Halaman detail menyediakan informasi mengenai lapak, fasilitas, operasional, dan ulasan jika tersedia.",
      },
      {
        question: "Apakah saya dapat memesan lebih dari satu lapak?",
        answer:
          "Ketersediaan pemesanan mengikuti ketentuan dan kapasitas lapak yang ditampilkan pada sistem. Periksa detail lapak sebelum mengajukan pemesanan.",
      },
    ],
  },
  {
    category: "Pesanan & Pembayaran",
    icon: "receipt_long",
    questions: [
      {
        question: "Di mana saya dapat melihat pesanan?",
        answer:
          "Setelah masuk sebagai penyewa, buka menu Pesanan Saya untuk melihat daftar pesanan dan informasi statusnya.",
      },
      {
        question: "Bagaimana cara mengetahui status pesanan?",
        answer:
          "Status pesanan dapat diperiksa melalui halaman Pesanan Saya. Pilih pesanan untuk melihat informasi lebih lanjut.",
      },
      {
        question: "Apa yang harus dilakukan jika pembayaran bermasalah?",
        answer:
          "Periksa kembali informasi pembayaran dan bukti yang dikirimkan. Jika kendala masih terjadi, hubungi pengelola melalui kanal bantuan resmi yang disediakan.",
      },
    ],
  },
  {
    category: "Pengelolaan Lapak",
    icon: "admin_panel_settings",
    questions: [
      {
        question: "Apa fungsi akun pengelola?",
        answer:
          "Akun pengelola digunakan untuk mengakses fitur pengelolaan lapak dan proses verifikasi sesuai hak akses yang diberikan.",
      },
      {
        question: "Bagaimana proses verifikasi pesanan?",
        answer:
          "Pengelola dapat membuka menu Verifikasi untuk memeriksa pengajuan dan informasi pendukung yang dikirimkan pengguna.",
      },
    ],
  },
];

const categories = ["Semua", ...faqData.map((item) => item.category)];

export default function HelpCenterView() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredFaq = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return faqData
      .filter(
        (group) =>
          activeCategory === "Semua" || group.category === activeCategory
      )
      .map((group) => ({
        ...group,
        questions: group.questions.filter(
          (item) =>
            item.question.toLowerCase().includes(keyword) ||
            item.answer.toLowerCase().includes(keyword)
        ),
      }))
      .filter((group) => group.questions.length > 0);
  }, [search, activeCategory]);

  const totalResults = filteredFaq.reduce(
    (total, group) => total + group.questions.length,
    0
  );

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-16">
      {/* Hero */}
      <section className="bg-[#003466] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-20 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">
              support_agent
            </span>
          </div>

          <p className="text-sm font-semibold text-blue-200 mb-3">
            NGELAPAK HELP CENTER
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ada yang bisa kami bantu?
          </h1>

          <p className="mt-4 text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Temukan jawaban atas pertanyaan seputar akun, penyewaan lapak,
            pesanan, dan penggunaan platform Ngelapak.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-[#855300] uppercase tracking-wider">
            Frequently Asked Questions
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#003466] mt-2">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-sm text-[#737781] mt-3">
            Pilih kategori atau cari pertanyaan untuk menemukan informasi
            yang dibutuhkan.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                setOpenQuestion(null);
              }}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === category
                  ? "bg-[#003466] text-white"
                  : "bg-white border border-[#e2e7ff] text-[#424750] hover:bg-[#eef2f9]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {filteredFaq.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#003466]">
                  {group.icon}
                </span>
                <h3 className="font-bold text-lg text-[#003466]">
                  {group.category}
                </h3>
              </div>

              <div className="bg-white border border-[#e2e7ff] rounded-2xl overflow-hidden divide-y divide-[#edf0fa]">
                {group.questions.map((item) => {
                  const key = `${group.category}-${item.question}`;
                  const isOpen = openQuestion === key;

                  return (
                    <div key={key}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenQuestion(isOpen ? null : key)
                        }
                        className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-[#f8f9ff] transition-colors"
                      >
                        <span className="text-sm sm:text-base font-semibold text-[#172033]">
                          {item.question}
                        </span>
                        <span className="material-symbols-outlined shrink-0 text-[#003466]">
                          {isOpen ? "remove" : "add"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 text-sm text-[#5c6270] leading-relaxed">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {totalResults === 0 && (
            <div className="bg-white border border-[#e2e7ff] rounded-2xl p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-[#a0a5b1]">
                search_off
              </span>
              <h3 className="font-bold text-[#003466] mt-3">
                Pertanyaan tidak ditemukan
              </h3>
              <p className="text-sm text-[#737781] mt-2">
                Coba gunakan kata kunci lain atau pilih kategori yang berbeda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("Semua");
                }}
                className="mt-4 text-sm font-semibold text-[#003466] hover:underline"
              >
                Hapus pencarian
              </button>
            </div>
          )}
        </div>

        {/* Contact information */}
        <div className="mt-12 bg-[#eef2f9] border border-[#dce5f2] rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-white mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[#003466]">
              contact_support
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#003466] mt-4">
            Belum menemukan jawaban?
          </h3>
          <p className="text-sm text-[#5c6270] mt-2 max-w-xl mx-auto leading-relaxed">
            Jika pertanyaan atau kendala belum terjawab, silakan hubungi
            pengelola Ngelapak melalui kanal komunikasi resmi yang tersedia.
          </p>
        </div>
      </section>
    </div>
  );
}
