/* Mahkota peserta: saldo, klaim login harian, papan peringkat, riwayat, dan foto profil.
 * Perhitungan dilakukan di Supabase (lihat supabase/mahkota.sql). Dipanggil dari js/profil.js.
 */
(function () {
  var sb = null;
  var OWNER = 'mahkota.to3@gmail.com';
  var emailSaya = '';
  var user = null;
  var usernameSaya = '';

  var $ = function (id) { return document.getElementById(id); };

  /* Pratinjau papan skor dengan data tetap, hanya jika alamat memuat ?simulasi=1 */
  var SIMULASI = /[?&]simulasi=1/.test(location.search);
  var NAMA_SIM = ['salsabila', 'yusuf', 'nadia', 'fauzan', 'aisyah', 'hamzah', 'zahra', 'ikhsan', 'maryam', 'rafi', 'hanifah', 'ilham', 'syifa', 'thariq'];
  var SKOR_SIM = [52, 47, 44, 39, 35, 31, 28, 24, 21, 18, 15, 12, 9, 6];
  var AVATAR_SIM = ['bintang', 'hati', 'bulan', 'api', 'lampu', 'buku', 'pena', 'target', 'mahkota', 'kompas'];
  function papanSimulasi(d) {
    var papan = NAMA_SIM.map(function (n, i) {
      return { peringkat: i + 1, username: n, avatar: AVATAR_SIM[i % AVATAR_SIM.length], total: SKOR_SIM[i], saya: false };
    });
    papan.push({ peringkat: papan.length + 1, username: d.username || '', avatar: d.avatar_key || null, total: d.total, saya: true });
    return Object.assign({}, d, { papan: papan, peringkat: papan.length });
  }

  /* Tampilkan 'n' baris pertama, sisanya lewat tombol Selengkapnya */
  function lipat(ul, n) {
    if (!ul) return;
    var items = ul.querySelectorAll(':scope > li');
    var lama = ul.parentNode.querySelector('.bk-more[data-for="' + ul.id + '"]');
    if (lama) lama.remove();
    items.forEach(function (li, i) { li.hidden = i >= n; });
    if (items.length <= n) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'bk-more';
    b.setAttribute('data-for', ul.id);
    b.textContent = 'Selengkapnya';
    b.onclick = function () {
      var buka = b.getAttribute('data-buka') !== '1';
      items.forEach(function (li, i) { li.hidden = !buka && i >= n; });
      b.setAttribute('data-buka', buka ? '1' : '0');
      b.textContent = buka ? 'Tutup' : 'Selengkapnya';
    };
    ul.parentNode.insertBefore(b, ul.nextSibling);
  }

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

  /* ---------- Pengajar: murid saya dan catat pertemuan ---------- */
  var isPengajar = false, namaPengajar = '';
  // Link Google Meet: hanya tautan meet.google.com (kosong = hapus link)
  var LINK_MEET_RE = /^https:\/\/meet\.google\.com\/[a-z0-9-]+/i;
  function renderMuridList(list) {
    var el = $('muridList');
    if (!el) return;
    if (!list.length) { el.innerHTML = '<p class="mr-kosong">Belum ada murid yang ditetapkan ke Anda.</p>'; return; }
    el.innerHTML = list.map(function (m) {
      var n = Number(m.pertemuan || 0), penuh = n >= 15;
      var pct = Math.min(100, Math.round(n / 15 * 100));
      return '<div class="mr-item">' +
        '<div class="mr-atas"><b>' + esc(m.nama || m.email) + '</b><span class="mr-paket">' + esc(m.paket ? 'Paket ' + m.paket.charAt(0).toUpperCase() + m.paket.slice(1) : '') + '</span></div>' +
        '<div class="mr-bar"><span style="width:' + pct + '%"></span></div>' +
        '<p class="mr-jam">Jam ' + esc(m.jam || '-') + ' WIB</p>' +
        '<div class="mr-bawah"><small>' + n + ' / 15 pertemuan</small>' +
        '<button type="button" class="mr-btn" data-catat="' + esc(m.email) + '" data-nama="' + esc(m.nama || m.email) + '"' + (penuh ? ' disabled' : '') + '>' + (penuh ? 'Lengkap' : 'Catat Pertemuan') + '</button></div>' +
        '<div class="mr-meet"><label>Link Google Meet<input type="url" data-meet-input="' + esc(m.email) + '" value="' + esc(m.link_meet || '') + '" placeholder="https://meet.google.com/..."></label>' +
          '<button type="button" class="mr-btn" data-meet-simpan="' + esc(m.email) + '">Simpan</button></div>' +
        '<div class="mr-bawah">' + (m.keluar_status === 'menunggu'
          ? '<span class="mr-tunggu">Menunggu persetujuan admin</span>'
          : '<button type="button" class="mr-btn mr-keluar" data-keluar="' + esc(m.email) + '" data-nama="' + esc(m.nama || m.email) + '">Keluarkan dari murid</button>') + '</div>' +
        '</div>';
    }).join('');
  }
  var meetPengajarEvents = false;
  function pasangMeetPengajar() {
    var el = $('muridList');
    if (!el || meetPengajarEvents) return;
    meetPengajarEvents = true;
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-meet-simpan]');
      if (!b || !sb) return;
      var email = b.getAttribute('data-meet-simpan');
      var inp = el.querySelector('input[data-meet-input="' + email + '"]');
      var link = inp ? (inp.value || '').trim() : '';
      if (link && !LINK_MEET_RE.test(link)) {
        note('Link harus berupa tautan Google Meet, contoh: https://meet.google.com/abc-defg-hij', true);
        return;
      }
      b.disabled = true;
      sb.rpc('atur_link_meet', { p_peserta_email: email, p_link: link || null }).then(function (r) {
        b.disabled = false;
        if (r.error) { note(r.error.message || 'Link belum tersimpan. Coba lagi.', true); return; }
        note(link ? 'Link Google Meet tersimpan.' : 'Link Google Meet dihapus.');
        muatMurid();
      }).catch(function () {
        b.disabled = false;
        note('Koneksi bermasalah. Silakan coba lagi.', true);
      });
    });
  }
  function muatMurid() {
    sb.rpc('murid_saya').then(function (r) {
      if (r.error) { $('muridList').innerHTML = '<p class="mr-kosong">Daftar murid belum bisa dimuat.</p>'; return; }
      renderMuridList(r.data || []);
    });
  }
  function renderPengajar() {
    var box = $('pengajarBox');
    if (!box) return;
    box.hidden = !isPengajar;
    $('pbPaket').hidden = isPengajar;
    if (isPengajar) {
      $('pengajarNama').textContent = namaPengajar;
      pasangMeetPengajar();
      muatMurid();
      pasangJadwalEvents();
      pasangPermintaanEvents();
      muatPermintaan();
      muatJadwal();
    }
  }
  var pengajarEvents = false;
  function pasangPengajarEvents() {
    if (pengajarEvents) return;
    pengajarEvents = true;
    $('muridList').addEventListener('click', function (e) {
      var k = e.target.closest && e.target.closest('button[data-keluar]');
      if (k) {
        if (!window.confirm('Ajukan agar ' + k.getAttribute('data-nama') + ' dikeluarkan dari daftar murid Anda? Admin harus menyetujui terlebih dahulu.')) return;
        k.disabled = true;
        sb.rpc('minta_keluar_murid', { p_peserta: k.getAttribute('data-keluar') }).then(function (r) {
          if (r.error) window.alert(r.error.message || 'Permintaan belum bisa dikirim.');
          muatMurid();
        });
        return;
      }
      var b = e.target.closest && e.target.closest('button[data-catat]');
      if (!b || b.disabled) return;
      var nama = b.getAttribute('data-nama');
      if (!window.confirm('Catat 1 pertemuan untuk ' + nama + '? Tindakan ini tidak bisa dibatalkan dari aplikasi.')) return;
      b.disabled = true;
      sb.rpc('catat_pertemuan', { p_email: b.getAttribute('data-catat') }).then(function (r) {
        if (r.error) { window.alert(r.error.message || 'Pertemuan belum bisa dicatat.'); }
        muatMurid();
      });
    });
  }

  /* ---------- Pengajar: jadwal kosong, sesi, dan notifikasi ---------- */
  var HARI_NAMA = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  function tglJamWib(iso) {
    return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ' WIB';
  }
  var PERIODE = [
    { nama: 'Pagi', dari: '04:00', sampai: '10:50' },
    { nama: 'Siang', dari: '11:00', sampai: '14:50' },
    { nama: 'Sore', dari: '15:00', sampai: '17:50' },
    { nama: 'Malam', dari: '18:00', sampai: '23:50' }
  ];
  var PAKET_NAMA = { weekday: 'Weekdays', weekend: 'Weekend' };
  function daftarJam() {
    var out = [];
    for (var m = 4 * 60; m <= 23 * 60 + 50; m += 10) {
      out.push(('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2));
    }
    return out;
  }
  function periodeIndeks(jam) {
    var h = Number(String(jam).slice(0, 2));
    return h < 11 ? 0 : h < 15 ? 1 : h < 18 ? 2 : 3;
  }
  function isiJamSelect() {
    var mulai = $('jMulai'), berakhir = $('jBerakhir');
    if (!mulai || !berakhir) return;
    var semua = daftarJam();
    var akhir = semua.slice(1).concat(['24:00']);
    function opsi(daftar, akhirOpsi) {
      return PERIODE.map(function (p, i) {
        return '<optgroup label="' + p.nama + ' (' + p.dari + '–' + p.sampai + ')">' +
          daftar.filter(function (s) { return periodeIndeks(s) === i; }).map(function (s) {
            return '<option value="' + s + '">' + s + (s === '24:00' ? ' (tengah malam)' : ' WIB') + '</option>';
          }).join('') + '</optgroup>';
      }).join('');
    }
    mulai.innerHTML = opsi(semua);
    berakhir.innerHTML = opsi(akhir);
    mulai.value = '19:00';
    berakhir.value = '21:00';
  }
  // Ringkasan: setiap paket dibagi menurut waktu (pagi, siang, sore, malam). Jam yang sudah terisi murid ditandai hijau.
  function renderJadwal(d) {
    var box = $('jadwalRingkas');
    if (!box) return;
    var jadwal = (d && d.jadwal) || [];
    box.innerHTML = ['weekday', 'weekend'].map(function (paket) {
      var baris = jadwal.filter(function (j) { return j.paket === paket; });
      return '<div class="pj-paket"><b>' + PAKET_NAMA[paket] + '</b>' +
        PERIODE.map(function (p, i) {
          var list = baris.filter(function (j) { return periodeIndeks(j.jam) === i; });
          return '<div class="pj-periode"><small>' + p.nama + ' · ' + p.dari + '–' + p.sampai + '</small>' +
            '<div class="pj-chips">' + (list.length ? list.map(function (j) {
              return '<span class="pj-chip' + (j.terisi ? ' terisi' : '') + '">' + esc(j.jam) +
                (j.terisi ? ' · terisi' : ' <button type="button" data-hapus-paket="' + paket + '" data-jam="' + esc(j.jam) + '" aria-label="Hapus">×</button>') +
                '</span>';
            }).join('') : '<span class="pj-kosong">Belum ada</span>') + '</div></div>';
        }).join('') + '</div>';
    }).join('');
  }
  function muatJadwal() {
    sb.rpc('jadwal_saya').then(function (r) {
      if (r.error) { $('jadwalRingkas').innerHTML = '<p class="mr-kosong">Jadwal belum bisa dimuat.</p>'; return; }
      renderJadwal(r.data || {});
    });
  }
  var jadwalEvents = false;
  function pasangJadwalEvents() {
    if (jadwalEvents) return;
    jadwalEvents = true;
    isiJamSelect();
    $('jTambah').addEventListener('click', function () {
      var paket = $('jPaket').value, mulai = $('jMulai').value, berakhir = $('jBerakhir').value;
      if (mulai >= berakhir) { window.alert('Waktu berakhir harus setelah waktu mulai.'); return; }
      sb.rpc('tambah_jadwal_kosong', { p_paket: paket, p_mulai: mulai, p_berakhir: berakhir }).then(function (r) {
        if (r.error) { window.alert(r.error.message || 'Jadwal belum bisa ditambahkan.'); return; }
        muatJadwal();
      });
    });
    $('jadwalRingkas').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-hapus-paket]');
      if (!b) return;
      var paket = b.getAttribute('data-hapus-paket'), jam = b.getAttribute('data-jam');
      if (!window.confirm('Hapus jadwal ' + PAKET_NAMA[paket] + ' pukul ' + jam + ' WIB?')) return;
      sb.rpc('hapus_paket_jadwal', { p_paket: paket, p_jam: jam }).then(function (r) {
        if (r.error) window.alert(r.error.message || 'Jadwal belum bisa dihapus.');
        muatJadwal();
      });
    });
  }

  /* ---------- Pengajar: permintaan murid masuk ---------- */
  function renderPermintaan(list) {
    var box = $('permintaanBox');
    if (!box) return;
    box.hidden = !list.length;
    $('permintaanList').innerHTML = list.map(function (x) {
      return '<div class="pm-item"><b>' + esc(x.nama) + '</b>' +
        '<small>' + esc(x.kelas || '-') + ' · ' + esc(String(x.durasi || '-')) + ' bulan · +' + esc(x.wa || '') + '</small>' +
        '<small>' + (x.hari_diminta === 'weekend' ? 'Weekend' : 'Weekdays') + ', pukul ' + esc(String(x.jam_diminta || '').slice(0, 5)) + ' WIB</small>' +
        '<div class="pm-aksi"><button type="button" class="mr-btn" data-terima="' + x.id + '">Terima</button>' +
        '<button type="button" class="pm-tolak" data-tolak="' + x.id + '">Tolak</button></div></div>';
    }).join('');
  }
  function muatPermintaan() {
    sb.rpc('permintaan_saya').then(function (r) {
      if (!r.error) renderPermintaan(r.data || []);
    });
  }
  var permintaanEvents = false;
  function pasangPermintaanEvents() {
    if (permintaanEvents) return;
    permintaanEvents = true;
    $('permintaanList').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-terima], button[data-tolak]');
      if (!b) return;
      var terima = b.hasAttribute('data-terima');
      if (!terima && !window.confirm('Tolak permintaan murid ini?')) return;
      if (terima && !window.confirm('Terima murid ini? Jam tersebut akan terisi untuk murid ini.')) return;
      var id = Number(b.getAttribute(terima ? 'data-terima' : 'data-tolak'));
      sb.rpc('respon_pengajuan', { p_id: id, p_terima: terima }).then(function (r) {
        if (r.error) window.alert(r.error.message || 'Belum bisa diproses.');
        muatPermintaan();
        muatJadwal();
      });
    });
  }

  /* ---------- Ringkasan ---------- */
  function muat() {
    sb.rpc('ringkasan_mahkota').then(function (r) {
      if (r.error || !r.data) { note('Data Mahkota belum bisa dimuat.', true); return; }
      tampil(r.data);
    });
    sb.rpc('progres_juz_saya').then(function (r) {
      renderJus(r.error ? null : r.data);
    });
    sb.rpc('pendaftaran_saya').then(function (r) {
      if (!r.error) tampilDaftarSaya(r.data || []);
    });
    pasangJadwalMurid();
    pasangGanti();
    pasangLive();
    muatJadwalMurid();
    sb.rpc('profil_pengajar_saya').then(function (r) {
      isPengajar = !r.error && !!(r.data && r.data.is_pengajar);
      namaPengajar = isPengajar ? (r.data.nama || '') : '';
      pasangPengajarEvents();
      renderPengajar();
    });
    sb.rpc('pertemuan_saya').then(function (r) {
      pertemuanSelesai = (!r.error && typeof r.data === 'number') ? r.data : null;
      renderMulai();
    });
    sb.rpc('grup_besar_saya').then(function (r) {
      grupBesar = (!r.error && r.data && r.data.link) ? r.data : null;
      renderMulai();
    });
    sb.from('rekening_garansi').select('bank,nomor,nama_pemilik').maybeSingle().then(function (r) {
      rekeningGaransi = (!r.error && r.data) ? r.data : null;
      renderGaransi();
    });
    sb.from('klaim_garansi').select('status,dibuat_at').order('dibuat_at', { ascending: false }).limit(1).then(function (r) {
      klaimGaransi = (!r.error && r.data && r.data[0]) ? r.data[0] : null;
      renderGaransi();
    });
    if (emailSaya === OWNER) {
      sb.rpc('gelombang_admin').then(function (r) {
        if (!r.error) tampilGelombang(r.data || []);
      });
      muatKeluar();
      muatGanti();
    }
    sb.rpc('pendaftaran_admin').then(function (r) {
      if (!r.error) tampilAdmin(r.data || []);
    });
    sb.rpc('profil_peserta_saya').then(function (r) {
      if (!r.error && r.data) tampilPaket(r.data);
    });
  }

  function tampil(d) {
    if (SIMULASI) d = papanSimulasi(d);
    $('mkTotal').textContent = d.total;
    $('mkRank').textContent = d.peringkat || '–';
    $('mkRankKet').textContent = d.peringkat && d.peringkat <= 3 ? 'Posisi 3 besar' : 'Posisi Anda';
    $('mkStreak').textContent = d.streak;
    renderTrack(d.streak);
    usernameSaya = d.username || '';
    $('vUsername').textContent = usernameSaya || 'Belum diatur';
    $('pfUsername').textContent = usernameSaya ? '@' + usernameSaya : 'Belum ada username';
    var akun = d.avatar_key ? cariAvatar(d.avatar_key) : null;
    if (akun) $('pfAvatar').innerHTML = svgAvatar(akun);

    var sudah = !!d.sudah_login_hari_ini;
    $('btnKlaim').setAttribute('data-sudah', sudah ? '1' : '0');
    $('btnKlaim').textContent = sudah ? 'Sudah diklaim' : 'Klaim +1';
    $('mkKlaimText').textContent = sudah ? 'Login hari ini sudah diklaim' : 'Login hari ini belum diklaim';

    var papan = (d.papan || []).map(function (p) {
      var a = p.avatar ? cariAvatar(p.avatar) : null;
      var gambar = a ? svgAvatar(a) : esc((p.username || 'P').charAt(0).toUpperCase());
      var nama = p.username ? p.username : 'Peserta';
      return '<li class="mk-row' + (p.saya ? ' me' : '') + '">' +
             '<span class="mk-pos">' + p.peringkat + '</span>' +
             '<span class="mk-av">' + gambar + '</span>' +
             '<span class="mk-nm">' + esc(nama) + (p.saya ? ' <em>(Anda)</em>' : '') + '</span>' +
             '<span class="mk-sc">' + p.total + '</span></li>';
    }).join('');
    $('mkPapan').innerHTML = papan || '<li class="pf-empty">Belum ada peserta.</li>';
    lipat($('mkPapan'), 10);

    var riwayat = (d.riwayat || []).map(function (h) {
      return '<li class="mk-row mk-hist">' +
             '<span class="mk-nm">' + esc(h.label) + '<br><small>' + tglPendek(h.tanggal) + '</small></span>' +
             '<span class="mk-sc">+' + h.jumlah + '</span></li>';
    }).join('');
    $('mkRiwayat').innerHTML = riwayat || '<li class="pf-empty">Belum ada riwayat Mahkota.</li>';
  }

  /* ---------- Pendaftaran: progres peserta dan daftar pendaftar admin ---------- */
  var LABEL_STATUS = {
    menunggu_bayar: 'Menunggu pembayaran',
    menunggu_verifikasi: 'Bukti diterima, menunggu verifikasi',
    diterima: 'Pembayaran diterima',
    kedaluwarsa: 'Waktu pembayaran habis'
  };
  var TAHAP = ['menunggu_bayar', 'menunggu_verifikasi', 'diterima'];
  function tglJam(iso) {
    return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ' WIB';
  }
  function tampilDaftarSaya(list) {
    var box = $('daftarSayaBox');
    if (!box) return;
    tglMulaiGelombang = ''; tglMulaiISO = ''; linkHalaqah = ''; sudahBayar = false;
    if (!list.length) { box.hidden = true; renderMulai(); return; }
    var d = list[0];
    linkHalaqah = d.link_grup || ''; sudahBayar = d.status === 'diterima';
    var idx = TAHAP.indexOf(d.status);
    var langkah = '<div class="pd-langkah">' + [0, 1, 2, 3].map(function (i) {
      return '<span class="' + (d.status === 'diterima' || (idx >= 0 && i <= idx) ? 'on' : '') + '"></span>';
    }).join('') + '</div>';
    var sub = d.status === 'menunggu_bayar'
      ? 'Selesaikan pembayaran sebelum ' + tglJam(d.batas_bayar) + '.'
      : (d.status === 'kedaluwarsa' ? 'Hubungi admin untuk dibukakan kembali.' : 'Progres pendaftaran Anda.');
    var lanjut = d.status === 'menunggu_bayar' ? '<div class="pd-aksi"><a class="pf-btn pf-btn-pri" href="pembayaran.html">Lanjutkan pembayaran</a></div>' : '';
    var mulai = d.tanggal_halaqah ? new Date(d.tanggal_halaqah + 'T00:00:00+07:00') : null;
    if (d.status === 'diterima' && d.tanggal_halaqah) {
      tglMulaiISO = d.tanggal_halaqah;
      tglMulaiGelombang = mulai.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
    }
    if (d.status === 'diterima' && mulai && mulai > new Date()) {
      var tgl = mulai.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
      $('daftarSaya').innerHTML = '<p class="pd-status">Belum Mulai</p>' +
        '<p class="pd-sub">Mulai belajar</p><p class="pd-status" style="font-size:20px">' + esc(tgl) + '</p>';
      tglMulaiGelombang = tgl;
      renderMulai();
      box.hidden = false;
      return;
    }
    renderMulai();
    $('daftarSaya').innerHTML = '<p class="pd-status">' + esc(LABEL_STATUS[d.status] || d.status) + '</p>' +
      '<p class="pd-sub">' + esc(sub) + '</p>' + langkah + lanjut;
    box.hidden = false;
  }

  var daftarAdmin = [];
  var gelombangList = [];
  function hariLabel(h) { return h === 'weekday' ? 'Weekdays' : h === 'weekend' ? 'Weekend' : '-'; }
  function jamLabel(j) { return j ? String(j).slice(0, 5) + ' WIB' : '-'; }
  function namaGelombang(k) {
    var g = gelombangList.filter(function (x) { return x.kode === k; })[0];
    return g ? g.nama : '-';
  }
  function tglLahir(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function rupiahAdm(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
  function teksWa(p) {
    var b = ['Nama: ' + p.nama];
    if (p.jenis_kelamin) b.push('Jenis kelamin: ' + p.jenis_kelamin);
    if (p.tanggal_lahir) b.push('Tanggal lahir: ' + tglLahir(p.tanggal_lahir));
    if (p.kota) b.push('Kota/Negara: ' + p.kota);
    b.push('Nomor WhatsApp: +' + p.wa);
    b.push('Email: ' + p.email);
    b.push('Status: ' + (LABEL_STATUS[p.status] || p.status));
    if (p.hari_diminta) b.push('Hari diminta: ' + hariLabel(p.hari_diminta));
    if (p.jam_diminta) b.push('Jam diminta: ' + jamLabel(p.jam_diminta));
    var awal = b.join('\n');
    return p.ringkasan ? awal + '\n\n' + p.ringkasan : awal;
  }
  var semuaAdmin = [];
  function tampilGrupAdmin(list) {
    var box = $('grupAdminBox'), el = $('grupAdminList');
    if (!box || !el) return;
    box.hidden = !list.length;
    if (!list.length) { el.innerHTML = ''; return; }
    var grup = { Ikhwan: {}, Akhwat: {} };
    list.forEach(function (p) {
      var g = p.jenis_kelamin === 'perempuan' ? 'Akhwat' : 'Ikhwan';
      var k = p.pengampu_nama || 'Belum ada pengampu';
      (grup[g][k] = grup[g][k] || []).push(p);
    });
    function baris(label, nilai) {
      return '<div class="pd-baris"><span>' + esc(label) + '</span><b>' + esc(nilai) + '</b></div>';
    }
    function detailMurid(p) {
      return '<div class="grup-detail">' +
        baris('Jenis kelamin', p.jenis_kelamin === 'perempuan' ? 'Perempuan' : 'Laki-laki') +
        baris('Kelas', p.kelas || '-') +
        baris('Tipe pendaftar', p.tipe_pendaftar || '-') +
        baris('Periode', p.periode_label || '-') +
        baris('Program', p.program || '-') +
        baris('Durasi', p.durasi ? p.durasi + ' bulan' : 'Belum diisi') +
        baris('Hari', p.hari_diminta ? hariLabel(p.hari_diminta) : '-') +
        baris('Jam', p.jam_diminta ? jamLabel(p.jam_diminta) : '-') +
        baris('Opsi waktu', p.opsi_waktu || '-') +
        baris('Gelombang', p.gelombang ? namaGelombang(p.gelombang) : 'Belum dipilih') +
        baris('Mulai halaqah', p.tanggal_halaqah ? tglLahir(p.tanggal_halaqah) : 'Belum diatur') +
        baris('WhatsApp', '+' + p.wa) +
        '</div>';
    }
    el.innerHTML = ['Ikhwan', 'Akhwat'].filter(function (g) { return Object.keys(grup[g]).length; }).map(function (g) {
      var total = Object.keys(grup[g]).reduce(function (n, k) { return n + grup[g][k].length; }, 0);
      var pengampu = Object.keys(grup[g]).sort().map(function (k) {
        var murid = grup[g][k].map(function (p) {
          return '<details class="grup-murid"><summary><span>' + esc(p.nama) + '</span><span class="grup-aksi">Detail</span></summary>' + detailMurid(p) + '</details>';
        }).join('');
        return '<details class="grup-ustadz"><summary><span>' + esc(k) + '</span><span class="grup-aksi">' + grup[g][k].length + ' murid · Detail</span></summary>' + murid + '</details>';
      }).join('');
      return '<details class="grup-gender"><summary><span>' + g + '</span><span class="grup-aksi">' + total + ' murid · Detail</span></summary>' + pengampu + '</details>';
    }).join('');
  }
  function tampilAdmin(list) {
    var box = $('adminBox');
    if (!box) return;
    semuaAdmin = list;
    daftarAdmin = list.filter(function (p) { return !!p.email; });
    list = daftarAdmin;
    tampilGrupAdmin(semuaAdmin.filter(function (p) { return !p.email; }));
    box.hidden = false;
    if (!list.length) { $('adminList').innerHTML = '<p class="pd-sub">Belum ada pendaftar.</p>'; return; }
    $('adminList').innerHTML = list.map(function (p, i) {
      var baris = [
        ['Email', p.email], ['WhatsApp', '+' + p.wa],
        ['Jenis kelamin', p.jenis_kelamin || '-'],
        ['Tanggal lahir', p.tanggal_lahir ? tglLahir(p.tanggal_lahir) : '-'],
        ['Kota/Negara', p.kota || '-'], ['Kelas', p.kelas || '-'],
        ['Durasi', p.durasi ? p.durasi + ' bulan' : '-'],
        ['Hari diminta', hariLabel(p.hari_diminta)], ['Jam diminta', jamLabel(p.jam_diminta)],
        ['Peserta', p.peserta || '-'], ['Total', rupiahAdm(p.total)],
        ['Batas bayar', tglJam(p.batas_bayar)],
        ['Bukti transfer', p.bukti_at ? tglJam(p.bukti_at) : 'Belum ada'],
        ['Gelombang', p.gelombang ? namaGelombang(p.gelombang) : 'Belum dipilih'],
        ['Mulai halaqah', p.tanggal_halaqah ? tglLahir(p.tanggal_halaqah) : 'Belum diatur']
      ].map(function (r) {
        return '<div class="pd-baris"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
      }).join('');
      var ringkas = p.ringkasan ? '<div class="pd-ringkas" style="white-space:pre-wrap;margin:8px 0"><small>Ringkasan pendaftaran</small>' +
        '<div>' + esc(p.ringkasan) + '</div></div>' : '';
      var owner = emailSaya === OWNER;
      var aksi = '<button type="button" data-salin="' + i + '">Salin untuk WhatsApp</button>' +
        (p.bukti_path ? '<button type="button" data-bukti="' + i + '">Lihat bukti</button>' : '') +
        (owner && p.status === 'menunggu_verifikasi' ? '<button type="button" class="utama" data-terima="' + p.id + '">Konfirmasi pembayaran</button>' : '');
      var opsi = '<option value="">Pilih gelombang</option>' + gelombangList.map(function (g) {
        var ada = !!g.tanggal_mulai;
        return '<option value="' + esc(g.kode) + '"' + (p.gelombang === g.kode ? ' selected' : '') + (ada ? '' : ' disabled') + '>' +
          esc(g.nama) + (ada ? ' · mulai ' + tglLahir(g.tanggal_mulai) : ' · tanggal belum diatur') + '</option>';
      }).join('');
      var jadwal = owner ? '<div class="pd-jadwal">' +
        '<label>Gelombang<select data-gelombang="' + p.id + '">' + opsi + '</select></label>' +
        '<label>Link grup<input type="url" data-linkgrup="' + p.id + '" placeholder="https://chat.whatsapp.com/..." value="' + esc(p.link_grup || '') + '"></label>' +
        '<button type="button" data-jadwal="' + p.id + '">Simpan jadwal</button></div>' : '';
      var meetAdmin = p.status === 'diterima' ? '<div class="pd-jadwal pd-meet"><label>Link Google Meet<input type="url" data-meet="' + esc(p.email) + '" placeholder="https://meet.google.com/..."></label>' +
        '<button type="button" data-simpan-meet="' + esc(p.email) + '">Simpan link Meet</button></div>' : '';
      return '<div class="pd-item"><b>' + esc(p.nama) + '</b>' +
        '<small>' + esc(LABEL_STATUS[p.status] || p.status) + '</small>' +
        '<div class="pd-detail">' + baris + '</div>' + ringkas +
        '<div class="pd-aksi">' + aksi + '</div>' + jadwal + meetAdmin +
        (p.status === 'diterima' ? '<div class="cocok" data-cocok="' + p.id + '"><small>Mencari ustadz yang cocok…</small></div>' +
          '<div class="cocok" data-terdekat="' + p.id + '"></div>' : '') +
        '</div>';
    }).join('');
    list.forEach(function (p) {
      if (p.status !== 'diterima' || !sb) return;
      var terdekat = box.querySelector('[data-terdekat="' + p.id + '"]');
      sb.rpc('ustadz_terdekat', { p_pendaftaran: p.id }).then(function (r) {
        if (!terdekat || r.error) return;
        var daftar = r.data || [];
        if (!daftar.length) { terdekat.innerHTML = ''; return; }
        terdekat.innerHTML = '<small>Usulkan waktu terdekat ke murid:</small>' + daftar.slice(0, 5).map(function (u) {
          return '<div class="cocok-baris"><b>' + esc(u.nama) + ' · ' + esc(u.jam) + ' WIB' +
            (Number(u.selisih) ? ' (' + (u.selisih > 0 ? '+' : '') + u.selisih + ' menit)' : '') + '</b>' +
            '<button type="button" data-usulkan="' + p.id + '" data-usul-ustadz="' + esc(u.email) + '" data-usul-jam="' + esc(u.jam) + '">Usulkan ke murid</button></div>';
        }).join('');
      });
      var slot = box.querySelector('[data-cocok="' + p.id + '"]');
      sb.rpc('ustadz_cocok', { p_pendaftaran: p.id }).then(function (r) {
        if (!slot) return;
        if (r.error) { slot.innerHTML = '<small>Ustadz belum bisa dicari.</small>'; return; }
        var daftar = r.data || [];
        if (!daftar.length) { slot.innerHTML = '<small>Belum ada ustadz yang kosong untuk ' + (p.hari_diminta === 'weekend' ? 'Weekend' : 'Weekdays') + ' pukul ' + esc(String(p.jam_diminta || '').slice(0, 5)) + ' WIB.</small>'; return; }
        slot.innerHTML = '<small>Ustadz yang cocok:</small>' + daftar.map(function (u) {
          return '<div class="cocok-baris"><b>' + esc(u.nama) + '</b>' +
            '<button type="button" data-ajukan="' + p.id + '" data-ustadz="' + esc(u.email) + '">Ajukan ke ustadz</button></div>';
        }).join('');
      });
    });
  }
  function tampilGelombang(list) {
    gelombangList = list;
    var box = $('gelombangBox'), form = $('gelombangForm');
    if (!box || !form) return;
    box.hidden = false;
    form.innerHTML = list.map(function (g) {
      return '<div class="pd-gelombang-baris"><label>' + esc(g.nama) +
        '<input type="date" data-gtgl="' + esc(g.kode) + '" value="' + esc(g.tanggal_mulai || '') + '"></label>' +
        '<button type="button" data-gsimpan="' + esc(g.kode) + '">Simpan</button></div>';
    }).join('');
    if (semuaAdmin.length) tampilAdmin(semuaAdmin);
  }
  function tampilKeluar(list) {
    var box = $('keluarBox'), el = $('keluarList');
    if (!box || !el) return;
    box.hidden = !list.length;
    el.innerHTML = list.map(function (k) {
      return '<div class="pm-item"><b>' + esc(k.murid || 'Murid') + '</b>' +
        '<small>Diminta keluar oleh ' + esc(k.pengajar || 'pengajar') + '</small>' +
        '<div class="pm-aksi"><button type="button" class="mr-btn" data-setuju-keluar="' + k.id + '">Setujui keluarkan</button>' +
        '<button type="button" class="pm-tolak" data-tolak-keluar="' + k.id + '">Tolak</button></div></div>';
    }).join('');
  }
  function bindKeluar() {
    var el = $('keluarList');
    if (!el) return;
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-setuju-keluar], button[data-tolak-keluar]');
      if (!b || !sb) return;
      var setuju = b.hasAttribute('data-setuju-keluar');
      if (!window.confirm(setuju ? 'Setujui murid dikeluarkan dari ustadz ini?' : 'Tolak permintaan ini?')) return;
      var id = Number(b.getAttribute(setuju ? 'data-setuju-keluar' : 'data-tolak-keluar'));
      sb.rpc('respon_keluar', { p_id: id, p_setuju: setuju }).then(function (r) {
        if (r.error) { note(r.error.message || 'Belum bisa diproses.', true); return; }
        note(setuju ? 'Murid dikeluarkan dari daftar ustadz.' : 'Permintaan ditolak.');
        muatKeluar();
      });
    });
  }
  function muatKeluar() {
    sb.rpc('daftar_keluar_admin').then(function (r) {
      if (!r.error) tampilKeluar(r.data || []);
    });
  }
  function ubahKePng(blob) {
    if (blob.type === 'image/png') return Promise.resolve(blob);
    return new Promise(function (ok, gagal) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : gagal(new Error('png')); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); gagal(new Error('gambar')); };
      img.src = url;
    });
  }
  function bacaDataUrl(blob) {
    return new Promise(function (ok, gagal) {
      var r = new FileReader();
      r.onload = function () { ok(r.result); };
      r.onerror = function () { gagal(r.error); };
      r.readAsDataURL(blob);
    });
  }
  function bindAdmin() {
    var box = $('adminList');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.salin !== undefined) {
        var p = daftarAdmin[Number(t.dataset.salin)];
        if (!navigator.clipboard || !p) return;
        var teks = teksWa(p);
        var tandai = function (label) {
          t.textContent = label;
          setTimeout(function () { t.textContent = 'Salin untuk WhatsApp'; }, 1800);
        };
        var salinTeksSaja = function () {
          navigator.clipboard.writeText(teks).then(function () { tandai('Tersalin (tanpa bukti)'); });
        };
        if (!p.bukti_path || !sb || typeof ClipboardItem === 'undefined') { salinTeksSaja(); return; }
        /* Teks dan gambar bukti transfer disalin bersamaan. ClipboardItem dibuat langsung di dalam klik. */
        var gambarPng = sb.storage.from('bukti-transfer').download(p.bukti_path).then(function (r) {
          if (r.error || !r.data) throw new Error('bukti');
          return ubahKePng(r.data);
        });
        var htmlSalin = gambarPng.then(function (png) {
          return bacaDataUrl(png).then(function (url) {
            return '<p>' + esc(teks).replace(/\n/g, '<br>') + '</p><p><img src="' + url + '" alt="Bukti transfer"></p>';
          });
        });
        var item = new ClipboardItem({
          'text/plain': new Blob([teks], { type: 'text/plain' }),
          'text/html': htmlSalin.then(function (h) { return new Blob([h], { type: 'text/html' }); }),
          'image/png': gambarPng
        });
        navigator.clipboard.write([item]).then(function () {
          tandai('Tersalin dengan bukti');
        }).catch(function () {
          salinTeksSaja();
        });
      }
      if (t.dataset.bukti !== undefined && sb) {
        var pb = daftarAdmin[Number(t.dataset.bukti)];
        if (!pb || !pb.bukti_path) return;
        sb.storage.from('bukti-transfer').createSignedUrl(pb.bukti_path, 300).then(function (r) {
          if (r.error || !r.data) { note('Bukti belum bisa dibuka.', true); return; }
          window.open(r.data.signedUrl, '_blank', 'noopener');
        });
      }
      if (t.dataset.ajukan !== undefined && sb) {
        sb.rpc('ajukan_ustadz', { p_pendaftaran: Number(t.dataset.ajukan), p_pengajar: t.dataset.ustadz }).then(function (r) {
          if (r.error) { note(r.error.message || 'Belum bisa diajukan.', true); return; }
          note('Permintaan dikirim ke ustadz.');
          t.disabled = true; t.textContent = 'Sudah diajukan';
        });
      }
      if (t.dataset.terima !== undefined && sb) {
        sb.rpc('ubah_status_pendaftaran', { p_id: Number(t.dataset.terima), p_status: 'diterima' }).then(function (r) {
          if (r.error) { note('Pembayaran belum bisa dikonfirmasi. Coba lagi.', true); return; }
          note('Pembayaran dikonfirmasi.');
          muat();
        });
      }
      if (t.dataset.simpanMeet !== undefined && sb) {
        var emailMeet = t.dataset.simpanMeet;
        var inpMeet = null, semuaMeet = box.querySelectorAll('input[data-meet]');
        for (var im = 0; im < semuaMeet.length; im++) { if (semuaMeet[im].getAttribute('data-meet') === emailMeet) inpMeet = semuaMeet[im]; }
        var linkMeet = inpMeet ? (inpMeet.value || '').trim() : '';
        if (linkMeet && !LINK_MEET_RE.test(linkMeet)) {
          note('Link harus berupa tautan Google Meet, contoh: https://meet.google.com/abc-defg-hij', true);
          return;
        }
        sb.rpc('atur_link_meet', { p_peserta_email: emailMeet, p_link: linkMeet || null }).then(function (r) {
          if (r.error) { note(r.error.message || 'Link belum tersimpan. Coba lagi.', true); return; }
          note(linkMeet ? 'Link Google Meet tersimpan.' : 'Link Google Meet dihapus.');
          if (inpMeet) inpMeet.value = '';
          muat();
        });
      }
      if (t.dataset.jadwal !== undefined && sb) {
        var id = t.dataset.jadwal;
        var kode = box.querySelector('[data-gelombang="' + id + '"]').value;
        var lk = box.querySelector('[data-linkgrup="' + id + '"]').value || null;
        if (!kode) { note('Pilih gelombang dulu.', true); return; }
        sb.rpc('atur_jadwal_pendaftaran', { p_id: Number(id), p_kode: kode, p_link: lk }).then(function (r) {
          if (r.error) { note(r.error.message || 'Jadwal belum tersimpan. Coba lagi.', true); return; }
          note('Jadwal halaqah tersimpan.');
          muat();
        });
      }
      if (t.hasAttribute('data-usulkan') && sb) {
        sb.rpc('usulkan_waktu', { p_pendaftaran: Number(t.getAttribute('data-usulkan')), p_pengajar: t.getAttribute('data-usul-ustadz'), p_jam: t.getAttribute('data-usul-jam') }).then(function (r) {
          if (r.error) { note(r.error.message || 'Usulan belum bisa dikirim.', true); return; }
          note('Usulan waktu sudah dikirim ke murid.');
          muat();
        });
      }
      if (t.dataset.gsimpan !== undefined && sb) {
        var kg = t.dataset.gsimpan;
        var tglG = document.querySelector('[data-gtgl="' + kg + '"]').value;
        if (!tglG) { note('Isi tanggal mulai dulu.', true); return; }
        sb.rpc('atur_gelombang', { p_kode: kg, p_tanggal: tglG }).then(function (r) {
          if (r.error) { note('Tanggal gelombang belum tersimpan.', true); return; }
          note('Tanggal gelombang tersimpan.');
          muat();
        });
      }
    });
  }

  /* ---------- Paket, pengampu, dan tanggal bergabung ---------- */
  var IKON_KOIN = '<span class="pb-koin" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg></span>';
  // Ikon paket: lingkaran dan mahkota. Silver abu-abu, Gold emas, Platinum perak, belum ada paket abu-abu.
  var WARNA_PAKET = {
    silver:   { cincin: '#9CA3AF', isi: '#FFFFFF', mahkota: '#1D1D1F' },
    gold:     { cincin: '#D4A337', isi: '#1D1D1F', mahkota: '#E9C46A' },
    platinum: { cincin: '#C0C6CC', isi: '#1D1D1F', mahkota: '#C0C6CC' },
    kosong:   { cincin: '#C7C7CC', isi: '#FFFFFF', mahkota: '#C7C7CC' }
  };
  function svgPaket(p) {
    var w = WARNA_PAKET[p] || WARNA_PAKET.kosong;
    return '<svg viewBox="0 0 64 64" width="84" height="84" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="28" fill="' + w.isi + '" stroke="' + w.cincin + '" stroke-width="5"/>' +
      '<path d="M18 40V25l8 7 6-11 6 11 8-7v15z" fill="' + w.mahkota + '"/>' +
      '<rect x="18" y="41.5" width="28" height="3" rx="1.5" fill="' + w.mahkota + '"/></svg>';
  }

  // Lingkaran H1 sampai H7: hari yang sudah berurutan diberi tanda centang.
  function renderTrack(n) {
    var box = $('mkTrack');
    if (!box) return;
    var isi = Math.min(Number(n) || 0, 7), html = '';
    for (var i = 1; i <= 7; i++) {
      html += '<div class="mk-hari' + (i <= isi ? ' on' : '') + '"><span class="mk-dot"></span><small>H' + i + '</small></div>';
    }
    box.innerHTML = html;
  }

  function setTier(d) {
    var p = String(d.paket || '').toLowerCase();
    var ada = d.status === 'aktif' && (p === 'silver' || p === 'gold' || p === 'platinum');
    var kunci = ada ? p : 'kosong';
    var badge = $('pfBadge');
    if (badge) badge.innerHTML = svgPaket(kunci);
    var btn = $('pfTier');
    if (btn && btn.firstChild) {
      btn.firstChild.nodeValue = (ada ? p.charAt(0).toUpperCase() + p.slice(1) : 'Belum Ada Paket') + ' ';
    }
  }

  var aktifPaket = false, tglMulaiGelombang = '', tglMulaiISO = '', paketKey = '', pengampuNama = '';
  var pertemuanSelesai = null; /* diisi dari pencatatan pengajar (belum tersedia) */
  var IKON_ORANG1 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6"/></svg>';
  var IKON_TUKAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h13l-3-3M20 15H7l3 3"/></svg>';
  var IKON_JAM = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  var MENIT_SESI = { silver: 10, gold: 20, platinum: 30 };
  function hariIniJakarta() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); }
  var grupBesar = null, linkHalaqah = '', sudahBayar = false, hitungTimer = null;
  var IKON_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5l1.2-4.1A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.1-1.1z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.2-1.8-.9-.8.8c-1-.4-2-1.4-2.4-2.4l.8-.8-.9-1.8z"/></svg>';
  var IKON_ORANG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3 3-4.8 6-4.8s5.4 1.8 6 4.8"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.4c2.4.2 4 1.8 4.5 4.6"/></svg>';
  var IKON_CEK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function tglSingkat(iso) {
    return new Date(iso + 'T00:00:00+07:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
  }
  function renderGrup(belum) {
    var kartu = $('pkGrup'), tahap = $('pkTahap');
    if (!kartu || !tahap) return;
    kartu.hidden = !belum; tahap.hidden = !belum;
    if (!belum) return;
    var adaBesar = !!(grupBesar && grupBesar.link);
    var adaHalaqah = !!linkHalaqah;
    $('grupBesarBaris').innerHTML =
      '<span class="pk-ikon-grup">' + IKON_WA + '</span>' +
      '<div class="pk-grup-isi"><b>Grup Besar</b><small>Grup utama seluruh peserta.</small></div>' +
      (adaBesar
        ? '<a class="pk-btn-hijau" href="' + esc(grupBesar.link) + '" target="_blank" rel="noopener">Masuk Grup</a>'
        : '<span class="pk-pill-kuning">Belum tersedia</span>');
    $('grupHalaqahBaris').innerHTML =
      '<span class="pk-ikon-grup kuning">' + IKON_ORANG + '</span>' +
      '<div class="pk-grup-isi"><b>Grup Halaqah</b><small>Grup briefing dengan ustadz &amp; anggota halaqah.</small></div>' +
      (adaHalaqah
        ? '<a class="pk-btn-hijau" href="' + esc(linkHalaqah) + '" target="_blank" rel="noopener">Masuk Grup</a>'
        : '<div class="pk-tunggu"><span class="pk-pill-kuning">Menunggu Ustadz</span><small>Grup akan tersedia setelah ustadz ditetapkan.</small></div>');
    var langkah = [
      { judul: 'Pembayaran', sub: sudahBayar ? 'Lunas' : 'Belum lunas', selesai: sudahBayar, sedang: !sudahBayar },
      { judul: 'Penetapan Ustadz', sub: adaHalaqah ? 'Ditetapkan' : '<span class="pk-pill-kuning">Sedang Diproses</span>', selesai: adaHalaqah, sedang: sudahBayar && !adaHalaqah },
      { judul: 'Mulai Belajar', sub: tglSingkat(tglMulaiISO), selesai: false, sedang: false }
    ];
    $('pkTahapLangkah').innerHTML = langkah.map(function (l, n) {
      var kelas = l.selesai ? 'selesai' : (l.sedang ? 'sedang' : '');
      return '<div><span class="pk-titik ' + kelas + '">' + (l.selesai ? IKON_CEK : (n + 1)) + '</span>' +
        '<div class="pk-tahap-judul">' + l.judul + '</div><div class="pk-tahap-sub">' + l.sub + '</div></div>';
    }).join('');
    $('pkTahapNote').textContent = adaHalaqah
      ? 'Grup Halaqah sudah tersedia. Silakan masuk untuk briefing jadwal belajar bersama ustadz.'
      : (adaBesar ? 'Anda sudah bergabung di Grup Besar. ' : '') +
        'Grup Halaqah akan diberikan setelah ustadz ditetapkan. Di Grup Halaqah, Anda akan melakukan briefing jadwal belajar bersama ustadz.';
  }
  /* ---------- Penjadwalan belajar murid: ubah jadwal, usulan dari admin ---------- */
  var jadwalMurid = null, jmEvents = false, gantiStatus = null;
  // Sisa hari program: dihitung sistem dari tanggal selesai periode (gelombang 1: tgl 10, gelombang 2: tgl 25)
  function sisaHariProgram() {
    if (!jadwalMurid || jadwalMurid.sisa_hari === null || jadwalMurid.sisa_hari === undefined) return null;
    return Number(jadwalMurid.sisa_hari);
  }
  // Jam dinding Jakarta sebagai Date lokal; semua perbandingan memakai pola yang sama
  function jakartaSekarang() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })); }
  function hariSesiJm(hari) { return hari === 'weekend' ? [6, 0] : [1, 2, 3, 4, 5]; }
  function jamDetik(d) { return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds(); }
  function hitungJam(detik) { var j = Math.floor(detik / 3600), m = Math.floor((detik % 3600) / 60), s = detik % 60; return [j, m, s].map(function (x) { return (x < 10 ? '0' : '') + x; }).join(' : '); }
  var njTimer = null;
  // Sisa waktu: jam dalam total, menit, dan detik (contoh: 18j 49m 14d)
  function formatSisa(ms) {
    var detik = Math.max(0, Math.floor(ms / 1000));
    var dua = function (x) { return (x < 10 ? '0' : '') + x; };
    return Math.floor(detik / 3600) + 'j ' + dua(Math.floor((detik % 3600) / 60)) + 'm ' + dua(detik % 60) + 'd';
  }
  function kartuNj(chip, kelas, judul, label, nilai, aksi, catatan) {
    var atas = label ? '<small class="nj-label">' + esc(label) + '</small><div class="nj-hitung">' + esc(nilai) + '</div>' : '';
    return '<div class="nj-kartu ' + kelas + '"><span class="nj-chip">' + esc(chip) + '</span>' +
      (judul ? '<b class="nj-judul2">' + esc(judul) + '</b>' : '') +
      (atas || aksi ? '<div class="nj-baris2"><div>' + atas + '</div>' + (aksi || '') + '</div>' : '') +
      (catatan || '') + '</div>';
  }
  function renderNotifJadwal(d) {
    var box = $('notifJadwal'), isi = $('njIsi');
    if (njTimer) { clearInterval(njTimer); njTimer = null; }
    if (!box || !isi) return;
    if (!d || !d.jam || !d.hari || !d.ustadz) { box.hidden = true; return; }
    box.hidden = false;
    var p = d.jam.split(':').map(Number), menit = d.menit || 10;
    var jamTitik = d.jam.replace(':', '.');
    var mulai = d.tanggal_mulai ? new Date(d.tanggal_mulai + 'T00:00:00') : null;
    var hariSesi = hariSesiJm(d.hari);
    var sesiDi = function (tgl) { return new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate(), p[0], p[1]); };
    var adaSesi = function (tgl) { return hariSesi.indexOf(tgl.getDay()) >= 0 && (!mulai || tgl >= mulai); };
    var fmtTgl = function (dt) { return dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
    var gambar = function () {
      var now = jakartaSekarang();
      var hari = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var besok = new Date(hari.getFullYear(), hari.getMonth(), hari.getDate() + 1);
      var sesiHari = sesiDi(hari), selesaiHari = new Date(sesiHari.getTime() + menit * 60000);
      var next = null;
      for (var i = 0; i < 400 && !next; i++) {
        var tg = new Date(hari.getFullYear(), hari.getMonth(), hari.getDate() + i);
        if (adaSesi(tg)) { var t = sesiDi(tg); if (t >= now) next = t; }
      }
      var sisaNext = next ? formatSisa(next - now) : '–';
      var top;
      if (adaSesi(hari) && now < selesaiHari) {
        var sedang = now >= sesiHari;
        var bisaMasuk = now >= new Date(sesiHari.getTime() - 5 * 60000) && now < selesaiHari;
        var linkMeet = d.link_meet || '';
        var aksi = bisaMasuk && linkMeet
          ? '<a class="nj-masuk" id="njMasuk" href="' + esc(linkMeet) + '" target="_blank" rel="noopener">' + IKON_PLAY + 'Live</a>'
          : '<button type="button" class="nj-masuk" id="njMasuk" disabled>' + IKON_PLAY + 'Live</button>';
        top = kartuNj('Hari Ini', 'nj-hari', '',
          sedang ? 'Sesi berakhir dalam' : 'Mulai dalam',
          sedang ? formatSisa(selesaiHari - now) : formatSisa(sesiHari - now), aksi, '');
      } else if (mulai && mulai > now) {
        top = kartuNj('Mulai', 'nj-hari', 'Sesi Pertama', 'Mulai dalam', next ? formatSisa(next - now) : '–', '',
          '<p class="nj-catatan">' + esc(fmtTgl(next || mulai)) + ' · ' + esc(jamTitik) + ' WIB</p>');
      } else if (adaSesi(hari)) {
        top = kartuNj('Hari Ini', 'nj-hari', '', 'Setoran berikutnya dalam', sisaNext, '',
          '<p class="nj-catatan">Setoran hari ini sudah selesai.</p>');
      } else {
        top = kartuNj('Hari Ini', 'nj-libur', 'Hari Ini Libur', 'Setoran berikutnya dalam', sisaNext, '',
          '<p class="nj-catatan">Manfaatkan waktu dengan baik untuk muroja’ah mandiri.</p>');
      }
      var bawah = '';
      if (!mulai || besok >= mulai) {
        var besokPendek = besok.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
        bawah = '<div class="nj-besok-baris">' + IKON_KALENDER + '<span>Besok: ' +
          (adaSesi(besok) ? esc(besokPendek) + ' · ' + esc(jamTitik) + ' WIB' : 'Libur') + '</span></div>';
      }
      isi.innerHTML = '<div class="nj-blok">' + top + bawah + '</div>';
    };
    gambar();
    njTimer = setInterval(gambar, 1000);
  }
  var IKON_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  var IKON_LONCENG = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 8a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7z"/><path d="M10 19a2 2 0 004 0"/></svg>';
  var IKON_KALENDER = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';

  /* ---------- Ganti pengajar ---------- */
  function bukaGanti() {
    var s = $('gantiSheet');
    if (!s) return;
    s.hidden = false;
    var ket = $('gpKet'); if (ket) ket.value = '';
    var isi = $('gpIsi');
    if (isi) isi.hidden = false;
    var sukses = $('gpSukses'); if (sukses) sukses.hidden = true;
  }
  function tutupGanti() { var s = $('gantiSheet'); if (s) s.hidden = true; }
  var gantiEvents = false, liveEvents = false;
  function pasangGanti() {
    var s = $('gantiSheet');
    if (!s || gantiEvents) return;
    gantiEvents = true;
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#pkGanti') && !e.target.closest('#pkGanti').disabled) bukaGanti();
    });
    $('gpTutup').addEventListener('click', tutupGanti);
    s.addEventListener('click', function (e) { if (e.target === s) tutupGanti(); });
    $('gpKirim').addEventListener('click', function () {
      var terpilih = document.querySelector('input[name="gpAlasan"]:checked');
      var alasan = terpilih ? terpilih.value : 'Lainnya';
      var ket = ($('gpKet').value || '').trim();
      if (!window.confirm('Ajukan pergantian pengajar? Admin akan memprosesnya.')) return;
      sb.rpc('minta_ganti_pengajar', { p_alasan: alasan, p_ket: ket }).then(function (r) {
        if (r.error) { note(r.error.message || 'Permintaan belum bisa dikirim.', true); return; }
        $('gpIsi').hidden = true;
        $('gpSukses').hidden = false;
        muat();
      });
    });
  }
  function tampilGanti(list) {
    var box = $('gantiBox'), el = $('gantiList');
    if (!box || !el) return;
    box.hidden = !list.length;
    el.innerHTML = list.map(function (k) {
      return '<div class="pm-item"><b>' + esc(k.murid || 'Murid') + '</b>' +
        '<small>Pengajar saat ini: ' + esc(k.pengajar || '-') + ' · Alasan: ' + esc(k.alasan || '-') + (k.keterangan ? ' — ' + esc(k.keterangan) : '') + '</small>' +
        '<div class="pm-aksi"><button type="button" class="mr-btn" data-setuju-ganti="' + k.id + '">Setujui pergantian</button>' +
        '<button type="button" class="pm-tolak" data-tolak-ganti="' + k.id + '">Tolak</button></div></div>';
    }).join('');
  }
  function muatGanti() {
    sb.rpc('daftar_ganti_admin').then(function (r) { if (!r.error) tampilGanti(r.data || []); });
  }
  function bindGanti() {
    var el = $('gantiList');
    if (!el) return;
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-setuju-ganti], button[data-tolak-ganti]');
      if (!b || !sb) return;
      var setuju = b.hasAttribute('data-setuju-ganti');
      if (!window.confirm(setuju ? 'Setujui pergantian pengajar untuk murid ini?' : 'Tolak permintaan ini?')) return;
      var id = Number(b.getAttribute(setuju ? 'data-setuju-ganti' : 'data-tolak-ganti'));
      sb.rpc('respon_ganti', { p_id: id, p_setuju: setuju }).then(function (r) {
        if (r.error) { note(r.error.message || 'Belum bisa diproses.', true); return; }
        note(setuju ? 'Pergantian diproses. Tetapkan ustadz baru lewat tab Pendaftar.' : 'Permintaan ditolak.');
        muatGanti();
      });
    });
  }

  /* ---------- Masuk live (murid) ---------- */
  function pasangLive() {
    if (liveEvents) return;
    liveEvents = true;
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#njMasuk');
      if (!b || b.disabled || !sb) return;
      sb.rpc('masuk_live_murid').then(function (r) {
        if (r.error) { note(r.error.message || 'Belum bisa masuk live.', true); return; }
        note('Pengajar sudah diberi tahu bahwa Anda masuk live.');
      });
    });
  }
  function labelHariJm(h) { return h === 'weekend' ? 'Weekend' : 'Weekdays'; }
  function isiJamMurid(pilih) {
    var sel = $('jmJam');
    if (!sel) return;
    var semua = daftarJam();
    sel.innerHTML = PERIODE.map(function (p, i) {
      return '<optgroup label="' + p.nama + ' (' + p.dari + '–' + p.sampai + ')">' +
        semua.filter(function (s) { return periodeIndeks(s) === i; }).map(function (s) {
          return '<option value="' + s + '">' + s + ' WIB</option>';
        }).join('') + '</optgroup>';
    }).join('');
    sel.value = pilih || '19:00';
  }
  function bukaFormJadwal() {
    var f = $('jmForm');
    if (!f) return;
    $('jmPaket').value = (jadwalMurid && jadwalMurid.hari) || 'weekday';
    isiJamMurid(jadwalMurid && jadwalMurid.jam);
    f.hidden = false;
    f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function renderJadwalMurid(d) {
    var box = $('jadwalMurid');
    if (!box) return;
    jadwalMurid = d;
    gantiStatus = d && d.ganti_status ? d.ganti_status : null;
    renderNotifJadwal(d && d.pendaftaran_id ? d : null);
    renderMulai();
    renderPkJadwal(d);
    if (!d || !d.pendaftaran_id) { box.hidden = true; return; }
    box.hidden = false;
    var belum = d.status_periode === 'sebelum';
    $('jmSub').textContent = belum
      ? 'Bisa diganti kapan saja di luar periode berjalan.'
      : (d.status_periode === 'selesai' ? 'Program sudah selesai.' : 'Periode berjalan. Sisa perubahan: ' + (d.sisa_ubah || 0) + ' kali.');
    $('jmPill').textContent = d.usulan ? 'Ada usulan dari admin' : (d.ustadz ? 'Ustadz ditetapkan' : 'Menunggu Ustadz');
    var bisaUbah = d.bisa_ubah !== undefined ? !!d.bisa_ubah : (belum || (d.sisa_ubah || 0) > 0);
    var isi = '<div class="jm-waktu"><small>Waktu yang Anda Ajukan</small><b>' + esc(labelHariJm(d.hari)) + ', ' + esc((d.jam || '-').replace(':', '.')) + ' WIB</b>' +
      (d.ustadz ? '<small>Ustadz: ' + esc(d.ustadz) + '</small>' : '') + '</div>';
    if (d.usulan) {
      var u = d.usulan, selisih = Number(u.selisih || 0);
      isi += '<div class="jm-usulan"><b>Usulan dari Admin</b>' +
        '<p>Ada ustadz yang tersedia dengan waktu terdekat dari permintaan Anda.</p>' +
        '<div class="jm-dua"><div><small>Waktu Anda</small><b>' + esc(labelHariJm(d.hari)) + ', ' + esc(d.jam) + '</b></div>' +
        '<span aria-hidden="true">→</span>' +
        '<div class="jm-tersedia"><small>Waktu Tersedia</small><b>' + esc(labelHariJm(u.hari)) + ', ' + esc(u.jam) + '</b>' +
        '<em>' + (selisih >= 0 ? '+' : '') + selisih + ' menit</em></div></div>' +
        '<small>Ustadz: ' + esc(u.ustadz) + '</small>' +
        '<div class="jm-aksi"><button type="button" class="pf-btn pf-btn-pri" data-setuju-usulan="' + u.id + '">Setuju Waktu Ini</button>' +
        '<button type="button" class="pf-btn" id="jmLain"' + (bisaUbah ? '' : ' disabled') + '>Ajukan Waktu Lain</button></div></div>';
    }
    isi += '<div class="jm-aksi" style="margin-top:12px">' +
      '<button type="button" class="pf-btn" id="jmEdit"' + (bisaUbah ? '' : ' disabled') + '>Edit Waktu</button></div>' +
      (bisaUbah ? '' : '<p class="jm-note">Batas 3 kali perubahan setelah mulai sudah habis.</p>');
    $('jmIsi').innerHTML = isi;
  }
  function muatJadwalMurid() {
    sb.rpc('jadwal_murid_saya').then(function (r) {
      renderJadwalMurid(r.error ? null : r.data);
    });
  }
  // Baris jadwal di kartu paket: hari, jam, dan Edit Waktu (jatah hanya tampil setelah mulai)
  var IKON_PENSIL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
  function renderPkJadwal(d) {
    var row = $('pkJadwal');
    if (!row) return;
    if (!d || !d.pendaftaran_id || isPengajar) { row.hidden = true; return; }
    row.hidden = false;
    var selesai = d.status_periode === 'selesai';
    var belum = d.status_periode === 'sebelum', sisa = Number(d.sisa_ubah || 0);
    var bisa = d.bisa_ubah !== undefined ? !!d.bisa_ubah : (belum || sisa > 0);
    $('pkJadwalHari').textContent = labelHariJm(d.hari);
    $('pkJadwalJam').textContent = (d.jam || '-').replace(':', '.') + ' WIB';
    var tombol = $('pkEditWaktu');
    tombol.disabled = !bisa;
    tombol.innerHTML = IKON_PENSIL + '<span>Edit Waktu</span><i class="pk-edit-garis" aria-hidden="true"></i>' +
      '<span class="pk-jatah-label">Jatah:</span><em class="pk-jatah">' + (belum ? 'Tidak terbatas' : (selesai ? '0' : sisa) + ' kali') + '</em>';
    var catatan = $('pkJadwalCatatan');
    if (catatan) {
      catatan.hidden = bisa;
      catatan.textContent = selesai ? 'Program sudah selesai, jadwal tidak bisa diubah.' : 'Batas 3 kali perubahan dalam periode ini sudah habis.';
    }
  }
  // Tanggal berakhir program (sama dengan perhitungan sisa hari)
  function sampaiProgram() {
    if (!jadwalMurid || !jadwalMurid.tanggal_selesai) return '';
    var s = jadwalMurid.tanggal_selesai.split('-').map(Number);
    return new Date(Date.UTC(s[0], s[1] - 1, s[2])).toLocaleDateString('id-ID', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function pasangJadwalMurid() {
    if (jmEvents) return;
    jmEvents = true;
    var pe = $('pkEditWaktu');
    if (pe) pe.addEventListener('click', function () {
      bukaFormJadwal();
      var kartu = $('jadwalMurid');
      if (kartu && kartu.scrollIntoView) kartu.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    var box = $('jadwalMurid');
    if (!box) return;
    isiJamMurid();
    box.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('button');
      if (!t) return;
      if (t.id === 'jmEdit' || t.id === 'jmLain') { bukaFormJadwal(); return; }
      if (t.id === 'jmBatal') { $('jmForm').hidden = true; return; }
      if (t.hasAttribute('data-setuju-usulan')) {
        if (!window.confirm('Setujui waktu ini? Jadwal Anda akan langsung berpindah ke waktu tersebut.')) return;
        sb.rpc('respon_usulan', { p_id: Number(t.getAttribute('data-setuju-usulan')), p_setuju: true }).then(function (r) {
          if (r.error) { note(r.error.message || 'Jadwal belum bisa disetujui.', true); return; }
          note('Jadwal Anda sudah diperbarui.');
          muat();
        });
      }
    });
    $('jmForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var kirim = e.target.querySelector('button[type="submit"]');
      if (kirim && kirim.disabled) return;
      var hari = $('jmPaket').value, jam = $('jmJam').value;
      if (!hari || !jam) { note('Pilih hari dan jam terlebih dahulu.', true); return; }
      if (jadwalMurid && hari === jadwalMurid.hari && jam === jadwalMurid.jam) {
        note('Jadwal ini sama dengan jadwal Anda sekarang. Pilih hari atau jam yang berbeda.', true);
        return;
      }
      if (!window.confirm('Ajukan jadwal ' + labelHariJm(hari) + ', pukul ' + jam + ' WIB? Admin akan mencarikan ustadz yang sesuai.')) return;
      if (kirim) kirim.disabled = true;
      sb.rpc('ajukan_ubah_jadwal', { p_hari: hari, p_jam: jam }).then(function (r) {
        if (kirim) kirim.disabled = false;
        if (r.error) { note(r.error.message || 'Permintaan belum bisa dikirim.', true); return; }
        $('jmForm').hidden = true;
        note('Permintaan jadwal sudah dikirim. Admin akan mengabari Anda.');
        muat();
      }).catch(function () {
        if (kirim) kirim.disabled = false;
        note('Koneksi bermasalah. Silakan coba lagi.', true);
      });
    });
  }

  /* ---------- Garansi uang kembali (7 hari pertama sejak pembelajaran dimulai) ---------- */
  var rekeningGaransi = null, klaimGaransi = null, garansiTimer = null;
  var HARI_GARANSI = 7;
  function fmtSisa(ms) {
    var m = Math.max(0, Math.floor(ms / 60000));
    var hari = Math.floor(m / 1440), jam = Math.floor((m % 1440) / 60);
    return hari + ' hari ' + jam + ' jam';
  }
  var LANGKAH_KLAIM = [
    { kode: 'diajukan', judul: 'Ajukan Klaim' },
    { kode: 'dikonfirmasi', judul: 'Konfirmasi' },
    { kode: 'diproses', judul: 'Diproses' },
    { kode: 'selesai', judul: 'Selesai' }
  ];
  function renderGaransi() {
    var kartu = $('pkGaransi');
    if (!kartu) return;
    if (garansiTimer) { clearInterval(garansiTimer); garansiTimer = null; }
    if (!sudahBayar) { kartu.hidden = true; return; }
    kartu.hidden = false;
    var badge = $('garansiBadge'), kiri = $('garansiKiri'), rek = $('garansiRekening'), kl = $('garansiKlaim');
    var ada = !!tglMulaiISO;
    var akhir = ada ? new Date(tglMulaiISO + 'T00:00:00+07:00').getTime() + HARI_GARANSI * 86400000 : 0;
    var belum = !ada || tglMulaiISO > hariIniJakarta();
    var aktif = !belum && Date.now() < akhir;
    var label = belum ? 'Menunggu Dimulai' : (aktif ? 'Masa Garansi Aktif' : 'Masa Garansi Berakhir');
    badge.textContent = label;
    badge.className = 'gr-badge ' + (belum ? 'gr-tunggu' : (aktif ? 'gr-aktif' : 'gr-akhir'));
    if (belum) {
      kiri.innerHTML = '<span class="pk-label">Berlaku</span><b class="pk-nilai">' + (ada ? '7 hari setelah ' + esc(tglMulaiGelombang) : 'Setelah jadwal mulai ditetapkan') + '</b>';
    } else if (aktif) {
      kiri.innerHTML = '<span class="pk-label">Sisa Waktu Klaim</span><b class="pk-nilai" id="garansiSisa">' + fmtSisa(akhir - Date.now()) + '</b>';
      garansiTimer = setInterval(function () {
        var el = $('garansiSisa');
        if (!el) return;
        if (Date.now() >= akhir) { renderGaransi(); return; }
        el.textContent = fmtSisa(akhir - Date.now());
      }, 60000);
    } else {
      kiri.innerHTML = '<b class="pk-nilai">Garansi Tidak Dapat Diklaim</b><span class="pk-label">Batas klaim 7 hari telah lewat sejak pembelajaran dimulai.</span>';
    }
    rek.innerHTML = rekeningGaransi
      ? '<span class="pk-label">Rekening Pengembalian Dana</span><b class="pk-nilai gr-rek">' + esc(rekeningGaransi.bank) + ' • ' + esc(rekeningGaransi.nomor) + '</b><span class="pk-label">a.n. ' + esc(rekeningGaransi.nama_pemilik) + '</span>' +
        '<button type="button" class="gr-btn-kecil" disabled>Ubah</button>'
      : '<span class="pk-label">Rekening Pengembalian Dana</span><b class="pk-nilai">Belum diisi</b>' +
        '<button type="button" class="gr-btn-kecil" disabled>Isi Rekening</button>';
    if (klaimGaransi) {
      var idx = LANGKAH_KLAIM.findIndex(function (l) { return l.kode === klaimGaransi.status; });
      kl.innerHTML = '<div class="gr-langkah">' + LANGKAH_KLAIM.map(function (l, n) {
        return '<div class="' + (n <= idx ? 'on' : '') + '"><span></span>' + l.judul + '</div>';
      }).join('') + '</div>';
    } else {
      kl.innerHTML = '<button type="button" class="gr-btn-klaim" disabled>Klaim Garansi</button>';
    }
  }

  function renderMulai() {
    var blok = $('pkBlok'), status = $('pkStatus'), meta = $('pkMeta'), kaki = $('pkKaki'), daftar = $('pbDaftar');
    if (!blok) return;
    if (hitungTimer) { clearInterval(hitungTimer); hitungTimer = null; }
    if (isPengajar) {
      if (hitungTimer) { clearInterval(hitungTimer); hitungTimer = null; }
      if (daftar) daftar.hidden = true;
      renderGrup(false); renderGaransi();
      return;
    }
    if (!paketKey && !tglMulaiISO) {
      blok.hidden = true; status.hidden = true; meta.hidden = true; kaki.hidden = true;
      renderGrup(false);
      if (daftar) daftar.hidden = false;
      return;
    }
    if (daftar) daftar.hidden = true;
    blok.hidden = false; status.hidden = false; meta.hidden = true; kaki.hidden = false;
    var kondisi = tglMulaiISO && tglMulaiISO > hariIniJakarta() ? 'belum'
      : (pertemuanSelesai !== null && pertemuanSelesai >= 15 ? 'selesai' : 'berjalan');
    var label = { belum: 'Menunggu Dimulai', berjalan: 'Sedang Berjalan', selesai: 'Selesai' }[kondisi];
    status.textContent = label;
    status.className = 'pk-status pk-' + kondisi;
    if (kondisi === 'belum') {
      blok.className = 'pk-blok pk-belum-blok';
      blok.innerHTML = '<div class="pk-kolom"><span class="pk-label">Mulai Belajar</span><b class="pk-nilai">' + esc(tglMulaiGelombang || '–') + '</b></div>' +
        '<div class="pk-kolom pk-kanan"><span class="pk-label">Waktu Mulai dalam</span><b class="pk-hitung" id="pkHitung">–</b></div>';
      var target = new Date(tglMulaiISO + 'T00:00:00+07:00').getTime();
      var dua = function (n) { return (n < 10 ? '0' : '') + n; };
      var tik = function () {
        var detik = Math.max(0, Math.floor((target - Date.now()) / 1000));
        if (detik === 0) { renderMulai(); return; }
        var hari = Math.floor(detik / 86400), sisa = detik % 86400;
        $('pkHitung').textContent = hari + ' hari ' + dua(Math.floor(sisa / 3600)) + ':' + dua(Math.floor((sisa % 3600) / 60)) + ':' + dua(sisa % 60);
      };
      tik();
      hitungTimer = setInterval(tik, 1000);
    } else if (kondisi === 'berjalan') {
      var sisa = sisaHariProgram();
      var n = pertemuanSelesai === null ? 0 : pertemuanSelesai;
      blok.className = 'pk-blok pk-hijau';
      var sampai = sampaiProgram();
      blok.innerHTML = '<div><span class="pk-label">Sisa Waktu</span><b class="pk-nilai">' + (sisa === null ? '–' : sisa + ' hari') + '</b>' +
        (sampai ? '<span class="pk-sub">s.d. ' + esc(sampai) + '</span>' : '') + '</div>' +
        '<div><span class="pk-label">Pertemuan</span><b class="pk-nilai">' + n + ' / 15</b>' +
        '<div class="pk-bar"><span style="width:' + Math.min(100, Math.round(n / 15 * 100)) + '%"></span></div></div>' +
        '<div><span class="pk-label">Durasi</span><span class="pk-durasi-baris">' + IKON_JAM + '<b class="pk-nilai pk-kecil">' + (paketKey ? MENIT_SESI[paketKey] + ' menit' : '–') + '</b></span>' +
        '<span class="pk-sub">per pertemuan</span></div>';
    } else {
      blok.className = 'pk-blok';
      blok.innerHTML = '<b class="pk-nilai">Program telah selesai</b><span class="pk-label">15 / 15 pertemuan</span>';
    }
    var bisaGanti = !!pengampuNama && !gantiStatus && kondisi !== 'selesai';
    var tombolGanti = gantiStatus === 'menunggu' ? 'Diproses' : (gantiStatus === 'diproses' ? 'Pergantian diproses' : 'Ajukan Ganti Pengajar');
    var alasanGanti = !pengampuNama ? 'Pengajar belum ditetapkan admin.'
      : (gantiStatus ? 'Permintaan pergantian sedang diproses admin.'
      : (kondisi === 'selesai' ? 'Program sudah selesai.' : ''));
    kaki.innerHTML = '<div class="pk-tutor"><span class="pk-tutor-ikon" aria-hidden="true">' + IKON_ORANG1 + '</span>' +
      '<span class="pk-pengajar">' + esc(pengampuNama || 'Belum ada pengajar') + '</span></div>' +
      '<button type="button" class="pk-ganti" id="pkGanti"' + (bisaGanti ? '' : ' disabled') + '>' + IKON_TUKAR + '<span>' + tombolGanti + '</span></button>' +
      (!bisaGanti && alasanGanti ? '<p class="pk-catatan">' + esc(alasanGanti) + '</p>' : '');
    renderGrup(kondisi === 'belum');
    renderGaransi();
  }

  function tampilPaket(d) {
    setTier(d);
    aktifPaket = d.status === 'aktif';
    var p = String(d.paket || '').toLowerCase();
    paketKey = aktifPaket && MENIT_SESI[p] ? p : '';
    pengampuNama = aktifPaket && d.pengampu ? d.pengampu : '';
    renderMulai();
  }

  /* ---------- Pencapaian: Juz 1 sampai 30, tiap juz 20 halaman ---------- */
  function renderJus(data) {
    var el = $('pbJus');
    if (!el) return;
    var aktif = !!(data && data.aktif);
    var juz = aktif ? (data.juz || {}) : {};
    var selesai = 0;
    for (var k = 1; k <= 30; k++) if (parseInt(juz[k], 10) >= 20) selesai++;
    var ringkas = $('pbRingkas');
    if (ringkas) ringkas.textContent = aktif
      ? selesai + ' dari 30 juz selesai · sisa ' + (30 - selesai) + ' juz'
      : 'Belum terdaftar. Progres juz tampil setelah Anda menjadi peserta aktif.';
    var html = '';
    for (var n = 1; n <= 30; n++) {
      var h = Math.min(20, Math.max(0, parseInt(juz[n], 10) || 0));
      html += '<li class="pb-juz">' +
              '<span class="pb-pena">' + n + '</span>' +
              '<div class="pb-juz-isi">' +
              '<div class="pb-juz-judul">Juz ' + n + '<span>' + h + '/20</span></div>' +
              '<div class="pb-bar"><i style="width:' + (h / 20 * 100) + '%"></i></div>' +
              '</div></li>';
    }
    el.innerHTML = html;
    lipat(el, 4);
  }

  /* ---------- Klaim login harian ---------- */
  function klaim() {
    var b = $('btnKlaim');
    if (b.getAttribute('data-sudah') === '1') { note('Login hari ini sudah diklaim.'); return; }
    sb.rpc('klaim_login_harian').then(function (r) {
      if (r.error) { note('Klaim belum berhasil. Coba lagi.', true); return; }
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
    sb.rpc('atur_profil_papan', { p_username: null, p_avatar: k }).then(function (r) {
      if (r.error) { note('Avatar belum tersimpan. Coba lagi.', true); return; }
      sb.auth.updateUser({ data: { avatar_key: k } }).then(function (r2) {
        if (r2.data && r2.data.user) user = r2.data.user;
        pasangAvatar(user);
        $('pickAvatar').classList.add('hidden');
        $('btnFoto').setAttribute('aria-expanded', 'false');
        note('Avatar sudah disimpan.');
        muat();
      });
    });
  }

  /* ---------- Username ---------- */
  function bukaUsername() {
    var f = $('formUsername');
    f.classList.remove('hidden');
    f.elements.username.value = usernameSaya;
    f.elements.username.focus();
  }

  function simpanUsername(e) {
    e.preventDefault();
    var f = $('formUsername');
    var v = f.elements.username.value.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(v)) {
      note('Username 3-20 karakter: huruf kecil, angka, titik, atau garis bawah.', true);
      return;
    }
    var b = $('btnSimpanUsername');
    b.disabled = true;
    sb.rpc('atur_profil_papan', { p_username: v, p_avatar: null }).then(function (r) {
      b.disabled = false;
      if (r.error) { note((r.error.message || 'Username belum tersimpan.'), true); return; }
      f.classList.add('hidden');
      note('Username sudah disimpan.');
      muat();
    });
  }

  /* ---------- Inisialisasi ---------- */
  function init(client, u) {
    sb = client;
    user = u;
    emailSaya = ((u && u.email) || '').toLowerCase();
    $('btnKlaim').addEventListener('click', klaim);
    bindAdmin();
    bindKeluar();
    bindGanti();
    $('btnFoto').addEventListener('click', bukaPilihan);
    $('btnEditUsername').addEventListener('click', bukaUsername);
    $('btnBatalUsername').addEventListener('click', function () { $('formUsername').classList.add('hidden'); });
    $('formUsername').addEventListener('submit', simpanUsername);
    pasangAvatar(u);
    muat();
  }

  window.MTO_MAHKOTA = { init: init, pasangAvatar: pasangAvatar };
})();
