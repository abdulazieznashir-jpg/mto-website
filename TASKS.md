# Daftar Tugas Perbaikan (hidup)

Sumber: PLAN.md (70 tugas), audit kode dan database 17 Nov 2026.
Status: [x] selesai · [~] sebagian · [ ] belum · [A] perlu persetujuan pemilik (dilewati saat jalan otomatis)

## A. Temuan audit (prioritas tinggi)
- [x] A1 Kartu kapasitas Halaqoh: bayangan variabel `ket` diperbaiki (commit 5219843)
- [x] A2 Tautan internal `.html` diubah ke alamat bersih, termasuk redirect JS (commit 7cfde01)
- [A] A3 Tombol "Sudah transfer, lanjut kirim bukti" di index.html memanggil RPC `tandai_bukti` yang tidak ada. [A] pilih: pakai alur pembayaran.html atau buat RPC baru
- [A] A4 Cabut EXECUTE dari role anon untuk fungsi admin_* (9 fungsi bisa dipanggil publik, sudah ada cek owner). Ditolak pemeriksaan keamanan, butuh persetujuan eksplisit
- [A] A5 Aktifkan proteksi kata sandi bocor di pengaturan Auth Supabase (dashboard)
- [A] A7 Facebook Pixel di 9 halaman publik masih memakai ID placeholder `PIXEL_ID`. Pelacakan iklan belum aktif. Perlu ID pixel asli dari pemilik
- [A] A8 Ejaan brand: situs memakai "Mahkota Tahfizh" (79 kali), PLAN.md dan percakapan memakai "Mahkota Tahfidz". Perlu keputusan pemilik sebelum diseragamkan
- [A] A6 admin_daftar_murid dan admin_tambah_murid hanya mengizinkan mahkota.to3, bukan abdulaziez. Tidak dipakai frontend, tapi perlu disamakan

## B. Dari PLAN.md (belum dikerjakan)
- [ ] B1–B70 sesuai PLAN.md. Fase 1 (admin) sebagian besar belum; Fase 2–7 belum. Item yang butuh keputusan pemilik ditandai [A] di PLAN.md (harga, konten, perubahan alur daftar, insert data)

## C. Pembersihan kecil (aman dikerjakan tanpa persetujuan)
- [x] C1 Audit kontras palet (WCAG AA, teks normal 4.5:1): emas #A67C37 di atas ivory #FBF9F6 = 3.59 (gagal), di atas putih = 3.78 (gagal). Cokelat #8C6526 = 4.99 (lulus). Abu #6E6E73 di ivory = 4.83, di F3F1ED = ~4.5 (batas)
- [A] A9 Warna emas #A67C37 untuk teks tidak lulus AA. Pilihan: pakai #8C6526 untuk teks dan biarkan #A67C37 untuk ornamen. Keputusan desain pemilik
- [x] C2 Pastikan setiap img punya alt. Sudah benar: satu-satunya img tanpa alt adalah pixel pelacak 1x1 dengan alt kosong yang disengaja
- [x] C3 Meta description: semua halaman publik sudah punya. admin, profil, dan pembayaran sudah noindex, jadi tidak perlu deskripsi
- [x] C4 Kandidat CSS tidak terpakai (dicek dengan pencarian teks di semua HTML dan JS). Sudah dihapus: galeri (gallery-*, gp-1..gp-8), instructor-*, dan testimonial-* yang tidak dipakai. adm-bar, adm-chip, adm-field, adm-who (di css/admin.css, yang hanya dimuat profil.html) sudah dihapus. blog-image, blog-content, blog-category, blog-excerpt, blog-meta sudah dihapus. arabic, hero-arabic, cta-arabic, breadcrumb, page-header, container-wide, pricing-dummy-note, program-meta sudah dihapus. Kelas big sudah lenyap bersama galeri. Daftar kandidat CSS sekarang habis. Hapus satu kelompok per commit, setelah cek ulang di HTML dan JS.
- [x] C5 Semua RPC di kode dicek terhadap database. Cocok, kecuali tandai_bukti yang tidak ada (lihat A3)

## Catatan putaran
- 17 Nov 2026 (dua rantai aktif): putaran kosong. Cek anchor, img alt, dan tautan kosong tidak menemukan masalah baru.
- 17 Nov 2026 (putaran 24 Nov): pindai fungsi JS tidak terpakai di js/ lain selain mahkota.js, hasil kosong.
