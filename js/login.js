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

  var $ = function (id) { return document.getElementById(id); };
  function esc(v) { return String(v || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function waLink(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  function showView(id) {
    ['viewAuth', 'viewCek', 'viewStatus'].forEach(function (v) {
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

  /* ---------- Status akun ---------- */
  function tampilkanStatus(status, namaPeserta) {
    var v = {
      belum: function () {
        return '<div class="st-ico info" aria-hidden="true">!</div>' +
          '<h1>Email ini belum terdaftar</h1>' +
          '<p class="lg-sub">Daftar dulu untuk mulai belajar. Akun Anda aktif setelah pembayaran diverifikasi.</p>' +
          '<div class="promo"><h3>Mulai hafalan Anda hari ini</h3>' +
          '<p>Belajar privat 1-on-1, cukup dari rumah.</p>' +
          '<ul><li><span>Silver · 10 menit</span><span>Mulai Rp199rb/bulan</span></li>' +
          '<li><span>Gold · 20 menit</span><span>Pilihan terbanyak</span></li>' +
          '<li><span>Platinum · 30 menit</span><span>Untuk target lebih besar</span></li></ul>' +
          '<a class="btn btn-primary btn-lg btn-full" href="' + PAKET_URL + '">Daftar Sekarang</a></div>';
      },
      terdaftar: function () {
        return '<div class="st-ico wait" aria-hidden="true">✓</div>' +
          '<h1>Anda sudah terdaftar</h1>' +
          '<p class="lg-sub">Silakan lakukan pembayaran, lalu kirim bukti transfer ke admin kami.</p>' +
          '<a class="btn btn-secondary btn-lg btn-full" href="' + waLink('Assalamu\'alaikum Admin, saya sudah mendaftar dan ingin mengirim bukti transfer.') + '" target="_blank" rel="noopener">Kirim bukti via WhatsApp</a>';
      },
      menunggu: function () {
        return '<div class="st-ico wait" aria-hidden="true">…</div>' +
          '<h1>Bukti transfer diperiksa</h1>' +
          '<p class="lg-sub">Kami akan memberi tahu Anda begitu akun aktif.</p>';
      },
      aktif: function () {
        return '<div class="st-ico ok" aria-hidden="true">✓</div>' +
          '<h1>Selamat datang' + (namaPeserta ? ', ' + esc(namaPeserta.split(' ')[0]) : '') + '</h1>' +
          '<p class="lg-sub">Akun Anda aktif.</p>' +
          '<button type="button" class="btn btn-primary btn-lg btn-full" disabled>Dashboard segera hadir</button>';
      }
    };
    $('stBody').innerHTML = (v[status] || v.belum)();
    showView('viewStatus');
  }

  function muatStatus(alamat) {
    sb.from('peserta').select('nama,status').eq('email', alamat).maybeSingle().then(function (r) {
      if (r.error) { note($('notice'), 'Status belum bisa dimuat. Coba lagi sebentar.', true); return; }
      if (!r.data) { tampilkanStatus('belum'); return; }
      tampilkanStatus(r.data.status, r.data.nama);
    });
  }

  // Dipanggil setiap kali ada sesi aktif (setelah masuk atau konfirmasi email).
  // Pendaftar baru dibuatkan baris peserta dengan status awal 'terdaftar'.
  function pastikanPeserta(user) {
    var alamat = (user.email || '').toLowerCase();
    var nama = (user.user_metadata && user.user_metadata.nama) || '';
    sb.from('peserta')
      .upsert({ email: alamat, nama: nama, status: 'terdaftar' }, { onConflict: 'email', ignoreDuplicates: true })
      .then(function () { muatStatus(alamat); });
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
    if (!sb) { note($('notice'), 'Layanan masuk belum tersedia.', true); return; }

    var btn = $('btnKirim');
    var label = mode === 'daftar' ? 'Daftar' : 'Masuk';
    setBusy(btn, true, 'Memproses…');
    note($('notice'), '');

    if (mode === 'daftar') {
      sb.auth.signUp({
        email: alamat,
        password: pass,
        options: { data: { nama: n }, emailRedirectTo: pageUrl() }
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

  function keluar() {
    if (sb) sb.auth.signOut();
    $('formAuth').reset();
    setMode('daftar');
    showView('viewAuth');
  }

  /* ---------- Inisialisasi ---------- */
  function mulai() {
    $('tabDaftar').addEventListener('click', function () { setMode('daftar'); });
    $('tabMasuk').addEventListener('click', function () { setMode('masuk'); });
    $('formAuth').addEventListener('submit', kirim);
    $('btnMasukSekarang').addEventListener('click', function () {
      setMode('masuk');
      showView('viewAuth');
      $('formAuth').email.value = emailCek;
    });
    $('btnKeluar').addEventListener('click', keluar);
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
      sb.auth.onAuthStateChange(function (event, session) {
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
