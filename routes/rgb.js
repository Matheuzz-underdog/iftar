'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile, uploadUrl } = require('../middlewares/upload');
const { validateRgb } = require('../middlewares/validateRgb');
const { renderRgb } = require('../controllers/rgb');

router.post('/render',      uploadFile, validateRgb, renderRgb);
router.post('/render/url', uploadUrl,  validateRgb, renderRgb);

module.exports = router;
