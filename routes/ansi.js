'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile, uploadUrl } = require('../middlewares/upload');
const { validateAnsi } = require('../middlewares/validateAnsi');
const { renderAnsi } = require('../controllers/ansi');

router.post('/render',      uploadFile, validateAnsi, renderAnsi);
router.post('/render/url', uploadUrl,  validateAnsi, renderAnsi);

module.exports = router;
