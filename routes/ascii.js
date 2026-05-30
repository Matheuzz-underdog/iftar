'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile } = require('../middlewares/upload');
const { renderAscii } = require('../controllers/ascii');

router.post('/render', uploadFile, renderAscii);

module.exports = router;
