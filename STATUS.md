# STATUS redesign admin (branch redesign-admin)

Total langkah: 9 dari 300 (rencana 300)
Progres keseluruhan: perkiraan 55%
- Beranda: 85% (kartu Pendaftar Baru dan Belum Bayar menunggu sumber data)
- Halaqoh: 60% (kartu, judul, filter, inisial sudah; filter Ikhwan/Akhwat belum karena data gender belum ada)
- Peserta: 50% (judul, subjudul, tab Belum Bayar dan Sudah Bayar dari data admin_daftar_lunas sudah. Kolom Jenis dan Program di tabel belum)
- Detail Halaqoh dan Detail Peserta: 0%
- Navigasi dan menu: 100%

## Selesai
- [x] Langkah 1: menu lama disembunyikan dari sidebar dan bottom bar (halaman tetap ada)
- [x] Langkah 2: label Beranda dan Peserta, judul Beranda
- [x] Langkah 3: Halaqoh (memakai halaman Pengajar) dan Notifikasi di bottom bar
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
- Tab Aktif dan Jeda di Peserta saya ganti dengan Belum Bayar dan Sudah Bayar, sesuai referensi. Filter Jeda tidak lagi tampil, tapi datanya masih ada.
- Halaqoh = halaman Pengajar (kartu referensi bertuliskan "Halaqoh (Pengajar)")
- Notifikasi = panel lonceng yang sudah ada
- Kartu Pendaftar Baru dan Belum Bayar tampil "—" sampai ada sumber data
- Filter Ikhwan/Akhwat di Halaqoh belum ditambahkan karena belum ada data gender pengajar. Saya tidak menebak dari nama.

## Menunggu keputusan pemilik
- Kartu "Pendaftar Baru" dan "Belum Bayar" belum punya data. Ringkasan database belum punya angka ini. Perlu fungsi SQL baru (di luar izin saat ini) atau isi placeholder dulu?
- Kartu Murid Jeda dan Belum Ada Gelombang dihapus dari Beranda karena tidak ada di referensi. Data tetap ada di halaman Peserta.
- Tugas Hari Ini masih dipertahankan di bawah kartu, karena belum ada keputusan untuk menghapusnya.
- Angka Beranda: data asli dari database, atau contoh dulu?
- Halaqoh dipetakan ke halaman Pengajar. Sudah benar?
- Kemiripan final: perkiraan 40% (struktur menu sudah sesuai, kartu Beranda belum)
