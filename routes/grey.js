'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile, uploadUrl } = require('../middlewares/upload');
const { validateGrey } = require('../middlewares/validateGrey');
const { renderGrey } = require('../controllers/grey');

router.post('/render',      uploadFile, validateGrey, renderGrey);
router.post('/render/url', uploadUrl,  validateGrey, renderGrey);

module.exports = router;
