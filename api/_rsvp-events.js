// Shared by /api/rsvp and /api/rsvps. The leading underscore keeps Vercel from
// exposing this file as an endpoint of its own.
//
// date/time/venue/mapQuery feed the RSVP confirmation email (_rsvp-email.js);
// keep them in step with the tour cards in index.html.
//
// To open RSVPs for another stop, add it here and put the RSVP section on the
// page. Capacity comes from an env var so it can change without a code edit.
const EVENTS = {
  johannesburg: {
    name: 'Johannesburg',
    date: 'Saturday, 26 September',
    time: '11am',
    venue: 'Apollo Hotel',
    mapQuery: 'Apollo Hotel Johannesburg',
    capacityEnv: 'RSVP_CAPACITY_JOHANNESBURG',
  },
  durban: {
    name: 'Durban',
    date: 'Saturday, 31 October',
    time: '11am',
    venue: 'Blue Waters Hotel',
    mapQuery: 'Blue Waters Hotel Durban',
    capacityEnv: 'RSVP_CAPACITY_DURBAN',
  },
  capetown: {
    name: 'Cape Town',
    date: 'Saturday, 28 November',
    time: null, // not announced yet; the email leaves the time line out
    venue: 'Century City',
    mapQuery: 'Century City Cape Town',
    capacityEnv: 'RSVP_CAPACITY_CAPETOWN',
  },
};

// Empty or unset → no limit (null). A whole number → the cap; 0 closes RSVPs.
// Anything else is logged and treated as no limit rather than blocking people.
function capacityFor(event) {
  const raw = String(process.env[event.capacityEnv] ?? '').trim();
  if (raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.error(`Ignoring invalid ${event.capacityEnv}="${raw}"; treating as no limit`);
    return null;
  }
  return n;
}

module.exports = { EVENTS, capacityFor };
