# STATUS redesign admin (branch redesign-admin)

Total langkah: 27 dari 300 (rencana 300)
Progres keseluruhan: perkiraan 72%
- Beranda: 92% (kartu Belum Bayar sudah terisi dari daftar lunas; kartu Pendaftar Baru menunggu definisi)
- Halaqoh: 60% (kartu, judul, filter, inisial sudah; filter Ikhwan/Akhwat belum karena data gender belum ada)
- Peserta: 70% (judul, tab Belum/Sudah Bayar, kolom Program dari kelas. Kolom Jenis Baru/Repeat belum: tidak ada datanya di database)
- Detail Halaqoh: 70% (statistik dan daftar peserta sudah, dengan inisial di tiap peserta. Tampilan referensi khusus detail belum ada di referensi. Pencocokan murid ke pengajar lewat nama)
- Detail Peserta: 60% (inisial, status, label info sudah sesuai referensi. Kolom Jenis (Baru/Repeat) belum ada datanya)
- Navigasi dan menu: 100% (desktop: Notifikasi ditambahkan di bagian paling bawah sidebar)

## Selesai
- [ ] Catatan run 28 (2026-11-17 18:17 UTC): tidak ada langkah kode yang bisa dikerjakan tanpa keputusan pemilik, jadi total langkah tetap 27 (commit ini hanya catatan, tidak dihitung sebagai langkah). Cek ulang: origin/main masih di 4fd21d6. Selisih terbaru redesign-admin vs main: 14 commit di depan, 29 di belakang (angka di run 27 sudah tidak akurat). Perubahan admin.html di redesign-admin tinggal 28 baris tambah dan 4 hapus dibanding titik cabangnya. Semua sisa pekerjaan tetap menunggu keputusan PRIORITAS. Tidak ada merge, tidak ada push ke main.
- [x] Langkah 27: run terjadwal (2026-11-17). Cek ulang status, tanpa perubahan kode. origin/main sekarang di 4fd21d6 (sebelumnya 84472d8): main sudah punya tab Transkrip di kiri Notifikasi (c790c7a) dan file TASKS.md/PLAN.md hasil audit (kontras, meta, tautan bersih, placeholder Pixel, ejaan Tahfizh vs Tahfidz). redesign-admin tetap 29 commit di depan dan 13 di belakang main; admin.html tetap konflik besar (main 1394 baris berbeda). Semua langkah yang tersisa masih menunggu keputusan pemilik (lihat 'Menunggu keputusan pemilik', poin PRIORITAS). Tidak ada merge, tidak ada push ke main.
- [x] Langkah 26: run terjadwal (2026-11-17). Cek sintaks skrip inline admin.html (lolos node --check). Tidak ada perubahan tampilan. Perbandingan dengan origin/main: redesign-admin 29 commit di depan dan 12 di belakang. Main sudah memuat versi sendiri untuk Beranda, Peserta, dan Halaqoh, serta tab Notifikasi di bawah yang menggantikan lonceng atas (1ae93c5). Melanjutkan tampilan di redesign-admin sekarang berisiko menduplikasi atau berbenturan dengan main. Keputusan yang dibutuhkan: rebase redesign-admin ke main, atau cukup pakai main sebagai acuan. Tidak ada merge, tidak ada push ke main.
- [x] Langkah 25: run terjadwal (2026-11-17). Cek konflik saja, tanpa mengubah kode dan tanpa merge (git merge-tree, hanya baca). origin/main sekarang di 1ae93c5 (dari d33553c): ada commit Notifikasi admin dengan trigger tabel notifikasi_admin (folder supabase/ ikut berubah di main, tidak disentuh di sini). Perbedaan: redesign-admin 21 commit di depan dan 11 di belakang main. Hasil: satu-satunya konflik adalah admin.html. Di redesign-admin, admin.html hanya berubah 32 baris sejak titik cabang aaa47bb; di main, admin.html berubah 1327 baris. Dibandingkan langsung, redesign-admin menambah 122 baris dan menghapus 1235 baris dari main. Angka ini memperkuat opsi (a) di bawah. Tidak ada perubahan tampilan.
- [x] Langkah 24: run terjadwal (2026-11-17, pukul 14:16 UTC). Cek sintaks skrip inline admin.html (1 blok, lolos node --check). Tidak ada perubahan tampilan. origin/main sekarang di d33553c (dari d7b9aba): ada tambahan 4 commit soal Halaqoh dan Beranda versi HP serta Beranda 'Menunggu Masuk Grup'. Perbedaan: redesign-admin 18 commit di depan dan 10 di belakang main. Main sudah memuat versi sendiri untuk Beranda, Peserta, dan Halaqoh (lihat 'Menunggu keputusan pemilik'), jadi melanjutkan perubahan tampilan di redesign-admin sekarang berisiko menduplikasi atau berbenturan. Tidak ada merge, tidak ada push ke main.
- [x] Langkah 23: run terjadwal (2026-11-17, pukul 13:16 UTC). Cek sintaks skrip inline admin.html (1 blok, lolos node --check). Tidak ada perubahan tampilan. origin/main sekarang di d7b9aba (sebelumnya 84472d8): ada commit baru soal Peserta (tampilan menunggu pengajar, panel pilih pengajar manual). redesign-admin tetap 15 commit di belakang main dan 9 commit di depan. Tidak ada merge, tidak ada push ke main.
- [x] Langkah 22: run terjadwal (2026-11-17, pukul 12:16 UTC). Cek sintaks skrip inline admin.html (1 blok, lolos node --check). Tidak ada perubahan tampilan. origin/main sekarang di 84472d8 (Owner langsung diarahkan ke admin.html), jadi ada tambahan commit di main yang belum masuk redesign-admin; sinkronisasi tetap menunggu keputusan pemilik. Tidak ada merge, tidak ada push ke main.
- [x] Langkah 21: run terjadwal (2026-11-17). Cek ulang sintaks skrip inline admin.html (lolos node --check). Tidak ada perubahan tampilan. Semua sisa pekerjaan yang tersisa bergantung pada keputusan pemilik (lihat "Menunggu keputusan pemilik"): merge atau rebase dengan main, sumber data Pendaftar Baru, Jenis Baru/Repeat, jadwal pengajar dari spreadsheet, dan nama merek. Run ini tidak menggabungkan apa pun dan tidak mengubah branch utama.
- [x] Langkah 20: run terjadwal. Cek sintaks skrip inline admin.html (1 blok, lolos node --check) dan koneksi CDN Supabase. Tidak ada perubahan tampilan. Tidak ada langkah lain yang bisa dikerjakan tanpa keputusan pemilik; semua sisa item ada di "Menunggu keputusan pemilik".
- [x] Langkah 19: daftar peserta di detail Halaqoh diberi inisial (avatar lingkaran krem), sama seperti di detail Peserta. Hanya tampilan; data dan fungsi tidak diubah. Sintaks skrip inline sudah dicek.
- [x] Langkah 18: kartu Beranda "Belum Bayar" diisi dari admin_daftar_lunas (sumber yang sama dengan daftar Belum lunas di Peserta). Hanya frontend, tanpa ubah SQL. Angka Pendaftar Baru tetap "—". Sintaks skrip sudah dicek.
- [x] Langkah 17: verifikasi visual lewat Playwright (salinan di luar repo, gerbang login dilewati, konten data kosong). Sidebar desktop (logo mahkota, Beranda aktif, Peserta, Halaqoh, Notifikasi di bawah) dan bottom bar HP (Beranda, Peserta, Halaqoh, Notifikasi) sudah sesuai referensi. Area konten belum tampak karena tanpa data.
- [x] Langkah 16: Notifikasi ditambahkan di bagian paling bawah sidebar desktop (membuka panel lonceng yang sudah ada, sama seperti bottom bar HP). Menu lama tetap tersembunyi, tidak ada kode yang dihapus.
- [x] Langkah 15: tabel Peserta memakai lebar penuh saat detail tertutup (sebelumnya menyisakan kolom kosong 340px). Saat detail terbuka tetap dua kolom.
- [x] Langkah 14: kartu Halaqoh (Pengajar) jadi kartu lebar dengan angka di kiri dan panah › di kanan (sebelumnya tersusun vertikal di tengah). Lencana Admin di top bar HP disembunyikan.
- [x] Langkah 1: menu lama disembunyikan dari sidebar dan bottom bar (halaman tetap ada)
- [x] Langkah 2: label Beranda dan Peserta, judul Beranda
- [x] Langkah 3: Halaqoh (memakai halaman Pengajar) dan Notifikasi di bottom bar
- [x] Langkah 13: detail Peserta: inisial, pil status, label No. WhatsApp, Program, Durasi, Pengajar
- [x] Langkah 12: detail Halaqoh menampilkan statistik (Peserta, Aktif, Belum Bayar) dan daftar peserta per pengajar
- [x] Langkah 11: tampilan admin lama di profil.html disembunyikan. Pintu masuk utama sekarang kartu "Buka Admin Mahkota Tahfidz Online" yang mengarah ke admin.html, dan hanya muncul untuk admin.
- [x] Langkah 10: kolom Program (dari kelas) menggantikan WA dan Gelombang di tabel Peserta. Kolom WA tetap ada di detail peserta.
- [x] Langkah 9: tab Peserta diganti Semua / Belum Bayar / Sudah Bayar, dihitung dari admin_daftar_lunas. Tab Aktif dan Jeda dilepas dari tampilan. Logikanya masih ada di kode.
- [x] Langkah 8: judul dan subjudul Peserta; gaya tab sebagai pil
- [x] Langkah 7: halaman Halaqoh berbentuk kartu dengan judul, subjudul, filter, dan inisial
- [x] Langkah 6: ikon di kartu Beranda dan kartu Halaqoh sesuai referensi terakhir
- [x] Langkah 5: cek ID elemen. Semua 55 ID yang dipakai JavaScript masih ada, tidak ada fungsi yang putus.
- [x] Langkah 4: kartu Beranda disusun ulang (3 kartu + kartu lebar Halaqoh). Subjudul ganda dihapus.

