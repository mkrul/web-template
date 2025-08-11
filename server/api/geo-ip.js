// Lightweight endpoint to provide approximate geolocation from client IP
// Uses IPinfo. Set IPINFO_TOKEN (or IPINFO_ACCESS_TOKEN) in environment variables.

module.exports = async function geoIp(req, res) {
  try {
    const token = process.env.IPINFO_TOKEN || process.env.IPINFO_ACCESS_TOKEN;
    if (!token) {
      res.status(501).json({ error: 'IP geolocation not configured' });
      return;
    }

    const xff = req.headers['x-forwarded-for'];
    const ipFromXff = Array.isArray(xff)
      ? xff[0]
      : typeof xff === 'string'
        ? xff.split(',')[0]
        : undefined;
    const rawIp = (ipFromXff || req.ip || '').toString().trim();
    const isLoopback = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(rawIp);
    const ip = isLoopback ? undefined : rawIp;

    const base = 'https://ipinfo.io';
    const url = ip
      ? `${base}/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(token)}`
      : `${base}/json?token=${encodeURIComponent(token)}`;

    const response = await globalThis.fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      res.status(502).json({ error: 'IPinfo request failed', details: text });
      return;
    }
    let data = await response.json();
    let loc = data && data.loc;
    if (!loc || typeof loc !== 'string' || !loc.includes(',')) {
      const isDev = process.env.NODE_ENV !== 'production';
      const testIp = process.env.IPINFO_TEST_IP;
      if (isDev && testIp) {
        const testUrl = `${base}/${encodeURIComponent(testIp)}/json?token=${encodeURIComponent(token)}`;
        const testResp = await globalThis.fetch(testUrl, {
          headers: { Accept: 'application/json' },
        });
        if (testResp.ok) {
          data = await testResp.json();
          loc = data && data.loc;
        }
      }
      if (!loc || typeof loc !== 'string' || !loc.includes(',')) {
        // As a last resort in dev, return a neutral US center to allow testing the flow
        if (isDev) {
          const lat = 39.8283;
          const lng = -98.5795;
          res.json({ lat, lng, source: 'ipinfo-dev-fallback' });
          return;
        }
        res.status(404).json({ error: 'Location not available' });
        return;
      }
    }
    const [latStr, lngStr] = loc.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(404).json({ error: 'Invalid coordinates from provider' });
      return;
    }
    res.json({ lat, lng, source: 'ipinfo' });
  } catch (e) {
    res.status(500).json({ error: 'IP geolocation failed' });
  }
};
