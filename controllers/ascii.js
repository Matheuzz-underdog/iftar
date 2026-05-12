'use strict';

const { render } = require('../models/renderer');

async function renderAscii(req, res, next) {
  try {
    const { canvas, format } = await render(req.imageBuffer, req.renderOptions);

    res.set('Content-Type', format === 'jpg' ? 'image/jpeg' : 'image/png');
    res.set('Content-Disposition', `inline; filename="ascii.${format}"`);

    const stream = format === 'jpg' || format === 'jpeg'
      ? canvas.createJPEGStream({ quality: 0.92 })
      : canvas.createPNGStream();

    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al generar la imagen' });
      } else {
        res.end();
      }
    });

  } catch (err) {
    const isImageError =
      err.message.includes('unsupported image format') ||
      err.message.includes('Input buffer') ||
      err.message.includes('bad image');

    if (isImageError) {
      return res.status(400).json({
        error: 'No se pudo procesar la imagen.',
        detail: err.message,
      });
    }

    next(err);
  }
}

module.exports = { renderAscii };
