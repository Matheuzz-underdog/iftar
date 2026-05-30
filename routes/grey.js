'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile } = require('../middlewares/upload');
const { renderGrey } = require('../controllers/grey');

router.post('/render', uploadFile, renderGrey);

module.exports = router;
