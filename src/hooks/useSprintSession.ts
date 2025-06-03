import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { SprintSession } from '../types';

export function useSprintSession() {
  const [activeSession, setActiveSession] = useState<SprintSession | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'sessions'),
      orderBy('startTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SprintSession[];

      const active = sessions.find(session => session.active);
      setActiveSession(active || null);
    });

    return () => unsubscribe();
  }, []);

  return activeSession;
}