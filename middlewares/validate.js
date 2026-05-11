'use strict';

const VALID_MODES    = ['ascii', 'ansi', 'grey', '256', 'rgb'];
const VALID_FORMATS  = ['png', 'jpg', 'jpeg'];
const VALID_ASCII_DENSITY = ['original', 'conservative', 'expanded', 'detailed', 'maximum'];
const VALID_COLOR_METHOD = ['classic', 'perceptual'];  // classic=riv.vala, perceptual=euclidiana

// Todos los parámetros de renderizado vienen como query strings (?mode=rgb&cellSize=8)
// Este middleware los valida, convierte al tipo correcto y los adjunta en req.renderOptions
function validate(req, res, next) {
  const {
    mode       = 'rgb',
    format     = 'png',
    columns    = '80',
    cellSize   = '8',
    brightness = '0',
    density    = 'detailed',  // para modo ascii: original(10), conservative(12), expanded(12), detailed(13), maximum(25)
    colorMethod = 'perceptual',  // para modos ansi y 256: classic(riv.vala), perceptual(euclidiana)
  } = req.query;

  // mode
  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({
      error:   `Modo inválido: "${mode}"`,
      valid:   VALID_MODES,
    });
  }

  // format
  if (!VALID_FORMATS.includes(format)) {
    return res.status(400).json({
      error: `Formato inválido: "${format}"`,
      valid: ['png', 'jpg'],
    });
  }

  // columns: controla la resolución horizontal en celdas
  const cols = parseInt(columns, 10);
  if (isNaN(cols) || cols < 20 || cols > 500) {
    return res.status(400).json({
      error: 'columns debe ser un entero entre 20 y 500',
    });
  }

  // cellSize: controla el tamaño de cada celda en px (alto = cellSize * 2)
  const cell = parseInt(cellSize, 10);
  if (isNaN(cell) || cell < 2 || cell > 32) {
    return res.status(400).json({
      error: 'cellSize debe ser un entero entre 2 y 32',
    });
  }

  // brightness: ajuste de brillo, fiel al parámetro -b de tiv.vala
  const bright = parseInt(brightness, 10);
  if (isNaN(bright) || bright < -255 || bright > 255) {
    return res.status(400).json({
      error: 'brightness debe ser un entero entre -255 y 255',
    });
  }

  // density: solo aplica para modo ascii (original, conservative, expanded, detailed, maximum)
  const densityLower = density.toLowerCase();
  if (!VALID_ASCII_DENSITY.includes(densityLower)) {
    return res.status(400).json({
      error:   `Densidad inválida: "${density}"`,
      valid:   VALID_ASCII_DENSITY,
    });
  }

  // colorMethod: método de distancia de color para modos ansi y 256 (classic, perceptual)
  const colorMethodLower = colorMethod.toLowerCase();
  if (!VALID_COLOR_METHOD.includes(colorMethodLower)) {
    return res.status(400).json({
      error:   `Método de color inválido: "${colorMethod}"`,
      valid:   VALID_COLOR_METHOD,
    });
  }

  // Normalizar: jpeg → jpg para que renderer.js solo maneje 'jpg'
  req.renderOptions = {
    mode,
    format:     format === 'jpeg' ? 'jpg' : format,
    columns:    cols,
    cellSize:   cell,
    brightness: bright,
    density:    densityLower,
    colorMethod: colorMethodLower,
  };

  next();
}

module.exports = { validate };