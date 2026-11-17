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
- [ ] A6 admin_daftar_murid dan admin_tambah_murid hanya mengizinkan mahkota.to3, bukan abdulaziez. Tidak dipakai frontend, tapi perlu disamakan

## B. Dari PLAN.md (belum dikerjakan)
- [ ] B1–B70 sesuai PLAN.md. Fase 1 (admin) sebagian besar belum; Fase 2–7 belum. Item yang butuh keputusan pemilik ditandai [A] di PLAN.md (harga, konten, perubahan alur daftar, insert data)

## C. Pembersihan kecil (aman dikerjakan tanpa persetujuan)
- [ ] C1 Cek kontras warna teks pada halaman publik (WCAG AA)
- [x] C2 Pastikan setiap img punya alt. Sudah benar: satu-satunya img tanpa alt adalah pixel pelacak 1x1 dengan alt kosong yang disengaja
- [ ] C3 Lengkapi meta description per halaman publik
- [ ] C4 Hapus CSS duplikat yang terbukti tidak dipakai (cek dengan pencarian kelas di HTML/JS)
- [ ] C5 Periksa semua fetch Supabase di js/ terhadap daftar RPC yang ada (sudah dicek, cocok kecuali tandai_bukti)
