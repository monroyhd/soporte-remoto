'use strict';

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const UAParser = require('ua-parser-js');
const session  = require('express-session');
const multer   = require('multer');

const app  = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// ── Proxy inverso (Caddy) ──────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Parseo de formularios / Sesiones ──────────────────────────────────────
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 2 * 60 * 60 * 1000, // 2 horas
  },
}));

// ── Catálogo de descargas ──────────────────────────────────────────────────
const DOWNLOADS = {
  windows: { filename: 'soporte-remoto-windows.exe', label: 'Windows', icon: '🪟' },
  macos:   { filename: 'soporte-remoto-macos.dmg',   label: 'macOS',   icon: '🍎' },
  linux:   { filename: 'soporte-remoto-linux.sh',    label: 'Linux',   icon: '🐧' },
  android: { filename: 'soporte-remoto-android.apk', label: 'Android', icon: '🤖' },
  ios:     { filename: null, label: 'iOS', icon: '📱', storeUrl: 'https://apps.apple.com' },
};

const ALLOWED_FILENAMES = Object.values(DOWNLOADS)
  .filter(d => d.filename)
  .map(d => d.filename);

// ── Multer: subida de archivos ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'downloads'),
  filename: (_req, file, cb) => cb(null, file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILENAMES.includes(file.originalname)) return cb(null, true);
    cb(new Error(`Nombre no permitido: "${file.originalname}"`));
  },
});

// ── Utilidades ────────────────────────────────────────────────────────────
function detectPlatform(ua) {
  const n = ((new UAParser(ua)).getOS().name || '').toLowerCase();
  if (n.includes('windows')) return 'windows';
  if (n.includes('mac'))     return 'macos';
  if (n.includes('android')) return 'android';
  if (n.includes('ios'))     return 'ios';
  if (n.includes('linux'))   return 'linux';
  return 'unknown';
}

function fileExists(filename) {
  try { fs.accessSync(path.join(__dirname, 'downloads', filename)); return true; }
  catch { return false; }
}

function fileSize(filename) {
  try {
    const bytes = fs.statSync(path.join(__dirname, 'downloads', filename)).size;
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  } catch { return '–'; }
}

function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.redirect('/admin');
}

