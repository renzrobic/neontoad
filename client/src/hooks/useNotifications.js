import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import notificationSound from '../assets/sounds/fahhh.mp3';

// Cache audio object at module level — avoid recreating on every notification
const notifAudio = new Audio(notificationSound);
notifAudio.volume = 0.5;

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const prevUnreadCount = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Optimized Query: Added orderBy to offload sorting to Firestore
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', 'in', [user.uid, 'all']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(n => !n.clearedBy?.includes(user.uid));
        
      setNotifications(notifs);
      
      const newUnreadCount = notifs.filter(n => !n.readBy?.includes(user.uid)).length;

      // We skip the very first load to avoid a "FAHHH" on page refresh
      if (newUnreadCount > prevUnreadCount.current && !isFirstLoad.current) {
        notifAudio.currentTime = 0;
        notifAudio.play().catch(e => console.log('Audio play blocked by browser:', e));
      }

      isFirstLoad.current = false;
      prevUnreadCount.current = newUnreadCount;
      setUnreadCount(newUnreadCount);
    }, (error) => {
      // Specifically handle the missing composite index error gracefully
      console.error("Notifications fetch error (Check Firebase composite indexes in the console link):", error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return { notifications, unreadCount };
};
