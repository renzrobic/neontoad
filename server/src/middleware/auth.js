const { auth } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    if (!auth) {
      // If Firebase Admin isn't fully set up yet, we'll bypass temporarily for development
      // WARNING: DO NOT DO THIS IN PRODUCTION
      console.warn("Firebase Admin Auth not initialized. Bypassing token verification for dev.");
      req.user = { uid: 'dev-user-id' };
      return next();
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

module.exports = { verifyToken };
