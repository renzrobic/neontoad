import React, { useState } from 'react';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const TARGET_TITLES = ["Frieren: Beyond Journey's End","That Time I Got Reincarnated as a Slime","Mushoku Tensei: Jobless Reincarnation","Wistoria: Wand and Sword","Goblin Slayer","Is It Wrong to Try to Pick Up Girls in a Dungeon?","Campfire Cooking in Another World with My Absurd Skill","Skeleton Knight in Another World","Chillin' in Another World with Level 2 Super Cheat Powers","Failure Frame","Ragna Crimson","The Dawn of the Witch","The Great Cleric","The Greatest Demon Lord Is Reborn as a Typical Nobody","Am I Actually the Strongest?","Dandadan","86 (Eighty-Six)","One-Punch Man","Mob Psycho 100","Classroom of the Elite","Tokyo Revengers","Moriarty the Patriot","Zom 100: Bucket List of the Dead","Akudama Drive","The Elusive Samurai","Dark Gathering","Darwin's Game","Battle Game in 5 Seconds","Sabikui Bisco","Spy × Family","Kaguya-sama: Love Is War","My Dress-Up Darling","The 100 Girlfriends Who Really, Really, Really, Really, Really Love You","Rent-A-Girlfriend","Shikimori's Not Just a Cutie","Higehiro: After Being Rejected, I Shaved and Took In a High School Runaway","Teasing Master Takagi-san","Baka & Test - Summon the Beasts","Ouran High School Host Club","Girlfriend, Girlfriend","Romantic Killer","Aho-Girl","Hyouka","Cells at Work!","Cells at Work! Code Black","Wandering Witch: The Journey of Elaina","Anohana: The Flower We Saw That Day","Nagi-Asu: A Lull in the Sea","The Aquatope on White Sand","Ace of Diamond Act II"
];

const SeedData = () => {
 const [status, setStatus] = useState('Idle');
 const [progress, setProgress] = useState(0);

 const cleanTitle = (title) => {
 // Strip out the parentheses parts to get better API search matches
 return title.split(' (')[0].trim();
 };

 const fetchAndSeed = async () => {
 setStatus('Initializing reset...');
 setProgress(0);

 try {
 // 1. DELETE EXISTING COLLECTIONS
 setStatus('Wiping old anime library...');
 
 const oldAnimeDocs = await getDocs(collection(db, 'anime'));
 const oldEpisodesDocs = await getDocs(collection(db, 'episodes'));
 const allDocsToDelete = [...oldAnimeDocs.docs, ...oldEpisodesDocs.docs];
 
 setStatus(`Wiping ${allDocsToDelete.length} total documents (anime & episodes)...`);

 // Simple chunking for deletes (Firestore limit is 500 per batch)
 for (let i = 0; i < allDocsToDelete.length; i += 400) {
 const chunkBatch = writeBatch(db);
 allDocsToDelete.slice(i, i + 400).forEach(doc => chunkBatch.delete(doc.ref));
 await chunkBatch.commit();
 }

 // 2. FETCH NEW DATA FROM JIKAN
 setStatus('Fetching custom titles from Jikan API...');
 let fetchedAnime = [];
 
 for (let i = 0; i < TARGET_TITLES.length; i++) {
 const title = TARGET_TITLES[i];
 setStatus(`Searching: ${title} (${i+1}/${TARGET_TITLES.length})`);
 
 const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle(title))}&limit=1`);
 if (!response.ok) {
 console.warn(`Failed to fetch ${title}, skipping...`);
 await new Promise(resolve => setTimeout(resolve, 1500));
 continue;
 }
 
 const data = await response.json();
 if (data.data && data.data.length > 0) {
 fetchedAnime.push(data.data[0]);
 }
 
 setProgress(Math.round(((i + 1) / TARGET_TITLES.length) * 50)); // First 50% of progress
 
 // Rate limiting avoidance (1.5 seconds)
 await new Promise(resolve => setTimeout(resolve, 1500));
 }

 // 3. INJECT INTO FIRESTORE
 setStatus('Injecting new library into Firestore...');
 
 for (let i = 0; i < fetchedAnime.length; i += 400) {
 const setBatch = writeBatch(db);
 const chunk = fetchedAnime.slice(i, i + 400);
 
 for (let j = 0; j < chunk.length; j++) {
 const item = chunk[j];
 const docRef = doc(collection(db, 'anime'), item.mal_id.toString());

 const formattedData = {
 id: item.mal_id,
 title: item.title,
 rating: item.score ? item.score.toString() : '0.0',
 viewCount: Math.floor(Math.random() * 5000), // Random starting views so Trending works immediately
 votes: item.scored_by ? (item.scored_by >= 1000000 ? (item.scored_by / 1000000).toFixed(1) + 'M' : (item.scored_by / 1000).toFixed(0) + 'K') : '0',
 seasons: item.type === 'TV' ? (item.episodes > 24 ? '2+ Seasons' : '1 Season') : 'Movie',
 episodes: item.episodes ? item.episodes.toString() : 'Ongoing',
 status: item.status || 'Finished Airing',
 type: item.type || 'TV Series',
 studio: item.studios?.[0]?.name || 'Unknown',
 description: item.synopsis || 'No description available.',
 genres: item.genres.map(g => g.name),
 image: item.images.jpg.large_image_url
 };

 setBatch.set(docRef, formattedData);
 }
 
 await setBatch.commit();
 setProgress(50 + Math.round(((i + chunk.length) / fetchedAnime.length) * 50));
 }

 setStatus(`Successfully reset and injected ${fetchedAnime.length} titles!`);
 } catch (err) {
 console.error(err);
 setStatus('Error: ' + err.message);
 }
 };

 const seedAvatars = async () => {
 setStatus('Seeding Avatars...');
 try {
 const { AVATAR_SERIES } = await import('../constants/avatars');
 const batch = writeBatch(db);
 AVATAR_SERIES.forEach(series => {
 const ref = doc(collection(db, 'avatars'), series.id);
 batch.set(ref, series);
 });
 await batch.commit();
 setStatus('Avatars seeded successfully!');
 } catch (err) {
 console.error(err);
 setStatus('Error seeding avatars: ' + err.message);
 }
 };

 return (
 <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 text-white">
 <h1 className="text-h2 font-medium text-primary mb-8">Data Injection Portal</h1>
 <div className="glass-card bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8 w-full max-w-md text-center">
 <p className="mb-4 font-medium text-white">Status: <span className="text-primary">{status}</span></p>
 <div className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 h-2 mb-8">
 <div
 className="bg-primary h-full transition-all duration-300"
 style={{ width: `${progress}%` }}
 />
 </div>
 <button onClick={fetchAndSeed}
 className="bg-primary text-black font-medium px-8 py-3 hover:bg-white transition-all w-full mb-4 rounded-xl"
 >
 Reset Library & Inject New Titles
 </button>
 <button
 onClick={seedAvatars}
 className="bg-white/10 backdrop-blur-md rounded-xl text-white font-medium px-8 py-3 hover:bg-neutral-700 transition-all w-full mb-4"
 >
 Inject Avatar Series
 </button>
 <p className="text-micro text-white font-medium opacity-80">
 Warning: This will delete the entire existing library and episodes. It will take ~3-4 minutes to complete. Do not close this page until finished.
 </p>
 </div>
 </div>
 );
};

export default SeedData;
