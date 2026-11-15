/* Pilihan tanggal lahir (tanggal, bulan, tahun) dan penghitung usia.
 * Dipakai di halaman daftar (login.html) dan profil. Usia dihitung dari tanggal lahir.
 */
(function () {
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function opsi(select, teks, nilai, pilih) {
    var o = document.createElement('option');
    o.value = nilai;
    o.textContent = teks;
    if (pilih) o.selected = true;
    select.appendChild(o);
  }

  // Isi ketiga pilihan. Tahun mencakup usia 10 sampai 100 tahun.
  function isi(hari, bulan, tahun) {
    if (!hari || !bulan || !tahun) return;
    var sekarang = new Date().getFullYear();

    hari.textContent = '';
    opsi(hari, 'Tanggal', '', true);
    for (var d = 1; d <= 31; d++) opsi(hari, String(d), String(d));

    bulan.textContent = '';
    opsi(bulan, 'Bulan', '', true);
    BULAN.forEach(function (nama, i) { opsi(bulan, nama, String(i + 1)); });

    tahun.textContent = '';
    opsi(tahun, 'Tahun', '', true);
    for (var y = sekarang - 10; y >= sekarang - 100; y--) opsi(tahun, String(y), String(y));
  }

  // Mengembalikan 'YYYY-MM-DD', atau '' bila belum lengkap atau tanggalnya tidak ada (misalnya 31 Februari).
  function iso(hari, bulan, tahun) {
    var h = Number(hari.value), b = Number(bulan.value), t = Number(tahun.value);
    if (!h || !b || !t) return '';
    var akhirBulan = new Date(t, b, 0).getDate();
    if (h > akhirBulan) return '';
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return t + '-' + pad(b) + '-' + pad(h);
  }

  // Usia dalam tahun penuh, dihitung dari 'YYYY-MM-DD'.
  function usia(isoTanggal) {
    if (!isoTanggal) return null;
    var p = isoTanggal.split('-');
    var y = Number(p[0]), m = Number(p[1]), d = Number(p[2]);
    var now = new Date();
    var u = now.getFullYear() - y;
    var bulanIni = now.getMonth() + 1;
    if (bulanIni < m || (bulanIni === m && now.getDate() < d)) u--;
    return u;
  }

  window.MTO_TGL = { isi: isi, iso: iso, usia: usia };
})();
