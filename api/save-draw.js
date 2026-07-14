module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable'
    });
  }

  const { numbers } = req.body || {};
  if (!Array.isArray(numbers) || numbers.length !== 6 || numbers.some((n) => !Number.isInteger(n))) {
    return res.status(400).json({ error: 'numbers must be an array of 6 integers' });
  }

  const payload = {
    numbers,
    numbers_text: numbers.join(','),
    created_at: new Date().toISOString()
  };

  let response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/lotto_draws`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to reach Supabase',
      details: error.message
    });
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    return res.status(response.status).json({
      error: data?.message || data?.error || 'Supabase insert failed',
      details: data,
      status: response.status
    });
  }

  return res.status(200).json({
    ok: true,
    id: data?.[0]?.id ?? null,
    row: data?.[0] ?? null
  });
}
