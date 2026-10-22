const Problemset = require('../models/Problemset');

class ProblemsetController {
  /**
   * Get all problems
   */
  static async getAllProblems(req, res) {
    try {
      const problems = await Problemset.find({}).lean();

      return res.status(200).json({
        success: true,
        data: problems,
        totalProblems: problems.length,
      });
    } catch (error) {
      console.error('[ProblemsetController] Get all problems error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching problems',
        error: error.message,
      });
    }
  }

  /**
   * Create a new problem
   */
  static async createProblem(req, res) {
    try {
      const { title, description, link, difficulty, platform } = req.body;

      // Validate required fields
      if (!title || !link) {
        return res.status(400).json({
          success: false,
          message: 'Title and link are required',
        });
      }

      const newProblem = new Problemset({
        title,
        description,
        link,
        difficulty,
        platform,
        status: [],
        createdAt: new Date(),
      });

      const savedProblem = await newProblem.save();

      return res.status(201).json({
        success: true,
        message: 'Problem created successfully',
        data: savedProblem,
      });
    } catch (error) {
      console.error('[ProblemsetController] Create problem error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating problem',
        error: error.message,
      });
    }
  }

  /**
   * Update problem status for a user (toggle solved status)
   */
  static async updateProblemStatus(req, res) {
    try {
      const { username, link } = req.body;

      if (!username || !link) {
        return res.status(400).json({
          success: false,
          message: 'Username and problem link are required',
        });
      }

      const problem = await Problemset.findOne({ link });

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      // Check if user has already solved this problem
      const userIndex = problem.status.indexOf(username);

      if (userIndex === -1) {
        // User hasn't solved it, add to status
        problem.status.push(username);
        await problem.save();

        return res.status(200).json({
          success: true,
          message: 'Problem marked as solved',
          data: {
            link: problem.link,
            solved: true,
            solvedBy: problem.status.length,
          },
        });
      } else {
        // User has solved it, remove from status
        problem.status.splice(userIndex, 1);
        await problem.save();

        return res.status(200).json({
          success: true,
          message: 'Problem marked as unsolved',
          data: {
            link: problem.link,
            solved: false,
            solvedBy: problem.status.length,
          },
        });
      }
    } catch (error) {
      console.error('[ProblemsetController] Update problem status error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating problem status',
        error: error.message,
      });
    }
  }

  /**
   * Delete a problem
   */
  static async deleteProblem(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Problem ID is required',
        });
      }

      const deletedProblem = await Problemset.findByIdAndDelete(id);

      if (!deletedProblem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Problem deleted successfully',
      });
    } catch (error) {
      console.error('[ProblemsetController] Delete problem error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while deleting problem',
        error: error.message,
      });
    }
  }
}

module.exports = ProblemsetController;
