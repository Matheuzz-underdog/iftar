'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile, uploadUrl } = require('../middlewares/upload');
const { validateAscii } = require('../middlewares/validateAscii');
const { renderAscii } = require('../controllers/ascii');

router.post('/render',      uploadFile, validateAscii, renderAscii);
router.post('/render/url', uploadUrl,  validateAscii, renderAscii);

module.exports = router;
