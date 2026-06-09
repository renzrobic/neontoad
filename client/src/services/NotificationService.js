import { doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const NotificationService = {
  markAllAsRead: async (notifications, userId) => {
    if (!userId || !notifications || notifications.length === 0) return;

    const batch = writeBatch(db);
    notifications.forEach(notif => {
      if (!notif.readBy?.includes(userId)) {
        const ref = doc(db, 'notifications', notif.id);
        batch.update(ref, {
          readBy: [...(notif.readBy || []), userId]
        });
      }
    });

    await batch.commit();
  },

  markAsRead: async (notifId, readBy = [], userId) => {
    if (!userId) return;
    const ref = doc(db, 'notifications', notifId);
    await updateDoc(ref, {
      readBy: [...readBy, userId]
    });
  },

  clearAllNotifications: async (notifications, userId) => {
    if (!userId || !notifications || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(notif => {
      const ref = doc(db, 'notifications', notif.id);
      if (notif.recipientId === 'all') {
        batch.update(ref, { clearedBy: [...(notif.clearedBy || []), userId] });
      } else {
        batch.delete(ref);
      }
    });
    await batch.commit();
  },

  deleteNotification: async (notif, userId) => {
    if (!userId) return;
    if (notif.recipientId === 'all') {
      await updateDoc(doc(db, 'notifications', notif.id), {
        clearedBy: [...(notif.clearedBy || []), userId]
      });
    } else {
      await deleteDoc(doc(db, 'notifications', notif.id));
    }
  }
};
