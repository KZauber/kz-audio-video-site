// Netlify automatically runs this function on every verified form submission
// (the filename "submission-created" is a reserved Netlify trigger — no config
// or dashboard toggle needed). It forwards each lead to LEAD_WEBHOOK_URL, which
// is where the SMS/notification is sent from (GHL inbound webhook or Make.com).
//
// To activate: set the destination below (or the LEAD_WEBHOOK_URL env var in
// Netlify). Until then it no-ops safely and never blocks a submission.

const LEAD_WEBHOOK_URL = ''; // ← paste GHL/Make webhook URL here (or use env var)

exports.handler = async (event) => {
  try {
    const url = LEAD_WEBHOOK_URL || process.env.LEAD_WEBHOOK_URL;
    if (!url) return { statusCode: 200, body: 'no webhook configured yet' };

    const { payload } = JSON.parse(event.body || '{}');
    const d = (payload && payload.data) || {};

    const lead = {
      name: d.name || '',
      phone: d.phone || '',
      email: d.email || '',
      service: d.service || '',
      message: d.message || '',
      source: d.source || 'KZ Website',
      form: (payload && payload.form_name) || 'contact',
      submitted_at: new Date().toISOString(),
    };

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });

    return { statusCode: 200, body: 'forwarded' };
  } catch (e) {
    // Never block or fail the lead capture — Netlify already stored it.
    return { statusCode: 200, body: 'noop: ' + (e && e.message) };
  }
};
