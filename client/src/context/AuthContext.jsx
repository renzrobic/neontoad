import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
 onAuthStateChanged, 
 signInWithEmailAndPassword, 
 createUserWithEmailAndPassword, 
 signOut, 
 signInWithPopup,
 GoogleAuthProvider,
 deleteUser
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

 useEffect(() => {
 let profileUnsubscribe = null;

 const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
 // Clean up previous profile listener if it exists
 if (profileUnsubscribe) {
 profileUnsubscribe();
 profileUnsubscribe = null;
 }

 setUser(currentUser);
 
 if (currentUser) {
 const userDocRef = doc(db, 'users', currentUser.uid);
 
 // Check if user is an admin
 const checkAdminStatus = async () => {
 try {
 const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
 setIsAdmin(adminDoc.exists());
 } catch (e) {
 setIsAdmin(false);
 }
 };
 checkAdminStatus();
 
 // Real-time listener
 profileUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
 if (snapshot.exists()) {
 const data = snapshot.data();
 const p = data.profiles || [];
 setProfiles(p);
 setIsBanned(data.isBanned === true);
 
 // OPTIMIZATION: Auto-select profile if user only has 1, preventing the forced creation loop
 const saved = localStorage.getItem('activeProfile');
 if (p.length === 1 && !saved) {
 setActiveProfile(p[0]);
 localStorage.setItem('activeProfile', JSON.stringify(p[0]));
 }
 } else {
 // If doc doesn't exist, create it (handles Google Login or missing docs)
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

 const addProfile = useCallback(async (profileData) => {
 if (!user) return;
 if (profiles.length >= 5) throw new Error('Maximum 5 profiles allowed');
 
 const newProfile = {
 id: Date.now().toString(),
 ...profileData
 };
 
 const updatedProfiles = [...profiles, newProfile];
 await updateDoc(doc(db, 'users', user.uid), {
 profiles: updatedProfiles
 });
 return newProfile;
 }, [user, profiles]);

 const updateProfile = useCallback(async (id, profileData) => {
 if (!user) return;
 const updatedProfiles = profiles.map(p => p.id === id ? { ...p, ...profileData } : p);
 await updateDoc(doc(db, 'users', user.uid), {
 profiles: updatedProfiles
 });
 
 // Update active profile if it was the one edited
 if (activeProfile?.id === id) {
 const newActive = { ...activeProfile, ...profileData };
 setActiveProfile(newActive);
 localStorage.setItem('activeProfile', JSON.stringify(newActive));
 }
 }, [user, profiles, activeProfile]);

 const deleteProfile = useCallback(async (id) => {
 if (!user) return;
 
 // Find the profile to get its name before deletion
 const profileToDelete = profiles.find(p => p.id === id);
 
 const updatedProfiles = profiles.filter(p => p.id !== id);
 await updateDoc(doc(db, 'users', user.uid), {
 profiles: updatedProfiles
 });
 
 if (activeProfile?.id === id) {
 setActiveProfile(null);
 localStorage.removeItem('activeProfile');
 }

 // Cascade delete: remove all reels and their comments created by this profile
 if (profileToDelete) {
 try {
 const qReels = query(
 collection(db, 'reels'), 
 where('userId', '==', user.uid), 
 where('userName', '==', profileToDelete.name)
 );
 const snapshot = await getDocs(qReels);
 for (const reelDoc of snapshot.docs) {
 // Delete comments subcollection for this reel
 const commentsSnap = await getDocs(collection(db, 'reels', reelDoc.id, 'comments'));
 for (const commentDoc of commentsSnap.docs) {
 await deleteDoc(commentDoc.ref);
 }
 // Delete the reel
 await deleteDoc(reelDoc.ref);
 }
 } catch (err) {
 console.error("Failed to delete profile's reels:", err);
 }
 }
 }, [user, profiles, activeProfile]);

 const deleteAccount = useCallback(async () => {
 if (!user) return;
 try {
 // 1. Delete all reels and their comments for this user
 const qReels = query(collection(db, 'reels'), where('userId', '==', user.uid));
 const snapshot = await getDocs(qReels);
 for (const reelDoc of snapshot.docs) {
 const commentsSnap = await getDocs(collection(db, 'reels', reelDoc.id, 'comments'));
 for (const commentDoc of commentsSnap.docs) {
 await deleteDoc(commentDoc.ref);
 }
 await deleteDoc(reelDoc.ref);
 }

 // 2. Delete user document from firestore
 await deleteDoc(doc(db, 'users', user.uid));
 
 // 3. Delete user from Firebase Auth
 await deleteUser(user);
 
 // Cleanup local state
 localStorage.removeItem('activeProfile');
 setActiveProfile(null);
 } catch (err) {
 console.error("Failed to delete account:", err);
 throw err;
 }
 }, [user]);

 // Debounce ref to throttle Firestore writes to max 1 per 30 seconds while watching
 const progressWriteTimer = useRef(null);

 const updateWatchProgress = useCallback(async (anime, episode, time, duration) => {
 if (!user || !activeProfile) return;
 
 const history = activeProfile.watchHistory || [];
 const filtered = history.filter(h => h.animeId !== anime.id);
 
 // Don't save if watched less than 5 seconds
 if (time < 5) return;
 
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
 
 const newActive = { ...activeProfile, watchHistory: newHistory };
 // Update local state immediately for responsive UI
 setActiveProfile(newActive);
 localStorage.setItem('activeProfile', JSON.stringify(newActive));

 // Debounce the Firestore write to max once per 30 seconds
 if (progressWriteTimer.current) clearTimeout(progressWriteTimer.current);
 progressWriteTimer.current = setTimeout(async () => {
 const updatedProfiles = profiles.map(p => p.id === activeProfile.id ? newActive : p);
 try {
 await updateDoc(doc(db, 'users', user.uid), {
 profiles: updatedProfiles
 });
 } catch (e) {
 console.error("Failed to update progress:", e);
 }
 }, 30000); // Write at most once every 30 seconds
 }, [user, activeProfile, profiles]);

 const toggleFavorite = useCallback(async (anime) => {
 if (!user || !activeProfile) return;
 
 const favorites = activeProfile.favorites || [];
 const isFavorite = favorites.some(f => f.id === anime.id);
 
 let newFavorites;
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
 }
 
 const newActive = { ...activeProfile, favorites: newFavorites };
 setActiveProfile(newActive);
 localStorage.setItem('activeProfile', JSON.stringify(newActive));

 const updatedProfiles = profiles.map(p => p.id === activeProfile.id ? newActive : p);
 try {
 await updateDoc(doc(db, 'users', user.uid), {
 profiles: updatedProfiles
 });
 } catch (e) {
 console.error("Failed to update favorites:", e);
 }
 }, [user, activeProfile, profiles]);

 const toggleFollow = useCallback(async (targetUserId) => {
 if (!user || !activeProfile || targetUserId === user.uid) return;
 
 const following = activeProfile.following || [];
 const isFollowing = following.includes(targetUserId);
 
 let newFollowing;
 if (isFollowing) {
 newFollowing = following.filter(id => id !== targetUserId);
 } else {
 newFollowing = [...following, targetUserId];
 }
 
 const newActive = { ...activeProfile, following: newFollowing };
 setActiveProfile(newActive);
 localStorage.setItem('activeProfile', JSON.stringify(newActive));

 const updatedProfiles = profiles.map(p => p.id === activeProfile.id ? newActive : p);
 try {
 await updateDoc(doc(db, 'users', user.uid), {
 profiles: updatedProfiles
 });
 // Also update the target user's followers array
 const targetUserRef = doc(db, 'users', targetUserId);
 await updateDoc(targetUserRef, {
 followers: isFollowing ? arrayRemove(user.uid) : arrayUnion(user.uid)
 });
 } catch (e) {
 console.error("Failed to update follow status:", e);
 }
 }, [user, activeProfile, profiles]);

 const createCustomList = useCallback(async (name) => {
 if (!user || !activeProfile) return;
 const customLists = activeProfile.customLists || [];
 
 if (customLists.some(l => l.name.toLowerCase() === name.trim().toLowerCase())) {
 throw new Error("A list with this name already exists");
 }

 const newList = {
 id: 'list_' + Date.now().toString(),
 name: name.trim(),
 createdAt: Date.now(),
 items: []
 };

 const newActive = { ...activeProfile, customLists: [...customLists, newList] };
 setActiveProfile(newActive);
 localStorage.setItem('activeProfile', JSON.stringify(newActive));

 const updatedProfiles = profiles.map(p => p.id === activeProfile.id ? newActive : p);
 try {
 await updateDoc(doc(db, 'users', user.uid), { profiles: updatedProfiles });
 return newList;
 } catch (e) {
 console.error("Failed to create custom list:", e);
 throw e;
 }
 }, [user, activeProfile, profiles]);

 const toggleAnimeInCustomList = useCallback(async (listId, anime) => {
 if (!user || !activeProfile) return;
 
 const customLists = activeProfile.customLists || [];
 const listIndex = customLists.findIndex(l => l.id === listId);
 if (listIndex === -1) return;

 const list = customLists[listIndex];
 const items = list.items || [];
 const isAdded = items.some(i => i.id === anime.id);

 let newItems;
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
 }

 const updatedList = { ...list, items: newItems };
 const newCustomLists = [...customLists];
 newCustomLists[listIndex] = updatedList;

 const newActive = { ...activeProfile, customLists: newCustomLists };
 setActiveProfile(newActive);
 localStorage.setItem('activeProfile', JSON.stringify(newActive));

 const updatedProfiles = profiles.map(p => p.id === activeProfile.id ? newActive : p);
 try {
 await updateDoc(doc(db, 'users', user.uid), { profiles: updatedProfiles });
 return !isAdded;
 } catch (e) {
 console.error("Failed to toggle anime in custom list:", e);
 throw e;
 }
 }, [user, activeProfile, profiles]);

 const updateProfileSettings = useCallback(async (settingsData) => {
 if (!user || !activeProfile) return;
 
 const newActive = { ...activeProfile, ...settingsData };
 setActiveProfile(newActive);
 localStorage.setItem('activeProfile', JSON.stringify(newActive));

 const updatedProfiles = profiles.map(p => p.id === activeProfile.id ? newActive : p);
 try {
 await updateDoc(doc(db, 'users', user.uid), { profiles: updatedProfiles });
 } catch (e) {
 console.error("Failed to update profile settings:", e);
 throw e;
 }
 }, [user, activeProfile, profiles]);

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
 }), [user, profiles, activeProfile, isBanned, isAdmin, selectProfile, addProfile, updateProfile, deleteProfile, deleteAccount, updateWatchProgress, toggleFavorite, toggleFollow, createCustomList, toggleAnimeInCustomList, updateProfileSettings, login, register, logout, loginWithGoogle, loading]);

 return (
 <AuthContext.Provider value={value}>
 {!loading && children}
 </AuthContext.Provider>
 );
};
