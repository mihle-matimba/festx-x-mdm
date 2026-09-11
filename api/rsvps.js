const { EVENTS, capacityFor } = require('./_rsvp-events');
const { requireAdmin } = require('./_auth');

module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return res.status(500).json({ error: 'Server is not configured' });
  }

  if (!requireAdmin(req, res)) return;

  const base = SUPABASE_URL.replace(/\/$/, '');

  if (req.method === 'GET') {
    const resp = await fetch(`${base}/rest/v1/rsvps?select=*&order=created_at.desc`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!resp.ok) {
      console.error('Supabase RSVP list failed', resp.status, await resp.text());
      return res.status(502).json({ error: 'Could not load RSVPs' });
    }
    // Capacity rides along so the dashboard can show the cap per city.
    const events = Object.fromEntries(
      Object.entries(EVENTS).map(([city, ev]) => [city, { name: ev.name, capacity: capacityFor(ev) }])
    );
    return res.status(200).json({ rsvps: await resp.json(), events });
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const resp = await fetch(`${base}/rest/v1/rsvps?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!resp.ok) {
      console.error('Supabase RSVP delete failed', resp.status, await resp.text());
      return res.status(502).json({ error: 'Could not delete RSVP' });
    }
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
