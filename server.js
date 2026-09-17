const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const CHARM_CONFIG_FILE = path.join(__dirname, 'data', 'charm-config.json');

// The full set of charms the Charm Dangle page knows how to show.
// Keep this list in sync with the `id` values inside public/charms.html.
const ALL_CHARM_IDS = ['nazar', 'hamsa', 'ghanta', 'doll', 'drishti', 'nimbu', 'clover', 'custom'];
const CHARM_NAMES = {
  nazar: 'Nazar boncuğu (evil eye)',
  hamsa: 'Hamsa',
  ghanta: 'Ghanta (bell)',
  doll: 'Wishing doll',
  drishti: 'Drishti guardian',
  nimbu: 'Nimbu-mirchi',
  clover: 'Four-leaf clover',
  custom: 'Your own charm (emoji)'
};

// Where a logged-in (non-admin) user is sent after a successful login —
// now served by this same app (see the protected /charms route below),
// so the admin's charm on/off choices actually take effect for everyone.
const CHARM_URL = '/charms';

// --- Admin credentials -----------------------------------------------------
// Change these before you deploy anywhere real. Better still: delete the
// hardcoded values below and set ADMIN_USER / ADMIN_PASS / SESSION_SECRET as
// environment variables on your hosting provider instead, so the password
// isn't sitting in your source code.
const ADMIN_USER = process.env.ADMIN_USER || 'balamurugana';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Balamurugan@2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'please-change-this-secret';
// ----------------------------------------------------------------------------

if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}');
}
if (!fs.existsSync(CHARM_CONFIG_FILE)) {
  fs.writeFileSync(CHARM_CONFIG_FILE, JSON.stringify({ enabled: ALL_CHARM_IDS }, null, 2));
}

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function loadCharmConfig() {
  try {
    var cfg = JSON.parse(fs.readFileSync(CHARM_CONFIG_FILE, 'utf8'));
    if (!Array.isArray(cfg.enabled) || cfg.enabled.length === 0) cfg.enabled = ALL_CHARM_IDS.slice();
    return cfg;
  } catch (e) {
    return { enabled: ALL_CHARM_IDS.slice() };
  }
}

function saveCharmConfig(cfg) {
  fs.writeFileSync(CHARM_CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // If you deploy behind HTTPS (which every real host does), turn this on:
      // secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    }
  })
);

function requireLogin(req, res, next) {
  if (req.session.user || req.session.isAdmin) return next();
  res.redirect('/');
}

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.status(403).json({ error: 'Not authorized.' });
}

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body || {};
  const name = String(username || '').trim();

  if (!name || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (name.toLowerCase() === ADMIN_USER.toLowerCase()) {
    return res.status(409).json({ error: 'That username is reserved.' });
  }

  const users = loadUsers();
  if (users[name]) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  users[name] = { hash, createdAt: new Date().toISOString() };
  saveUsers(users);

  req.session.user = name;
  req.session.isAdmin = false;
  res.json({ ok: true, user: name, charmUrl: CHARM_URL });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const name = String(username || '').trim();

  // Admin sign-in, checked against the fixed admin credential above.
  if (name.toLowerCase() === ADMIN_USER.toLowerCase() && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    req.session.user = null;
    return res.json({ ok: true, admin: true });
  }

  const users = loadUsers();
  const rec = users[name];
  if (!rec || !bcrypt.compareSync(password || '', rec.hash)) {
    return res.status(401).json({ error: 'Wrong username or password.' });
  }

  req.session.user = name;
  req.session.isAdmin = false;
  res.json({ ok: true, user: name, charmUrl: CHARM_URL });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({
    user: req.session.user || null,
    isAdmin: !!req.session.isAdmin,
    charmUrl: CHARM_URL
  });
});

app.get('/charms', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'charms.html'));
});

// Anyone logged in can read which charms are turned on (the charms page
// itself calls this to decide what to show).
app.get('/api/charm-config', requireLogin, (req, res) => {
  res.json(loadCharmConfig());
});

app.get('/api/admin/charm-config', requireAdmin, (req, res) => {
  var cfg = loadCharmConfig();
  var all = ALL_CHARM_IDS.map(function (id) {
    return { id: id, name: CHARM_NAMES[id] || id, enabled: cfg.enabled.indexOf(id) !== -1 };
  });
  res.json({ charms: all });
});

app.post('/api/admin/charm-config', requireAdmin, (req, res) => {
  var enabled = (req.body && req.body.enabled) || [];
  enabled = enabled.filter(function (id) { return ALL_CHARM_IDS.indexOf(id) !== -1; });
  if (enabled.length === 0) {
    return res.status(400).json({ error: 'At least one charm has to stay on.' });
  }
  saveCharmConfig({ enabled: enabled });
  res.json({ ok: true });
});

app.get('/api/admin/users', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: 'Not authorized.' });
  const users = loadUsers();
  const list = Object.keys(users).map((name) => ({
    username: name,
    createdAt: users[name].createdAt || null
  }));
  res.json({ users: list });
});

app.post('/api/admin/remove', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: 'Not authorized.' });
  const { username } = req.body || {};
  const users = loadUsers();
  delete users[username];
  saveUsers(users);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log('Charm Dangle auth server running on port ' + PORT);
});
