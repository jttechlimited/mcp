const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenUtils');
const { sendVerificationEmail } = require('../utils/emailUtils');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register with email
router.post('/register', async (req, res) => {
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { email, phone, password, name } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: {
          message: '電子郵件已被註冊',
          code: 'EMAIL_EXISTS'
        }
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      `INSERT INTO users (email, phone, password_hash, name, points) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, points, subscription_type, created_at`,
      [email, phone, passwordHash, name, 100] // 100 points for new users
    );

    const user = result.rows[0];

    // Add points transaction record
    await query(
      'INSERT INTO points_transactions (user_id, points_change, transaction_type, description) VALUES ($1, $2, $3, $4)',
      [user.id, 100, 'registration_bonus', '新用戶註冊獎勵']
    );

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Generate tokens
    const tokens = generateTokens(user);

    logger.info(`New user registered: ${email}`);
    
    res.status(201).json({
      message: '註冊成功，請檢查電子郵件進行驗證',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          points: user.points,
          subscriptionType: user.subscription_type
        },
        tokens
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: '註冊失敗，請稍後再試',
        code: 'REGISTRATION_FAILED'
      }
    });
  }
});

// Login with email
router.post('/login', async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { email, password } = req.body;

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, name, points, subscription_type, email_verified, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          message: '電子郵件或密碼錯誤',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: {
          message: '帳戶已被停用',
          code: 'ACCOUNT_DISABLED'
        }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: '電子郵件或密碼錯誤',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const tokens = generateTokens(user);

    logger.info(`User logged in: ${email}`);
    
    res.json({
      message: '登入成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          points: user.points,
          subscriptionType: user.subscription_type,
          emailVerified: user.email_verified
        },
        tokens
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: {
        message: '登入失敗，請稍後再試',
        code: 'LOGIN_FAILED'
      }
    });
  }
});

// Google OAuth login
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: {
          message: 'Google ID token is required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let result = await query(
      'SELECT id, email, name, points, subscription_type, google_id FROM users WHERE email = $1',
      [email]
    );

    let user;
    if (result.rows.length === 0) {
      // Create new user with Google account
      const insertResult = await query(
        `INSERT INTO users (email, google_id, name, avatar_url, points, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, email, name, points, subscription_type, email_verified`,
        [email, googleId, name, picture, 100, true]
      );
      
      user = insertResult.rows[0];
      
      // Add points transaction record
      await query(
        'INSERT INTO points_transactions (user_id, points_change, transaction_type, description) VALUES ($1, $2, $3, $4)',
        [user.id, 100, 'registration_bonus', '新用戶註冊獎勵']
      );
      
      logger.info(`New user registered via Google: ${email}`);
    } else {
      user = result.rows[0];
      
      // Update Google ID if not exists
      if (!user.google_id) {
        await query(
          'UPDATE users SET google_id = $1, avatar_url = $2, email_verified = true WHERE id = $3',
          [googleId, picture, user.id]
        );
      }
    }

    // Generate tokens
    const tokens = generateTokens(user);

    res.json({
      message: 'Google 登入成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          points: user.points,
          subscriptionType: user.subscription_type,
          emailVerified: true,
          avatarUrl: picture
        },
        tokens
      }
    });

  } catch (error) {
    logger.error('Google login error:', error);
    res.status(500).json({
      error: {
        message: 'Google 登入失敗，請稍後再試',
        code: 'GOOGLE_LOGIN_FAILED'
      }
    });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        }
      });
    }

    const userData = verifyRefreshToken(refreshToken);
    if (!userData) {
      return res.status(401).json({
        error: {
          message: '無效的刷新令牌',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }

    // Generate new tokens
    const tokens = generateTokens(userData);

    res.json({
      message: 'Token refreshed successfully',
      data: { tokens }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: {
        message: '刷新令牌失敗，請稍後再試',
        code: 'TOKEN_REFRESH_FAILED'
      }
    });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email_verification') {
      return res.status(400).json({
        error: {
          message: '無效的驗證令牌',
          code: 'INVALID_VERIFICATION_TOKEN'
        }
      });
    }

    await query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [decoded.userId]
    );

    res.json({
      message: '電子郵件驗證成功'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(400).json({
      error: {
        message: '驗證令牌已過期或無效',
        code: 'VERIFICATION_FAILED'
      }
    });
  }
});

module.exports = router;