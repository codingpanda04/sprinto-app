import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { SprintSession } from '../types';
import { formatTimeRemaining } from '../utils/formatters';

interface SprintTimerProps {
  session: SprintSession;
  onComplete: () => void;
}

export default function SprintTimer({ session, onComplete }: SprintTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!session?.startTime) return;

    const startTime = session.startTime.toDate();
    const endTime = new Date(startTime.getTime() + session.duration * 60 * 1000);

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, endTime.getTime() - now.getTime());
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        onComplete();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, onComplete]);

  if (!timeRemaining) return null;

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-md p-3 flex items-center gap-2">
      <Timer className="text-indigo-600" />
      <span className="font-mono text-lg">{formatTimeRemaining(timeRemaining)}</span>
    </div>
  );
}