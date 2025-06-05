import React from 'react';
import { auth } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import Auth from './components/Auth';
import SprintChat from './components/SprintChat';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class">
      <Toaster position="top-right" />
      <ThemeToggle />
      {user ? <SprintChat /> : <Auth />}
    </ThemeProvider>
  );
}

export default App;