// Vercel Routing Middleware: runs before anything under /admin is served, so
// a visitor without a valid session never receives the dashboard pages at all.
// The admin APIs check the session themselves as well (api/_auth.js) — this
// guards the pages, not the data.
//
// Edge runtime twin of verify() in api/_auth.js. Keep the two in step: same
// token format, same signing key, same minimum lengths.
export const config = { matcher: ['/admin', '/admin/:path*'] };

const COOKIE = 'fxm_admin';

function b64urlFromBytes(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToString(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64 + '==='.slice((b64.length + 3) % 4));
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function isValidSession(token) {
  const pw = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  if (pw.length < 12 || secret.length < 32 || !token) return false;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(`${secret}:${pw}`),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const expected = b64urlFromBytes(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  if (!sameString(expected, sig)) return false;

  try {
    const { exp } = JSON.parse(b64urlToString(payload));
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (m && await isValidSession(decodeURIComponent(m[1]))) return; // let it through

  const url = new URL(request.url);
  const login = new URL('/login', url);
  login.searchParams.set('next', url.pathname);
  return new Response(null, {
    status: 307,
    headers: { Location: login.toString(), 'Cache-Control': 'no-store' },
  });
}
