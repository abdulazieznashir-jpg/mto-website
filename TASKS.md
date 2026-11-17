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
- [A] A11 Nomor e-wallet di daftar rekening (index.html dan pembayaran.html, 085722366003) berbeda dari nomor WA utama 085727533000. Bisa benar (nomor e-wallet terpisah), tapi perlu konfirmasi pemilik karena menyangkut pembayaran. Tidak diubah
- [A] A12 Data terstruktur (schema.org) di index.html memakai email admin@mahkotatahfizh.com, yang domainnya belum tentu aktif. Perlu konfirmasi alamat email resmi. Tidak diubah
- [A] A13 login.html tidak punya tag canonical (halaman publik lain sudah punya). Menambahkannya perlu URL domain resmi, dan domain itu belum dikonfirmasi (lihat A12). Tidak diubah
- [A] A14 Tidak ada robots.txt dan sitemap.xml di repo. Halaman privat sudah noindex, jadi tidak wajib, tetapi sitemap perlu domain resmi (lihat A12). Membuat berkas baru di situs produksi perlu persetujuan. Tidak dibuat
- [A] A15 Tidak ada favicon di repo dan tidak ada tag icon di 13 halaman. Perlu aset logo dari pemilik (keputusan desain). Tidak dibuat
- [A] A16 Tautan media sosial di footer index.html (Instagram, Facebook, YouTube, TikTok) masih href="#". Ikon ada, tapi tidak mengarah ke akun mana pun. Perlu URL akun resmi dari pemilik. Tidak diubah
- [A] A17 Tag Open Graph hanya ada di index.html (6 tag), tanpa og:image. Halaman lain tidak punya OG sama sekali. Saat tautan dibagikan di WhatsApp, pratinjau tanpa gambar. Perlu pilihan gambar pratinjau dan domain resmi (lihat A12). Tidak diubah
- [A] A18 Panjang judul dan deskripsi meta: judul paket-belajar.html 62 karakter (lebih dari 60), deskripsi index.html 178 karakter (lebih dari 160). Beberapa deskripsi lain di bawah 120. Ini teks pemasaran, jadi perbaikannya keputusan konten pemilik. Tidak diubah

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
- 17 Nov 2026 (putaran 26): cek lang, _blank tanpa noopener, dan ukuran gambar. Hasil kosong. hero.png sudah cadangan dari hero.webp di index.html.
- 17 Nov 2026 (putaran 27): spasi ganda, nomor wa.me (konstanta WA berawalan 62), dan type input. Hasil kosong.
- 17 Nov 2026 (putaran 28): label for, tombol ikon (profil punya teks), referensi aset CSS. Hasil kosong.
- 17 Nov 2026 (putaran 29): src ganda, meta viewport, dan ukuran aset. Hasil kosong.
- 17 Nov 2026 (putaran 30): h1 ganda ditemukan dan dicatat sebagai A10, tidak diubah. Tautan #anchor lintas halaman dan style inline berulang belum ada masalah nyata (display:none berulang setara dengan atribut hidden).
- 17 Nov 2026 (putaran 31): lang pada semua 13 html sudah id. Tidak ada tautan mailto. Format nomor telepon konsisten (0857-2753-3000 sama dengan 085727533000). Temuan baru: A11 dan A12, keduanya perlu konfirmasi pemilik.
- 17 Nov 2026 (putaran 32): title tiap halaman ada dan unik. Kata placeholder (contoh, xxx, lorem, todo) hanya di atribut placeholder atau teks contoh yang disengaja. Tidak ada console.log di js/. Hasil kosong.
- 17 Nov 2026 (putaran 33): semua src dan href lokal di HTML menunjuk ke file yang ada (tiga yang tampak hilang adalah string JS dalam atribut, bukan berkas). Hasil kosong.
- 17 Nov 2026 (putaran 34): cek canonical, robots, dan description per halaman. Semua halaman publik punya description. Hanya login.html yang belum punya canonical, dicatat sebagai A13 karena butuh domain resmi.
- 17 Nov 2026 (putaran 35): tautan dan tombol tanpa teks. Hanya satu di profil.html (pkEditWaktu), isinya diisi JS saat jadwal dimuat, jadi bukan masalah. Hasil kosong.
- 17 Nov 2026 (putaran 36): semua img di HTML sudah punya atribut width (mencegah pergeseran tata letak). Hasil kosong.
- 17 Nov 2026 (putaran 37): tidak ada tautan http:// yang tidak aman di HTML/JS/CSS. Satu-satunya http:// adalah namespace SVG di css/style.css, bukan tautan. Hasil kosong.
- 17 Nov 2026 (putaran 38): tidak ada robots.txt dan sitemap.xml. Dicatat sebagai A14, tidak dibuat karena menyangkut domain dan berkas baru di produksi.
- 17 Nov 2026 (putaran 39): pindai kata berulang berurutan di teks tampil. Semua hasil berasal dari judul dan label yang berdekatan setelah tag dibuang (misalnya 'Blog Blog &amp; Artikel'), bukan typo. Hasil kosong.
- 17 Nov 2026 (putaran 40): cek sintaks node --check untuk semua js/*.js lolos, dan working tree bersih. Hasil kosong.
- 17 Nov 2026 (putaran 41): kelas yang dipakai di HTML/JS tapi tidak punya aturan CSS: adm-buka-baru, cek-timer, hero-image, pd-meet, pd-ringkas, sy-runtun, tentang-page, tgl-grup (dan beberapa nama dinamis). Sebagian besar berfungsi sebagai kait JS atau diberi gaya inline. Bukan dari penghapusan CSS kita, karena sudah ada sejak commit cf1498e. Tidak ada efek visual yang rusak yang terlihat dari kode. Tidak diubah. Hasil kosong.
- 17 Nov 2026 (putaran 42): charset dan viewport ada di semua halaman. Tidak ada favicon, dicatat sebagai A15 (butuh aset logo dari pemilik).
- 17 Nov 2026 (putaran 43): semua form tanpa action sudah punya penangan submit di JS (termasuk form yang dibuat dinamis dan dataForm di index.html, yang ditangani lewat listener submit di container). Hasil kosong.
- 17 Nov 2026 (putaran 44): href="#" dan javascript:. Ditemukan empat tautan sosial di footer beranda yang masih kosong, dicatat sebagai A16 (butuh URL akun dari pemilik).
- 17 Nov 2026 (putaran 45): Open Graph hanya di index.html, tanpa og:image. Dicatat sebagai A17.
- [x] C6 Input nomor WhatsApp di form pendaftaran (index.html) diberi autocomplete: nomor utama memakai tel, ulangi memakai off agar browser tidak mengisi nomor yang sama. Hanya atribut, tidak mengubah perilaku
- 17 Nov 2026 (putaran 46): cek autocomplete pada input tel/email/password. Dua input WA di form pendaftaran belum punya atribut, sudah diperbaiki (C6). Sintaks skrip inline lolos.
- [x] C7 Select jam sesi di index.html (jamSel) tidak punya nama aksesibel. Ditambahkan aria-label "Jam mulai sesi". Select lain di admin/profil sudah punya label atau teks sr-only
- 17 Nov 2026 (putaran 47): cek select tanpa label. Empat dari lima select di admin/profil sudah dibungkus label; satu di index.html belum (diperbaiki sebagai C7).
- 17 Nov 2026 (putaran 48): tidak ada tabindex positif dan tidak ada autofocus. Hasil kosong.
- 17 Nov 2026 (putaran 49): panjang judul dan deskripsi meta. Dicatat sebagai A18 (teks pemasaran, keputusan pemilik).
- 17 Nov 2026 (putaran 50): tag br sangat sedikit (profil 1, index 2), tidak ada br berurutan. Hasil kosong.
- [x] C8 Teks Arab 'القرآن نور' di label gambar tentang (index.html) diberi lang="ar" agar pembaca layar membacanya dengan benar. Hanya atribut
- 17 Nov 2026 (putaran 51): cek teks Arab tanpa lang="ar". Satu ditemukan dan diperbaiki (C8).
- 17 Nov 2026 (putaran 52): pindai ulang teks Arab di semua halaman, hanya satu yang sudah diperbaiki di putaran 51. Hasil kosong.
- 17 Nov 2026 (putaran 53): tidak ada button atau tautan bersarang di dalam <a>. Hasil kosong.
