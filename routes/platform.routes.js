const router = require('express').Router();
const {
    codeChefController,
    codeForcesController,
    leetCodeController,
    atCoderController,
    hackerrankController,
    opController } = require('../controllers/platform.controllers');


router.get('/codechef/:userHandle', codeChefController);
router.get('/codeforces/:userHandle', codeForcesController);
router.get('/leetcode/:userHandle', leetCodeController);
router.get('/atcoder/:userHandle', atCoderController);
router.get('/hackerrank/:userHandle', hackerrankController);
router.get('/op/:userHandle', opController);

module.exports = router;