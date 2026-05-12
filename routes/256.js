'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile, uploadUrl } = require('../middlewares/upload');
const { validate256 } = require('../middlewares/validate256');
const { render256 } = require('../controllers/256');

router.post('/render',      uploadFile, validate256, render256);
router.post('/render/url', uploadUrl,  validate256, render256);

module.exports = router;
