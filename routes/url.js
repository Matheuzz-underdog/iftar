'use strict';

const express = require('express');
const router  = express.Router();

const { uploadUrl } = require('../middlewares/upload');
const { renderAscii } = require('../controllers/ascii');
const { renderAnsi }  = require('../controllers/ansi');
const { renderGrey }  = require('../controllers/grey');
const { render256 }   = require('../controllers/256');
const { renderRgb }   = require('../controllers/rgb');

router.post('/ascii/render/url', uploadUrl, renderAscii);
router.post('/ansi/render/url',  uploadUrl, renderAnsi);
router.post('/grey/render/url',  uploadUrl, renderGrey);
router.post('/256/render/url',   uploadUrl, render256);
router.post('/rgb/render/url',   uploadUrl, renderRgb);

module.exports = router;
