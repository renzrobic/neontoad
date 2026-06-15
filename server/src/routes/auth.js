const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { auth } = require('../config/firebase');

// @route   POST /api/auth/revoke-sessions
// @desc    Revoke all refresh tokens for a user, forcing re-authentication
// @access  Private
router.post('/revoke-sessions', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    if (!auth) {
      return res.status(500).json({ error: 'Firebase Auth Admin not initialized' });
    }

    // This will revoke all refresh tokens for the user
    await auth.revokeRefreshTokens(uid);
    
    // The tokens are revoked immediately, but active ID tokens might still be valid
    // for up to an hour unless checked. We can also optionally update a field in Firestore
    // to force the client to log out via a snapshot listener.
    
    res.json({ success: true, message: 'All sessions revoked' });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete the entire user account and cascade delete reels/comments
// @access  Private
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    if (!db || !auth) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    // 1. Cascade delete all reels and their comments for this user
    try {
      const reelsSnapshot = await db.collection('reels').where('userId', '==', uid).get();
      const batch = db.batch();
      
      for (const reelDoc of reelsSnapshot.docs) {
        const commentsSnapshot = await db.collection('reels').doc(reelDoc.id).collection('comments').get();
        for (const commentDoc of commentsSnapshot.docs) {
          batch.delete(commentDoc.ref);
        }
        batch.delete(reelDoc.ref);
      }
      await batch.commit();
    } catch (err) {
      console.error("Failed to delete user's reels:", err);
    }

    // 2. Delete user document from firestore
    await db.collection('users').doc(uid).delete();
    
    // 3. Delete user from Firebase Auth
    await auth.deleteUser(uid);
    
    res.json({ success: true, message: 'Account successfully deleted' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
