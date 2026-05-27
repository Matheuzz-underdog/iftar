'use strict';

const { render } = require('../models/renderer');

async function renderRgb(req, res, next) {
  try {
    const { canvas, format } = await render(req.imageBuffer, req.renderOptions);

    res.set('Content-Type', format === 'jpg' ? 'image/jpeg' : 'image/png');
    res.set('Content-Disposition', `inline; filename="rgb.${format}"`);

    const stream = format === 'jpg'
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
      err.message.includes('bad image') ||
      err.message.includes('excede');

    if (isImageError) {
      return res.status(400).json({
        error: err.message,
        detail: err.message,
      });
    }

    next(err);
  }
}

module.exports = { renderRgb };
