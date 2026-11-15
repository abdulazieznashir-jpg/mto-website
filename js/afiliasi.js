/* Program afiliasi di halaman profil peserta.
 * Gabung hanya bisa untuk peserta yang sudah aktif (diperiksa di server, lihat supabase/afiliasi.sql).
 */
(function () {
  var sb = null;
  var user = null;

  var $ = function (id) { return document.getElementById(id); };

  function note(msg, bad) {
    var el = $('notice');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('bad', !!bad);
  }

  function pesanErr(err) {
    var m = (err && err.message) || '';
    if (/akun belum aktif/i.test(m)) return 'Afiliasi tersedia setelah akun Anda aktif, yaitu setelah pembayaran diverifikasi.';
    if (/tidak valid/i.test(m)) return 'Periksa nama, bank, dan nomor rekening Anda.';
    return 'Belum berhasil. Coba lagi.';
  }

  function linkRef(kode) {
    return window.location.origin + '/login.html?ref=' + encodeURIComponent(kode);
  }

  function tampilAktif(d) {
    $('btnGabung').closest('.af-intro').classList.add('hidden');
    $('formAfiliasi').classList.add('hidden');
    $('afAktif').classList.remove('hidden');
    $('afKode').textContent = d.kode;
    $('afLink').textContent = linkRef(d.kode);
    var nomor = String(d.nomor_rekening || '');
    $('afRek').textContent = 'Pencairan ke ' + d.bank + ' ••••' + nomor.slice(-4);
  }

  function muat() {
    sb.from('afiliasi').select('kode,bank,nomor_rekening').maybeSingle().then(function (r) {
      if (r.error || !r.data) return;
      tampilAktif(r.data);
    });
  }

  function bukaForm() {
    $('formAfiliasi').classList.remove('hidden');
    $('btnGabung').classList.add('hidden');
    $('formAfiliasi').nama.focus();
  }

  function tutupForm() {
    $('formAfiliasi').reset();
    $('formAfiliasi').classList.add('hidden');
    $('btnGabung').classList.remove('hidden');
  }

  function gabung(e) {
    e.preventDefault();
    var f = $('formAfiliasi');
    var nama = (f.nama.value || '').trim();
    var bank = (f.bank.value || '').trim();
    var nomor = (f.nomor.value || '').replace(/[\s-]/g, '');
    if (!f.setuju.checked) { note('Centang persetujuan syarat program afiliasi.', true); return; }
    if (nama.length < 3 || bank.length < 2 || !/^[0-9]{5,20}$/.test(nomor)) {
      note('Periksa nama, bank, dan nomor rekening Anda.', true);
      return;
    }

    var btn = $('btnSimpanGabung');
    btn.disabled = true;
    sb.rpc('gabung_afiliasi', { p_nama: nama, p_bank: bank, p_nomor: nomor }).then(function (r) {
      btn.disabled = false;
      if (r.error) { note(pesanErr(r.error), true); return; }
      note('Selamat, Anda sudah bergabung dalam program afiliasi.');
      muat();
    });
  }

  function salin() {
    var teks = $('afLink').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teks).then(function () { note('Link sudah disalin.'); },
        function () { note('Salin link secara manual dari teks di atas.', true); });
    } else {
      note('Salin link secara manual dari teks di atas.', true);
    }
  }

  function init(client, u) {
    sb = client;
    user = u;
    $('btnGabung').addEventListener('click', bukaForm);
    $('btnBatalGabung').addEventListener('click', tutupForm);
    $('formAfiliasi').addEventListener('submit', gabung);
    $('btnSalin').addEventListener('click', salin);
    muat();
  }

  window.MTO_AFILIASI = { init: init };
})();
