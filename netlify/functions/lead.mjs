import { createHash } from 'node:crypto';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'json' }, 400); }

  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return json({ ok: true, capi: 'desligada' });

  const name = String(body.name || '').trim().toLowerCase();
  let phone = String(body.phone || '').replace(/\D/g, '');
  if (phone && !phone.startsWith('55')) phone = '55' + phone;

  const user_data = {};
  if (phone) user_data.ph = [sha(phone)];
  if (name) {
    const parts = name.split(/\s+/);
    user_data.fn = [sha(parts[0])];
    if (parts.length > 1) user_data.ln = [sha(parts[parts.length - 1])];
  }
  if (body.fbp) user_data.fbp = String(body.fbp);
  if (body.fbc) user_data.fbc = String(body.fbc);
  const ip = (req.headers.get('x-nf-client-connection-ip') || '').trim();
  if (ip) user_data.client_ip_address = ip;
  const ua = req.headers.get('user-agent');
  if (ua) user_data.client_user_agent = ua;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id ? String(body.event_id) : undefined,
      action_source: 'website',
      event_source_url: body.url ? String(body.url) : undefined,
      user_data,
    }],
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  const ver = process.env.META_GRAPH_VERSION || 'v23.0';
  try {
    const r = await fetch(
      `https://graph.facebook.com/${ver}/${encodeURIComponent(pixel)}/events?access_token=${encodeURIComponent(token)}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }
    );
    return json({ ok: r.ok, capi: r.ok ? 'enviada' : 'erro', status: r.status });
  } catch {
    return json({ ok: false, capi: 'erro' }, 502);
  }
};

export const config = { path: '/api/lead' };
