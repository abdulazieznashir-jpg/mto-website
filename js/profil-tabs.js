/* Navigasi bawah akun: Beranda, Deals (halaman terpisah), Notifikasi, dan Saya.
 * Saya memuat Pesanan Saya, Pengaturan, Afiliasi, dan Bantuan. Tab dipilih lewat hash di URL,
 * tanpa memuat ulang halaman. Menu avatar di pojok kanan atas tetap berfungsi.
 */
(function () {
  var GRUP = {
    beranda: ['beranda'],
    notifikasi: ['notifikasi'],
    saya: ['saya', 'pengaturan', 'afiliasi', 'bantuan']
  };
  // Bagian di dalam Saya: hash-nya tetap, lalu layar digulir ke bagian itu.
  var DI_SAYA = { pengaturan: true, afiliasi: true, bantuan: true };
  var panes = document.querySelectorAll('.pf-pane');
  var tabs = document.querySelectorAll('.pf-tab[data-tab]');
  var menu = document.getElementById('pfMenu');
  var btnMenu = document.getElementById('btnMenu');

  function tampilkan(nama) {
    var sub = DI_SAYA[nama] ? nama : null;
    var grup = sub ? 'saya' : (GRUP[nama] ? nama : 'beranda');
    var aktif = GRUP[grup];
    panes.forEach(function (p) {
      p.classList.toggle('is-on', aktif.indexOf(p.getAttribute('data-pane')) >= 0);
    });
    tabs.forEach(function (t) {
      t.setAttribute('aria-selected', t.getAttribute('data-tab') === grup ? 'true' : 'false');
    });
    var hashBaru = '#' + (sub || grup);
    if (location.hash !== hashBaru) {
      history.replaceState(null, '', hashBaru);
    }
    if (sub) {
      var el = document.querySelector('[data-pane="' + sub + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (grup === 'notifikasi') {
      window.dispatchEvent(new CustomEvent('notifikasi:buka'));
    }
  }

  function dariHash() {
    tampilkan(location.hash.replace('#', ''));
  }

  function bukaMenu(buka) {
    if (!menu || !btnMenu) return;
    menu.hidden = !buka;
    btnMenu.setAttribute('aria-expanded', buka ? 'true' : 'false');
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tampilkan(t.getAttribute('data-tab'));
    });
  });

  var tier = document.getElementById('pfTier');
  var tierInfo = document.getElementById('pfTierInfo');
  if (tier && tierInfo) {
    tier.addEventListener('click', function (e) {
      e.stopPropagation();
      var buka = tierInfo.hidden;
      tierInfo.hidden = !buka;
      tier.setAttribute('aria-expanded', buka ? 'true' : 'false');
    });
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', function (e) {
      e.stopPropagation();
      bukaMenu(menu.hidden);
    });
  }
  if (menu) {
    menu.addEventListener('click', function (e) {
      e.stopPropagation();
      var a = e.target.closest && e.target.closest('[data-go]');
      if (a) {
        e.preventDefault();
        tampilkan(a.getAttribute('data-go'));
        bukaMenu(false);
      }
    });
  }
  document.addEventListener('click', function () { bukaMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') bukaMenu(false);
  });
  window.addEventListener('hashchange', dariHash);

  dariHash();
})();
