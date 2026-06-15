const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { db, FieldValue } = require('../config/firebase');

// Helper to get user profile
const getActiveProfile = async (uid, profileId) => {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error('User not found');
  const profiles = userDoc.data().profiles || [];
  const profileIndex = profiles.findIndex(p => p.id === profileId);
  if (profileIndex === -1) throw new Error('Profile not found');
  return { userRef, profiles, profileIndex };
};

// @route   POST /api/interactions/progress
// @desc    Update watch progress
// @access  Private
router.post('/progress', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { profileId, anime, episode, time, duration } = req.body;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    if (time < 5) return res.json({ success: true, ignored: true }); // Don't save if < 5s

    const { userRef, profiles, profileIndex } = await getActiveProfile(uid, profileId);
    
    const activeProfile = profiles[profileIndex];
    const history = activeProfile.watchHistory || [];
    const filtered = history.filter(h => h.animeId !== anime.id);
    
    const newEntry = {
      animeId: anime.id,
      animeTitle: anime.title,
      animeImage: anime.image,
      episodeId: episode.id,
      episodeNumber: episode.episodeNumber,
      episodeTitle: episode.title,
      time,
      duration,
      updatedAt: Date.now()
    };
    
    const newHistory = [newEntry, ...filtered].slice(0, 20); // Keep last 20
    profiles[profileIndex].watchHistory = newHistory;

    await userRef.update({ profiles });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// @route   POST /api/interactions/favorites
// @desc    Toggle favorite anime
// @access  Private
router.post('/favorites', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { profileId, anime } = req.body;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const { userRef, profiles, profileIndex } = await getActiveProfile(uid, profileId);
    
    const activeProfile = profiles[profileIndex];
    const favorites = activeProfile.favorites || [];
    const isFavorite = favorites.some(f => f.id === anime.id);
    
    let newFavorites;
    let added = false;
    if (isFavorite) {
      newFavorites = favorites.filter(f => f.id !== anime.id);
    } else {
      const animeData = {
        id: anime.id,
        title: anime.title,
        image: anime.image || anime.coverImage || '',
        addedAt: Date.now()
      };
      newFavorites = [animeData, ...favorites];
      added = true;
    }

    profiles[profileIndex].favorites = newFavorites;
    await userRef.update({ profiles });
    res.json({ success: true, added });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// @route   POST /api/interactions/follow
// @desc    Toggle follow target user
// @access  Private
router.post('/follow', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { profileId, targetUserId } = req.body;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    if (uid === targetUserId) return res.status(400).json({ error: 'Cannot follow yourself' });

    const { userRef, profiles, profileIndex } = await getActiveProfile(uid, profileId);
    
    const activeProfile = profiles[profileIndex];
    const following = activeProfile.following || [];
    const isFollowing = following.includes(targetUserId);
    
    let newFollowing;
    if (isFollowing) {
      newFollowing = following.filter(id => id !== targetUserId);
    } else {
      newFollowing = [...following, targetUserId];
    }

    profiles[profileIndex].following = newFollowing;

    // Batch update both user documents
    const batch = db.batch();
    batch.update(userRef, { profiles });

    const targetUserRef = db.collection('users').doc(targetUserId);
    if (isFollowing) {
      batch.update(targetUserRef, { followers: FieldValue.arrayRemove(uid) });
    } else {
      batch.update(targetUserRef, { followers: FieldValue.arrayUnion(uid) });
    }

    await batch.commit();
    res.json({ success: true, followed: !isFollowing });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

module.exports = router;
