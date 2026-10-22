const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthController {
  /**
   * Handle user login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Find user
      const user = await User.findOne({ email }).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = jwt.sign(
        { email: user.email, username: user.opusername },
        process.env.JWT_PASS || 'oneprofile-dev-secret',
        { expiresIn: '8h' }
      );

      // In production, you should verify the password hash
      // For now, returning basic login response
      return res.status(200).json({
        success: true,
        data: {
          opusername: user.opusername,
          email: user.email,
          token,
        },
      });
    } catch (error) {
      console.error('[AuthController] Login error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during login',
        error: error.message,
      });
    }
  }

  /**
   * Check if username is available during registration
   */
  static async checkUsernameAvailability(req, res) {
    try {
      const { opusername } = req.params;

      if (!opusername || opusername.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Username is required',
        });
      }

      const existingUser = await User.findOne({ opusername });

      if (existingUser) {
        return res.status(200).json({
          success: true,
          available: false,
          message: 'Username is already taken',
        });
      }

      return res.status(200).json({
        success: true,
        available: true,
        message: 'Username is available',
      });
    } catch (error) {
      console.error('[AuthController] Username availability check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while checking username availability',
        error: error.message,
      });
    }
  }

  /**
   * Register a new user
   */
  static async register(req, res) {
    try {
      const { email, password, opusername, codeforces, codechef, leetcode, atcoder } = req.body;

      // Validate required fields
      if (!email || !password || !opusername) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and username are required',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { opusername }],
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email or username already exists',
        });
      }

      // Create new user
      const newUser = new User({
        email,
        password,
        opusername,
        codeforces,
        codechef,
        leetcode,
        atcoder,
        codeforcesRating: 0,
        codechefRating: 0,
        leetcodeRating: 0,
        atcoderRating: 0,
        compositeRating: 0,
        lastRatingUpdate: new Date(),
      });

      const savedUser = await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: savedUser._id,
          opusername: savedUser.opusername,
          email: savedUser.email,
        },
      });
    } catch (error) {
      console.error('[AuthController] Registration error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during registration',
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