## Sedang dikerjakan
- Verifikasi isi Beranda dengan data asli belum bisa dilakukan tanpa login owner. Perlu dicek manual di browser.

## Sudah berjalan (belum diubah, harus tetap utuh)
- Pemuatan data dari Supabase (muatMurid, dashboard)
- Daftar peserta dan detail peserta
- Daftar pengajar
- Pembayaran dan pengumuman
- Panel notifikasi (lonceng)

## Keputusan yang saya ambil sendiri (bisa diubah)
- Murid dicocokkan ke pengajar lewat nama (pengampu_nama). Kalau ada dua pengajar dengan nama sama, datanya tercampur. Perlu ID pengajar dari database.
- Admin lama ada di profil.html (#adminBox), bukan di admin.html. Yang disembunyikan adalah #adminBox. Pintu masuk baru memakai pemeriksaan pendaftaran_admin yang sudah ada.
- Kolom Jenis (Baru/Repeat) belum ada karena tidak ada sumber datanya. Tidak saya tebak.
- Tab Aktif dan Jeda di Peserta saya ganti dengan Belum Bayar dan Sudah Bayar, sesuai referensi. Filter Jeda tidak lagi tampil, tapi datanya masih ada.
- Halaqoh = halaman Pengajar (kartu referensi bertuliskan "Halaqoh (Pengajar)")
- Notifikasi = panel lonceng yang sudah ada
- Kartu Pendaftar Baru dan Belum Bayar tampil "—" sampai ada sumber data
- Filter Ikhwan/Akhwat di Halaqoh belum ditambahkan karena belum ada data gender pengajar. Saya tidak menebak dari nama.

## Menunggu keputusan pemilik
- PRIORITAS: Arah branch. Per run 25: konflik dengan main hanya di admin.html (git merge-tree). Sampai dipilih, run terjadwal tidak menambah perubahan tampilan. origin/main (d33553c) sudah memuat redesign admin versi pemilik: Beranda (Total Peserta, Masuk Grup, Penempatan Pengajar, Menunggu Masuk Grup, versi HP), Peserta (ringkasan, filter, panel pilih pengajar), Halaqoh (kapasitas, filter Ikhwan/Akhwat, versi HP), dan Notifikasi. Pilihan: (a) redesign-admin dibuang dan referensi diterapkan ulang di atas main, (b) redesign-admin di-rebase ke main lalu hanya bagian yang belum ada yang ditambahkan, (c) main dipakai sebagai dasar dan branch ini ditutup. Sampai ada jawaban, run berikutnya tidak akan menambah perubahan tampilan baru.
- Sinkronisasi dengan branch utama (per run 24, origin/main di d33553c; run 23, d7b9aba; run 22 di 84472d8; sebelumnya 70208fc tentang Beranda Total Peserta, Masuk Grup, Penempatan Pengajar; run ini tidak menggabungkan apa pun): origin/main punya 10 commit yang belum ada di redesign-admin (Halaqoh: pencocokan murid lewat nama pengampu dan filter Ikhwan/Akhwat; Peserta: kolom cari, filter Gelombang, kartu ringkasan; Beranda: angka Peserta Aktif, Belum Bayar, Pengajar Aktif; Notifikasi; perbaikan email Owner dan redirect ke admin.html). redesign-admin juga punya 2 commit yang belum ada di main. Run ini tidak menggabungkan apa pun. Perlu keputusan: merge main ke redesign-admin, rebase, atau biarkan terpisah. Catatan: sebagian poin 'Menunggu' di bawah mungkin sudah terjawab di main.
- Jadwal pengajar dari spreadsheet (Google Sheets): belum dimasukkan ke database. Tabel pengajar hanya punya 1 baris sekarang. Sheet punya sekitar 17 pengajar Akhwat dan belasan Ikhwan, tapi tanpa email. Email dipakai sebagai kunci tabel pengajar. Perlu: periode mana yang dipakai (P69 sampai P77, atau G1 dan G2 dasar), email tiap pengajar, dan izin menulis ke database.
- Kartu "Pendaftar Baru" belum punya data. Perlu definisi: status apa yang dihitung sebagai pendaftar baru? Ringkasan database (admin_ringkasan_lengkap) juga belum punya angka ini, dan mengubahnya butuh perubahan SQL (di luar izin saat ini).
- Kartu "Belum Bayar" sekarang dihitung di frontend dari admin_daftar_lunas. Kalau owner lebih suka angka dari ringkasan database, perlu perubahan SQL.
- Kartu Murid Jeda dan Belum Ada Gelombang dihapus dari Beranda karena tidak ada di referensi. Data tetap ada di halaman Peserta.
- Tugas Hari Ini masih dipertahankan di bawah kartu, karena belum ada keputusan untuk menghapusnya.
- Angka Beranda: data asli dari database, atau contoh dulu?
- Halaqoh dipetakan ke halaman Pengajar. Sudah benar?
- Kemiripan final: perkiraan 75% (struktur menu, sidebar, bottom bar, kartu Beranda, kartu Halaqoh sudah sesuai)
- Nama merek: referensi menulis "Mahkota Tahfidz Online", tapi seluruh situs memakai "Tahfizh" (69 tempat). Belum diubah. Perlu keputusan: ikut referensi (ubah semua situs) atau tetap "Tahfizh".
