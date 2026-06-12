import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate, useLocation } from 'react-router-dom';

export const useWatchData = (episodeId) => {
 const navigate = useNavigate();
 const location = useLocation();
 const [episode, setEpisode] = useState(null);
 const [anime, setAnime] = useState(null);
 const [otherEpisodes, setOtherEpisodes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [skipTimes, setSkipTimes] = useState(null);
 const progressRef = useRef({ time: 0, duration: 0 });

 useEffect(() => {
 if (!anime || !episode) {
 setSkipTimes(null);
 return;
 }
 const fetchSkipData = async () => {
 try {
 const res = await fetch(`https://api.aniskip.com/v2/skip-times/${anime.id}/${episode.episodeNumber}?types=op&types=ed&episodeLength=0`);
 const data = await res.json();
 if (data.found && data.results) {
 const skipData = {};
 data.results.forEach(result => {
 skipData[result.skipType] = result.interval;
 });
 setSkipTimes(skipData);
 } else {
 setSkipTimes(null);
 }
 } catch (err) {
 console.error("Failed to fetch skip times:", err);
 setSkipTimes(null);
 }
 };
 fetchSkipData();
 }, [anime, episode]);

 useEffect(() => {
 let isRedirecting = false;
 const fetchData = async () => {
 const foundEp = otherEpisodes.find(ep => String(ep.id) === String(episodeId));
 if (foundEp && anime) {
 setEpisode(foundEp);
 progressRef.current = { time: 0, duration: 0 };
 window.scrollTo(0, 0);
 return;
 }

 setLoading(true);
 progressRef.current = { time: 0, duration: 0 };
 try {
 const animeDoc = await getDoc(doc(db, 'anime', episodeId));
 let targetAnimeId = episodeId;
 let currentEpisodeData = null;
 let fetchedAnimeData = null;

 if (animeDoc.exists()) {
 const animeData = { id: animeDoc.id, ...animeDoc.data() };
 fetchedAnimeData = animeData;
 setAnime(animeData);
 targetAnimeId = animeData.id;

 let q = query(collection(db, 'episodes'), where('animeId', '==', targetAnimeId));
 let querySnapshot = await getDocs(q);
 
 if (querySnapshot.empty && !isNaN(Number(targetAnimeId))) {
 q = query(collection(db, 'episodes'), where('animeId', '==', Number(targetAnimeId)));
 querySnapshot = await getDocs(q);
 }

 const rawEps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 const now = new Date();
 const eps = rawEps.filter(ep => {
 if (ep.status !== 'queued') return true;
 if (!ep.releaseDate) return false;
 return ep.releaseDate.toDate() <= now;
 });
 eps.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
 
 if (eps.length > 0) {
 if (String(eps[0].id) !== String(episodeId)) {
 isRedirecting = true;
 navigate(`/watch/${eps[0].id}`, { replace: true });
 return;
 } else {
 currentEpisodeData = eps[0];
 }
 } else {
 if (location.state?.fromReel) {
 isRedirecting = true;
 navigate(`/anime/${targetAnimeId}`, { replace: true });
 return;
 }
 currentEpisodeData = {
 id: `default-${targetAnimeId}`,
 animeId: targetAnimeId,
 episodeNumber: 1,
 title: 'Episode 1',
 embedUrl: '',
 thumbnail: animeData.image
 };
 }
 setOtherEpisodes(eps);
 
 } else {
 const epDoc = await getDoc(doc(db, 'episodes', episodeId));
 if (epDoc.exists()) {
 currentEpisodeData = { id: epDoc.id, ...epDoc.data() };
 targetAnimeId = String(currentEpisodeData.animeId);
 const aDoc = await getDoc(doc(db, 'anime', targetAnimeId));
 if (aDoc.exists()) {
 fetchedAnimeData = { id: aDoc.id, ...aDoc.data() };
 setAnime(fetchedAnimeData);
 }
 }
 }

 if (!currentEpisodeData) {
 setEpisode(null);
 } else {
 setEpisode(currentEpisodeData);
 try {
 await updateDoc(doc(db, 'anime', String(targetAnimeId)), { viewCount: increment(1) });
 } catch (err) {}
 }

 if (!otherEpisodes.length && targetAnimeId) {
 let q = query(collection(db, 'episodes'), where('animeId', '==', targetAnimeId));
 let querySnapshot = await getDocs(q);
 
 if (querySnapshot.empty && !isNaN(Number(targetAnimeId))) {
 q = query(collection(db, 'episodes'), where('animeId', '==', Number(targetAnimeId)));
 querySnapshot = await getDocs(q);
 }
 
 const rawAllEps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 const now = new Date();
 const allEps = rawAllEps.filter(ep => {
 if (ep.status !== 'queued') return true;
 if (!ep.releaseDate) return false;
 return ep.releaseDate.toDate() <= now;
 });
 allEps.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
 setOtherEpisodes(allEps);
 }

 } catch (err) {
 console.error("Watch Page Error:", err);
 } finally {
 if (!isRedirecting) setLoading(false);
 }
 };

 fetchData();
 window.scrollTo(0, 0);
 }, [episodeId, navigate, location.state]);

 return { episode, anime, otherEpisodes, loading, skipTimes, progressRef };
};
