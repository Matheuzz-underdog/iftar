'use strict';

const express = require('express');
const router  = express.Router();

const { uploadFile } = require('../middlewares/upload');
const { render256 } = require('../controllers/256');

router.post('/render', uploadFile, render256);

module.exports = router;
