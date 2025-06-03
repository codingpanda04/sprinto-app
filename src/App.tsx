import React from 'react';
import { auth } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Auth from './components/Auth';
import SprintChat from './components/SprintChat';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <SprintChat /> : <Auth />;
}

export default App;