// NG Kerk Meerensee — Site Platform (AutoEffortless blueprint, River Whisperer-style)
// Hosted site + admin dashboard + AI Site Editor (drafts → preview → publish)
// The AI edits come from the dedicated `ngkerk` OpenClaw agent.

const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
const PORT = 8091;
const JWT_SECRET = 'ngkerk-secret-2026';
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const { setupAnalytics } = require('./analytics');

// ── Multer config ──
const ALLOWED_TYPES = [
  'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/wav','audio/ogg','audio/mp4',
  'application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dateDir = new Date().toISOString().slice(0, 10);
      const dir = path.join(UPLOADS_DIR, dateDir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const base = path.basename(file.originalname || 'file', ext).replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 60);
      cb(null, Date.now() + '-' + base + ext);
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed: ' + file.mimetype));
  }
});

app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

// ── Users (private/users.json) ──
const USERS_FILE = path.join(__dirname, 'private', 'users.json');
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
  catch { return []; }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function authenticate(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ── Auth ──
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = generateToken(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ success: true, user: { name: user.name, email: user.email, role: user.role } });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token) return res.json({ authenticated: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.json({ authenticated: false });
    res.json({ authenticated: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.json({ authenticated: false });
  }
});

// ── Admin: user management ──
app.get('/api/admin/users', authenticate, requireRole('admin'), (req, res) => {
  const users = loadUsers().map(({ password, ...safe }) => safe);
  res.json({ users });
});

// ── Admin pages (auth-protected) ──
app.get(['/login', '/signup'], (req, res) => {
  res.sendFile('login.html', { root: __dirname });
});
app.get('/admin', authenticate, requireRole('admin'), (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});
app.get('/analytics', authenticate, requireRole('admin'), (req, res) => {
  res.sendFile('analytics.html', { root: __dirname });
});
app.get('/dashboard', authenticate, (req, res) => {
  res.sendFile('dashboard.html', { root: __dirname });
});

// ═══════════════════════════════════════════════
//  UPLOADS (site media)
// ═══════════════════════════════════════════════

app.post('/api/upload', authenticate, requireRole('admin'), (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err) {
      if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Upload error: ' + err.message });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const relativePath = path.relative(__dirname, req.file.path);
    const urlPath = '/' + relativePath.replace(/\\/g, '/');
    res.json({
      success: true,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: relativePath,
        url: urlPath
      }
    });
  });
});

app.get('/api/uploads', authenticate, requireRole('admin'), (req, res) => {
  const files = [];
  function walk(dir, dateDir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach(e => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full, e.name);
        else if (e.isFile()) {
          const relativePath = path.relative(UPLOADS_DIR, full);
          const urlPath = '/uploads/' + relativePath.replace(/\\/g, '/');
          const stat = fs.statSync(full);
          files.push({
            filename: e.name,
            path: urlPath,
            size: stat.size,
            date: stat.mtime,
            dateGroup: dateDir || 'other'
          });
        }
      });
    } catch {}
  }
  if (fs.existsSync(UPLOADS_DIR)) walk(UPLOADS_DIR, '');
  files.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ files });
});

