/* Tab akun (Beranda, Pengaturan, Afiliasi, Bantuan) dan menu avatar di pojok kanan atas.
 * Tab dipilih lewat hash di URL, tanpa memuat ulang halaman.
 */
(function () {
  var TAB = ['beranda', 'pengaturan', 'afiliasi', 'bantuan'];
  var panes = document.querySelectorAll('.pf-pane');
  var tabs = document.querySelectorAll('.pf-tab');
  var menu = document.getElementById('pfMenu');
  var btnMenu = document.getElementById('btnMenu');

  function tampilkan(nama) {
    if (TAB.indexOf(nama) < 0) nama = 'beranda';
    panes.forEach(function (p) {
      p.classList.toggle('is-on', p.getAttribute('data-pane') === nama);
    });
    tabs.forEach(function (t) {
      t.setAttribute('aria-selected', t.getAttribute('data-tab') === nama ? 'true' : 'false');
    });
    if (location.hash !== '#' + nama) {
      history.replaceState(null, '', '#' + nama);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
