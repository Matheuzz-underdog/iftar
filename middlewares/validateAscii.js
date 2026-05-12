'use strict';

const {
  VALID_ASCII_DENSITY,
  VALID_LUMINANCE,
  VALID_FORMATS,
  DEFAULT_COLUMNS,
  DEFAULT_CELLSIZE,
  DEFAULT_BRIGHTNESS,
  DEFAULT_FORMAT,
  DEFAULT_AUTOCONTRAST,
  DEFAULT_DENSITY,
  DEFAULT_LUMINANCE,
} = require('../utils/constants');

function validateAscii(req, res, next) {
  const {
    columns      = DEFAULT_COLUMNS,
    cellSize    = DEFAULT_CELLSIZE,
    brightness  = DEFAULT_BRIGHTNESS,
    format      = DEFAULT_FORMAT,
    autocontrast = DEFAULT_AUTOCONTRAST,
    density     = DEFAULT_DENSITY,
    luminance   = DEFAULT_LUMINANCE,
  } = req.query;

  const cols = parseInt(columns, 10);
  if (isNaN(cols) || cols < 20 || cols > 500) {
    return res.status(400).json({ error: 'columns debe ser un entero entre 20 y 500' });
  }

  const cell = parseInt(cellSize, 10);
  if (isNaN(cell) || cell < 2 || cell > 32) {
    return res.status(400).json({ error: 'cellSize debe ser un entero entre 2 y 32' });
  }

  const bright = parseInt(brightness, 10);
  if (isNaN(bright) || bright < -255 || bright > 255) {
    return res.status(400).json({ error: 'brightness debe ser un entero entre -255 y 255' });
  }

  if (!VALID_FORMATS.includes(format)) {
    return res.status(400).json({ error: `Formato inválido: "${format}"`, valid: ['png', 'jpg'] });
  }

  if (autocontrast !== 'true' && autocontrast !== 'false' && autocontrast !== true && autocontrast !== false) {
    return res.status(400).json({ error: 'autocontrast debe ser true o false' });
  }

  const densityLower = density.toLowerCase();
  if (!VALID_ASCII_DENSITY.includes(densityLower)) {
    return res.status(400).json({ error: `Densidad inválida: "${density}"`, valid: VALID_ASCII_DENSITY });
  }

  const luminanceLower = luminance.toLowerCase();
  if (!VALID_LUMINANCE.includes(luminanceLower)) {
    return res.status(400).json({ error: `Luminancia inválida: "${luminance}"`, valid: VALID_LUMINANCE });
  }

  req.renderOptions = {
    mode: 'ascii',
    format:     format === 'jpeg' ? 'jpg' : format,
    columns:    cols,
    cellSize:   cell,
    brightness: bright,
    autocontrast: autocontrast === 'true' || autocontrast === true,
    density:    densityLower,
    luminance:  luminanceLower,
    dithering:  'none',
  };

  next();
}

module.exports = { validateAscii };