app.delete(/^\/api\/uploads\/(.+)/, authenticate, requireRole('admin'), (req, res) => {
  const filePath = req.params[0];
  if (!filePath || filePath.includes('..')) return res.status(400).json({ error: 'Invalid path' });
  const fullPath = path.join(UPLOADS_DIR, filePath);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });
  try {
    fs.unlinkSync(fullPath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ═══════════════════════════════════════════════
//  AI CHAT (async jobs — the admin chats with the ngkerk agent)
// ═══════════════════════════════════════════════
const { exec } = require('child_process');

const AI_JOBS = new Map();
let AI_JOB_SEQ = 0;

function runAgentJob(job, message) {
  // Prepend staging instruction so the agent edits drafts/ instead of live files
  const stagedMessage = `IMPORTANT: You are editing in STAGING mode. The live site serves files from the root directory. When you edit or write files, save them to the 'drafts/' directory instead of the root. For example, edit 'drafts/index.html' not 'index.html'. When the user says 'publish', the changes will be copied to the live site.\n\nUser message: ${message}`;

  job.status = 'working';
  exec(
    `openclaw agent --agent ngkerk --message ${JSON.stringify(stagedMessage)} --json 2>/dev/null`,
    { encoding: 'utf-8', timeout: 180000, maxBuffer: 10 * 1024 * 1024 },
    (err, stdout) => {
      if (err) {
        job.status = 'error';
        job.error = 'Agent run failed: ' + (err.message || String(err));
      } else {
        try {
          const parsed = JSON.parse(stdout);
          job.reply = parsed?.result?.payloads?.[0]?.text || parsed?.text || 'No response';
          job.status = 'done';
        } catch (e) {
          job.status = 'error';
          job.error = 'Could not parse agent output: ' + e.message;
        }
      }
      job.finishedAt = new Date().toISOString();
    }
  );
}

app.post('/api/ai-chat', authenticate, requireRole('admin'), (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
  const id = 'job_' + (++AI_JOB_SEQ) + '_' + Date.now();
  const job = {
    id, status: 'received', message: message.trim(), reply: null, error: null,
    createdAt: new Date().toISOString(), finishedAt: null
  };
  AI_JOBS.set(id, job);
  if (AI_JOBS.size > 50) {
    const oldest = AI_JOBS.keys().next().value;
    AI_JOBS.delete(oldest);
  }
  runAgentJob(job, message.trim());
  res.status(202).json({ jobId: id, status: job.status });
});

app.get('/api/ai-chat/:id', authenticate, requireRole('admin'), (req, res) => {
  const job = AI_JOBS.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({
    id: job.id, status: job.status, reply: job.reply, error: job.error,
    createdAt: job.createdAt, finishedAt: job.finishedAt
  });
});

// Draft preview — serve the staged draft of a page when one exists
function serveDraftOrLive(file, res, next) {
  const draftPath = path.join(DRAFTS_DIR, file);
  const livePath = path.join(LIVE_DIR, file);
  let p = null;
  if (fs.existsSync(draftPath) && fs.statSync(draftPath).isFile()) p = draftPath;
  else if (fs.existsSync(livePath) && fs.statSync(livePath).isFile()) p = livePath;
  if (p) {
    try {
      res.type(path.extname(p).replace('.', '') || 'html');
      res.send(fs.readFileSync(p));
    } catch (e) {
      res.status(500).json({ error: 'Preview failed: ' + e.message });
    }
    return;
  }
  next();
}

app.get('/preview', authenticate, requireRole('admin'), (req, res, next) => {
  serveDraftOrLive('index.html', res, next);
});
app.get('/preview/:file', authenticate, requireRole('admin'), (req, res, next) => {
  const f = path.basename(req.params.file);
  if (!/^[\w.-]+$/.test(f) || f === '.' || f === '..') return res.status(400).json({ error: 'Bad file name' });
  serveDraftOrLive(f, res, next);
});

// Discard all staged drafts
app.post('/api/drafts/discard', authenticate, requireRole('admin'), (req, res) => {
  const discarded = [];
  const errors = [];
  try {
    fs.readdirSync(DRAFTS_DIR).forEach(f => {
      if (f === 'backups') return;
      const draftPath = path.join(DRAFTS_DIR, f);
      if (fs.statSync(draftPath).isFile()) {
        try { fs.unlinkSync(draftPath); discarded.push(f); }
        catch (e) { errors.push(f + ': ' + e.message); }
      }
    });
  } catch {}
  res.json({ discarded, errors, count: discarded.length });
});

// ═══════════════════════════════════════════════
//  PUBLISH / STAGING / BACKUPS
// ═══════════════════════════════════════════════
const DRAFTS_DIR = path.join(__dirname, 'drafts');
const LIVE_DIR = __dirname;
const BACKUPS_DIR = path.join(DRAFTS_DIR, 'backups');

function ts() {
  const d = new Date();
  return d.getFullYear()
    + String(d.getMonth()+1).padStart(2,'0')
    + String(d.getDate()).padStart(2,'0')
    + '-' + String(d.getHours()).padStart(2,'0')
    + String(d.getMinutes()).padStart(2,'0')
    + String(d.getSeconds()).padStart(2,'0');
}

function loadBackupManifest() {
  const p = path.join(BACKUPS_DIR, 'manifest.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return []; }
}
function saveBackupManifest(m) {
  fs.writeFileSync(path.join(BACKUPS_DIR, 'manifest.json'), JSON.stringify(m, null, 2));
}

function createBackup() {
  const stamp = ts();
  const backupDir = path.join(BACKUPS_DIR, stamp);
  fs.mkdirSync(backupDir, { recursive: true });

  const backedUp = [];
  const pathsToBackup = ['index.html', 'eredienste/index.html', 'kontak/index.html',
    'finansies/index.html', 'gebed/index.html', 'jeug-splash/index.html',
    'omgeegroepe/index.html', 'media/index.html', 'vorms/index.html',
    'admin.html', 'dashboard.html', 'login.html', 'rw-chat.js', 'server.js'];

  pathsToBackup.forEach(f => {
    const src = path.join(LIVE_DIR, f);
    if (fs.existsSync(src) && fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(backupDir, f.replace(/\//g, '__')));
      backedUp.push(f);
    }
  });

  try {
    fs.readdirSync(DRAFTS_DIR).forEach(f => {
      const draftPath = path.join(DRAFTS_DIR, f);
      if (f === 'backups') return;
      if (fs.statSync(draftPath).isFile() && !backedUp.includes(f)) {
        fs.copyFileSync(draftPath, path.join(backupDir, f));
        backedUp.push(f);
      }
    });
  } catch {}

  const localManifest = { createdAt: new Date().toISOString(), files: backedUp };
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(localManifest, null, 2));

  const manifest = loadBackupManifest();
  manifest.push({ id: stamp, createdAt: localManifest.createdAt, files: backedUp });
  manifest.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  saveBackupManifest(manifest);

  if (manifest.length > 50) {
    const toRemove = manifest.slice(50);
    manifest.length = 50;
    toRemove.forEach(b => {
      try { fs.rmSync(path.join(BACKUPS_DIR, b.id), { recursive: true, force: true }); } catch {}
    });
    saveBackupManifest(manifest);
  }

  return { id: stamp, createdAt: localManifest.createdAt, files: backedUp };
}

// Draft status — what files are staged for publish
app.get('/api/draft-status', authenticate, requireRole('admin'), (req, res) => {
  const drafts = [];
  try {
    const files = fs.readdirSync(DRAFTS_DIR);
    files.forEach(f => {
      if (f === 'backups') return;
      const draftPath = path.join(DRAFTS_DIR, f);
      const livePath = path.join(LIVE_DIR, f);
      const stat = fs.statSync(draftPath);
      if (stat.isFile() && (f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.js') || f.endsWith('.json'))) {
        const draftContent = fs.readFileSync(draftPath, 'utf-8');
        let liveContent = '';
        try { liveContent = fs.readFileSync(livePath, 'utf-8'); } catch {}
        drafts.push({
          file: f,
          draftSize: draftContent.length,
          liveSize: liveContent.length,
          modified: draftContent !== liveContent,
          modifiedAt: stat.mtime
        });
      }
    });
  } catch {}
  res.json({ drafts, count: drafts.filter(d => d.modified).length });
});

// Publish — auto-backup live files, then copy all drafts to live
app.post('/api/publish', authenticate, requireRole('admin'), (req, res) => {
  const published = [];
  const errors = [];
  createBackup();
  try {
    const files = fs.readdirSync(DRAFTS_DIR);
    files.forEach(f => {
      const draftPath = path.join(DRAFTS_DIR, f);
      const livePath = path.join(LIVE_DIR, f);
      if (f === 'backups') return;
      if (fs.statSync(draftPath).isFile()) {
        try {
          const content = fs.readFileSync(draftPath, 'utf-8');
          const existing = fs.existsSync(livePath) ? fs.readFileSync(livePath, 'utf-8') : '';
          if (content !== existing) {
            fs.writeFileSync(livePath, content, 'utf-8');
            fs.unlinkSync(draftPath);
            published.push(f);
          } else {
            fs.unlinkSync(draftPath);
          }
        } catch (e) { errors.push(f + ': ' + e.message); }
      }
    });
  } catch {}
  res.json({ published, errors, count: published.length });
});

// Backups — list and restore
app.get('/api/backups', authenticate, requireRole('admin'), (req, res) => {
  res.json({ backups: loadBackupManifest() });
});

app.post('/api/backups/:id/restore', authenticate, requireRole('admin'), (req, res) => {
  const manifest = loadBackupManifest();
  const entry = manifest.find(b => b.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Backup not found' });

  const backupDir = path.join(BACKUPS_DIR, req.params.id);
  if (!fs.existsSync(backupDir)) return res.status(404).json({ error: 'Backup files not found on disk' });

  const restored = [];
  const errors = [];
  entry.files.forEach(f => {
    const src = path.join(backupDir, f.replace(/\//g, '__'));
    const dest = path.join(LIVE_DIR, f);
    if (!fs.existsSync(src)) return errors.push(f + ': missing in backup');
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      restored.push(f);
    } catch (e) { errors.push(f + ': ' + e.message); }
  });
  res.json({ restored, errors, count: restored.length });
});

// ── Analytics (self-hosted beacon + admin endpoints) ──
setupAnalytics(app, { authenticate, requireRole });

// ── Static files (after API routes so API takes priority) ──
app.use((req, res, next) => {
  const p = path.normalize(req.path).replace(/^[/\\]+/, '');
  if (p === 'server.js' || p.startsWith('drafts/') || p.startsWith('private/')) {
    return res.status(404).send('Not found');
  }
  next();
});

// Manual static serving with HTML injection: every HTML page gets the
// analytics beacon (rw-track.js) + the admin Site Editor widget (rw-chat.js)
// injected before </head> — including pages the AI creates later.
const INJECT = `<script src="/rw-track.js"></script>\n<script src="/rw-chat.js"></script>`;
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const raw = req.path;
  // The mirror URL-encodes ? as %3F in asset names (wget artifact) —
  // try the decoded form too so wp-content assets resolve.
  let candidates = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded !== raw) candidates.push(decoded);
  } catch {}
  for (const candidate of candidates) {
    let filePath = path.join(__dirname, path.normalize(candidate).replace(/^[/\\]+/, ''));
    if (!filePath.startsWith(__dirname)) return next();
    let stat;
    try { stat = fs.statSync(filePath); } catch { continue; }
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      try { stat = fs.statSync(filePath); } catch { continue; }
    }
    if (!stat.isFile()) continue;
    if (filePath.endsWith('.html')) {
      try {
        let html = fs.readFileSync(filePath, 'utf-8');
        // Strip dead third-party tracker baked into the mirrored WP pages
        // (apps.ignitefeedback.com no longer resolves — would throw console errors)
        html = html.replace(/<script[^>]*apps\.ignitefeedback\.com[^>]*><\/script>/g, '')
                   .replace(/window\._igniter[^;]*;/g, '');
        if (html.indexOf('rw-track.js') === -1) {
          html = html.replace(/<\/head>/i, INJECT + '\n</head>');
        }
        res.type('html').send(html);
        return;
      } catch (e) { return next(); }
    }
    // Read + send directly — the send module chokes on filenames
    // containing '?' (wget mirror artifact), so bypass it entirely.
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.css': 'text/css', '.js': 'application/javascript', '.mjs': 'application/javascript',
      '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
      '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.woff': 'font/woff',
      '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.txt': 'text/plain',
      '.xml': 'application/xml'
    }[ext] || 'application/octet-stream';
    try {
      const buf = fs.readFileSync(filePath);
      res.type(mime).send(buf);
      return;
    } catch (e) { return next(); }
  }
  next();
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`⛪ NG Kerk Meerensee — http://localhost:${PORT}`);
  console.log(`   Admin login via /login`);
});
