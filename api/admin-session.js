const auth = require('./_auth');

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // GET → is this browser signed in? Used by the login page to skip the form.
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: !auth.configError() && auth.verify(auth.readCookie(req)) });
  }

  // DELETE → log out.
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', auth.cookieFor(req, '', 0));
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const err = auth.configError();
  if (err) {
    console.error(err);
    return res.status(500).json({ error: 'Admin login is not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  if (!auth.checkPassword((body || {}).password)) {
    // No rate-limit store on serverless, so slow each wrong guess instead.
    // With a long random password this makes guessing hopeless.
    await sleep(800);
    return res.status(401).json({ error: 'Wrong password.' });
  }

  res.setHeader('Set-Cookie', auth.cookieFor(req, auth.issue(), auth.SESSION_SECONDS));
  return res.status(204).end();
};
