# STATUS redesign admin (branch redesign-admin)

Total langkah: 13 dari 300 (rencana 300)
Progres keseluruhan: perkiraan 66%
- Beranda: 85% (kartu Pendaftar Baru dan Belum Bayar menunggu sumber data)
- Halaqoh: 60% (kartu, judul, filter, inisial sudah; filter Ikhwan/Akhwat belum karena data gender belum ada)
- Peserta: 65% (judul, tab Belum/Sudah Bayar, kolom Program dari kelas. Kolom Jenis Baru/Repeat belum: tidak ada datanya di database)
- Detail Halaqoh: 60% (statistik dan daftar peserta sudah. Avatar dan tampilan referensi belum. Pencocokan murid ke pengajar lewat nama)
- Detail Peserta: 60% (inisial, status, label info sudah sesuai referensi. Kolom Jenis (Baru/Repeat) belum ada datanya)
- Navigasi dan menu: 100%

## Selesai
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
- Verifikasi visual terhadap referensi (belum ada browser untuk render)

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
- Jadwal pengajar dari spreadsheet (Google Sheets): belum dimasukkan ke database. Tabel pengajar hanya punya 1 baris sekarang. Sheet punya sekitar 17 pengajar Akhwat dan belasan Ikhwan, tapi tanpa email. Email dipakai sebagai kunci tabel pengajar. Perlu: periode mana yang dipakai (P69 sampai P77, atau G1 dan G2 dasar), email tiap pengajar, dan izin menulis ke database.
- Kartu "Pendaftar Baru" dan "Belum Bayar" belum punya data. Ringkasan database belum punya angka ini. Perlu fungsi SQL baru (di luar izin saat ini) atau isi placeholder dulu?
- Kartu Murid Jeda dan Belum Ada Gelombang dihapus dari Beranda karena tidak ada di referensi. Data tetap ada di halaman Peserta.
- Tugas Hari Ini masih dipertahankan di bawah kartu, karena belum ada keputusan untuk menghapusnya.
- Angka Beranda: data asli dari database, atau contoh dulu?
- Halaqoh dipetakan ke halaman Pengajar. Sudah benar?
- Kemiripan final: perkiraan 40% (struktur menu sudah sesuai, kartu Beranda belum)

## Deal Maker: samakan tampilan Owner dan Zikri (20 Nov 2026)
- [x] Langkah 1: Owner di Switch Account > Deal Maker kini memakai menu yang sama dengan akun Zikri (Beranda, Follow Up, Transkrip, Notifikasi), tanpa tombol cari, dan bisa kembali ke Owner. Sudah dites render lokal.
- [x] Langkah 2 (kode): Beranda Deal Maker milik Owner meminta data Zikri lewat dm_beranda(p_email). Jika fungsi SQL baru belum terpasang, otomatis memakai versi lama (angka 0).
- [ ] Menunggu: jalankan supabase/dm-beranda-per-pic.sql (bagian dm_beranda) di database agar Owner melihat angka Zikri.
