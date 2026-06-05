const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());

let themes = [
  { id: 'theme-grace-dark', name: 'Grace (Charcoal)', author: 'ChurchOS Themes', description: 'Charcoal Grace dark theme with soft accents' },
  { id: 'theme-grace-light', name: 'Grace (Off-white)', author: 'ChurchOS Themes', description: 'Off-white Grace light theme with soft accents' }
];
let plugins = [
  { id: 'plugin-giving', name: 'Giving Gateway', author: 'ChurchOS', description: 'Donation and giving plugin for tenant churches' },
  { id: 'plugin-events', name: 'Events Manager', author: 'Community', description: 'Events, RSVPs and calendar integration' }
];

// Simple developer users (in-memory). In production, use real auth and persistence.
const devUsers = [
  { id: 'dev1', name: 'Acme Dev', apiKey: 'devkey-CHANGE_ME' }
];

app.get('/api/themes', (req, res) => res.json(themes));
app.get('/api/plugins', (req, res) => res.json(plugins));

app.post('/api/publish', (req, res) => {
  const { type, name, author, description } = req.body;
  if (!type || !name) return res.status(400).json({ error: 'type and name required' });
  const entry = { id: `${type}-${Date.now()}`, name, author: author||'unknown', description };
  if (type === 'theme') themes.push(entry);
  else plugins.push(entry);
  return res.json({ ok: true, entry });
});

// Developer API: manage packages (requires X-API-KEY header)
function getDevUserFromKey(req){
  const key = req.header('x-api-key') || req.query.apiKey;
  if(!key) return null;
  return devUsers.find(u => u.apiKey === key) || null;
}

app.get('/api/dev/packages', (req, res) => {
  const user = getDevUserFromKey(req);
  if(!user) return res.status(401).json({ error: 'unauthorized' });
  const all = [
    ...themes.map(t => ({ ...t, type: 'theme' })),
    ...plugins.map(p => ({ ...p, type: 'plugin' }))
  ];
  // return only packages owned by this developer (if ownerId set), otherwise all (for convenience)
  const list = all.filter(p => !p.ownerId || p.ownerId === user.id);
  res.json(list);
});

app.post('/api/dev/packages', (req, res) => {
  const user = getDevUserFromKey(req);
  if(!user) return res.status(401).json({ error: 'unauthorized' });
  const { type, name, description } = req.body;
  if(!type || !name) return res.status(400).json({ error: 'type and name required' });
  const entry = { id: `${type}-${Date.now()}`, name, author: user.name, description, ownerId: user.id };
  if(type === 'theme') themes.push(entry);
  else plugins.push(entry);
  res.json({ ok: true, entry });
});

app.delete('/api/dev/packages/:id', (req, res) => {
  const user = getDevUserFromKey(req);
  if(!user) return res.status(401).json({ error: 'unauthorized' });
  const id = req.params.id;
  const removeFrom = (arr) => {
    const idx = arr.findIndex(p => p.id === id && (!p.ownerId || p.ownerId === user.id));
    if(idx === -1) return false;
    arr.splice(idx,1); return true;
  }
  const ok = removeFrom(themes) || removeFrom(plugins);
  if(!ok) return res.status(404).json({ error: 'not found or not allowed' });
  res.json({ ok: true });
});

app.listen(9000, () => console.log('Marketplace backend listening on http://localhost:9000'));
