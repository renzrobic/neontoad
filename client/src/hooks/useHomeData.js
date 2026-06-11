import { useState, useEffect } from 'react';
import { collection, query, getDocs, getDoc, doc, limit, where, orderBy, documentId } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

let cachedHomeData = null;
let cachedHomeProfileId = null;

export const useHomeData = () => {
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
  }, [activeProfile]);

  return { rowDatas, loading, activeProfile };
};