function safeCompare(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ── Layout HTML del panel admin ────────────────────────────────────────────
function adminLayout(title, body) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} – Soporte Remoto Admin</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      background:#0f172a;color:#e2e8f0;min-height:100vh;
      display:flex;align-items:center;justify-content:center;padding:2rem}
    .card{background:#1e293b;border:1px solid #334155;border-radius:1rem;
      padding:2.5rem;max-width:560px;width:100%;box-shadow:0 25px 50px rgba(0,0,0,.4)}
    h1{font-size:1.5rem;font-weight:700;color:#f1f5f9;margin-bottom:1.75rem}
    h2{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;
      color:#64748b;margin-bottom:.75rem}
    label{display:block;font-size:.85rem;color:#94a3b8;margin-bottom:.4rem}
    input[type=password]{width:100%;padding:.65rem .9rem;background:#0f172a;
      border:1px solid #475569;border-radius:.5rem;color:#e2e8f0;font-size:.95rem;
      margin-bottom:1.25rem}
    input[type=password]:focus{outline:none;border-color:#2563eb}
    input[type=file]{width:100%;padding:.5rem .9rem;background:#0f172a;
      border:1px solid #475569;border-radius:.5rem;color:#94a3b8;font-size:.88rem;
      margin-bottom:.5rem;cursor:pointer}
    .hint{font-size:.78rem;color:#475569;margin-bottom:1.25rem;line-height:1.6}
    .btn{display:inline-flex;align-items:center;gap:.4rem;padding:.65rem 1.5rem;
      border:none;border-radius:.5rem;font-size:.9rem;font-weight:600;
      cursor:pointer;text-decoration:none;transition:background .15s}
    .btn-primary{background:#2563eb;color:#fff}.btn-primary:hover{background:#1d4ed8}
    .btn-danger{background:#dc2626;color:#fff}.btn-danger:hover{background:#b91c1c}
    .btn-sm{padding:.4rem .85rem;font-size:.8rem}
    .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.75rem}
    .topbar h1{margin-bottom:0}
    .alert{padding:.75rem 1rem;border-radius:.5rem;margin-bottom:1.25rem;font-size:.88rem}
    .alert-error{background:#450a0a;border:1px solid #dc2626;color:#fca5a5}
    .alert-ok{background:#052e16;border:1px solid #16a34a;color:#86efac}
    .file-list{list-style:none;margin-bottom:1.5rem}
    .file-item{display:flex;align-items:center;gap:.75rem;padding:.65rem .85rem;
      background:#0f172a;border:1px solid #334155;border-radius:.45rem;margin-bottom:.4rem}
    .file-meta{display:flex;flex-direction:column;gap:.15rem;flex:1;min-width:0}
    .file-name{font-size:.88rem;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .file-size{font-size:.75rem;color:#64748b}
    .badge{padding:.2rem .55rem;border-radius:.3rem;font-size:.72rem;font-weight:700;white-space:nowrap}
    .badge-ok{background:#052e16;color:#86efac}
    .badge-missing{background:#450a0a;color:#fca5a5}
    hr{border:none;border-top:1px solid #334155;margin:1.5rem 0}
  </style>
</head>
<body><div class="card">${body}</div></body>
</html>`;
}

// ── Archivos estáticos ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API ────────────────────────────────────────────────────────────────────
app.get('/api/platform', (req, res) => {
  const ua       = req.headers['user-agent'] || '';
  const platform = detectPlatform(ua);
  const info     = DOWNLOADS[platform] || null;
  res.json({
    platform,
    download: info ? {
      filename:  info.filename,
      label:     info.label,
      icon:      info.icon,
      available: info.filename ? fileExists(info.filename) : false,
      storeUrl:  info.storeUrl || null,
    } : null,
  });
});

app.get('/api/files', (_req, res) => {
  const files = Object.entries(DOWNLOADS)
    .filter(([, d]) => d.filename)
    .map(([platform, d]) => ({
      platform,
      label:     d.label,
      icon:      d.icon,
      filename:  d.filename,
      available: fileExists(d.filename),
    }));
  res.json(files);
});

// ── Descargas ──────────────────────────────────────────────────────────────
function sendFile(res, platform, info) {
  const filePath = path.join(__dirname, 'downloads', info.filename);
  res.download(filePath, info.filename, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({
        error:    'Archivo no encontrado',
        platform,
        filename: info.filename,
        message:  'Coloca el archivo en la carpeta /downloads/',
      });
    }
  });
}

app.get('/download', (req, res) => {
  const platform = detectPlatform(req.headers['user-agent'] || '');
  const info     = DOWNLOADS[platform];
  if (!info)          return res.status(400).send('Plataforma no reconocida.');
  if (info.storeUrl)  return res.redirect(info.storeUrl);
  if (!info.filename) return res.status(404).send('Archivo no disponible.');
  sendFile(res, platform, info);
});

app.get('/download/:platform', (req, res) => {
  const platform = req.params.platform.toLowerCase();
  const info     = DOWNLOADS[platform];
  if (!info)          return res.status(400).json({ error: `Plataforma desconocida: ${platform}` });
  if (info.storeUrl)  return res.redirect(info.storeUrl);
  if (!info.filename) return res.status(404).send('Archivo no disponible.');
  sendFile(res, platform, info);
});

// ── Admin: login ───────────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  if (req.session?.isAdmin) return res.redirect('/admin/dashboard');
  const errMsg = req.query.error
    ? '<div class="alert alert-error">⚠️ Contraseña incorrecta. Intente nuevamente.</div>'
    : '';
  res.send(adminLayout('Acceso', `
    <h1>🔐 Panel de administración</h1>
    ${errMsg}
    <form method="POST" action="/admin/login">
      <label for="pwd">Contraseña</label>
      <input type="password" id="pwd" name="password" autofocus autocomplete="current-password" required/>
      <button type="submit" class="btn btn-primary">Ingresar</button>
    </form>
  `));
});

app.post('/admin/login', (req, res) => {
  const pwd = req.body.password || '';
  if (ADMIN_PASSWORD && safeCompare(pwd, ADMIN_PASSWORD)) {
    req.session.isAdmin = true;
    return req.session.save(() => res.redirect('/admin/dashboard'));
  }
  res.redirect('/admin?error=1');
});

// ── Admin: dashboard ───────────────────────────────────────────────────────
app.get('/admin/dashboard', requireAdmin, (req, res) => {
  const msg = req.query.success
    ? '<div class="alert alert-ok">✅ Archivo subido correctamente.</div>'
    : req.query.error === 'upload'
      ? '<div class="alert alert-error">❌ Error al subir. Verifica el nombre o tamaño del archivo.</div>'
      : '';

  const rows = Object.entries(DOWNLOADS)
    .filter(([, d]) => d.filename)
    .map(([, d]) => {
      const exists = fileExists(d.filename);
      const size   = exists ? fileSize(d.filename) : '–';
      return `
        <li class="file-item">
          <span style="font-size:1.3rem">${d.icon}</span>
          <div class="file-meta">
            <span class="file-name">${d.filename}</span>
            <span class="file-size">${d.label} · ${size}</span>
          </div>
          <span class="badge ${exists ? 'badge-ok' : 'badge-missing'}">
            ${exists ? 'Disponible' : 'Faltante'}
          </span>
        </li>`;
    }).join('');

  res.send(adminLayout('Dashboard', `
    <div class="topbar">
      <h1>📁 Archivos de descarga</h1>
      <form method="POST" action="/admin/logout" style="margin:0">
        <button type="submit" class="btn btn-danger btn-sm">Cerrar sesión</button>
      </form>
    </div>
    ${msg}
    <h2>Estado actual</h2>
    <ul class="file-list">${rows}</ul>
    <hr/>
    <h2>Subir archivo</h2>
    <form method="POST" action="/admin/upload" enctype="multipart/form-data">
      <label>Selecciona el instalador</label>
      <input type="file" name="file" required/>
      <p class="hint">
        El nombre del archivo debe coincidir exactamente con uno de los siguientes:<br/>
        ${ALLOWED_FILENAMES.map(f => `<code>${f}</code>`).join(' &nbsp;·&nbsp; ')}
      </p>
      <button type="submit" class="btn btn-primary">⬆️ Subir archivo</button>
    </form>
  `));
});

app.post('/admin/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err || !req.file) {
      if (err) console.error('Upload error:', err.message);
      return res.redirect('/admin/dashboard?error=upload');
    }
    res.redirect('/admin/dashboard?success=1');
  });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin'));
});

// ── Arranque ───────────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`✅ Servidor soporte-remoto corriendo en http://${HOST}:${PORT}`);
  console.log(`   (acceso público a través del proxy Caddy → 10.10.10.88:${PORT})`);
  if (!ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD no configurado → acceso al panel admin deshabilitado.');
  }
  if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  SESSION_SECRET no configurado → las sesiones no persistirán entre reinicios.');
  }
});
