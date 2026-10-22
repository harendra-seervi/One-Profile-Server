const express = require('express');
const ContestController = require('../controllers/contestController');

const router = express.Router();

router.get('/', ContestController.getContests);

module.exports = router;
