/* Daftar dan masuk Mahkota Tahfizh Online dengan email dan password.
 *
 * SUPABASE_URL      : Project URL dari Supabase (Project Settings → API).
 * SUPABASE_ANON_KEY : Publishable key (aman dipakai di browser karena RLS aktif).
 *                     JANGAN pakai secret key di halaman ini.
 */
(function () {
  var SUPABASE_URL = 'https://bvltmjurkgnzmwtgdaic.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_F4qsCGTEYFcxgJmqJd0TZg_yas0Ho1g';
  var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  var WA = '6285727533000';
  var PAKET_URL = 'index.html#daftar';
  var sb = null;
  var mode = 'daftar';   // 'daftar' | 'masuk'
  var emailCek = '';
  // true saat peserta membuka halaman dari link reset password di email
  var pemulihan = /type=recovery/.test(window.location.hash);

  var $ = function (id) { return document.getElementById(id); };
  function esc(v) { return String(v || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function waLink(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  function showView(id) {
    ['viewAuth', 'viewCek', 'viewLupa', 'viewBaru'].forEach(function (v) {
      $(v).classList.toggle('hidden', v !== id);
    });
    window.scrollTo(0, 0);
  }
  function note(el, msg, bad) {
    el.textContent = msg || '';
    el.classList.toggle('bad', !!bad);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function pageUrl() { return window.location.origin + window.location.pathname; }

  function setMode(m) {
    mode = m;
    var daftar = m === 'daftar';
    $('tabDaftar').setAttribute('aria-selected', daftar);
    $('tabMasuk').setAttribute('aria-selected', !daftar);
    $('fldNama').classList.toggle('hidden', !daftar);
    $('fldHint').classList.toggle('hidden', !daftar);
    $('fldTgl').classList.toggle('hidden', !daftar);
    $('fldJk').classList.toggle('hidden', !daftar);
    $('lupaWrap').classList.toggle('hidden', daftar);
    $('password').setAttribute('autocomplete', daftar ? 'new-password' : 'current-password');
    $('btnKirim').textContent = daftar ? 'Daftar' : 'Masuk';
    $('lgSub').textContent = daftar
      ? 'Buat akun dengan email dan password.'
      : 'Masuk dengan email dan password Anda.';
    if (sb) note($('notice'), '');
  }

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    if (label) btn.textContent = label;
  }

  function msgErr(err) {
    var m = (err && err.message) || '';
    if (/invalid login credentials/i.test(m)) return 'Email atau password salah.';
    if (/email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Buka email Anda lalu klik link konfirmasi.';
    if (/rate|too many|seconds/i.test(m)) return 'Terlalu sering mencoba. Tunggu sebentar lalu coba lagi.';
    if (/at least|password/i.test(m)) return 'Password minimal 8 karakter.';
    if (/already registered|already been registered/i.test(m)) return 'Email ini sudah terdaftar. Pilih tab "Sudah punya akun".';
    return 'Belum berhasil. Coba lagi.';
  }

  /* ---------- Pendaftar dan sesi ---------- */
  // Dipanggil setiap kali ada sesi aktif (setelah masuk atau konfirmasi email).
  // Pendaftar baru dibuatkan baris peserta dengan status awal 'terdaftar'.
  function pastikanPeserta(user) {
    var alamat = (user.email || '').toLowerCase();
    var meta = user.user_metadata || {};
    var baris = { email: alamat, nama: meta.nama || '', status: 'terdaftar' };
    if (meta.tgl) { baris.tanggal_lahir = meta.tgl; baris.usia = window.MTO_TGL ? MTO_TGL.usia(meta.tgl) : null; }
    if (meta.jk) baris.jenis_kelamin = meta.jk;
    sb.from('peserta')
      .upsert(baris, { onConflict: 'email', ignoreDuplicates: true })
      .then(function () {
        var admin = ['abdulaziez.nashir@gmail.com', 'mahkota.to3@gmail.com', 'azieznashir@gmail.com'].indexOf(alamat) !== -1;
        window.location.replace(admin ? 'admin.html' : 'profil.html');
      });
  }

  /* ---------- Lupa password ---------- */
  function kirimReset(e) {
    e.preventDefault();
    var alamat = (e.target.email.value || '').trim().toLowerCase();
    if (!validEmail(alamat)) { note($('noticeLupa'), 'Tulis email yang benar.', true); return; }
    if (!sb) { note($('noticeLupa'), 'Layanan masuk belum tersedia.', true); return; }
    var btn = $('btnKirimLupa');
    setBusy(btn, true, 'Mengirim…');
    sb.auth.resetPasswordForEmail(alamat, { redirectTo: pageUrl() }).then(function (r) {
      setBusy(btn, false, 'Kirim link reset');
      if (r.error) { note($('noticeLupa'), msgErr(r.error), true); return; }
      note($('noticeLupa'), 'Link untuk mengatur ulang password sudah dikirim. Cek email Anda, termasuk folder spam.');
    });
  }

  function simpanPasswordBaru(e) {
    e.preventDefault();
    var pass = e.target.password.value || '';
    if (pass.length < 8) { note($('noticeBaru'), 'Password minimal 8 karakter.', true); return; }
    var btn = $('btnSimpanBaru');
    setBusy(btn, true, 'Menyimpan…');
    sb.auth.updateUser({ password: pass }).then(function (r) {
      setBusy(btn, false, 'Simpan password baru');
      if (r.error) { note($('noticeBaru'), msgErr(r.error), true); return; }
      pemulihan = false;
      history.replaceState(null, '', pageUrl());
      e.target.reset();
      pastikanPeserta(r.data.user);
    });
  }

  /* ---------- Alur ---------- */
  function kirim(e) {
    e.preventDefault();
    var f = e.target;
    var alamat = (f.email.value || '').trim().toLowerCase();
    var pass = f.password.value || '';
    var n = (f.nama ? f.nama.value : '').trim();
    if (!validEmail(alamat)) { note($('notice'), 'Tulis email yang benar.', true); return; }
    if (mode === 'daftar' && !n) { note($('notice'), 'Tulis nama lengkap Anda.', true); return; }
    if (pass.length < 8) { note($('notice'), 'Password minimal 8 karakter.', true); return; }
    var tglIn = mode === 'daftar' && window.MTO_TGL ? MTO_TGL.iso($('tglHari'), $('tglBulan'), $('tglTahun')) : '';
    var usiaIn = tglIn ? MTO_TGL.usia(tglIn) : 0;
    var jkIn = mode === 'daftar' ? ((f.querySelector('input[name="jk"]:checked') || {}).value || '') : '';
    if (mode === 'daftar' && !tglIn) { note($('notice'), 'Pilih tanggal lahir Anda dengan lengkap dan benar.', true); return; }
    if (mode === 'daftar' && (usiaIn < 10 || usiaIn > 100)) { note($('notice'), 'Usia harus antara 10 dan 100 tahun.', true); return; }
    if (mode === 'daftar' && !jkIn) { note($('notice'), 'Pilih jenis kelamin Anda.', true); return; }
    if (!sb) { note($('notice'), 'Layanan masuk belum tersedia.', true); return; }

    var ref = (new URLSearchParams(window.location.search).get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    var btn = $('btnKirim');
    var label = mode === 'daftar' ? 'Daftar' : 'Masuk';
    setBusy(btn, true, 'Memproses…');
    note($('notice'), '');

    if (mode === 'daftar') {
      sb.auth.signUp({
        email: alamat,
        password: pass,
        options: { data: Object.assign({ nama: n, tgl: tglIn, jk: jkIn }, ref ? { ref: ref } : {}), emailRedirectTo: pageUrl() }
      }).then(function (r) {
        setBusy(btn, false, label);
        if (r.error) { note($('notice'), msgErr(r.error), true); return; }
        // Email sudah terdaftar tetapi belum dikonfirmasi: Supabase tidak mengirim error, identities kosong.
        if (r.data.user && r.data.user.identities && r.data.user.identities.length === 0) {
          note($('notice'), msgErr({ message: 'already registered' }), true);
          return;
        }
        if (r.data.session) return; // Konfirmasi email nonaktif: onAuthStateChange langsung menangani.
        emailCek = alamat;
        $('cekEmail').textContent = alamat;
        showView('viewCek');
      });
    } else {
      sb.auth.signInWithPassword({ email: alamat, password: pass }).then(function (r) {
        setBusy(btn, false, label);
        if (r.error) { note($('notice'), msgErr(r.error), true); return; }
        // Sukses: onAuthStateChange menangani.
      });
    }
  }

  /* ---------- Inisialisasi ---------- */
  function mulai() {
    if (window.MTO_TGL) MTO_TGL.isi($('tglHari'), $('tglBulan'), $('tglTahun'));
    $('tabDaftar').addEventListener('click', function () { setMode('daftar'); });
    $('tabMasuk').addEventListener('click', function () { setMode('masuk'); });
    $('formAuth').addEventListener('submit', kirim);
    $('btnMasukSekarang').addEventListener('click', function () {
      setMode('masuk');
      showView('viewAuth');
      $('formAuth').email.value = emailCek;
    });
    $('btnLupa').addEventListener('click', function () { note($('noticeLupa'), ''); showView('viewLupa'); });
    $('btnBatalLupa').addEventListener('click', function () { setMode('masuk'); showView('viewAuth'); });
    $('formLupa').addEventListener('submit', kirimReset);
    $('formBaru').addEventListener('submit', simpanPasswordBaru);
    setMode('daftar');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      note($('notice'), 'Layanan masuk belum tersedia.', true);
      $('btnKirim').disabled = true;
      return;
    }

    var s = document.createElement('script');
    s.src = SUPABASE_JS;
    s.onload = function () {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // Dipanggil saat halaman dibuka (INITIAL_SESSION) dan setiap ada masuk baru,
      // termasuk ketika peserta mengklik link konfirmasi di email.
      if (pemulihan) showView('viewBaru');
      sb.auth.onAuthStateChange(function (event, session) {
        if (event === 'PASSWORD_RECOVERY') { pemulihan = true; showView('viewBaru'); return; }
        if (pemulihan) return; // selama membuat password baru, jangan tampilkan status dulu
        if (session && session.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          pastikanPeserta(session.user);
        }
      });
    };
    s.onerror = function () { note($('notice'), 'Tidak dapat memuat layanan masuk. Periksa koneksi Anda.', true); };
    document.head.appendChild(s);
  }

  mulai();
})();
