import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState(null);
  const [activeProfile, setActiveProfile] = useState(() => {
    const saved = localStorage.getItem('activeProfile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Debounce ref for watch progress
  const progressWriteTimer = useRef(null);

  useEffect(() => {
    let profileUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous profile listener
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Check admin
        const checkAdminStatus = async () => {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
            setIsAdmin(adminDoc.exists());
          } catch (e) {
            setIsAdmin(false);
          }
        };
        checkAdminStatus();
        
        // Real-time listener for READS only
        profileUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const p = data.profiles || [];
            setProfiles(p);
            setIsBanned(data.isBanned === true);
            
            // Auto-select profile
            const saved = localStorage.getItem('activeProfile');
            if (p.length === 1 && !saved) {
              setActiveProfile(p[0]);
              localStorage.setItem('activeProfile', JSON.stringify(p[0]));
            }
          } else {
            // Initial document creation upon first ever login
            await setDoc(userDocRef, { 
              email: currentUser.email,
              createdAt: new Date().toISOString(),
              profiles: [],
              isBanned: false
            });
            setProfiles([]);
            setIsBanned(false);
          }
          setLoading(false);
        });
      } else {
        setProfiles([]);
        setActiveProfile(null);
        setIsBanned(false);
        setIsAdmin(false);
        localStorage.removeItem('activeProfile');
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    localStorage.removeItem('activeProfile');
    setActiveProfile(null);
    return signInWithEmailAndPassword(auth, email, password);
  }, []);
  
  const register = useCallback(async (email, password) => {
    localStorage.removeItem('activeProfile');
    setActiveProfile(null);
    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('activeProfile');
    return signOut(auth);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    localStorage.removeItem('activeProfile');
    setActiveProfile(null);
    return signInWithPopup(auth, googleProvider);
  }, []);

  const selectProfile = useCallback((profile) => {
    setActiveProfile(profile);
    localStorage.setItem('activeProfile', JSON.stringify(profile));
  }, []);

  // ----------------------------------------------------
  // Backend Mutated Functions
  // ----------------------------------------------------

  const addProfile = useCallback(async (profileData) => {
    if (!user) return;
    const res = await apiRequest('/profiles', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
    return res.profile;
  }, [user]);

  const updateProfile = useCallback(async (id, profileData) => {
    if (!user) return;
    await apiRequest(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (activeProfile?.id === id) {
      const newActive = { ...activeProfile, ...profileData };
      setActiveProfile(newActive);
      localStorage.setItem('activeProfile', JSON.stringify(newActive));
    }
  }, [user, activeProfile]);

  const deleteProfile = useCallback(async (id) => {
    if (!user) return;
    await apiRequest(`/profiles/${id}`, { method: 'DELETE' });
    if (activeProfile?.id === id) {
      setActiveProfile(null);
      localStorage.removeItem('activeProfile');
    }
  }, [user, activeProfile]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    await apiRequest('/auth/account', { method: 'DELETE' });
    localStorage.removeItem('activeProfile');
    setActiveProfile(null);
    // Note: auth.deleteUser() is handled by the backend. 
    // The client will automatically sign out when the token is invalidated.
    await signOut(auth);
  }, [user]);

  const updateWatchProgress = useCallback(async (anime, episode, time, duration) => {
    if (!user || !activeProfile) return;
    if (time < 5) return;
    
    // Optimistic update for snappy UI
    const history = activeProfile.watchHistory || [];
    const filtered = history.filter(h => h.animeId !== anime.id);
    const newEntry = {
      animeId: anime.id, animeTitle: anime.title, animeImage: anime.image,
      episodeId: episode.id, episodeNumber: episode.episodeNumber, episodeTitle: episode.title,
      time, duration, updatedAt: Date.now()
    };
    
    const newHistory = [newEntry, ...filtered].slice(0, 20);
    const newActive = { ...activeProfile, watchHistory: newHistory };
    setActiveProfile(newActive);
    localStorage.setItem('activeProfile', JSON.stringify(newActive));

    // Debounced Backend Update (max 1 per 30s)
    if (progressWriteTimer.current) clearTimeout(progressWriteTimer.current);
    progressWriteTimer.current = setTimeout(async () => {
      try {
        await apiRequest('/interactions/progress', {
          method: 'POST',
          body: JSON.stringify({ profileId: activeProfile.id, anime, episode, time, duration })
        });
      } catch (e) {
        console.error("Failed to update progress:", e);
      }
    }, 30000);
  }, [user, activeProfile]);

  const toggleFavorite = useCallback(async (anime) => {
    if (!user || !activeProfile) return;
    
    // Optimistic Update
    const favorites = activeProfile.favorites || [];
    const isFavorite = favorites.some(f => f.id === anime.id);
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter(f => f.id !== anime.id);
    } else {
      newFavorites = [{ id: anime.id, title: anime.title, image: anime.image || anime.coverImage || '', addedAt: Date.now() }, ...favorites];
    }
    const newActive = { ...activeProfile, favorites: newFavorites };
    setActiveProfile(newActive);
    localStorage.setItem('activeProfile', JSON.stringify(newActive));

    try {
      await apiRequest('/interactions/favorites', {
        method: 'POST',
        body: JSON.stringify({ profileId: activeProfile.id, anime })
      });
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
    }
  }, [user, activeProfile]);

  const toggleFollow = useCallback(async (targetUserId) => {
    if (!user || !activeProfile || targetUserId === user.uid) return;
    try {
      await apiRequest('/interactions/follow', {
        method: 'POST',
        body: JSON.stringify({ profileId: activeProfile.id, targetUserId })
      });
      // Snapshot listener will grab the fresh state
    } catch (e) {
      console.error("Failed to follow user:", e);
    }
  }, [user, activeProfile]);

  const createCustomList = useCallback(async (name) => {
    if (!user || !activeProfile) return;
    const res = await apiRequest('/lists', {
      method: 'POST',
      body: JSON.stringify({ profileId: activeProfile.id, name })
    });
    return res.list;
  }, [user, activeProfile]);

  const toggleAnimeInCustomList = useCallback(async (listId, anime) => {
    if (!user || !activeProfile) return;
    const res = await apiRequest(`/lists/${listId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ profileId: activeProfile.id, anime })
    });
    return res.added;
  }, [user, activeProfile]);

  const updateProfileSettings = useCallback(async (settingsData) => {
    if (!user || !activeProfile) return;
    
    // Optimsitic UI sync
    const newActive = { ...activeProfile, ...settingsData };
    setActiveProfile(newActive);
    localStorage.setItem('activeProfile', JSON.stringify(newActive));

    try {
      await apiRequest(`/profiles/${activeProfile.id}`, {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });
    } catch (e) {
      console.error("Failed to update profile settings:", e);
    }
  }, [user, activeProfile]);

  const value = useMemo(() => ({
    user,
    profiles,
    activeProfile,
    isBanned,
    isAdmin,
    selectProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    deleteAccount,
    updateWatchProgress,
    toggleFavorite,
    toggleFollow,
    createCustomList,
    toggleAnimeInCustomList,
    updateProfileSettings,
    login,
    register,
    logout,
    loginWithGoogle,
    loading
  }), [
    user, profiles, activeProfile, isBanned, isAdmin, selectProfile, 
    addProfile, updateProfile, deleteProfile, deleteAccount, 
    updateWatchProgress, toggleFavorite, toggleFollow, 
    createCustomList, toggleAnimeInCustomList, updateProfileSettings, 
    login, register, logout, loginWithGoogle, loading
  ]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
