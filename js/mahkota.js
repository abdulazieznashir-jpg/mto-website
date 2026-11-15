/* Mahkota peserta: saldo, klaim login harian, papan peringkat, riwayat, dan foto profil.
 * Perhitungan dilakukan di Supabase (lihat supabase/mahkota.sql). Dipanggil dari js/profil.js.
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

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function tglPendek(iso) {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) { return iso; }
  }

  /* ---------- Ringkasan ---------- */
  function muat() {
    sb.rpc('ringkasan_mahkota').then(function (r) {
      if (r.error || !r.data) { note('Data Mahkota belum bisa dimuat.', true); return; }
      tampil(r.data);
    });
  }

  function tampil(d) {
    $('mkTotal').textContent = d.total;
    $('mkRank').textContent = d.peringkat || '–';
    $('mkRankKet').textContent = d.peringkat && d.peringkat <= 3 ? 'Posisi 3 besar' : 'Posisi Anda';
    $('mkStreak').textContent = d.streak;
    renderJus(d.jus || {});

    var sudah = !!d.sudah_login_hari_ini;
    $('btnKlaim').disabled = sudah;
    $('btnKlaim').textContent = sudah ? 'Sudah' : 'Klaim +1';
    $('mkKlaimText').textContent = sudah ? 'Login hari ini sudah diklaim' : 'Login hari ini belum diklaim';

    var papan = (d.papan || []).map(function (p) {
      return '<li class="mk-row' + (p.saya ? ' me' : '') + '">' +
             '<span class="mk-pos">' + p.peringkat + '</span>' +
             '<span class="mk-nm">' + esc(p.inisial) + (p.saya ? ' <em>(Anda)</em>' : '') + '</span>' +
             '<span class="mk-sc">' + p.total + '</span></li>';
    }).join('');
    $('mkPapan').innerHTML = papan || '<li class="pf-empty">Belum ada peserta.</li>';

    var riwayat = (d.riwayat || []).map(function (h) {
      return '<li class="mk-row mk-hist">' +
             '<span class="mk-nm">' + esc(h.label) + '<br><small>' + tglPendek(h.tanggal) + '</small></span>' +
             '<span class="mk-sc">+' + h.jumlah + '</span></li>';
    }).join('');
    $('mkRiwayat').innerHTML = riwayat || '<li class="pf-empty">Belum ada riwayat Mahkota.</li>';
  }

  /* ---------- Pencapaian: Jus 1 sampai 30, tiap jus 20 halaman ---------- */
  function renderJus(data) {
    var el = $('pbJus');
    if (!el) return;
    var html = '';
    for (var n = 1; n <= 30; n++) {
      var h = Math.min(20, Math.max(0, parseInt(data[n], 10) || 0));
      html += '<li class="pb-juz">' +
              '<span class="pb-pena">' + n + '</span>' +
              '<div class="pb-juz-isi">' +
              '<div class="pb-juz-judul">Jus ' + n + '<span>' + h + '/20</span></div>' +
              '<div class="pb-bar"><i style="width:' + (h / 20 * 100) + '%"></i></div>' +
              '</div></li>';
    }
    el.innerHTML = html;
  }

  /* ---------- Klaim login harian ---------- */
  function klaim() {
    var b = $('btnKlaim');
    b.disabled = true;
    sb.rpc('klaim_login_harian').then(function (r) {
      if (r.error) { b.disabled = false; note('Klaim belum berhasil. Coba lagi.', true); return; }
      note(r.data && r.data.baru ? '+1 Mahkota diterima.' : 'Login hari ini sudah diklaim.');
      muat();
    });
  }

  /* ---------- Avatar ---------- */
  // 10 pilihan ikon non-makhluk hidup, bertema semangat dan belajar.
  var AVATAR = [
    { k: 'bintang', n: 'Bintang', d: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/>' },
    { k: 'hati', n: 'Hati', d: '<path d="M12 20.5s-7.5-4.6-9.2-9.1C1.6 8.4 3.5 5 7 5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.5 0 5.4 3.4 4.2 6.4C19.5 15.9 12 20.5 12 20.5z"/>' },
    { k: 'bulan', n: 'Bulan', d: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>' },
    { k: 'api', n: 'Semangat', d: '<path d="M12 22c-4 0-7-2.9-7-6.8C5 11 9 9 9 5c3 2 4 4.5 4 6.5.9-.8 1.6-2.2 1.6-3.8C17.8 9 19 12.4 19 15.2 19 19.1 16 22 12 22z"/>' },
    { k: 'lampu', n: 'Ide', d: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>' },
    { k: 'buku', n: 'Buku', d: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>' },
    { k: 'pena', n: 'Pena', d: '<path d="M16.5 3.5l4 4L8 20l-5 1 1-5zM14 6l4 4"/>' },
    { k: 'target', n: 'Target', d: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>' },
    { k: 'mahkota', n: 'Mahkota', d: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>' },
    { k: 'kompas', n: 'Kompas', d: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>' }
  ];

  function cariAvatar(k) {
    for (var i = 0; i < AVATAR.length; i++) if (AVATAR[i].k === k) return AVATAR[i];
    return null;
  }

  function svgAvatar(a) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + a.d + '</svg>';
  }

  function pasangAvatar(u) {
    if (u) user = u;
    var av = $('pfAvatar');
    if (!av) return;
    var a = cariAvatar(user && user.user_metadata && user.user_metadata.avatar_key);
    if (a) av.innerHTML = svgAvatar(a); // tanpa avatar, inisial nama tetap tampil
  }

  function bukaPilihan() {
    var g = $('pickAvatar');
    var buka = g.classList.contains('hidden');
    if (buka && !g.dataset.isi) {
      g.innerHTML = AVATAR.map(function (a) {
        return '<button type="button" class="av-opt" data-k="' + a.k + '" aria-label="' + a.n + '" title="' + a.n + '">' + svgAvatar(a) + '</button>';
      }).join('');
      g.dataset.isi = '1';
      g.querySelectorAll('.av-opt').forEach(function (b) { b.addEventListener('click', pilihAvatar); });
    }
    g.classList.toggle('hidden', !buka);
    $('btnFoto').setAttribute('aria-expanded', buka ? 'true' : 'false');
  }

  function pilihAvatar(e) {
    var k = e.currentTarget.getAttribute('data-k');
    sb.auth.updateUser({ data: { avatar_key: k } }).then(function (r) {
      if (r.error) { note('Avatar belum tersimpan. Coba lagi.', true); return; }
      user = r.data.user;
      pasangAvatar(user);
      $('pickAvatar').classList.add('hidden');
      $('btnFoto').setAttribute('aria-expanded', 'false');
      note('Avatar sudah disimpan.');
    });
  }

  /* ---------- Inisialisasi ---------- */
  function init(client, u) {
    sb = client;
    user = u;
    $('btnKlaim').addEventListener('click', klaim);
    $('btnFoto').addEventListener('click', bukaPilihan);
    pasangAvatar(u);
    muat();
  }

  window.MTO_MAHKOTA = { init: init, pasangAvatar: pasangAvatar };
})();
