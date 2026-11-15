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

  var terakhir = {};
  var IKON = {
    lonceng: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>',
    mahkota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>',
    jadwal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    materi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 5.5C5 4.5 8 4.5 12 6.5c4-2 7-2 9.5-1v13c-2.5-1-5.5-1-9.5.9-4-1.9-7-1.9-9.5-.9z"/><path d="M12 6.5v13"/></svg>',
    capaian: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="12" width="3.5" height="8" rx="1"/><rect x="10.25" y="7" width="3.5" height="13" rx="1"/><rect x="16.5" y="3" width="3.5" height="17" rx="1"/></svg>',
    umum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h3l8 4V6L7 10z"/><path d="M18 9.5a3.5 3.5 0 010 5"/></svg>'
  };

  function pilihIkon(t) {
    t = (t || '').toLowerCase();
    if (/bayar|pembayaran|paket/.test(t)) return IKON.mahkota;
    if (/jadwal|sesi/.test(t)) return IKON.jadwal;
    if (/capai|juz/.test(t)) return IKON.capaian;
    if (/materi/.test(t)) return IKON.materi;
    if (/pengumuman|libur|periode/.test(t)) return IKON.umum;
    return IKON.lonceng;
  }

  function hariJakarta(d) {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  }

  function waktuRelatif(iso) {
    var d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
    if (isNaN(s)) return '';
    if (s < 60) return 'Baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (hariJakarta(d) === hariJakarta(new Date(Date.now() - 86400000))) return 'Kemarin';
    if (s < 7 * 86400) return Math.floor(s / 86400) + ' hari lalu';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
  }

  function buatItem(judul, isi, waktu, ikon, belum, tautan) {
    var el = document.createElement(tautan ? 'a' : 'div');
    if (tautan) el.href = tautan;
    el.className = 'nt-item' + (belum ? ' belum' : '');
    var ik = document.createElement('span');
    ik.className = 'nt-ikon';
    ik.innerHTML = ikon;
    var isiBox = document.createElement('div');
    isiBox.className = 'nt-isi';
    var head = document.createElement('div');
    head.className = 'nt-head';
    var b = document.createElement('b');
    b.textContent = judul;
    var w = document.createElement('small');
    w.textContent = waktu;
    head.appendChild(b);
    head.appendChild(w);
    isiBox.appendChild(head);
    if (isi) {
      var p = document.createElement('p');
      p.textContent = isi;
      isiBox.appendChild(p);
    }
    el.appendChild(ik);
    el.appendChild(isiBox);
    if (belum) {
      var dot = document.createElement('span');
      dot.className = 'nt-dot';
      el.appendChild(dot);
    }
    return el;
  }

  // Daftar di tab Notifikasi: dibagi Hari Ini dan Sebelumnya. Lencana bawah ikut diperbarui.
  function sinkronTab(belum) {
    var tabBadge = document.getElementById('tabNotifBadge');
    if (tabBadge) {
      tabBadge.textContent = belum > 9 ? '9+' : String(belum);
      tabBadge.hidden = belum === 0;
    }
    var wrap = document.getElementById('notifPane');
    var kosong = document.getElementById('notifPaneKosong');
    if (!wrap || !kosong) return;

    var daftar = terakhir.daftar || [];
    var verif = !!terakhir.perlu_verifikasi;
    wrap.textContent = '';
    if (!daftar.length && !verif) {
      wrap.hidden = true;
      kosong.hidden = false;
      return;
    }
    wrap.hidden = false;
    kosong.hidden = true;

    var ini = hariJakarta(new Date());
    var grupIni = [], grupLama = [];
    if (verif) {
      grupIni.push(buatItem('Harap verifikasi data Anda', 'Lengkapi usia dan jenis kelamin agar data peserta akurat.', '', IKON.lonceng, true, '#pengaturan'));
    }
    daftar.forEach(function (n) {
      var el = buatItem(n.judul, n.isi, waktuRelatif(n.dibuat_at), pilihIkon(n.judul + ' ' + (n.isi || '')), !n.dibaca_at, null);
      (hariJakarta(new Date(n.dibuat_at)) === ini ? grupIni : grupLama).push(el);
    });
    function tambahGrup(judul, items) {
      var h = document.createElement('p');
      h.className = 'nt-grup';
      h.textContent = judul;
      wrap.appendChild(h);
      items.forEach(function (el) { wrap.appendChild(el); });
    }
    if (grupIni.length) tambahGrup('Hari Ini', grupIni);
    if (grupLama.length) tambahGrup('Sebelumnya', grupLama);
  }

  function render(data) {
    terakhir = data || {};
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
