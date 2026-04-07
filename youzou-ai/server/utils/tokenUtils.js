const jwt = require('jsonwebtoken');

function generateTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    subscriptionType: user.subscription_type
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m'
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

function generateResetToken(userId) {
  return jwt.sign(
    { userId, type: 'password_reset' },
    process.env.JWT_RESET_SECRET,
    { expiresIn: '1h' }
  );
}

function verifyResetToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    if (decoded.type !== 'password_reset') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken
};