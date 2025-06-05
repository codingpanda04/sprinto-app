import React, { useEffect } from 'react';
import { auth, db, requestNotificationPermission, onMessageListener } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useSprintSession } from '../hooks/useSprintSession';
import toast from 'react-hot-toast';
import type { Message } from '../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SprintTimer from './SprintTimer';
import { formatWordCount } from '../utils/formatters';

export default function SprintChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const activeSession = useSprintSession();

  useEffect(() => {
    // Request notification permission when component mounts
    requestNotificationPermission();

    // Listen for foreground messages
    const unsubscribeMessage = onMessageListener();

    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Show notification for new messages
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.userId !== auth.currentUser?.uid) {
        if (lastMessage.type === 'message') {
          toast(`${lastMessage.userEmail.split('@')[0]}: ${lastMessage.text}`, {
            icon: '💬'
          });
        }
      }
      
      setMessages(newMessages);
    });

    return () => {
      unsubscribe();
      unsubscribeMessage();
    };
  }, []);

  const handleSprintComplete = async () => {
    if (!activeSession) return;
    
    const sortedParticipants = Object.entries(activeSession.wordCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([uid]) => uid);

    if (sortedParticipants.length > 0) {
      const winner = sortedParticipants[0];
      const winnerEmail = messages.find(m => m.userId === winner)?.userEmail;
      
      const completionMessage = `Sprint completed! 🎉 Congratulations @${winnerEmail} for winning with ${formatWordCount(activeSession.wordCounts[winner])} words!`;
      
      await addDoc(collection(db, 'messages'), {
        text: completionMessage,
        userId: 'system',
        userEmail: 'System',
        timestamp: serverTimestamp(),
        type: 'sprint'
      });

      toast.success(completionMessage);
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
          toast.error('A sprint session is already active!');
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
        const sprintMessage = `@${user.email} started a ${duration} minute sprint!`;
        await addDoc(collection(db, 'messages'), {
          text: sprintMessage,
          userId: user.uid,
          userEmail: user.email,
          timestamp: serverTimestamp(),
          type: 'sprint',
          duration
        });
        
        // Notify all users about new sprint
        toast((t) => (
          <div>
            <p>New sprint session started!</p>
            <div className="mt-2">
              <button
                className="mr-2 px-3 py-1 bg-green-500 text-white rounded-md"
                onClick={() => {
                  handleCommand('/join', []);
                  toast.dismiss(t.id);
                }}
              >
                Join
              </button>
              <button
                className="px-3 py-1 bg-gray-500 text-white rounded-md"
                onClick={() => toast.dismiss(t.id)}
              >
                Skip
              </button>
            </div>
          </div>
        ), { duration: 10000 });
        break;

      case '/join':
        if (!activeSession) {
          toast.error('No active sprint session!');
          return;
        }
        if (!activeSession.participants.includes(user.uid)) {
          await updateDoc(doc(db, 'sessions', activeSession.id), {
            participants: [...activeSession.participants, user.uid]
          });
          const joinMessage = `@${user.email} joined the sprint!`;
          await addDoc(collection(db, 'messages'), {
            text: joinMessage,
            userId: user.uid,
            userEmail: user.email,
            timestamp: serverTimestamp(),
            type: 'join'
          });
          toast.success(joinMessage);
        }
        break;

      case '/leave':
        if (!activeSession) {
          toast.error('No active sprint session!');
          return;
        }
        if (activeSession.participants.includes(user.uid)) {
          await updateDoc(doc(db, 'sessions', activeSession.id), {
            participants: activeSession.participants.filter(id => id !== user.uid)
          });
          const leaveMessage = `@${user.email} left the sprint.`;
          await addDoc(collection(db, 'messages'), {
            text: leaveMessage,
            userId: user.uid,
            userEmail: user.email,
            timestamp: serverTimestamp(),
            type: 'leave'
          });
          toast.success(leaveMessage);
        }
        break;

      case '/wordcount':
        if (!activeSession) {
          toast.error('No active sprint session!');
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
        const wordCountMessage = `@${user.email} wrote ${formatWordCount(wordCount)} words!`;
        await addDoc(collection(db, 'messages'), {
          text: wordCountMessage,
          userId: user.uid,
          userEmail: user.email,
          timestamp: serverTimestamp(),
          type: 'wordcount',
          wordCount
        });
        toast.success(wordCountMessage);
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