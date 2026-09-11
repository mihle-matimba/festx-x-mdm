// Admin session helpers for the Node API functions. middleware.js carries an
// edge-runtime twin of verify(); the token format must stay identical.
//
// Token: base64url(JSON {exp}) + "." + base64url(HMAC-SHA256(key, payload)).
// The key mixes the session secret with the password, so changing
// ADMIN_PASSWORD (or rotating ADMIN_SESSION_SECRET) logs everyone out.
const crypto = require('crypto');

const COOKIE = 'fxm_admin';
const SESSION_SECONDS = 12 * 60 * 60;
const MIN_PASSWORD = 12;
const MIN_SECRET = 32;

// Refuse to run with weak or missing settings rather than fall back to
// something guessable. Returns an error string, or null when all is well.
function configError() {
  const pw = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  if (!pw || !secret) return 'Admin login is not configured (set ADMIN_PASSWORD and ADMIN_SESSION_SECRET)';
  if (pw.length < MIN_PASSWORD) return `ADMIN_PASSWORD must be at least ${MIN_PASSWORD} characters`;
  if (secret.length < MIN_SECRET) return `ADMIN_SESSION_SECRET must be at least ${MIN_SECRET} characters`;
  return null;
}

const signingKey = () => `${process.env.ADMIN_SESSION_SECRET}:${process.env.ADMIN_PASSWORD}`;
const sign = payload => crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');

// Hash both sides first so the comparison is constant-time regardless of length.
function checkPassword(input) {
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || '').digest();
  return crypto.timingSafeEqual(a, b);
}

function issue() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verify(token) {
  if (configError() || !token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function readCookie(req) {
  const header = req.headers.cookie || '';
  const m = header.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : '';
}

// Secure is skipped only for plain-http localhost, where browsers would
// otherwise drop the cookie in some setups. Production is always https.
function cookieFor(req, value, maxAge) {
  const host = String(req.headers.host || '');
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return [
    `${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAge}`,
    local ? null : 'Secure',
  ].filter(Boolean).join('; ');
}

// Use at the top of every admin handler: `if (!requireAdmin(req, res)) return;`
function requireAdmin(req, res) {
  const err = configError();
  if (err) {
    console.error(err);
    res.status(500).json({ error: 'Admin login is not configured' });
    return false;
  }
  if (!verify(readCookie(req))) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { COOKIE, SESSION_SECONDS, configError, checkPassword, issue, verify, readCookie, cookieFor, requireAdmin };
