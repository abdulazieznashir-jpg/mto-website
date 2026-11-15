/* Halaman masuk Mahkota Tahfizh Online.
 *
 * CATATAN PENTING
 * - Isi GOOGLE_CLIENT_ID dengan Client ID OAuth dari Google Cloud Console.
 * - Token dari Google hanya didekode di browser untuk menampilkan nama dan email.
 *   Verifikasi token dan pengecekan status akun HARUS dilakukan di server.
 * - Fungsi cekStatus() di bawah masih memakai data pratinjau sampai server dibangun.
 */
(function () {
  var GOOGLE_CLIENT_ID = ''; // Contoh: '1234-abc.apps.googleusercontent.com'
  var DAFTAR_URL = 'index.html#daftar';

  var $ = function (id) { return document.getElementById(id); };
  var viewMasuk = $('viewMasuk'), viewStatus = $('viewStatus');
  var gStatus = $('gStatus'), stWho = $('stWho'), stBody = $('stBody');

  function esc(v) { return String(v || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  function decodeJwt(token) {
    try {
      var b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var json = decodeURIComponent(atob(b64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  // Pratinjau: status bisa dipaksa lewat ?demo=... hanya jika Client ID belum dipasang.
  // Setelah server tersambung, fungsi ini diganti dengan panggilan ke server.
  function cekStatus(email, cb) {
    var demo = GOOGLE_CLIENT_ID ? null : new URLSearchParams(location.search).get('demo');
    setTimeout(function () { cb(demo || 'belum'); }, 250);
  }

  var DAFTAR_CTA = '<a class="btn btn-primary btn-lg" href="' + DAFTAR_URL + '">Daftar Sekarang</a>';

  var VIEW = {
    aktif: function (u) {
      return '<div class="st-head"><div class="st-ico ok" aria-hidden="true">✓</div>' +
        '<h2>Selamat datang' + (u.name ? ', ' + esc(u.name.split(' ')[0]) : '') + '</h2></div>' +
        '<p class="st-text">Akun Anda aktif dan sudah bisa digunakan.</p>' +
        '<div class="st-actions"><button type="button" class="btn btn-primary btn-lg" disabled>Dashboard segera hadir</button></div>';
    },
    menunggu: function () {
      return '<div class="st-head"><div class="st-ico wait" aria-hidden="true">…</div>' +
        '<h2>Anda sudah terdaftar</h2></div>' +
        '<p class="st-text">Bukti transfer Anda sedang kami periksa. Kami akan memberi tahu lewat email dan WhatsApp setelah akun aktif.</p>' +
        '<div class="st-actions"><a class="btn btn-secondary btn-lg" href="https://wa.me/6285727533000" target="_blank" rel="noopener">Tanya status via WhatsApp</a></div>';
    },
    verifikasi: function () {
      return '<div class="st-head"><div class="st-ico info" aria-hidden="true">@</div>' +
        '<h2>Anda sudah terdaftar</h2></div>' +
        '<p class="st-text">Silakan verifikasi email Anda terlebih dahulu. Cek kotak masuk atau folder spam.</p>' +
        '<div class="st-actions"><button type="button" class="btn btn-secondary btn-lg" disabled>Kirim ulang email verifikasi</button></div>';
    },
    belum: function () {
      return '<div class="st-head"><div class="st-ico info" aria-hidden="true">!</div>' +
        '<h2>Akun belum aktif</h2></div>' +
        '<p class="st-text">Email ini belum terdaftar sebagai peserta. Daftar dulu untuk mulai belajar, lalu akun Anda aktif setelah pembayaran diverifikasi.</p>' +
        '<div class="promo"><h3>Mulai hafalan Anda hari ini</h3>' +
        '<p>Belajar privat 1-on-1, cukup dari rumah.</p>' +
        '<ul><li><span>Silver · 10 menit</span><span>Mulai Rp199rb/bulan</span></li>' +
        '<li><span>Gold · 20 menit</span><span>Pilihan terbanyak</span></li>' +
        '<li><span>Platinum · 30 menit</span><span>Untuk target lebih besar</span></li></ul>' +
        DAFTAR_CTA + '</div>';
    }
  };

  function tampilkanStatus(user, status) {
    stWho.innerHTML = (user.picture ? '<img src="' + esc(user.picture) + '" alt="">' : '') +
      '<div><strong>' + esc(user.name || 'Pengguna') + '</strong><small>' + esc(user.email) + '</small></div>';
    stBody.innerHTML = (VIEW[status] || VIEW.belum)(user);
    viewMasuk.classList.add('hidden');
    viewStatus.classList.remove('hidden');
  }

  function setUser(user) {
    stBody.innerHTML = '<p class="st-text">Memeriksa akun Anda…</p>';
    stWho.innerHTML = '<div><strong>' + esc(user.name || 'Pengguna') + '</strong><small>' + esc(user.email) + '</small></div>';
    viewMasuk.classList.add('hidden');
    viewStatus.classList.remove('hidden');
    cekStatus(user.email, function (status) { tampilkanStatus(user, status); });
  }

  function onCredential(resp) {
    var p = decodeJwt(resp.credential || '');
    if (!p || !p.email) { gStatus.textContent = 'Login belum berhasil. Coba lagi.'; return; }
    setUser({ email: p.email, name: p.name, picture: p.picture });
  }

  $('stSwitch').addEventListener('click', function () {
    if (window.google && google.accounts && google.accounts.id && google.accounts.id.disableAutoSelect) {
      google.accounts.id.disableAutoSelect();
    }
    viewStatus.classList.add('hidden');
    viewMasuk.classList.remove('hidden');
    stBody.innerHTML = '';
    gStatus.textContent = '';
  });

  // Tampilan pratinjau tanpa Google (hanya bila Client ID belum dipasang)
  function pratinjau() {
    var demo = new URLSearchParams(location.search).get('demo');
    if (!demo) {
      gStatus.textContent = 'Login Google akan aktif setelah Client ID dipasang.';
      return;
    }
    setUser({ email: 'peserta@contoh.com', name: 'Peserta Contoh', picture: '' });
  }

  function initGoogle() {
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential, ux_mode: 'popup' });
    var box = $('googleBtn');
    google.accounts.id.renderButton(box, {
      type: 'standard', theme: 'outline', size: 'large', text: 'signin_with',
      shape: 'pill', logo_alignment: 'left', width: Math.min(360, box.offsetWidth || 320)
    });
  }

  if (!GOOGLE_CLIENT_ID) {
    // Belum ada Client ID: tampilkan pratinjau tanpa memuat layanan Google.
    pratinjau();
  } else {
    // Muat skrip Google hanya saat Client ID sudah dipasang.
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = initGoogle;
    s.onerror = function () { gStatus.textContent = 'Tidak dapat memuat layanan Google. Periksa koneksi Anda.'; };
    document.head.appendChild(s);
  }
})();
