const { EVENTS, capacityFor } = require('./_rsvp-events');

// Rows already booked for a city, via PostgREST's exact count header.
async function countFor(base, key, city) {
  const resp = await fetch(`${base}/rest/v1/rsvps?select=id&city=eq.${encodeURIComponent(city)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact', Range: '0-0' },
  });
  if (!resp.ok) throw new Error(`count failed ${resp.status}: ${await resp.text()}`);
  return parseInt((resp.headers.get('content-range') || '').split('/')[1], 10) || 0;
}

module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return res.status(500).json({ error: 'Server is not configured' });
  }
  const base = SUPABASE_URL.replace(/\/$/, '');

  // GET ?city=johannesburg → whether RSVPs are still open. Deliberately
  // returns no counts: the page never shows how many spots are left.
  if (req.method === 'GET') {
    const city = String(req.query.city || '').toLowerCase();
    const event = EVENTS[city];
    if (!event) return res.status(404).json({ error: 'Unknown city' });

    const capacity = capacityFor(event);
    res.setHeader('Cache-Control', 'no-store');
    if (capacity === null) return res.status(200).json({ city, full: false });
    try {
      const booked = await countFor(base, SERVICE_KEY, city);
      return res.status(200).json({ city, full: booked >= capacity });
    } catch (err) {
      console.error('RSVP status check failed', err);
      return res.status(502).json({ error: 'Could not check availability' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const city = String(body.city || '').toLowerCase();
  const event = EVENTS[city];
  const full_name = String(body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();

  if (!event) return res.status(400).json({ error: 'RSVPs are not open for that city' });
  if (!full_name || !email) return res.status(400).json({ error: 'Full name and email are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  // Count-then-insert isn't atomic, so two people hitting the very last spot
  // at the same moment can both get in. Acceptable slack for an event RSVP.
  const capacity = capacityFor(event);
  if (capacity !== null) {
    try {
      if (await countFor(base, SERVICE_KEY, city) >= capacity) {
        return res.status(409).json({ error: `${event.name} is fully booked.`, full: true });
      }
    } catch (err) {
      console.error('RSVP capacity check failed', err);
      return res.status(502).json({ error: 'Could not save your RSVP. Please try again.' });
    }
  }

  let resp;
  try {
    resp = await fetch(`${base}/rest/v1/rsvps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify([{ city, full_name, email, phone: phone || null }]),
    });
  } catch (err) {
    console.error('Supabase request failed', err);
    return res.status(502).json({ error: 'Could not save your RSVP. Please try again.' });
  }

  if (resp.ok) {
    const [row] = await resp.json();
    return res.status(201).json({ city: row.city, full_name: row.full_name, email: row.email });
  }

  const errText = await resp.text();
  if (resp.status === 409) {
    return res.status(409).json({ error: `You've already RSVP'd for ${event.name} with this email.` });
  }
  console.error('Supabase RSVP insert failed', resp.status, errText);
  return res.status(502).json({ error: 'Could not save your RSVP. Please try again.' });
};
