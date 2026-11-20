// Pemeriksaan UI otomatis: mendeteksi error JavaScript, scroll horizontal, elemen keluar layar,
// dan teks yang terpotong, pada lebar HP (390 px) dan desktop (1280 px).
// Pemakaian (server lokal berjalan di port 8765 dari folder repo):
//   NODE_PATH=$(npm root -g) node tests/ui-cek.cjs
// Keluar dengan kode 1 bila ada masalah.
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:8765/';
const LEBAR = [390, 1280];
// [halaman, email login simulasi (atau null), apakah perlu sesi]
const HALAMAN = [
  ['index.html', null],
  ['pembayaran.html', null],
  ['profil.html', 'orang.uji@gmail.com'],
  ['admin.html', 'abdulaziez.nashir@gmail.com'],
  ['admin.html', 'azieznashir@gmail.com'],
];

// Stub Supabase: sesi dari email, RPC kosong. Cukup untuk memeriksa tampilan kerangka halaman.
const STUB = `window.supabase = { createClient: function () {
  var ok = function (d) { return Promise.resolve({ data: d === undefined ? [] : d, error: null }); };
  var q = { select: function () { return q; }, eq: function () { return q; }, order: function () { return q; }, limit: function () { return q; }, gte: function () { return q; }, lte: function () { return q; }, in: function () { return q; }, single: function () { return ok(null); }, maybeSingle: function () { return ok(null); }, then: function (f, r) { return ok([]).then(f, r); } };
  return {
    auth: {
      getSession: function () { var e = window.__EMAIL; return Promise.resolve({ data: { session: e ? { user: { email: e } } : null } }); },
      getUser: function () { var e = window.__EMAIL; return Promise.resolve({ data: { user: e ? { email: e } : null }, error: null }); },
      onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
      signOut: function () { return ok(null); }, updateUser: function () { return ok({}); }
    },
    rpc: function () { return ok([]); },
    from: function () { return q; },
    storage: { from: function () { return { upload: function () { return ok({}); }, getPublicUrl: function () { return { data: { publicUrl: '' } }; }, createSignedUrl: function () { return ok({ signedUrl: '' }); } }; } },
    channel: function () { var c = { on: function () { return c; }, subscribe: function () { return c; } }; return c; },
    removeChannel: function () {}
  };
} };`;

// Dijalankan di dalam halaman: kumpulkan masalah tampilan.
const PERIKSA = () => {
  const masalah = [];
  const lebarLayar = window.innerWidth;
  const de = document.documentElement;
  if (de.scrollWidth > lebarLayar + 1) {
    masalah.push('Scroll horizontal: lebar halaman ' + de.scrollWidth + 'px > layar ' + lebarLayar + 'px');
  }
  const dalamWadahGeser = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
    }
    return false;
  };
  const nama = (el) => {
    const id = el.id ? '#' + el.id : '';
    const kelas = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + id + kelas;
  };
  let keluar = 0, terpotong = 0;
  document.querySelectorAll('body *').forEach((el) => {
    const gaya = getComputedStyle(el);
    if (gaya.display === 'none' || gaya.visibility === 'hidden') return;
    if (el.closest('[hidden]')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    // Elemen yang sengaja di luar layar (tautan lompat untuk pembaca layar) tidak dihitung.
    if (r.left <= -9000) return;
    if (keluar < 5 && (r.right > lebarLayar + 1 || r.left < -1) && !dalamWadahGeser(el)) {
      keluar++;
      masalah.push('Keluar dari layar: ' + nama(el) + ' kiri ' + Math.round(r.left) + ' kanan ' + Math.round(r.right));
    }
    if (terpotong < 5 && el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 &&
        (gaya.overflow === 'hidden' || gaya.textOverflow === 'ellipsis') && gaya.whiteSpace === 'nowrap') {
      terpotong++;
      masalah.push('Teks terpotong: ' + nama(el) + ' "' + el.textContent.trim().slice(0, 40) + '"');
    }
  });
  return masalah;
};

(async () => {
  const browser = await chromium.launch();
  let adaMasalah = false;
  for (const [halaman, email] of HALAMAN) {
    for (const lebar of LEBAR) {
      const ctx = await browser.newContext({ viewport: { width: lebar, height: 844 } });
      await ctx.route(/fonts\.g(oogleapis|static)\.com/, (r) => r.abort());
      await ctx.route(/cdn\.jsdelivr\.net/, (r) => r.fulfill({ contentType: 'application/javascript', body: STUB }));
      await ctx.addInitScript((e) => { window.__EMAIL = e; }, email);
      const page = await ctx.newPage();
      const galat = [];
      page.on('pageerror', (x) => galat.push('Error JavaScript: ' + x.message.slice(0, 160)));
      page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) galat.push('Console: ' + m.text().slice(0, 160)); });
      await page.goto(BASE + halaman, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const temuan = galat.concat(await page.evaluate(PERIKSA));
      const label = halaman + (email ? ' [' + email + ']' : '') + ' @' + lebar + 'px';
      if (temuan.length) {
        adaMasalah = true;
        console.log('GAGAL ' + label);
        temuan.forEach((t) => console.log('   - ' + t));
      } else {
        console.log('LOLOS ' + label);
      }
      await ctx.close();
    }
  }
  await browser.close();
  process.exit(adaMasalah ? 1 : 0);
})();
