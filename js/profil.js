/* Halaman profil peserta Mahkota Tahfizh Online.
 * Hanya bisa dibuka setelah masuk. Tanpa sesi aktif, pengunjung dikembalikan ke login.html.
 */
(function () {
  var SUPABASE_URL = 'https://bvltmjurkgnzmwtgdaic.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_F4qsCGTEYFcxgJmqJd0TZg_yas0Ho1g';
  var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  var sb = null;
  var user = null;

  var $ = function (id) { return document.getElementById(id); };

  function note(msg, bad) {
    var el = $('notice');
    el.textContent = msg || '';
    el.classList.toggle('bad', !!bad);
  }

  function msgErr(err) {
    var m = (err && err.message) || '';
    if (/at least|password/i.test(m)) return 'Password minimal 8 karakter.';
    if (/same password|different from the old/i.test(m)) return 'Password baru harus berbeda dari password lama.';
    if (/rate|too many|seconds/i.test(m)) return 'Terlalu sering mencoba. Tunggu sebentar lalu coba lagi.';
    return 'Belum berhasil. Coba lagi.';
  }

  function namaUser() {
    return (user && user.user_metadata && user.user_metadata.nama) || '';
  }

  function inisial(nama, email) {
    var kata = (nama || '').trim().split(/\s+/).filter(Boolean);
    if (kata.length) {
      var a = kata[0].charAt(0);
      var b = kata.length > 1 ? kata[kata.length - 1].charAt(0) : '';
      return (a + b).toUpperCase();
    }
    return (email || '?').charAt(0).toUpperCase();
  }

  function fmtTanggal(iso) {
    if (!iso) return '–';
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return '–'; }
  }

  function render() {
    var nama = namaUser();
    $('pfNama').textContent = nama || 'Peserta';
    $('pfAvatar').textContent = inisial(nama, user.email);
    $('pfEmail').textContent = user.email;
    $('vNama').textContent = nama || '–';
    $('vEmail').textContent = user.email;
    $('vTgl').textContent = fmtTanggal(user.created_at);
    $('formNama').nama.value = nama;
    if (window.MTO_MAHKOTA) window.MTO_MAHKOTA.pasangAvatar(user);
  }

  function bukaForm(form, tombolUbah, buka) {
    form.classList.toggle('hidden', !buka);
    if (tombolUbah) tombolUbah.setAttribute('aria-expanded', buka ? 'true' : 'false');
  }

  /* ---------- Nama ---------- */
  function toggleNama() {
    var buka = $('formNama').classList.contains('hidden');
    bukaForm($('formNama'), null, buka);
    if (buka) $('formNama').nama.focus();
  }

  function simpanNama(e) {
    e.preventDefault();
    var n = ($('formNama').nama.value || '').trim();
    if (!n) { note('Tulis nama lengkap Anda.', true); return; }
    var btn = $('btnSimpanNama');
    btn.disabled = true;
    sb.auth.updateUser({ data: { nama: n } }).then(function (r) {
      btn.disabled = false;
      if (r.error) { note('Nama belum tersimpan. Coba lagi.', true); return; }
      user = r.data.user;
      render();
      bukaForm($('formNama'), null, false);
      note('Nama sudah disimpan.');
    });
  }

  /* ---------- Password ---------- */
  function togglePass() {
    var buka = $('formPass').classList.contains('hidden');
    bukaForm($('formPass'), $('btnEditPass'), buka);
    if (buka) $('formPass').password.focus();
  }

  function simpanPass(e) {
    e.preventDefault();
    var pass = $('formPass').password.value || '';
    if (pass.length < 8) { note('Password minimal 8 karakter.', true); return; }
    var btn = $('btnSimpanPass');
    btn.disabled = true;
    sb.auth.updateUser({ password: pass }).then(function (r) {
      btn.disabled = false;
      if (r.error) { note(msgErr(r.error), true); return; }
      $('formPass').reset();
      bukaForm($('formPass'), $('btnEditPass'), false);
      note('Password sudah diubah.');
    });
  }

  /* ---------- Keluar ---------- */
  function keluar() {
    if (!sb) { window.location.replace('login.html'); return; }
    sb.auth.signOut().then(function () {
      window.location.replace('login.html');
    });
  }

  /* ---------- Inisialisasi ---------- */
  function mulai() {
    $('btnEditNama').addEventListener('click', toggleNama);
    $('btnBatalNama').addEventListener('click', function () { bukaForm($('formNama'), null, false); render(); });
    $('formNama').addEventListener('submit', simpanNama);

    $('btnEditPass').addEventListener('click', togglePass);
    $('btnBatalPass').addEventListener('click', function () { $('formPass').reset(); bukaForm($('formPass'), $('btnEditPass'), false); });
    $('formPass').addEventListener('submit', simpanPass);

    $('btnKeluar').addEventListener('click', keluar);
    $('btnKeluarTop').addEventListener('click', keluar);

    var s = document.createElement('script');
    s.src = SUPABASE_JS;
    s.onload = function () {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      sb.auth.getSession().then(function (r) {
        if (!r.data || !r.data.session) { window.location.replace('login.html'); return; }
        user = r.data.session.user;
        render();
        if (window.MTO_MAHKOTA) window.MTO_MAHKOTA.init(sb, user);
        if (window.MTO_AFILIASI) window.MTO_AFILIASI.init(sb, user);
        if (window.MTO_PESANAN) window.MTO_PESANAN.init(sb, user);
      });
      sb.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_OUT') window.location.replace('login.html');
      });
    };
    s.onerror = function () { note('Tidak dapat memuat halaman. Periksa koneksi Anda.', true); };
    document.head.appendChild(s);
  }

  mulai();
})();
