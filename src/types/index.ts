export interface Message {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  timestamp: any;
  type: 'message' | 'sprint' | 'join' | 'leave' | 'wordcount';
  wordCount?: number;
  duration?: number;
}

export interface SprintSession {
  id: string;
  active: boolean;
  startTime: any;
  duration: number;
  participants: string[];
  wordCounts: Record<string, number>;
}