/* Pesanan Saya: jumlah pesanan per status di bagian Saya.
 * Data dari tabel pesanan. RLS membatasi hanya pesanan milik peserta yang sedang masuk.
 * Status diubah admin, peserta hanya membaca.
 */
(function () {
  var STATUS = ['belum_bayar', 'diproses', 'belajar', 'beri_nilai'];

  function init(sb) {
    sb.from('pesanan').select('status').then(function (r) {
      if (r.error || !r.data) return;
      var hitung = {};
      r.data.forEach(function (x) { hitung[x.status] = (hitung[x.status] || 0) + 1; });
      STATUS.forEach(function (k) {
        var b = document.querySelector('.ps-item[data-status="' + k + '"] .ps-badge');
        if (!b) return;
        var n = hitung[k] || 0;
        b.textContent = n > 9 ? '9+' : String(n);
        b.hidden = n === 0;
      });
      var kosong = document.getElementById('psKosong');
      if (kosong) kosong.hidden = r.data.length > 0;
    });
  }

  window.MTO_PESANAN = { init: init };
})();
