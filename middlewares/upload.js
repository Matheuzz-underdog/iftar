'use strict';

const { URL } = require('url');
const multer = require('multer');
const axios  = require('axios');

const MAGIC_BYTES = {
  'image/png':  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/gif':  [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]],
  'image/bmp':  [[0x42, 0x4D]],
};

function checkMagicBytes(buffer, mimetype) {
  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;

  for (const sig of signatures) {
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (sig[i] === null) continue;
      if (buffer[i] !== sig[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

function isSafeUrl(raw) {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const h = u.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
    if (h === '169.254.169.254') return false;
    return true;
  } catch { return false; }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`));
  },
});

function uploadFile(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({
        error: 'No se recibió ningún archivo. Campo multipart esperado: "image"',
      });
    }

    if (!checkMagicBytes(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({
        error: 'El archivo no corresponde a una imagen válida. Verificá que no esté corrupto.',
      });
    }

    req.imageBuffer = req.file.buffer;
    next();
  });
}

async function uploadUrl(req, res, next) {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'El campo "url" es requerido en el body JSON' });
  }

  if (!isSafeUrl(url)) {
    return res.status(400).json({ error: 'URL no permitida' });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxContentLength: 10 * 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; tiv-API/1.0)',
      },
    });

    const contentType = response.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({
        error: `La URL no apunta a una imagen. Content-Type recibido: "${contentType}"`,
      });
    }

    const buffer = Buffer.from(response.data);

    if (!checkMagicBytes(buffer, contentType)) {
      return res.status(400).json({
        error: 'El contenido descargado no corresponde a una imagen válida.',
      });
    }

    req.imageBuffer = buffer;
    next();
  } catch (err) {
    if (err.response) {
      return res.status(400).json({
        error: `No se pudo descargar la imagen: HTTP ${err.response.status}`,
      });
    }
    return res.status(400).json({
      error: `Error al descargar la imagen: ${err.message}`,
    });
  }
}

module.exports = { uploadFile, uploadUrl };
