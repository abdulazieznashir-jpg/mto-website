/* Mahkota peserta: saldo, klaim login harian, papan peringkat, riwayat, dan foto profil.
 * Perhitungan dilakukan di Supabase (lihat supabase/mahkota.sql). Dipanggil dari js/profil.js.
 */
(function () {
  var sb = null;
  var user = null;
  var BUCKET = 'avatars';
  var MAX_BYTES = 2 * 1024 * 1024;
  var TIPE = ['image/png', 'image/jpeg', 'image/webp'];

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
    $('mkRank').textContent = d.peringkat ? '#' + d.peringkat + ' / ' + d.jumlah_peserta : '–';
    $('mkStreak').textContent = d.streak + ' hari';
    $('mkBulan').textContent = d.bulan_ini;

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

  /* ---------- Foto profil ---------- */
  function pasangAvatar(u) {
    if (u) user = u;
    var av = $('pfAvatar');
    if (!av || !sb) return;
    var old = av.querySelector('img');
    if (old) old.remove();
    var path = user && user.user_metadata && user.user_metadata.avatar_path;
    if (!path) return;
    sb.storage.from(BUCKET).createSignedUrl(path, 3600).then(function (r) {
      if (r.error || !r.data) return;
      var img = document.createElement('img');
      img.alt = 'Foto profil';
      img.src = r.data.signedUrl;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
      av.textContent = '';
      av.appendChild(img);
    });
  }

  function unggahFoto(e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (TIPE.indexOf(f.type) === -1) { note('Format foto harus JPG, PNG, atau WEBP.', true); return; }
    if (f.size > MAX_BYTES) { note('Ukuran foto maksimal 2 MB.', true); return; }

    var path = user.id + '/avatar';
    note('Mengunggah foto…');
    sb.storage.from(BUCKET)
      .upload(path, f, { upsert: true, contentType: f.type, cacheControl: '3600' })
      .then(function (r) {
        if (r.error) throw r.error;
        return sb.auth.updateUser({ data: { avatar_path: path, avatar_v: Date.now() } });
      })
      .then(function (r) {
        if (r.error) throw r.error;
        user = r.data.user;
        pasangAvatar(user);
        note('Foto profil sudah disimpan.');
      })
      .catch(function () { note('Foto belum tersimpan. Coba lagi.', true); });
  }

  /* ---------- Inisialisasi ---------- */
  function init(client, u) {
    sb = client;
    user = u;
    $('btnKlaim').addEventListener('click', klaim);
    $('btnFoto').addEventListener('click', function () { $('fileFoto').click(); });
    $('fileFoto').addEventListener('change', unggahFoto);
    pasangAvatar(u);
    muat();
  }

  window.MTO_MAHKOTA = { init: init, pasangAvatar: pasangAvatar };
})();
