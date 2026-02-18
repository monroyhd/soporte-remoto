const express = require('express');
const path = require('path');
const UAParser = require('ua-parser-js');

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '127.0.0.1';

// Confiar en el proxy inverso (Caddy) para leer X-Forwarded-For y X-Forwarded-Proto
app.set('trust proxy', 1);

// Archivos de descarga por plataforma
const DOWNLOADS = {
  windows: {
    filename: 'soporte-remoto-windows.exe',
    label: 'Windows',
    icon: '🪟',
  },
  macos: {
    filename: 'soporte-remoto-macos.dmg',
    label: 'macOS',
    icon: '🍎',
  },
  linux: {
    filename: 'soporte-remoto-linux.sh',
    label: 'Linux',
    icon: '🐧',
  },
  android: {
    filename: 'soporte-remoto-android.apk',
    label: 'Android',
    icon: '🤖',
  },
  ios: {
    filename: null,
    label: 'iOS',
    icon: '📱',
    storeUrl: 'https://apps.apple.com',
  },
};

// Detecta la plataforma del cliente a partir del User-Agent
function detectPlatform(userAgent) {
  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  const osName = (os.name || '').toLowerCase();

  if (osName.includes('windows')) return 'windows';
  if (osName.includes('mac')) return 'macos';
  if (osName.includes('linux') && !osName.includes('android')) return 'linux';
  if (osName.includes('android')) return 'android';
  if (osName.includes('ios')) return 'ios';

  return 'unknown';
}

// Servir archivos estáticos (HTML, CSS, JS del cliente)
app.use(express.static(path.join(__dirname, 'public')));

// API: devuelve la plataforma detectada
app.get('/api/platform', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const platform = detectPlatform(ua);
  const info = DOWNLOADS[platform] || null;

  res.json({
    platform,
    userAgent: ua,
    download: info
      ? {
          filename: info.filename,
          label: info.label,
          available: !!info.filename,
          storeUrl: info.storeUrl || null,
        }
      : null,
  });
});

// Ruta de descarga: sirve el archivo según la plataforma detectada
app.get('/download', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const platform = detectPlatform(ua);
  const info = DOWNLOADS[platform];

  if (!info) {
    return res.status(400).send('Plataforma no reconocida.');
  }

  if (info.storeUrl) {
    return res.redirect(info.storeUrl);
  }

  if (!info.filename) {
    return res.status(404).send('Archivo no disponible para esta plataforma.');
  }

  const filePath = path.join(__dirname, 'downloads', info.filename);

  res.download(filePath, info.filename, (err) => {
    if (err) {
      if (!res.headersSent) {
        res.status(404).json({
          error: 'Archivo no encontrado',
          platform,
          filename: info.filename,
          message: 'Coloca el archivo en la carpeta /downloads/',
        });
      }
    }
  });
});

// Ruta de descarga para plataforma específica (forzar descarga)
app.get('/download/:platform', (req, res) => {
  const platform = req.params.platform.toLowerCase();
  const info = DOWNLOADS[platform];

  if (!info) {
    return res.status(400).json({ error: `Plataforma desconocida: ${platform}` });
  }

  if (info.storeUrl) {
    return res.redirect(info.storeUrl);
  }

  if (!info.filename) {
    return res.status(404).send('Archivo no disponible para esta plataforma.');
  }

  const filePath = path.join(__dirname, 'downloads', info.filename);

  res.download(filePath, info.filename, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({
        error: 'Archivo no encontrado',
        platform,
        filename: info.filename,
        message: 'Coloca el archivo en la carpeta /downloads/',
      });
    }
  });
});

// Escuchar solo en loopback: el tráfico público lo gestiona Caddy
app.listen(PORT, HOST, () => {
  console.log(`✅ Servidor soporte-remoto corriendo en http://${HOST}:${PORT}`);
  console.log(`   (acceso público a través del proxy Caddy)`);
});
