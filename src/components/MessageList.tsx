import React from 'react';
import { auth } from '../lib/firebase';
import { Timer, Crown } from 'lucide-react';
import { Message } from '../types';
import { formatTimestamp } from '../utils/formatters';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                ? 'bg-purple-100'
                : message.type === 'wordcount'
                ? 'bg-green-100'
                : message.userId === auth.currentUser?.uid
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {message.type === 'sprint' && <Timer className="inline-block mr-2" />}
            {message.type === 'wordcount' && <Crown className="inline-block mr-2" />}
            <span className="text-sm font-medium">
              {message.userEmail.split('@')[0]}:
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
    </div>
  );
}