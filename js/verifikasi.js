/* Verifikasi data diri peserta (usia dan jenis kelamin).
 * Dipakai di halaman profil. Banner selalu tampil selama data belum lengkap.
 * Pop-up tampil sekali per sesi dan bisa ditutup dengan "Nanti saja".
 * Data dibaca dan disimpan lewat RPC data_diri_saya dan lengkapi_data_diri.
 */
(function () {
  var SUPABASE_URL = 'https://bvltmjurkgnzmwtgdaic.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_F4qsCGTEYFcxgJmqJd0TZg_yas0Ho1g';
  var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  var KUNCI_POPUP = 'verifPopupTutup';

  var $ = function (id) { return document.getElementById(id); };
  var sb = null;
  var perlu = false;

  function labelJk(v) {
    return v === 'P' ? 'Perempuan' : v === 'L' ? 'Laki-laki' : '–';
  }

  function isiTampilan(d) {
    $('vUsia').textContent = d.usia ? String(d.usia) : '–';
    $('vJk').textContent = labelJk(d.jenis_kelamin);
  }

  function tampilkanBanner(ya) {
    $('verifBanner').classList.toggle('hidden', !ya);
  }

  function bukaPopup(ya) {
    $('verifModal').classList.toggle('hidden', !ya);
  }

  function bukaFormVerif() {
    var form = $('formVerif');
    form.classList.remove('hidden');
    form.usia.focus();
    $('btnVerif').setAttribute('aria-expanded', 'true');
  }

  function tutupFormVerif() {
    $('formVerif').classList.add('hidden');
    $('formVerif').reset();
    $('btnVerif').setAttribute('aria-expanded', 'false');
  }

  function bukaPengaturan() {
    location.hash = '#pengaturan';
    setTimeout(bukaFormVerif, 80);
  }

  function simpan(e) {
    e.preventDefault();
    var f = e.target;
    var usia = Number(f.usia.value);
    var jk = (f.querySelector('input[name="jk"]:checked') || {}).value || '';
    var btn = $('btnSimpanVerif');
    if (!Number.isInteger(usia) || usia < 10 || usia > 100) { note('Tulis usia antara 10 dan 100 tahun.', true); return; }
    if (!jk) { note('Pilih jenis kelamin Anda.', true); return; }

    btn.disabled = true;
    sb.rpc('lengkapi_data_diri', { p_usia: usia, p_jk: jk }).then(function (r) {
      btn.disabled = false;
      if (r.error) { note('Data belum tersimpan. Coba lagi sebentar.', true); return; }
      perlu = false;
      isiTampilan({ usia: usia, jenis_kelamin: jk });
      tutupFormVerif();
      tampilkanBanner(false);
      bukaPopup(false);
      note('Data diri Anda sudah lengkap. Terima kasih.', false);
      window.dispatchEvent(new Event('verifikasi:selesai'));
    });
  }

  function note(msg, bad) {
    var el = $('notice');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('bad', !!bad);
  }

  function muat() {
    return sb.rpc('data_diri_saya').then(function (r) {
      if (r.error || !r.data) return;
      var d = r.data;
      perlu = !!d.perlu_verifikasi;
      isiTampilan(d);
      tampilkanBanner(perlu);
      if (perlu && !sessionStorage.getItem(KUNCI_POPUP)) bukaPopup(true);
    });
  }

  function pasang() {
    $('btnVerif').addEventListener('click', function () {
      var terbuka = !$('formVerif').classList.contains('hidden');
      if (terbuka) tutupFormVerif(); else bukaFormVerif();
    });
    $('btnBatalVerif').addEventListener('click', tutupFormVerif);
    $('formVerif').addEventListener('submit', simpan);

    document.querySelectorAll('[data-verif-buka]').forEach(function (b) {
      b.addEventListener('click', bukaPengaturan);
    });
    $('verifSekarang').addEventListener('click', function () {
      bukaPopup(false);
      bukaPengaturan();
    });
    $('verifNanti').addEventListener('click', function () {
      sessionStorage.setItem(KUNCI_POPUP, '1');
      bukaPopup(false);
    });
    $('verifModal').addEventListener('click', function (e) {
      if (e.target === $('verifModal')) {
        sessionStorage.setItem(KUNCI_POPUP, '1');
        bukaPopup(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('verifModal').classList.contains('hidden')) {
        sessionStorage.setItem(KUNCI_POPUP, '1');
        bukaPopup(false);
      }
    });
  }

  function mulai() {
    var s = document.createElement('script');
    s.src = SUPABASE_JS;
    s.onload = function () {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      sb.auth.getSession().then(function (r) {
        var u = r.data && r.data.session && r.data.session.user;
        if (!u) return;
        pasang();
        muat();
      });
    };
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }
})();
