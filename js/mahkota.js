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
        '<div class="mr-bawah"><small>' + n + ' / 15 pertemuan</small>' +
        '<button type="button" class="mr-btn" data-catat="' + esc(m.email) + '" data-nama="' + esc(m.nama || m.email) + '"' + (penuh ? ' disabled' : '') + '>' + (penuh ? 'Lengkap' : 'Catat Pertemuan') + '</button></div>' +
        '</div>';
    }).join('');
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
      muatMurid();
      pasangJadwalEvents();
      muatJadwal();
    }
  }
  var pengajarEvents = false;
  function pasangPengajarEvents() {
    if (pengajarEvents) return;
    pengajarEvents = true;
    $('muridList').addEventListener('click', function (e) {
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
  function renderJadwal(d) {
    var chips = $('jadwalChips'), sesiEl = $('sesiList'), sel = $('sMurid');
    if (!chips || !sesiEl || !sel) return;
    var jadwal = (d && d.jadwal) || [], sesi = (d && d.sesi) || [], murid = (d && d.murid) || [];
    chips.innerHTML = jadwal.length
      ? jadwal.map(function (j) {
          return '<span class="pj-chip">' + esc(HARI_NAMA[j.hari]) + ' ' + esc(j.jam) +
            ' <button type="button" data-hapus="' + j.id + '" aria-label="Hapus">×</button></span>';
        }).join('')
      : '<p class="mr-kosong">Belum ada jadwal kosong.</p>';
    sesiEl.innerHTML = sesi.length
      ? sesi.map(function (x) {
          return '<div class="pj-sesi"><b>' + esc(x.murid || x.peserta_email) + '</b><small>' + esc(tglJamWib(x.mulai)) + ' · ' + esc(x.status) + '</small></div>';
        }).join('')
      : '<p class="mr-kosong">Belum ada sesi yang dijadwalkan.</p>';
    sel.innerHTML = murid.length
      ? murid.map(function (m) { return '<option value="' + esc(m.email) + '">' + esc(m.nama || m.email) + '</option>'; }).join('')
      : '<option value="">Belum ada murid</option>';
  }
  function muatJadwal() {
    sb.rpc('jadwal_saya').then(function (r) {
      if (r.error) { $('jadwalChips').innerHTML = '<p class="mr-kosong">Jadwal belum bisa dimuat.</p>'; return; }
      renderJadwal(r.data || {});
    });
  }
  var jadwalEvents = false;
  function pasangJadwalEvents() {
    if (jadwalEvents) return;
    jadwalEvents = true;
    $('jTambah').addEventListener('click', function () {
      sb.rpc('tambah_jadwal_kosong', { p_hari: Number($('jHari').value), p_jam: $('jJam').value }).then(function (r) {
        if (r.error) window.alert(r.error.message || 'Jadwal belum bisa ditambah.');
        muatJadwal();
      });
    });
    $('jadwalChips').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-hapus]');
      if (!b) return;
      if (!window.confirm('Hapus jadwal kosong ini?')) return;
      sb.rpc('hapus_jadwal_kosong', { p_id: Number(b.getAttribute('data-hapus')) }).then(muatJadwal);
    });
    $('sBuat').addEventListener('click', function () {
      var murid = $('sMurid').value, waktu = $('sWaktu').value;
      if (!murid || !waktu) { window.alert('Pilih murid dan waktu sesi terlebih dahulu.'); return; }
      sb.rpc('buat_sesi', { p_peserta: murid, p_mulai: waktu + ':00+07:00' }).then(function (r) {
        if (r.error) window.alert(r.error.message || 'Sesi belum bisa dibuat.');
        else { $('sWaktu').value = ''; }
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
    var awal = b.join('\n');
    return p.ringkasan ? awal + '\n\n' + p.ringkasan : awal;
  }
  function tampilAdmin(list) {
    var box = $('adminBox');
    if (!box) return;
    daftarAdmin = list;
    box.hidden = false;
    if (!list.length) { $('adminList').innerHTML = '<p class="pd-sub">Belum ada pendaftar.</p>'; return; }
    $('adminList').innerHTML = list.map(function (p, i) {
      var baris = [
        ['Email', p.email], ['WhatsApp', '+' + p.wa],
        ['Jenis kelamin', p.jenis_kelamin || '-'],
        ['Tanggal lahir', p.tanggal_lahir ? tglLahir(p.tanggal_lahir) : '-'],
        ['Kota/Negara', p.kota || '-'], ['Kelas', p.kelas || '-'],
        ['Durasi', p.durasi ? p.durasi + ' bulan' : '-'],
        ['Peserta', p.peserta || '-'], ['Total', rupiahAdm(p.total)],
        ['Batas bayar', tglJam(p.batas_bayar)],
        ['Bukti transfer', p.bukti_at ? tglJam(p.bukti_at) : 'Belum ada']
      ].map(function (r) {
        return '<div class="pd-baris"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
      }).join('');
      var owner = emailSaya === OWNER;
      var aksi = '<button type="button" data-salin="' + i + '">Salin untuk WhatsApp</button>' +
        (p.bukti_path ? '<button type="button" data-bukti="' + i + '">Lihat bukti</button>' : '') +
        (owner && p.status === 'menunggu_verifikasi' ? '<button type="button" class="utama" data-terima="' + p.id + '">Konfirmasi pembayaran</button>' : '');
      var jadwal = owner ? '<div class="pd-jadwal">' +
        '<label>Mulai halaqah<input type="date" data-tglhalaqah="' + p.id + '" value="' + esc(p.tanggal_halaqah || '') + '"></label>' +
        '<label>Link grup<input type="url" data-linkgrup="' + p.id + '" placeholder="https://chat.whatsapp.com/..." value="' + esc(p.link_grup || '') + '"></label>' +
        '<button type="button" data-jadwal="' + p.id + '">Simpan jadwal</button></div>' : '';
      return '<div class="pd-item"><b>' + esc(p.nama) + '</b>' +
        '<small>' + esc(LABEL_STATUS[p.status] || p.status) + '</small>' +
        '<div class="pd-detail">' + baris + '</div>' +
        '<div class="pd-aksi">' + aksi + '</div>' + jadwal + '</div>';
    }).join('');
  }
  function bindAdmin() {
    var box = $('adminList');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.salin !== undefined) {
        var p = daftarAdmin[Number(t.dataset.salin)];
        if (!navigator.clipboard || !p) return;
        navigator.clipboard.writeText(teksWa(p)).then(function () {
          t.textContent = 'Tersalin';
          setTimeout(function () { t.textContent = 'Salin untuk WhatsApp'; }, 1500);
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
      if (t.dataset.terima !== undefined && sb) {
        sb.rpc('ubah_status_pendaftaran', { p_id: Number(t.dataset.terima), p_status: 'diterima' }).then(function (r) {
          if (r.error) { note('Pembayaran belum bisa dikonfirmasi. Coba lagi.', true); return; }
          note('Pembayaran dikonfirmasi.');
          muat();
        });
      }
      if (t.dataset.jadwal !== undefined && sb) {
        var id = t.dataset.jadwal;
        var tg = box.querySelector('[data-tglhalaqah="' + id + '"]').value || null;
        var lk = box.querySelector('[data-linkgrup="' + id + '"]').value || null;
        sb.rpc('atur_halaqah', { p_id: Number(id), p_tanggal: tg, p_link: lk }).then(function (r) {
          if (r.error) { note('Jadwal belum tersimpan. Coba lagi.', true); return; }
          note('Jadwal halaqah tersimpan.');
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
    blok.hidden = false; status.hidden = false; meta.hidden = false; kaki.hidden = false;
    var kondisi = tglMulaiISO && tglMulaiISO > hariIniJakarta() ? 'belum'
      : (pertemuanSelesai !== null && pertemuanSelesai >= 15 ? 'selesai' : 'berjalan');
    var label = { belum: 'Menunggu Dimulai', berjalan: 'Sedang Berjalan', selesai: 'Selesai' }[kondisi];
    status.textContent = label;
    status.className = 'pk-status pk-' + kondisi;
    meta.textContent = paketKey
      ? 'Sesi ' + MENIT_SESI[paketKey] + ' menit • Weekdays • 15 kali pertemuan'
      : 'Weekdays • 15 kali pertemuan';
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
      blok.className = 'pk-blok pk-hijau';
      blok.innerHTML = '<div><span class="pk-label">Sisa Waktu</span><b class="pk-nilai">–</b></div>' +
        '<div><span class="pk-label">Pertemuan</span><b class="pk-nilai">' + (pertemuanSelesai === null ? '–' : pertemuanSelesai) + ' / 15</b></div>';
    } else {
      blok.className = 'pk-blok';
      blok.innerHTML = '<b class="pk-nilai">Program telah selesai</b><span class="pk-label">15 / 15 pertemuan</span>';
    }
    kaki.innerHTML = '<span class="pk-pengajar">' + esc(pengampuNama || 'Belum ada pengajar') + '</span>' +
      '<button type="button" class="pk-ganti" disabled>Ganti Pengajar</button>';
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
    $('btnFoto').addEventListener('click', bukaPilihan);
    $('btnEditUsername').addEventListener('click', bukaUsername);
    $('btnBatalUsername').addEventListener('click', function () { $('formUsername').classList.add('hidden'); });
    $('formUsername').addEventListener('submit', simpanUsername);
    pasangAvatar(u);
    muat();
  }

  window.MTO_MAHKOTA = { init: init, pasangAvatar: pasangAvatar };
})();
