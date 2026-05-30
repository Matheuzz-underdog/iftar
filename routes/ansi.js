'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile } = require('../middlewares/upload');
const { renderAnsi } = require('../controllers/ansi');

router.post('/render', uploadFile, renderAnsi);

module.exports = router;
