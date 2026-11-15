/* Lonceng notifikasi peserta di navigasi.
 * Hanya tampil saat peserta sudah masuk. Data diambil dari RPC notifikasi_saya
 * (lihat supabase/notifikasi.sql). Semua teks dimasukkan dengan textContent.
 */
(function () {
  var SUPABASE_URL = 'https://bvltmjurkgnzmwtgdaic.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_F4qsCGTEYFcxgJmqJd0TZg_yas0Ho1g';
  var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';

  var sb = null;
  var btn, badge, panel, list, kosong;
  var terbuka = false;

  function buatTombol() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'notif-btn';
    btn.setAttribute('aria-label', 'Notifikasi');
    btn.setAttribute('aria-expanded', 'false');
    btn.hidden = true;

    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>';

    badge = document.createElement('span');
    badge.className = 'notif-badge';
    badge.hidden = true;
    btn.appendChild(badge);

    panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.hidden = true;

    var judulPanel = document.createElement('div');
    judulPanel.className = 'notif-panel-head';
    judulPanel.textContent = 'Notifikasi';
    panel.appendChild(judulPanel);

    list = document.createElement('ul');
    list.className = 'notif-list';
    panel.appendChild(list);

    kosong = document.createElement('p');
    kosong.className = 'notif-kosong';
    kosong.textContent = 'Belum ada notifikasi.';
    kosong.hidden = true;
    panel.appendChild(kosong);

    var wrap = document.createElement('div');
    wrap.className = 'notif-wrap';
    wrap.appendChild(btn);
    wrap.appendChild(panel);

    var cta = document.querySelector('.nav-cta');
    var pf = document.querySelector('.pf-top-in');
    if (cta) {
      cta.insertBefore(wrap, cta.firstChild);
    } else if (pf) {
      wrap.classList.add('notif-wrap-pf');
      pf.appendChild(wrap);
    } else {
      return false;
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      bukaTutup(!terbuka);
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { bukaTutup(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') bukaTutup(false);
    });
    return true;
  }

  function bukaTutup(buka) {
    terbuka = buka;
    panel.hidden = !buka;
    btn.setAttribute('aria-expanded', buka ? 'true' : 'false');
    if (buka && badge.hidden === false) tandaiDibaca();
  }

  function waktu(iso) {
    try {
      return new Date(iso).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return ''; }
  }

  // Salinan daftar untuk tab Notifikasi di bagian bawah, dan lencana merahnya.
  function sinkronTab(belum) {
    var tabBadge = document.getElementById('tabNotifBadge');
    if (tabBadge) {
      tabBadge.textContent = belum > 9 ? '9+' : String(belum);
      tabBadge.hidden = belum === 0;
    }
    var paneList = document.getElementById('notifPane');
    var paneKosong = document.getElementById('notifPaneKosong');
    if (!paneList) return;
    paneList.textContent = '';
    Array.prototype.forEach.call(list.children, function (c) { paneList.appendChild(c.cloneNode(true)); });
    if (paneKosong) paneKosong.hidden = list.children.length > 0;
  }

  function render(data) {
    var perluVerif = !!data.perlu_verifikasi;
    var belum = Number(data.belum_dibaca || 0) + (perluVerif ? 1 : 0);
    var daftar = data.daftar || [];

    btn.hidden = false;
    badge.textContent = belum > 9 ? '9+' : String(belum);
    badge.hidden = belum === 0;
    btn.setAttribute('aria-label', belum ? 'Notifikasi, ' + belum + ' belum dibaca' : 'Notifikasi');

    list.textContent = '';
    kosong.hidden = daftar.length > 0 || perluVerif;

    daftar.forEach(function (n) {
      var li = document.createElement('li');
      li.className = 'notif-item' + (n.dibaca_at ? '' : ' belum');

      var j = document.createElement('div');
      j.className = 'notif-judul';
      j.textContent = n.judul;
      li.appendChild(j);

      if (n.isi) {
        var i = document.createElement('div');
        i.className = 'notif-isi';
        i.textContent = n.isi;
        li.appendChild(i);
      }

      var t = document.createElement('div');
      t.className = 'notif-waktu';
      t.textContent = waktu(n.dibuat_at);
      li.appendChild(t);

      list.appendChild(li);
    });

    if (perluVerif) {
      var pin = document.createElement('li');
      pin.className = 'notif-item belum penting';
      var tautan = document.createElement('a');
      tautan.className = 'notif-link';
      tautan.href = 'profil.html#pengaturan';
      var jv = document.createElement('div');
      jv.className = 'notif-judul';
      jv.textContent = 'Harap verifikasi data Anda';
      var iv = document.createElement('div');
      iv.className = 'notif-isi';
      iv.textContent = 'Lengkapi usia dan jenis kelamin agar data peserta akurat.';
      tautan.appendChild(jv);
      tautan.appendChild(iv);
      pin.appendChild(tautan);
      list.insertBefore(pin, list.firstChild);
    }

    sinkronTab(belum);
  }

  function muat() {
    return sb.rpc('notifikasi_saya').then(function (r) {
      if (r.error || !r.data) return;
      render(r.data);
    });
  }

  function tandaiDibaca() {
    sb.rpc('tandai_notifikasi_dibaca').then(function (r) {
      if (r.error) return;
      badge.hidden = true;
      badge.textContent = '';
      btn.setAttribute('aria-label', 'Notifikasi');
      list.querySelectorAll('.notif-item.belum').forEach(function (el) {
        el.classList.remove('belum');
      });
      sinkronTab(0);
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
        if (!buatTombol()) return;
        muat();
        setInterval(muat, 5 * 60 * 1000);
        window.addEventListener('verifikasi:selesai', muat);
        window.addEventListener('notifikasi:buka', function () {
          if (badge && !badge.hidden) tandaiDibaca();
        });
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
