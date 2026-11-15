/* Tombol Tampilkan/Sembunyikan untuk setiap kolom password.
 * Dipasang otomatis pada semua input[type="password"] di halaman.
 */
(function () {
  function pasang(input) {
    if (input.parentNode && input.parentNode.classList.contains('pw-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'pw-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pw-toggle';
    b.textContent = 'Tampilkan';
    b.setAttribute('aria-label', 'Tampilkan password');
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      var tampil = input.type === 'password';
      input.type = tampil ? 'text' : 'password';
      b.textContent = tampil ? 'Sembunyikan' : 'Tampilkan';
      b.setAttribute('aria-label', tampil ? 'Sembunyikan password' : 'Tampilkan password');
      b.setAttribute('aria-pressed', tampil ? 'true' : 'false');
      input.focus();
    });
    wrap.appendChild(b);
  }
  document.querySelectorAll('input[type="password"]').forEach(pasang);
})();
