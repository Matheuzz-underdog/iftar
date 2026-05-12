'use strict';

const {
  VALID_DITHERING,
  VALID_FORMATS,
  DEFAULT_COLUMNS,
  DEFAULT_CELLSIZE,
  DEFAULT_BRIGHTNESS,
  DEFAULT_FORMAT,
  DEFAULT_AUTOCONTRAST,
  DEFAULT_DITHERING,
} = require('../utils/constants');

function validateRgb(req, res, next) {
  const {
    columns      = DEFAULT_COLUMNS,
    cellSize    = DEFAULT_CELLSIZE,
    brightness  = DEFAULT_BRIGHTNESS,
    format      = DEFAULT_FORMAT,
    autocontrast = DEFAULT_AUTOCONTRAST,
    dithering   = DEFAULT_DITHERING,
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

  const ditheringLower = dithering.toLowerCase();
  if (!VALID_DITHERING.includes(ditheringLower)) {
    return res.status(400).json({ error: `Dithering inválido: "${dithering}"`, valid: VALID_DITHERING });
  }

  req.renderOptions = {
    mode:        'rgb',
    format:      format === 'jpeg' ? 'jpg' : format,
    columns:     cols,
    cellSize:    cell,
    brightness:  bright,
    autocontrast: autocontrast === 'true' || autocontrast === true,
    dithering:  ditheringLower,
  };

  next();
}

module.exports = { validateRgb };
