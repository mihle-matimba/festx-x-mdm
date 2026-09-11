// Shared by /api/rsvp and /api/rsvps. The leading underscore keeps Vercel from
// exposing this file as an endpoint of its own.
//
// To open RSVPs for another stop, add it here and put the RSVP section on the
// page. Capacity comes from an env var so it can change without a code edit.
const EVENTS = {
  johannesburg: {
    name: 'Johannesburg',
    capacityEnv: 'RSVP_CAPACITY_JOHANNESBURG',
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
