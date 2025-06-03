import { formatDistanceToNow } from 'date-fns';

export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatWordCount(count: number): string {
  return new Intl.NumberFormat().format(count);
}

export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}