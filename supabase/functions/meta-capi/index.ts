// Meta Conversions API relay untuk Pixel 124403919300787
// Token dibaca dari secret META_CAPI_TOKEN dan tidak pernah dikirim balik ke klien.

const PIXEL_ID = '124403919300787';
const GRAPH_VERSION = 'v21.0';
const ALLOWED_EVENTS = new Set(['Lead', 'Contact', 'CompleteRegistration', 'ViewContent', 'InitiateCheckout', 'PageView']);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normEmail(v: unknown): string {
  const e = String(v ?? '').trim().toLowerCase();
  return e.includes('@') && e.length <= 254 ? e : '';
}

function normPhone(v: unknown): string {
  let d = String(v ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 8 && d.length <= 16 ? d : '';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const eventName = String(b.event_name ?? '');
  if (!ALLOWED_EVENTS.has(eventName)) {
    return json({ ok: false, error: 'event_not_allowed' }, 400);
  }

  const eventId = String(b.event_id ?? '');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(eventId)) {
    return json({ ok: false, error: 'invalid_event_id' }, 400);
  }

  const token = Deno.env.get('META_CAPI_TOKEN');
  if (!token) {
    console.error('META_CAPI_TOKEN belum diset');
    return json({ ok: false, error: 'server_not_configured' }, 500);
  }

  const userData: Record<string, unknown> = {};

  const em = normEmail(b.email);
  if (em) userData.em = [await sha256(em)];

  const ph = normPhone(b.phone);
  if (ph) userData.ph = [await sha256(ph)];

  const fbp = String(b.fbp ?? '');
  if (/^fb\.[0-9]\.[0-9]+\.[0-9]+$/.test(fbp)) userData.fbp = fbp;

  const fbc = String(b.fbc ?? '');
  if (/^fb\.[0-9]\.[0-9]+\..{1,300}$/.test(fbc)) userData.fbc = fbc;

  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '';
  if (ip) userData.client_ip_address = ip;

  const ua = req.headers.get('user-agent') ?? '';
  if (ua) userData.client_user_agent = ua.slice(0, 500);

  const sourceUrl = String(b.event_source_url ?? '').slice(0, 500);

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    user_data: userData,
  };
  if (sourceUrl) event.event_source_url = sourceUrl;

  const cd = b.custom_data as Record<string, unknown> | undefined;
  if (cd && typeof cd === 'object' && cd.content_name) {
    event.custom_data = { content_name: String(cd.content_name).slice(0, 100) };
  }

  // Kode uji hanya diterima dengan format TESTxxxxx dari Events Manager
  const tc = typeof b.test_event_code === 'string' ? b.test_event_code : '';
  const testCode = /^TEST[0-9]{3,10}$/.test(tc) ? tc : '';

  try {
    const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [event],
        access_token: token,
        ...(testCode ? { test_event_code: testCode } : {}),
      }),
    });
    const res = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok) {
      const err = res.error as Record<string, unknown> | undefined;
      console.error('Meta CAPI gagal', r.status, err?.message ?? '');
      return json({ ok: false, error: 'meta_rejected', status: r.status }, 502);
    }
    return json({
      ok: true,
      events_received: res.events_received ?? 0,
      fbtrace_id: res.fbtrace_id ?? null,
    });
  } catch (e) {
    console.error('Meta CAPI network error', String(e));
    return json({ ok: false, error: 'network' }, 502);
  }
});
