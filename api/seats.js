const CAPACITY = 1000;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/registrations?select=id`;
  let resp;
  try {
    resp = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'count=exact',
        Range: '0-0',
      },
    });
  } catch (err) {
    console.error('Supabase count request failed', err);
    return res.status(502).json({ error: 'Could not load seat count' });
  }

  if (!resp.ok) {
    console.error('Supabase count failed', resp.status, await resp.text());
    return res.status(502).json({ error: 'Could not load seat count' });
  }

  const contentRange = resp.headers.get('content-range') || '';
  const registered = parseInt(contentRange.split('/')[1], 10) || 0;
  const remaining = Math.max(CAPACITY - registered, 0);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ capacity: CAPACITY, registered, remaining });
};
