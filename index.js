const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const CONFIG_PATH = path.join(__dirname, 'src/config.json');
const KEYS_PATH = path.join(__dirname, 'src/keys.json');
const STATS_PATH = path.join(__dirname, 'src/stats.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function writeJSON(p, data) {
  try { fs.writeFileSync(p, JSON.stringify(data, null, 2)); } catch(e) {}
}

function getStats() {
  return readJSON(STATS_PATH) || { total: 0, endpoints: {}, daily: {} };
}

function updateStats(endpoint) {
  const stats = getStats();
  const today = new Date().toISOString().slice(0, 10);
  stats.total = (stats.total || 0) + 1;
  stats.endpoints[endpoint] = (stats.endpoints[endpoint] || 0) + 1;
  if (!stats.daily[today]) stats.daily[today] = 0;
  stats.daily[today]++;
  writeJSON(STATS_PATH, stats);
}

function validateKey(apikey) {
  const keys = readJSON(KEYS_PATH) || {};
  if (!keys[apikey]) return { valid: false, message: 'Invalid API key' };
  const k = keys[apikey];
  if (k.limit !== -1 && k.used >= k.limit) return { valid: false, message: 'API key limit reached (' + k.limit + ')' };
  k.used = (k.used || 0) + 1;
  writeJSON(KEYS_PATH, keys);
  return { valid: true, remaining: k.limit === -1 ? 'unlimited' : k.limit - k.used };
}

app.get('/api/stats', (req, res) => {
  res.json({ status: true, data: getStats() });
});

app.get('/api/config', (req, res) => {
  const config = readJSON(CONFIG_PATH) || [];
  const safe = config.map(api => ({
    name: api.name,
    endpoint: api.endpoint,
    method: api.method,
    category: api.category,
    description: api.description,
    params: api.params
  }));
  res.json({ status: true, data: safe });
});

app.get('/api/keys/all', (req, res) => {
  const keys = readJSON(KEYS_PATH) || {};
  const result = Object.entries(keys).map(([key, k]) => ({
    key,
    limit: k.limit,
    used: k.used,
    owner: k.owner,
    remaining: k.limit === -1 ? 'unlimited' : Math.max(0, k.limit - k.used)
  }));
  res.json({ status: true, data: result });
});

app.get('/api/keys/info', (req, res) => {
  const { apikey } = req.query;
  if (!apikey) return res.status(400).json({ status: false, message: 'apikey required' });
  const keys = readJSON(KEYS_PATH) || {};
  if (!keys[apikey]) return res.status(404).json({ status: false, message: 'Key not found' });
  const k = keys[apikey];
  res.json({
    status: true,
    data: {
      key: apikey,
      limit: k.limit,
      used: k.used,
      remaining: k.limit === -1 ? 'unlimited' : Math.max(0, k.limit - k.used)
    }
  });
});

const config = readJSON(CONFIG_PATH) || [];

config.forEach(api => {
  const method = (api.method || 'GET').toLowerCase();
  app[method](api.endpoint, async (req, res) => {
    const query = method === 'get' ? req.query : { ...req.query, ...req.body };

    for (const param of (api.params || [])) {
      if (param.required && param.name !== 'apikey' && !query[param.name]) {
        return res.status(400).json({ status: false, message: `Parameter '${param.name}' is required` });
      }
    }

    const needsKey = (api.params || []).find(p => p.name === 'apikey' && p.required);
    if (needsKey) {
      if (!query.apikey) return res.status(401).json({ status: false, message: 'API key is required' });
      const check = validateKey(query.apikey);
      if (!check.valid) return res.status(403).json({ status: false, message: check.message });
    }

    updateStats(api.endpoint);

    try {
      delete require.cache[require.resolve(path.join(__dirname, 'src/apis', api.filename + '.js'))];
      const handler = require(path.join(__dirname, 'src/apis', api.filename + '.js'));
      const result = await handler(query, req, res);
      if (!res.headersSent) res.json(result);
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ status: false, message: err.message });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  if (!fs.existsSync(STATS_PATH)) writeJSON(STATS_PATH, { total: 0, endpoints: {}, daily: {} });
  console.log('Server running on port ' + PORT);
});

module.exports = app;
