'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile } = require('../middlewares/upload');
const { renderRgb } = require('../controllers/rgb');

router.post('/render', uploadFile, renderRgb);

module.exports = router;
