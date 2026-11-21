/* Kolom bank pada form pencairan afiliasi: daftar pilihan yang bisa dicari.
   Sumber nama: bank umum konvensional dan syariah yang berizin OJK, serta e-wallet yang umum dipakai.
   Peserta tetap bisa mengetik nama lain secara bebas bila tidak ada di daftar. */
(function () {
  var DAFTAR = [
    { nama: 'BCA', alias: 'Bank Central Asia' },
    { nama: 'BCA Syariah', alias: 'Bank Central Asia Syariah' },
    { nama: 'BRI', alias: 'Bank Rakyat Indonesia' },
    { nama: 'BNI', alias: 'Bank Negara Indonesia' },
    { nama: 'Mandiri', alias: 'Bank Mandiri' },
    { nama: 'BSI', alias: 'Bank Syariah Indonesia' },
    { nama: 'BTN', alias: 'Bank Tabungan Negara' },
    { nama: 'BTN Syariah', alias: 'Bank Tabungan Negara Syariah' },
    { nama: 'CIMB Niaga', alias: 'CIMB' },
    { nama: 'CIMB Niaga Syariah', alias: 'CIMB Syariah' },
    { nama: 'Danamon', alias: 'Bank Danamon' },
    { nama: 'Permata', alias: 'Bank Permata' },
    { nama: 'Permata Syariah', alias: 'Bank Permata Syariah' },
    { nama: 'Maybank', alias: 'Bank Maybank Indonesia' },
    { nama: 'Panin', alias: 'Bank Panin' },
    { nama: 'Panin Dubai Syariah', alias: 'Bank Panin Dubai Syariah' },
    { nama: 'OCBC NISP', alias: 'OCBC' },
    { nama: 'UOB Indonesia', alias: 'UOB' },
    { nama: 'Mega', alias: 'Bank Mega' },
    { nama: 'Mega Syariah', alias: 'Bank Mega Syariah' },
    { nama: 'BTPN', alias: 'Bank BTPN' },
    { nama: 'BTPN Syariah', alias: 'Bank BTPN Syariah' },
    { nama: 'Jenius', alias: 'Jenius BTPN' },
    { nama: 'Jago', alias: 'Bank Jago' },
    { nama: 'SeaBank', alias: 'Bank SeaBank Indonesia' },
    { nama: 'Allo Bank', alias: 'Allo' },
    { nama: 'Neo Commerce', alias: 'Bank Neo Commerce, Bank Neo' },
    { nama: 'Muamalat', alias: 'Bank Muamalat Indonesia' },
    { nama: 'Aceh Syariah', alias: 'Bank Aceh Syariah' },
    { nama: 'BJB', alias: 'Bank Jabar Banten' },
    { nama: 'BJB Syariah', alias: 'Bank Jabar Banten Syariah' },
    { nama: 'Bank DKI', alias: 'Bank Pembangunan Daerah Jakarta' },
    { nama: 'Bank Jateng', alias: 'Bank Pembangunan Daerah Jawa Tengah' },
    { nama: 'Bank Jatim', alias: 'Bank Pembangunan Daerah Jawa Timur' },
    { nama: 'Bank Sumut', alias: 'Bank Pembangunan Daerah Sumatera Utara' },
    { nama: 'Bank Sultra', alias: 'Bank Pembangunan Daerah Sulawesi Tenggara' },
    { nama: 'Bank Kalbar', alias: 'Bank Pembangunan Daerah Kalimantan Barat' },
    { nama: 'Bank NTB Syariah', alias: 'Bank Nusa Tenggara Barat Syariah' },
    { nama: 'Bank Nagari', alias: 'Bank Pembangunan Daerah Sumatera Barat' },
    { nama: 'DANA', alias: 'e-wallet' },
    { nama: 'GoPay', alias: 'Gojek, e-wallet' },
    { nama: 'OVO', alias: 'e-wallet' },
    { nama: 'ShopeePay', alias: 'Shopee, e-wallet' },
    { nama: 'LinkAja', alias: 'e-wallet' },
    { nama: 'Sakuku', alias: 'e-wallet, BCA' }
  ];

  function normal(s) { return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

  var KATA_UMUM = ['bank', 'indonesia', 'pembangunan', 'daerah', 'persero'];

  // Peringkat: nama sama persis, nama diawali kata yang diketik, kata lain dalam nama, lalu alias.
  function cari(teks) {
    var q = normal(teks);
    if (!q) return DAFTAR;
    var skor = [];
    DAFTAR.forEach(function (b) {
      var n = normal(b.nama), kataNama = n.split(' '), kataAlias = normal(b.alias).split(' ').filter(function (k) { return KATA_UMUM.indexOf(k) === -1; });
      var s = 0;
      if (n === q) s = 4;
      else if (n.indexOf(q) === 0) s = 3;
      else if (kataNama.some(function (k) { return k.indexOf(q) === 0; })) s = 2;
      else if (kataAlias.some(function (k) { return k.indexOf(q) === 0; })) s = 1;
      if (s) skor.push({ b: b, s: s });
    });
    skor.sort(function (x, y) { return y.s - x.s; });
    return skor.map(function (x) { return x.b; });
  }

  function pasang(input) {
    if (!input || input.dataset.bankPasang === '1') return;
    input.dataset.bankPasang = '1';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');

    var wrap = document.createElement('div');
    wrap.className = 'bp-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var daftar = document.createElement('ul');
    daftar.className = 'bp-list';
    daftar.id = (input.name || 'bank') + 'BpList';
    daftar.setAttribute('role', 'listbox');
    daftar.hidden = true;
    wrap.appendChild(daftar);
    input.setAttribute('aria-controls', daftar.id);

    var aktif = -1, hasil = [];

    function tutup() { daftar.hidden = true; input.setAttribute('aria-expanded', 'false'); aktif = -1; }
    function buka() {
      hasil = cari(input.value);
      daftar.innerHTML = '';
      if (!hasil.length) {
        var kosong = document.createElement('li');
        kosong.className = 'bp-kosong';
        kosong.textContent = 'Tidak ada yang cocok. Anda bisa tetap mengetik nama bank secara manual.';
        daftar.appendChild(kosong);
      } else {
        hasil.forEach(function (b, i) {
          var li = document.createElement('li');
          li.className = 'bp-opsi';
          li.setAttribute('role', 'option');
          li.id = daftar.id + '-' + i;
          li.textContent = b.nama;
          li.dataset.i = i;
          daftar.appendChild(li);
        });
      }
      daftar.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      aktif = -1;
    }
    function pilih(i) {
      if (!hasil[i]) return;
      input.value = hasil[i].nama;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      tutup();
    }
    function sorot(i) {
      var opsi = daftar.querySelectorAll('.bp-opsi');
      if (!opsi.length) return;
      aktif = (i + opsi.length) % opsi.length;
      opsi.forEach(function (li, k) { li.classList.toggle('aktif', k === aktif); });
      input.setAttribute('aria-activedescendant', opsi[aktif].id);
      opsi[aktif].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('focus', buka);
    input.addEventListener('input', buka);
    input.addEventListener('blur', function () { setTimeout(tutup, 150); });
    input.addEventListener('keydown', function (e) {
      if (daftar.hidden && (e.key === 'ArrowDown')) { buka(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); sorot(aktif + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sorot(aktif - 1); }
      else if (e.key === 'Enter' && !daftar.hidden && aktif > -1) { e.preventDefault(); pilih(aktif); }
      else if (e.key === 'Escape') { tutup(); }
    });
    daftar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    daftar.addEventListener('click', function (e) {
      var li = e.target.closest('.bp-opsi');
      if (li) pilih(Number(li.dataset.i));
    });
  }

  function mulai() {
    document.querySelectorAll('[data-bank-pilih]').forEach(pasang);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();
