'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var rateLimit = require('express-rate-limit');

var { asciiRouter, ansiRouter, greyRouter, rgb256Router, rgbRouter } = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Probá de nuevo en 15 minutos.' },
});

app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.use('/api/image/ascii', asciiRouter);
app.use('/api/image/ansi',  ansiRouter);
app.use('/api/image/grey',  greyRouter);
app.use('/api/image/256',   rgb256Router);
app.use('/api/image/rgb',   rgbRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
