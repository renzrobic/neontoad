import React from 'react';
import HeroBanner from '../components/home/HeroBanner';
import AnimeRow from '../components/anime/AnimeRow';
import TopTenRow from '../components/anime/TopTenRow';
import AdBanner from '../components/home/AdBanner';
import NewsSection from '../components/home/NewsSection';
import ReleaseCalendar from '../components/home/ReleaseCalendar';
import { useHomeData } from '../hooks/useHomeData';

const Home = () => {
 const { rowDatas, loading, activeProfile } = useHomeData();

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
