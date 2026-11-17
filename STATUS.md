# STATUS redesign admin (branch redesign-admin)

Total langkah: 19 dari 300 (rencana 300)
Progres keseluruhan: perkiraan 72%
- Beranda: 92% (kartu Belum Bayar sudah terisi dari daftar lunas; kartu Pendaftar Baru menunggu definisi)
- Halaqoh: 60% (kartu, judul, filter, inisial sudah; filter Ikhwan/Akhwat belum karena data gender belum ada)
- Peserta: 70% (judul, tab Belum/Sudah Bayar, kolom Program dari kelas. Kolom Jenis Baru/Repeat belum: tidak ada datanya di database)
- Detail Halaqoh: 70% (statistik dan daftar peserta sudah, dengan inisial di tiap peserta. Tampilan referensi khusus detail belum ada di referensi. Pencocokan murid ke pengajar lewat nama)
- Detail Peserta: 60% (inisial, status, label info sudah sesuai referensi. Kolom Jenis (Baru/Repeat) belum ada datanya)
- Navigasi dan menu: 100% (desktop: Notifikasi ditambahkan di bagian paling bawah sidebar)

## Selesai
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
- Sinkronisasi dengan branch utama (origin/main sekarang juga punya commit baru 70208fc tentang Beranda Total Peserta, Masuk Grup, Penempatan Pengajar; run ini tidak menggabungkan apa pun): origin/main punya 10 commit yang belum ada di redesign-admin (Halaqoh: pencocokan murid lewat nama pengampu dan filter Ikhwan/Akhwat; Peserta: kolom cari, filter Gelombang, kartu ringkasan; Beranda: angka Peserta Aktif, Belum Bayar, Pengajar Aktif; Notifikasi; perbaikan email Owner dan redirect ke admin.html). redesign-admin juga punya 2 commit yang belum ada di main. Run ini tidak menggabungkan apa pun. Perlu keputusan: merge main ke redesign-admin, rebase, atau biarkan terpisah. Catatan: sebagian poin 'Menunggu' di bawah mungkin sudah terjawab di main.
- Jadwal pengajar dari spreadsheet (Google Sheets): belum dimasukkan ke database. Tabel pengajar hanya punya 1 baris sekarang. Sheet punya sekitar 17 pengajar Akhwat dan belasan Ikhwan, tapi tanpa email. Email dipakai sebagai kunci tabel pengajar. Perlu: periode mana yang dipakai (P69 sampai P77, atau G1 dan G2 dasar), email tiap pengajar, dan izin menulis ke database.
- Kartu "Pendaftar Baru" belum punya data. Perlu definisi: status apa yang dihitung sebagai pendaftar baru? Ringkasan database (admin_ringkasan_lengkap) juga belum punya angka ini, dan mengubahnya butuh perubahan SQL (di luar izin saat ini).
- Kartu "Belum Bayar" sekarang dihitung di frontend dari admin_daftar_lunas. Kalau owner lebih suka angka dari ringkasan database, perlu perubahan SQL.
- Kartu Murid Jeda dan Belum Ada Gelombang dihapus dari Beranda karena tidak ada di referensi. Data tetap ada di halaman Peserta.
- Tugas Hari Ini masih dipertahankan di bawah kartu, karena belum ada keputusan untuk menghapusnya.
- Angka Beranda: data asli dari database, atau contoh dulu?
- Halaqoh dipetakan ke halaman Pengajar. Sudah benar?
- Kemiripan final: perkiraan 75% (struktur menu, sidebar, bottom bar, kartu Beranda, kartu Halaqoh sudah sesuai)
- Nama merek: referensi menulis "Mahkota Tahfidz Online", tapi seluruh situs memakai "Tahfizh" (69 tempat). Belum diubah. Perlu keputusan: ikut referensi (ubah semua situs) atau tetap "Tahfizh".
