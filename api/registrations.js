module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return res.status(500).json({ error: 'Server is not configured' });
  }

  if (ADMIN_TOKEN) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const base = SUPABASE_URL.replace(/\/$/, '');

  if (req.method === 'GET') {
    const url = `${base}/rest/v1/registrations?select=*&order=registered_at.desc`;
    const resp = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!resp.ok) {
      console.error('Supabase list failed', resp.status, await resp.text());
      return res.status(502).json({ error: 'Could not load registrations' });
    }
    return res.status(200).json(await resp.json());
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const url = `${base}/rest/v1/registrations?id=eq.${encodeURIComponent(id)}`;
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!resp.ok) {
      console.error('Supabase delete failed', resp.status, await resp.text());
      return res.status(502).json({ error: 'Could not delete registration' });
    }
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
