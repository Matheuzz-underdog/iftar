'use strict';

const asciiRouter = require('./ascii');
const ansiRouter  = require('./ansi');
const greyRouter  = require('./grey');
const rgb256Router = require('./256');
const rgbRouter  = require('./rgb');

module.exports = {
  asciiRouter,
  ansiRouter,
  greyRouter,
  rgb256Router,
  rgbRouter,
};
