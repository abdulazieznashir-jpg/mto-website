# STATUS redesign admin (branch redesign-admin)

Total langkah: 6 dari 300

## Selesai
- [x] Langkah 1: menu lama disembunyikan dari sidebar dan bottom bar (halaman tetap ada)
- [x] Langkah 2: label Beranda dan Peserta, judul Beranda
- [x] Langkah 3: Halaqoh (memakai halaman Pengajar) dan Notifikasi di bottom bar
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
- Halaqoh = halaman Pengajar (kartu referensi bertuliskan "Halaqoh (Pengajar)")
- Notifikasi = panel lonceng yang sudah ada
- Kartu Pendaftar Baru dan Belum Bayar tampil "—" sampai ada sumber data

## Menunggu keputusan pemilik
- Kartu "Pendaftar Baru" dan "Belum Bayar" belum punya data. Ringkasan database belum punya angka ini. Perlu fungsi SQL baru (di luar izin saat ini) atau isi placeholder dulu?
- Kartu Murid Jeda dan Belum Ada Gelombang dihapus dari Beranda karena tidak ada di referensi. Data tetap ada di halaman Peserta.
- Tugas Hari Ini masih dipertahankan di bawah kartu, karena belum ada keputusan untuk menghapusnya.
- Angka Beranda: data asli dari database, atau contoh dulu?
- Halaqoh dipetakan ke halaman Pengajar. Sudah benar?
- Kemiripan final: perkiraan 40% (struktur menu sudah sesuai, kartu Beranda belum)
