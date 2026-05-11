const { catalog } = require('./catalog');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json({
    ok: true,
    sources: catalog.map(({ id, name, title, adult }) => ({ id, name, title, adult }))
  });
};
