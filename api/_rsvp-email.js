// RSVP confirmation email, sent through Resend. The leading underscore keeps
// Vercel from exposing this file as an endpoint of its own.
//
// Needs RESEND_API_KEY and RSVP_EMAIL_FROM (a sender on a domain verified in
// Resend, e.g. "FestX × MDM <tour@yourdomain.com>"). If either is missing the
// email is skipped and the RSVP still goes through.

const FESTX_LOGO = 'https://yscggkgvxfjvfmnulrcy.supabase.co/storage/v1/object/public/images/festxlogo.png';
const MDM_LOGO = 'https://yscggkgvxfjvfmnulrcy.supabase.co/storage/v1/object/public/Media/MDM%20loogo-06.png';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function render(event, fullName) {
  const first = fullName.split(/\s+/)[0] || 'there';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapQuery)}`;
  const when = event.time ? `${event.date} · ${event.time}` : event.date;

  const timeRow = event.time
    ? `<tr><td style="padding:6px 0;color:#a39a97;">Time</td><td style="padding:6px 0;font-weight:700;">${esc(event.time)}</td></tr>`
    : '';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark only">
<meta name="supported-color-schemes" content="dark only"><title>You're on the list</title><style>
  :root{color-scheme:dark;supported-color-schemes:dark;}
  body{background:#030303 !important;}
  @media (prefers-color-scheme:dark){
    body,.pg{background:#030303 !important;}
  }
  /* Outlook.com / Outlook app dark-mode overrides: pin every colour to what we set. */
  [data-ogsb] body,[data-ogsb] [bgcolor="#030303"]{background-color:#030303 !important;}
  [data-ogsb] [bgcolor="#14121f"]{background-color:#14121f !important;}
  [data-ogsb] [style*="background:#0d0b0c"]{background-color:#0d0b0c !important;}
  [data-ogsc] [style*="color:#f6f3f2"]{color:#f6f3f2 !important;}
  [data-ogsc] [style*="color:#c9c1be"]{color:#c9c1be !important;}
  [data-ogsc] [style*="color:#a39a97"]{color:#a39a97 !important;}
  [data-ogsc] [style*="color:#f2503d"]{color:#f2503d !important;}
  [data-ogsc] [style*="color:#b096e8"]{color:#b096e8 !important;}
  [data-ogsc] [style*="color:#ffffff"]{color:#ffffff !important;}
</style>
</head>
<body bgcolor="#030303" style="margin:0;padding:0;background:#030303;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#030303;">${esc(when)} · ${esc(event.venue)}. Your spot for ${esc(event.name)} is confirmed.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#030303" style="background:#030303;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:Arial,Helvetica,sans-serif;color:#f6f3f2;">
  <tr><td align="center" style="padding:10px 0 26px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;"><tr>
      <td align="center" valign="middle" width="130" style="width:130px;"><img src="${FESTX_LOGO}" alt="FestX" width="130" style="display:block;width:130px;height:auto;border:0;"></td>
      <td align="center" valign="middle" style="padding:0 18px;font-size:22px;font-weight:800;color:#a39a97;line-height:1;">&times;</td>
      <td align="center" valign="middle" width="84" style="width:84px;"><img src="${MDM_LOGO}" alt="MDM" width="84" style="display:block;width:84px;height:auto;border:0;"></td>
    </tr></table>
  </td></tr>
  <tr><td align="center" style="padding:0 16px;">
    <div style="font-family:Consolas,monospace;font-size:12px;font-weight:700;letter-spacing:.14em;color:#f2503d;">&#9679; RSVP CONFIRMED</div>
    <h1 style="margin:14px 0 0;font-size:40px;line-height:1.1;font-weight:800;letter-spacing:-.02em;color:#f6f3f2;">You're on the list,<br><span style="color:#b096e8;">${esc(first)}.</span></h1>
  </td></tr>
  <tr><td style="padding:22px 16px 26px;font-size:16px;line-height:1.65;color:#c9c1be;">
    <p style="margin:0 0 14px;">Your spot for <b style="color:#f6f3f2;">${esc(event.name)}</b> is locked in. FestX and MDM are coming to you, and we can't wait to see you in the room.</p>
    <p style="margin:0;">Save the details below and tell your people.</p>
  </td></tr>
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#14121f" style="background:#14121f;background-image:linear-gradient(#14121f,#14121f);border:1px solid rgba(150,120,220,.3);border-radius:18px;">
      <tr><td style="padding:22px 26px;">
        <div style="font-family:Consolas,monospace;font-size:12px;font-weight:700;letter-spacing:.14em;color:#b096e8;margin-bottom:12px;">THE DETAILS</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:16px;line-height:1.5;color:#f6f3f2;">
          <tr><td width="80" style="padding:6px 0;color:#a39a97;">City</td><td style="padding:6px 0;font-weight:700;">${esc(event.name)}</td></tr>
          <tr><td style="padding:6px 0;color:#a39a97;">Date</td><td style="padding:6px 0;font-weight:700;">${esc(event.date)}</td></tr>
          ${timeRow}
          <tr><td style="padding:6px 0;color:#a39a97;">Venue</td><td style="padding:6px 0;font-weight:700;">${esc(event.venue)}</td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:28px 0 0;">
    <a href="${mapUrl}" style="display:inline-block;background:#f2503d;background-image:linear-gradient(135deg,#f2503d,#c73824);color:#ffffff;font-size:17px;font-weight:800;text-decoration:none;padding:16px 38px;border-radius:999px;">Get directions &rarr;</a>
  </td></tr>
  <tr><td style="padding:28px 16px;font-size:16px;line-height:1.6;color:#c9c1be;">
    See you there,<br><b style="color:#f6f3f2;">The FestX <span style="color:#a39a97;">&times;</span> MDM team</b>
  </td></tr>
  <tr><td align="center" style="padding:20px 16px 8px;border-top:1px solid rgba(255,255,255,.1);font-size:12px;line-height:1.7;color:#a39a97;">
    <a href="https://www.tradewithfestx.com/" style="color:#a39a97;">tradewithfestx.com</a> &nbsp;&bull;&nbsp; <a href="https://www.mdmtraders.com/" style="color:#a39a97;">mdmtraders.com</a><br>
    You're getting this because you RSVP'd for the ${esc(event.name)} tour stop.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    `You're on the list, ${first}.`,
    '',
    `Your spot for ${event.name} is locked in. FestX and MDM are coming to you, and we can't wait to see you in the room.`,
    '',
    'THE DETAILS',
    `City:  ${event.name}`,
    `Date:  ${event.date}`,
    ...(event.time ? [`Time:  ${event.time}`] : []),
    `Venue: ${event.venue}`,
    `Map:   ${mapUrl}`,
    '',
    'See you there,',
    'The FestX × MDM team',
  ].join('\n');

  return { html, text };
}

async function sendRsvpConfirmation({ event, full_name, email }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RSVP_EMAIL_FROM;
  if (!key || !from) {
    console.error('RSVP confirmation skipped: RESEND_API_KEY or RSVP_EMAIL_FROM not set');
    return;
  }
  try {
    const { html, text } = render(event, full_name);
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `You're on the list for ${event.name} 🔥`,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) console.error('RSVP confirmation failed', resp.status, await resp.text());
  } catch (err) {
    console.error('RSVP confirmation failed', err);
  }
}

module.exports = { sendRsvpConfirmation };
