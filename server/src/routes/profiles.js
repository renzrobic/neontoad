const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const crypto = require('crypto');

// Helper to hash PIN
const hashPin = (pin) => {
  return crypto.createHash('sha256').update(pin).digest('hex');
};

// @route   POST /api/profiles/:profileId/pin
// @desc    Set or remove a PIN for a specific profile
// @access  Private
router.post('/:profileId/pin', verifyToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const { pin, remove } = req.body;
    const uid = req.user.uid;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profiles = userDoc.data().profiles || [];
    const profileIndex = profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (remove) {
      profiles[profileIndex].pinHash = null;
      profiles[profileIndex].hasPin = false;
    } else {
      if (!pin || pin.length !== 4) {
        return res.status(400).json({ error: 'PIN must be 4 digits' });
      }
      profiles[profileIndex].pinHash = hashPin(pin);
      profiles[profileIndex].hasPin = true;
    }

    await userRef.update({ profiles });

    res.json({ success: true, message: remove ? 'PIN removed' : 'PIN updated' });
  } catch (error) {
    console.error('Error updating PIN:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/profiles/:profileId/verify-pin
// @desc    Verify a PIN to unlock a profile
// @access  Private
router.post('/:profileId/verify-pin', verifyToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const { pin } = req.body;
    const uid = req.user.uid;

    if (!pin) return res.status(400).json({ error: 'PIN is required' });
    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profiles = userDoc.data().profiles || [];
    const profile = profiles.find(p => p.id === profileId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.pinHash) {
      return res.json({ success: true, message: 'Profile has no PIN' });
    }

    const hashedInput = hashPin(pin);
    if (hashedInput === profile.pinHash) {
      res.json({ success: true, message: 'PIN verified' });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect PIN' });
    }

  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/profiles
// @desc    Add a new profile
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const profileData = req.body;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const profiles = userDoc.data().profiles || [];
    if (profiles.length >= 5) {
      return res.status(400).json({ error: 'Maximum 5 profiles allowed' });
    }

    const newProfile = {
      id: Date.now().toString(),
      ...profileData
    };

    profiles.push(newProfile);
    await userRef.update({ profiles });

    res.json({ success: true, profile: newProfile });
  } catch (error) {
    console.error('Error adding profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profiles/:profileId
// @desc    Update a profile
// @access  Private
router.put('/:profileId', verifyToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const profileData = req.body;
    const uid = req.user.uid;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const profiles = userDoc.data().profiles || [];
    const profileIndex = profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profiles[profileIndex] = { ...profiles[profileIndex], ...profileData };
    await userRef.update({ profiles });

    res.json({ success: true, profile: profiles[profileIndex] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/profiles/:profileId
// @desc    Delete a profile and cascade delete reels/comments
// @access  Private
router.delete('/:profileId', verifyToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const uid = req.user.uid;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const profiles = userDoc.data().profiles || [];
    const profileToDelete = profiles.find(p => p.id === profileId);

    if (!profileToDelete) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    await userRef.update({ profiles: updatedProfiles });

    // Cascade delete: remove all reels and their comments created by this profile
    try {
      const reelsSnapshot = await db.collection('reels')
        .where('userId', '==', uid)
        .where('userName', '==', profileToDelete.name)
        .get();

      const batch = db.batch();
      
      for (const reelDoc of reelsSnapshot.docs) {
        // Delete comments subcollection for this reel
        const commentsSnapshot = await db.collection('reels').doc(reelDoc.id).collection('comments').get();
        for (const commentDoc of commentsSnapshot.docs) {
          batch.delete(commentDoc.ref);
        }
        // Delete the reel
        batch.delete(reelDoc.ref);
      }
      
      await batch.commit();
    } catch (err) {
      console.error("Failed to delete profile's reels:", err);
      // We don't fail the whole request if cascade fails, but we log it
    }

    res.json({ success: true, message: 'Profile deleted' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
