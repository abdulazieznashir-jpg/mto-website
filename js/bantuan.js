/* Bantuan akun: pencarian dan penjelasan singkat di setiap fitur (tanda "?").
 * Penjelasan ada di tab Bantuan (profil.html). Tanda "?" membuka tab itu dan item yang sesuai.
 */
(function () {
  var cari = document.getElementById('btCari');
  var kosong = document.getElementById('btKosong');

  function saring() {
    if (!cari) return;
    var q = cari.value.trim().toLowerCase();
    var ada = 0;
    document.querySelectorAll('.bt-item').forEach(function (d) {
      var cocok = !q || d.textContent.toLowerCase().indexOf(q) >= 0;
      d.hidden = !cocok;
      if (cocok) ada++;
    });
    document.querySelectorAll('.bt-kat').forEach(function (k) {
      k.hidden = !k.querySelector('.bt-item:not([hidden])');
    });
    if (kosong) kosong.classList.toggle('hidden', ada > 0);
  }
  if (cari) cari.addEventListener('input', saring);

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-bantuan]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    var d = document.getElementById(b.getAttribute('data-bantuan'));
    if (!d) return;
    if (cari) { cari.value = ''; saring(); }
    location.hash = 'bantuan';
    d.open = true;
    document.querySelectorAll('.bt-sorot').forEach(function (x) { x.classList.remove('bt-sorot'); });
    d.classList.add('bt-sorot');
    setTimeout(function () {
      d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  });
})();
