const express = require('express');
const ProblemsetController = require('../controllers/problemsetController');

const router = express.Router();

/**
 * @route   GET /api/problemset
 * @desc    Get all problems
 * @access  Public
 */
router.get('/', ProblemsetController.getAllProblems);

/**
 * @route   POST /api/problemset
 * @desc    Create a new problem
 * @access  Public (should be protected in production)
 */
router.post('/', ProblemsetController.createProblem);

/**
 * @route   POST /api/problemset/status
 * @desc    Update problem status (mark as solved/unsolved)
 * @access  Public (should be protected in production)
 */
router.post('/status', ProblemsetController.updateProblemStatus);

/**
 * @route   DELETE /api/problemset/:id
 * @desc    Delete a problem
 * @access  Public (should be protected in production)
 */
router.delete('/:id', ProblemsetController.deleteProblem);

module.exports = router;
