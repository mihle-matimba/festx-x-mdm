const TICKET_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeTicketId() {
  let id = 'FXM-';
  for (let i = 0; i < 6; i++) id += TICKET_CHARS[Math.floor(Math.random() * TICKET_CHARS.length)];
  return id;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return res.status(500).json({ error: 'Server is not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const full_name = String(body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const attendance_mode = body.attendance_mode === 'replay' ? 'replay' : 'live';

  if (!full_name || !email) {
    return res.status(400).json({ error: 'Full name and email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  const insertUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/registrations`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const ticket_id = makeTicketId();
    let resp;
    try {
      resp = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify([{ full_name, email, phone: phone || null, attendance_mode, ticket_id }]),
      });
    } catch (err) {
      console.error('Supabase request failed', err);
      return res.status(502).json({ error: 'Could not save your registration. Please try again.' });
    }

    if (resp.ok) {
      const rows = await resp.json();
      const row = rows[0];
      return res.status(201).json({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        attendance_mode: row.attendance_mode,
        ticket_id: row.ticket_id,
        registered_at: row.registered_at,
      });
    }

    const errText = await resp.text();
    if (resp.status === 409) {
      if (errText.includes('email')) {
        return res.status(409).json({ error: "You're already registered — check your inbox for your ticket." });
      }
      if (errText.includes('ticket_id') && attempt < 4) continue;
    }
    console.error('Supabase insert failed', resp.status, errText);
    return res.status(502).json({ error: 'Could not save your registration. Please try again.' });
  }

  return res.status(502).json({ error: 'Could not save your registration. Please try again.' });
};
