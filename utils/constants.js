'use strict';

const VALID_MODES    = ['ascii', 'ansi', 'grey', '256', 'rgb'];
const VALID_FORMATS  = ['png', 'jpg', 'jpeg'];
const VALID_ASCII_DENSITY = ['original', 'conservative', 'expanded', 'detailed', 'maximum'];
const VALID_COLOR_METHOD = ['classic', 'perceptual'];
const VALID_DITHERING = ['none', 'floyd-steinberg', 'atkinson', 'ordered'];
const VALID_LUMINANCE = ['bt709', 'ntsc', 'gamma'];

const MAX_PIXELS = 4096 * 4096;
const DEFAULT_COLUMNS    = 80;
const DEFAULT_CELLSIZE   = 8;
const DEFAULT_BRIGHTNESS = 0;
const DEFAULT_FORMAT     = 'png';
const DEFAULT_AUTOCONTRAST = false;
const DEFAULT_DITHERING  = 'none';
const DEFAULT_DENSITY    = 'original';
const DEFAULT_LUMINANCE  = 'bt709';
const DEFAULT_COLORMETHOD = 'perceptual';

module.exports = {
  VALID_MODES,
  VALID_FORMATS,
  VALID_ASCII_DENSITY,
  VALID_COLOR_METHOD,
  VALID_DITHERING,
  VALID_LUMINANCE,
  MAX_PIXELS,
  DEFAULT_COLUMNS,
  DEFAULT_CELLSIZE,
  DEFAULT_BRIGHTNESS,
  DEFAULT_FORMAT,
  DEFAULT_AUTOCONTRAST,
  DEFAULT_DITHERING,
  DEFAULT_DENSITY,
  DEFAULT_LUMINANCE,
  DEFAULT_COLORMETHOD,
};
