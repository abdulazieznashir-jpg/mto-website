/* Navigasi akun: bar bawah (Pencapaian, Notifikasi, Saya) dan halaman Pengaturan.
 * Pengaturan memuat Data diri, Ubah password, lalu Afiliasi, Bantuan, dan Keluar.
 * Setiap layar punya hash sendiri di URL dan tidak memuat ulang halaman.
 */
(function () {
  var LAYAR = {
    pencapaian: 'pencapaian',
    notifikasi: 'notifikasi',
    saya: 'saya',
    pengaturan: 'pengaturan',
    afiliasi: 'afiliasi',
    bantuan: 'bantuan'
  };
  // Layar di bawah Saya: bar bawah tetap menandai Saya.
  var TAB_INDUK = { pengaturan: 'saya', afiliasi: 'saya', bantuan: 'saya' };
  var panes = document.querySelectorAll('.pf-pane');
  var tabs = document.querySelectorAll('.pf-tab[data-tab]');

  function tampilkan(nama) {
    if (!LAYAR[nama]) nama = 'pencapaian';
    var tab = TAB_INDUK[nama] || nama;
    panes.forEach(function (p) {
      p.classList.toggle('is-on', p.getAttribute('data-pane') === nama);
    });
    tabs.forEach(function (t) {
      t.setAttribute('aria-selected', t.getAttribute('data-tab') === tab ? 'true' : 'false');
    });
    if (location.hash !== '#' + nama) {
      history.replaceState(null, '', '#' + nama);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (nama === 'notifikasi') {
      window.dispatchEvent(new CustomEvent('notifikasi:buka'));
    }
  }

  function dariHash() {
    tampilkan(location.hash.replace('#', '') || 'pencapaian');
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tampilkan(t.getAttribute('data-tab'));
    });
  });

  // Tombol apa pun dengan data-go (roda gigi, kembali, Afiliasi, Bantuan).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-go]');
    if (!a) return;
    e.preventDefault();
    tampilkan(a.getAttribute('data-go'));
  });

  window.addEventListener('hashchange', dariHash);
  dariHash();
})();
