const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { db } = require('../config/firebase');

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

// @route   POST /api/lists
// @desc    Create a custom list
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { profileId, name } = req.body;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    if (!name || name.trim() === '') return res.status(400).json({ error: 'List name is required' });

    const { userRef, profiles, profileIndex } = await getActiveProfile(uid, profileId);
    
    const activeProfile = profiles[profileIndex];
    const customLists = activeProfile.customLists || [];
    
    if (customLists.some(l => l.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(400).json({ error: 'A list with this name already exists' });
    }

    const newList = {
      id: 'list_' + Date.now().toString(),
      name: name.trim(),
      createdAt: Date.now(),
      items: []
    };

    customLists.push(newList);
    profiles[profileIndex].customLists = customLists;

    await userRef.update({ profiles });
    res.json({ success: true, list: newList });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// @route   POST /api/lists/:listId/toggle
// @desc    Toggle anime in a custom list
// @access  Private
router.post('/:listId/toggle', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { listId } = req.params;
    const { profileId, anime } = req.body;

    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const { userRef, profiles, profileIndex } = await getActiveProfile(uid, profileId);
    
    const activeProfile = profiles[profileIndex];
    const customLists = activeProfile.customLists || [];
    const listIndex = customLists.findIndex(l => l.id === listId);
    
    if (listIndex === -1) return res.status(404).json({ error: 'List not found' });

    const list = customLists[listIndex];
    const items = list.items || [];
    const isAdded = items.some(i => i.id === anime.id);

    let newItems;
    let added = false;
    if (isAdded) {
      newItems = items.filter(i => i.id !== anime.id);
    } else {
      const animeData = {
        id: anime.id,
        title: anime.title,
        image: anime.image || anime.coverImage || '',
        addedAt: Date.now()
      };
      newItems = [animeData, ...items];
      added = true;
    }

    list.items = newItems;
    customLists[listIndex] = list;
    profiles[profileIndex].customLists = customLists;

    await userRef.update({ profiles });
    res.json({ success: true, added });
  } catch (error) {
    console.error('Error toggling list item:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

module.exports = router;
