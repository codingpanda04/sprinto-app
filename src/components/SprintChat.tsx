import React, { useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useSprintSession } from '../hooks/useSprintSession';
import type { Message } from '../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SprintTimer from './SprintTimer';
import { formatWordCount } from '../utils/formatters';

export default function SprintChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const activeSession = useSprintSession();

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, []);

  const handleSprintComplete = async () => {
    if (!activeSession) return;
    
    const sortedParticipants = Object.entries(activeSession.wordCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([uid]) => uid);

    if (sortedParticipants.length > 0) {
      const winner = sortedParticipants[0];
      const winnerEmail = messages.find(m => m.userId === winner)?.userEmail;
      
      await addDoc(collection(db, 'messages'), {
        text: `Sprint completed! 🎉 Congratulations @${winnerEmail} for winning with ${formatWordCount(activeSession.wordCounts[winner])} words!`,
        userId: 'system',
        userEmail: 'System',
        timestamp: serverTimestamp(),
        type: 'sprint'
      });
    }

    await updateDoc(doc(db, 'sessions', activeSession.id), {
      active: false
    });
  };

  const handleCommand = async (command: string, args: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    switch (command) {
      case '/sprint':
        if (activeSession) {
          alert('A sprint session is already active!');
          return;
        }
        const duration = parseInt(args[0]) || 30;
        const session = {
          active: true,
          startTime: serverTimestamp(),
          duration,
          participants: [user.uid],
          wordCounts: {}
        };
        const sessionDoc = await addDoc(collection(db, 'sessions'), session);
        await addDoc(collection(db, 'messages'), {
          text: `@${user.email} started a ${duration} minute sprint!`,
          userId: user.uid,
          userEmail: user.email,
          timestamp: serverTimestamp(),
          type: 'sprint',
          duration
        });
        break;

      case '/join':
        if (!activeSession) {
          alert('No active sprint session!');
          return;
        }
        if (!activeSession.participants.includes(user.uid)) {
          await updateDoc(doc(db, 'sessions', activeSession.id), {
            participants: [...activeSession.participants, user.uid]
          });
          await addDoc(collection(db, 'messages'), {
            text: `@${user.email} joined the sprint!`,
            userId: user.uid,
            userEmail: user.email,
            timestamp: serverTimestamp(),
            type: 'join'
          });
        }
        break;

      case '/leave':
        if (!activeSession) {
          alert('No active sprint session!');
          return;
        }
        if (activeSession.participants.includes(user.uid)) {
          await updateDoc(doc(db, 'sessions', activeSession.id), {
            participants: activeSession.participants.filter(id => id !== user.uid)
          });
          await addDoc(collection(db, 'messages'), {
            text: `@${user.email} left the sprint.`,
            userId: user.uid,
            userEmail: user.email,
            timestamp: serverTimestamp(),
            type: 'leave'
          });
        }
        break;

      case '/wordcount':
        if (!activeSession) {
          alert('No active sprint session!');
          return;
        }
        const wordCount = parseInt(args[0]) || 0;
        const updatedCounts = {
          ...activeSession.wordCounts,
          [user.uid]: wordCount
        };
        await updateDoc(doc(db, 'sessions', activeSession.id), {
          wordCounts: updatedCounts
        });
        await addDoc(collection(db, 'messages'), {
          text: `@${user.email} wrote ${formatWordCount(wordCount)} words!`,
          userId: user.uid,
          userEmail: user.email,
          timestamp: serverTimestamp(),
          type: 'wordcount',
          wordCount
        });
        break;
    }
  };

  const handleSendMessage = async (newMessage: string) => {
    const user = auth.currentUser;
    if (!user) return;

    if (newMessage.startsWith('/')) {
      const [command, ...args] = newMessage.split(' ');
      await handleCommand(command, args);
    } else {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        type: 'message'
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {activeSession && (
        <SprintTimer
          session={activeSession}
          onComplete={handleSprintComplete}
        />
      )}
      <MessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}