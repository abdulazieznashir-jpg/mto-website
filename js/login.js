/* Daftar dan masuk Mahkota Tahfizh Online dengan email dan kode verifikasi.
 *
 * Isi dua nilai ini dari Supabase: Project Settings → API.
 *   SUPABASE_URL      : Project URL, bentuknya https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY : anon public key (boleh dipakai di browser).
 *                       JANGAN pakai service_role key di halaman ini.
 */
(function () {
  var SUPABASE_URL = '';
  var SUPABASE_ANON_KEY = '';
  var WA = '6285727533000';
  var PAKET_URL = 'index.html#daftar';
  var sb = null;
  var mode = 'daftar';   // 'daftar' | 'masuk'
  var email = '', nama = '';
  var timerUlang = null;

  var $ = function (id) { return document.getElementById(id); };
  function esc(v) { return String(v || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function waLink(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  function showView(id) {
    ['viewAuth', 'viewKode', 'viewStatus'].forEach(function (v) {
      $(v).classList.toggle('hidden', v !== id);
    });
    window.scrollTo(0, 0);
  }
  function note(el, msg, bad) {
    el.textContent = msg || '';
    el.classList.toggle('bad', !!bad);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function setMode(m) {
    mode = m;
    var daftar = m === 'daftar';
    $('tabDaftar').setAttribute('aria-selected', daftar);
    $('tabMasuk').setAttribute('aria-selected', !daftar);
    $('fldNama').classList.toggle('hidden', !daftar);
    $('btnKirim').textContent = daftar ? 'Daftar dan kirim kode' : 'Kirim kode ke email';
    if (SUPABASE_URL) note($('notice'), '');
  }

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    if (label) btn.textContent = label;
  }

  function mulaiCooldown() {
    var btn = $('btnUlang'), sisa = 30;
    btn.disabled = true;
    clearInterval(timerUlang);
    function tick() {
      if (sisa <= 0) {
        clearInterval(timerUlang);
        btn.disabled = false;
        btn.textContent = 'Kirim ulang kode';
        return;
      }
      btn.textContent = 'Kirim ulang kode (' + sisa + ' dtk)';
      sisa--;
    }
    tick();
    timerUlang = setInterval(tick, 1000);
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
      if (r.error) { note($('notice'), 'Status belum bisa dimuat. Coba lagi sebentar.', true); showView('viewAuth'); return; }
      if (!r.data) { tampilkanStatus('belum'); return; }
      tampilkanStatus(r.data.status, r.data.nama);
    });
  }

  /* ---------- Alur ---------- */
  function kirimKode(e) {
    e.preventDefault();
    var f = e.target;
    var alamat = (f.email.value || '').trim().toLowerCase();
    var n = (f.nama ? f.nama.value : '').trim();
    if (!validEmail(alamat)) { note($('notice'), 'Tulis email yang benar.', true); return; }
    if (mode === 'daftar' && !n) { note($('notice'), 'Tulis nama lengkap Anda.', true); return; }
    if (!sb) { note($('notice'), 'Layanan masuk belum dihubungkan.', true); return; }

    var btn = $('btnKirim');
    setBusy(btn, true, 'Mengirim…');
    var opsi = { shouldCreateUser: mode === 'daftar' };
    if (mode === 'daftar') opsi.data = { nama: n };

    sb.auth.signInWithOtp({ email: alamat, options: opsi }).then(function (r) {
      setBusy(btn, false, mode === 'daftar' ? 'Daftar dan kirim kode' : 'Kirim kode ke email');
      if (r.error) {
        var m = r.error.message || '';
        if (/signups? not allowed|not found/i.test(m) && mode === 'masuk') {
          note($('notice'), 'Email ini belum terdaftar. Pilih tab Daftar.', true);
        } else if (/rate|too many|seconds/i.test(m)) {
          note($('notice'), 'Terlalu sering. Tunggu sebentar lalu coba lagi.', true);
        } else {
          note($('notice'), 'Kode belum terkirim. Coba lagi.', true);
        }
        return;
      }
      email = alamat; nama = n;
      $('kodeEmail').textContent = alamat;
      note($('noticeKode'), '');
      showView('viewKode');
      mulaiCooldown();
    });
  }

  function verifikasi(e) {
    e.preventDefault();
    var kode = (e.target.kode.value || '').replace(/\D/g, '');
    if (kode.length !== 6) { note($('noticeKode'), 'Kode terdiri dari 6 angka.', true); return; }
    sb.auth.verifyOtp({ email: email, token: kode, type: 'email' }).then(function (r) {
      if (r.error) { note($('noticeKode'), 'Kode salah atau sudah kedaluwarsa.', true); return; }
      // Pendaftar baru: buat baris peserta dengan status awal 'terdaftar'.
      if (mode === 'daftar' && nama) {
        sb.from('peserta').upsert({ email: email, nama: nama, status: 'terdaftar' }, { onConflict: 'email', ignoreDuplicates: true })
          .then(function () { muatStatus(email); });
      } else {
        muatStatus(email);
      }
    });
  }

  function kirimUlang() {
    if (!sb || !email) return;
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: mode === 'daftar' } }).then(function (r) {
      if (r.error) { note($('noticeKode'), 'Belum bisa mengirim ulang. Tunggu sebentar.', true); return; }
      note($('noticeKode'), 'Kode baru sudah dikirim.');
      mulaiCooldown();
    });
  }

  function keluar() {
    if (sb) sb.auth.signOut();
    email = ''; nama = '';
    $('formKirim').reset(); $('formKode').reset();
    setMode('daftar');
    showView('viewAuth');
  }

  /* ---------- Inisialisasi ---------- */
  function mulai() {
    $('tabDaftar').addEventListener('click', function () { setMode('daftar'); });
    $('tabMasuk').addEventListener('click', function () { setMode('masuk'); });
    $('formKirim').addEventListener('submit', kirimKode);
    $('formKode').addEventListener('submit', verifikasi);
    $('btnUlang').addEventListener('click', kirimUlang);
    $('btnGanti').addEventListener('click', function () { showView('viewAuth'); note($('notice'), ''); });
    $('btnKeluar').addEventListener('click', keluar);
    setMode('daftar');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      note($('notice'), 'Layanan masuk belum dihubungkan. Halaman ini siap dan akan aktif setelah konfigurasi dipasang.', true);
      $('btnKirim').disabled = true;
      return;
    }

    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
    s.onload = function () {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      sb.auth.getSession().then(function (r) {
        if (r.data && r.data.session) muatStatus(r.data.session.user.email);
      });
    };
    s.onerror = function () { note($('notice'), 'Tidak dapat memuat layanan masuk. Periksa koneksi Anda.', true); };
    document.head.appendChild(s);
  }

  mulai();
})();
