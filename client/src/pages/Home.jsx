import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/home/HeroBanner';
import AnimeRow from '../components/anime/AnimeRow';
import TopTenRow from '../components/anime/TopTenRow';
import AdBanner from '../components/home/AdBanner';
import NewsSection from '../components/home/NewsSection';
import ReleaseCalendar from '../components/home/ReleaseCalendar';
import { collection, query, getDocs, getDoc, doc, limit, where, orderBy, documentId } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

let cachedHomeData = null;
let cachedHomeProfileId = null;

const Home = () => {
 const { activeProfile } = useAuth();
 const [rowDatas, setRowDatas] = useState({
 newEpisodes: [],
 topRated: [],
 recommended: [],
 recommendedGenre: '',
 genreRows: []
 });
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchAllData = async () => {
 if (cachedHomeData && cachedHomeProfileId === activeProfile?.id) {
 setRowDatas(cachedHomeData);
 setLoading(false);
 return;
 }
 
 setLoading(true);
 try {
 const results = {};
 
 // 1. Top 10 Promise
 const topRatedPromise = getDocs(query(collection(db, 'anime'), orderBy('viewCount', 'desc'), limit(10)))
 .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

 // 2. New Episodes Promise
 const newEpisodesPromise = (async () => {
 const epQuery = query(collection(db, 'episodes'), orderBy('createdAt', 'desc'), limit(50));
 const queuedQuery = query(collection(db, 'episodes'), where('status', '==', 'queued'));
 const [epSnap, queuedSnap] = await Promise.all([getDocs(epQuery), getDocs(queuedQuery)]);
 
 let episodes = epSnap.docs.map(d => ({ id: d.id, ...d.data() }));
 const queuedEps = queuedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
 
 const allEpsMap = new Map();
 episodes.forEach(ep => allEpsMap.set(ep.id, ep));
 queuedEps.forEach(ep => allEpsMap.set(ep.id, ep));
 episodes = Array.from(allEpsMap.values());
 
 const now = new Date();
 let releasedEpisodes = episodes.filter(ep => {
 if (ep.status !== 'queued') return true;
 if (!ep.releaseDate) return false;
 return ep.releaseDate.toDate() <= now;
 });
 
 releasedEpisodes.sort((a, b) => {
 const dateA = a.releaseDate ? a.releaseDate.toDate() : (a.createdAt ? a.createdAt.toDate() : new Date(0));
 const dateB = b.releaseDate ? b.releaseDate.toDate() : (b.createdAt ? b.createdAt.toDate() : new Date(0));
 return dateB - dateA;
 });
 
 const animeIds = [...new Set(releasedEpisodes.map(d => String(d.animeId)))].slice(0, 10);
 
 if (animeIds.length > 0) {
 const numericIds = animeIds.filter(id => !isNaN(Number(id))).map(Number);
 const queries = [
 getDocs(query(collection(db, 'anime'), where('id', 'in', animeIds))),
 getDocs(query(collection(db, 'anime'), where(documentId(), 'in', animeIds)))
 ];
 if (numericIds.length > 0) {
 queries.push(getDocs(query(collection(db, 'anime'), where('id', 'in', numericIds))));
 }
 const snaps = await Promise.all(queries);
 
 const fetchedAnime = new Map();
 snaps.forEach(snap => {
 snap.docs.forEach(doc => {
 fetchedAnime.set(String(doc.id), { id: doc.id, ...doc.data() });
 if (doc.data().id) fetchedAnime.set(String(doc.data().id), { id: doc.id, ...doc.data() });
 });
 });
 return animeIds.map(id => fetchedAnime.get(String(id))).filter(a => a !== undefined);
 }
 return [];
 })();

 // 3. Recommended Promise
 const recommendedPromise = (async () => {
 if (activeProfile?.watchHistory?.length > 0) {
 const firstAnimeId = String(activeProfile.watchHistory[0].animeId);
 let firstAnimeDoc = await getDoc(doc(db, 'anime', firstAnimeId));
 if (!firstAnimeDoc.exists() && !isNaN(Number(firstAnimeId))) {
 firstAnimeDoc = await getDoc(doc(db, 'anime', String(Number(firstAnimeId))));
 }
 if (firstAnimeDoc.exists()) {
 const docGenres = firstAnimeDoc.data().genres;
 if (docGenres && docGenres.length > 0) {
 const recGenre = docGenres[0];
 const rq = query(collection(db, 'anime'), where('genres', 'array-contains', recGenre), limit(15));
 const rSnap = await getDocs(rq);
 const histIds = activeProfile.watchHistory.map(h => String(h.animeId));
 const recommendedList = rSnap.docs.map(d => ({ id: d.id, ...d.data() }))
 .filter(a => !histIds.includes(String(a.id)));
 return { recommendedList, recGenre };
 }
 }
 }
 return { recommendedList: [], recGenre: '' };
 })();

 // 4. Genres Promises
 const genresList = ['Action', 'Comedy', 'Fantasy', 'Romance', 'Adventure', 'Drama', 'Sci-Fi', 'Slice of Life', 'Mystery', 'Sports'];
 const genrePromises = genresList.map(genre => 
 getDocs(query(collection(db, 'anime'), where('genres', 'array-contains', genre), limit(30)))
 .then(snap => ({ genre, docs: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }))
 );

 // Execute all promises in parallel
 const [topRated, newEpisodes, recommendedResult, ...genreResults] = await Promise.all([
 topRatedPromise,
 newEpisodesPromise,
 recommendedPromise,
 ...genrePromises
 ]);

 results.topRated = topRated;
 results.newEpisodes = newEpisodes;
 results.recommended = recommendedResult.recommendedList;
 results.recommendedGenre = recommendedResult.recGenre;

 // Deduplicate Genres
 const genreRows = [];
 const seenIds = new Set();
 
 if (results.topRated) results.topRated.forEach(a => seenIds.add(String(a.id)));
 if (results.newEpisodes) results.newEpisodes.forEach(a => seenIds.add(String(a.id)));
 
 genreResults.forEach(({ genre, docs }) => {
 const genreData = [];
 docs.forEach(data => {
 if (!seenIds.has(String(data.id))) {
 seenIds.add(String(data.id));
 genreData.push(data);
 }
 });
 if (genreData.length > 0) {
 genreRows.push({ title: genre, genre: genre, data: genreData });
 }
 });
 
 results.genreRows = genreRows;

 cachedHomeData = results;
 cachedHomeProfileId = activeProfile?.id;
 setRowDatas(prev => ({ ...prev, ...results }));
 } catch (err) {
 console.error("Error distributing row data:", err);
 } finally {
 setLoading(false);
 }
 };
 
 fetchAllData();
 }, []);

 const renderContent = () => {
 const listRows = [];
 
 if (rowDatas.newEpisodes && rowDatas.newEpisodes.length > 0) {
 listRows.push(<AnimeRow key="new_episodes" title="New Episodes" data={rowDatas.newEpisodes} loading={loading} />);
 }
 
 if (rowDatas.topRated && rowDatas.topRated.length > 0) {
 listRows.push(<TopTenRow key="top_10" title="Top 10 Most Watched" data={rowDatas.topRated} loading={loading} />);
 }

 if (activeProfile && activeProfile.watchHistory && activeProfile.watchHistory.length > 0) {
 listRows.push(
 <AnimeRow 
 key="continue_watching"
 title={`Continue Watching for ${activeProfile.name}`} 
 data={activeProfile.watchHistory.map(h => ({ 
 id: h.animeId, 
 title: h.animeTitle, 
 image: h.animeImage,
 link: `/watch/${h.episodeId}?t=${Math.floor(h.time)}`,
 progress: h.duration ? (h.time / h.duration) * 100 : 0
 }))} 
 loading={loading} 
 />
 );
 }

 if (rowDatas.recommended && rowDatas.recommended.length > 0) {
 listRows.push(<AnimeRow key="recommended" title={`Because you watched ${rowDatas.recommendedGenre}`} genre={rowDatas.recommendedGenre} data={rowDatas.recommended} loading={loading} />);
 }

 if (rowDatas.genreRows) {
 rowDatas.genreRows.forEach(row => {
 listRows.push(<AnimeRow key={`genre_${row.title}`} title={row.title} genre={row.genre} data={row.data} loading={loading} />);
 });
 }

 const specialSections = [
 <AdBanner key="ad1" id="ad1" />,
 <NewsSection key="news1" />,
 <AdBanner key="ad2" id="ad2" />
 ];
 
 let specialIdx = 0;
 const finalRender = [];
 
 listRows.forEach((row, idx) => {
 finalRender.push(row);
 // Insert a special section after every 3 anime rows
 if ((idx + 1) % 3 === 0 && specialIdx < specialSections.length) {
 finalRender.push(specialSections[specialIdx]);
 specialIdx++;
 }
 });
 
 return finalRender;
 };

 return (
 <div className="bg-transparent min-h-screen">
 <HeroBanner />
 
 <div className="mt-[-40px] md:mt-[-120px] relative z-20 pb-20 pt-8 md:pt-12">


 <ReleaseCalendar />

 {renderContent()}
 </div>
 </div>
 );
};

export default Home;
