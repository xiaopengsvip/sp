const { catalog } = require('./catalog');

const memoryCache = new Map();

function uniqueUrls(text) {
  const patterns = [
    /https?:\/\/api\.yujn\.cn\/api\/[\w./-]+\.php(?:\?[^\s"'<>]*)?/g,
    /https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)(?:\?[^\s"'<>]*)?/g
  ];
  const out = [];
  for (const re of patterns) {
    const matches = String(text).match(re) || [];
    for (const item of matches) out.push(item.replace(/&amp;/g, '&'));
  }
  return [...new Set(out)];
}

async function resolveEndpoint(source) {
  if (source.endpoint) return source.endpoint;
  const cached = memoryCache.get(source.id);
  if (cached && Date.now() - cached.time < 24 * 60 * 60 * 1000) return cached.endpoint;

  const detailUrl = `https://api.yujn.cn/?action=interface&id=${encodeURIComponent(source.id)}`;
  const htmlRes = await fetch(detailUrl, {
    headers: { 'user-agent': 'Mozilla/5.0 Vercel Video Proxy' }
  });
  const html = await htmlRes.text();
  const urls = uniqueUrls(html);
  const endpoint = urls[0];
  if (!endpoint) throw new Error(`接口 ${source.id} 没有解析到真实请求地址`);
  memoryCache.set(source.id, { endpoint, time: Date.now() });
  return endpoint;
}

module.exports = async function handler(req, res) {
  try {
    const id = String(req.query.id || '261');
    const source = catalog.find((item) => item.id === id) || catalog[0];
    const endpoint = await resolveEndpoint(source);
    const url = new URL(endpoint);
    if (!url.searchParams.has('type')) url.searchParams.set('type', req.query.type || source.type || 'video');
    url.searchParams.set('_t', `${Date.now()}${Math.random().toString(16).slice(2)}`);

    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(302, { Location: url.toString() });
    res.end();
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || 'video api error' });
  }
};
