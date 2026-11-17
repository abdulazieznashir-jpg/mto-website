# Daftar Tugas Perbaikan (hidup)

Sumber: PLAN.md (70 tugas), audit kode dan database 17 Nov 2026.
Status: [x] selesai · [~] sebagian · [ ] belum · [A] perlu persetujuan pemilik (dilewati saat jalan otomatis)

## A. Temuan audit (prioritas tinggi)
- [x] A1 Kartu kapasitas Halaqoh: bayangan variabel `ket` diperbaiki (commit 5219843)
- [x] A2 Tautan internal `.html` diubah ke alamat bersih, termasuk redirect JS (commit 7cfde01)
- [ ] A3 Tombol "Sudah transfer, lanjut kirim bukti" di index.html memanggil RPC `tandai_bukti` yang tidak ada. [A] pilih: pakai alur pembayaran.html atau buat RPC baru
- [A] A4 Cabut EXECUTE dari role anon untuk fungsi admin_* (9 fungsi bisa dipanggil publik, sudah ada cek owner). Ditolak pemeriksaan keamanan, butuh persetujuan eksplisit
- [A] A5 Aktifkan proteksi kata sandi bocor di pengaturan Auth Supabase (dashboard)
- [A] A7 Facebook Pixel di 9 halaman publik masih memakai ID placeholder `PIXEL_ID`. Pelacakan iklan belum aktif. Perlu ID pixel asli dari pemilik
- [A] A8 Ejaan brand: situs memakai "Mahkota Tahfizh" (79 kali), PLAN.md dan percakapan memakai "Mahkota Tahfidz". Perlu keputusan pemilik sebelum diseragamkan
- [ ] A6 admin_daftar_murid dan admin_tambah_murid hanya mengizinkan mahkota.to3, bukan abdulaziez. Tidak dipakai frontend, tapi perlu disamakan

## B. Dari PLAN.md (belum dikerjakan)
- [ ] B1–B70 sesuai PLAN.md. Fase 1 (admin) sebagian besar belum; Fase 2–7 belum. Item yang butuh keputusan pemilik ditandai [A] di PLAN.md (harga, konten, perubahan alur daftar, insert data)

## C. Pembersihan kecil (aman dikerjakan tanpa persetujuan)
- [x] C1 Audit kontras palet (WCAG AA, teks normal 4.5:1): emas #A67C37 di atas ivory #FBF9F6 = 3.59 (gagal), di atas putih = 3.78 (gagal). Cokelat #8C6526 = 4.99 (lulus). Abu #6E6E73 di ivory = 4.83, di F3F1ED = ~4.5 (batas)
- [A] A9 Warna emas #A67C37 untuk teks tidak lulus AA. Pilihan: pakai #8C6526 untuk teks dan biarkan #A67C37 untuk ornamen. Keputusan desain pemilik
- [x] C2 Pastikan setiap img punya alt. Sudah benar: satu-satunya img tanpa alt adalah pixel pelacak 1x1 dengan alt kosong yang disengaja
- [x] C3 Meta description: semua halaman publik sudah punya. admin, profil, dan pembayaran sudah noindex, jadi tidak perlu deskripsi
- [~] C4 Kandidat CSS tidak terpakai. Kelompok galeri (gallery-*, gp-1..gp-8) dan kelompok instructor-* serta testimonial-* yang tidak dipakai sudah dihapus. Sisanya menunggu. Kandidat (sudah diverifikasi dengan pencarian substring di semua HTML dan JS: 53 kelas benar-benar tidak muncul; `warn` ternyata dipakai). Dari 179 tidak ditemukan di HTML/JS. Daftar: adm-bar, adm-chip, adm-field, adm-who, arabic, big, blog-category, blog-content, blog-excerpt, blog-image, blog-meta, breadcrumb, contact-card, contact-grid, contact-icon, contact-label, contact-value, container-wide, cta-arabic, gallery-grid, gallery-item, gallery-placeholder, gp-1 s/d gp-8, hero-arabic, instructor-* (avatar, bio, card, name, specialty, title), instructors-grid, page-header, pricing-dummy-note, program-meta, testimonial-* (author, avatar, card, info, name, role, text), testimonials-grid, about-value* (icon, text), about-values, warn. Belum dihapus: beberapa bisa dibentuk dinamis lewat string di JS. Verifikasi per kelas dulu, lalu hapus sebagai commit terpisah
- [ ] C5 Periksa semua fetch Supabase di js/ terhadap daftar RPC yang ada (sudah dicek, cocok kecuali tandai_bukti)
