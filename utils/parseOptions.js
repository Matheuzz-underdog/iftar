'use strict';

function parseColumns(value) {
  const cols = parseInt(value, 10);
  if (isNaN(cols) || cols < 20 || cols > 500) {
    throw { status: 400, error: 'columns debe ser un entero entre 20 y 500' };
  }
  return cols;
}

function parseCellSize(value) {
  const cell = parseInt(value, 10);
  if (isNaN(cell) || cell < 2 || cell > 32) {
    throw { status: 400, error: 'cellSize debe ser un entero entre 2 y 32' };
  }
  return cell;
}

function parseBrightness(value) {
  const bright = parseInt(value, 10);
  if (isNaN(bright) || bright < -255 || bright > 255) {
    throw { status: 400, error: 'brightness debe ser un entero entre -255 y 255' };
  }
  return bright;
}

function parseFormat(value) {
  if (value === 'jpeg') return 'jpg';
  if (!['jpg', 'png'].includes(value)) {
    throw { status: 400, error: `Formato inválido: "${value}"`, valid: ['png', 'jpg'] };
  }
  return value;
}

function parseAutocontrast(value) {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  throw { status: 400, error: 'autocontrast debe ser true o false' };
}

module.exports = { parseColumns, parseCellSize, parseBrightness, parseFormat, parseAutocontrast };
