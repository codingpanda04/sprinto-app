import React, { useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { Timer, Crown } from 'lucide-react';
import { Message } from '../types';
import { formatTimestamp } from '../utils/formatters';
import { doc, getDoc } from 'firebase/firestore';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [usernames, setUsernames] = React.useState<Record<string, string>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUsernames = async () => {
      const uniqueUserIds = [...new Set(messages.map(m => m.userId))];
      const usernamePromises = uniqueUserIds.map(async userId => {
        if (userId === 'system') return ['system', 'System'];
        const userDoc = await getDoc(doc(db, 'users', userId));
        return [userId, userDoc.data()?.username || userDoc.data()?.email.split('@')[0]];
      });
      const usernameEntries = await Promise.all(usernamePromises);
      setUsernames(Object.fromEntries(usernameEntries));
    };

    fetchUsernames();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-900">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.userId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              message.type === 'sprint'
                ? 'bg-purple-100 dark:bg-purple-900'
                : message.type === 'wordcount'
                ? 'bg-green-100 dark:bg-green-900'
                : message.userId === auth.currentUser?.uid
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-800 dark:text-white'
            }`}
          >
            {message.type === 'sprint' && <Timer className="inline-block mr-2" />}
            {message.type === 'wordcount' && <Crown className="inline-block mr-2" />}
            <span className="text-sm font-medium">
              {usernames[message.userId] || message.userEmail.split('@')[0]}:
            </span>
            <p>{message.text}</p>
            {message.timestamp && (
              <span className="text-xs opacity-75 mt-1 block">
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}