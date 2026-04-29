import React, { useEffect, useState } from 'react';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export function Auth({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded border border-stone-200 text-center max-w-sm w-full shadow-sm">
          <h1 className="text-2xl font-black uppercase text-stone-900 mb-2">Login Required</h1>
          <p className="text-sm font-bold text-stone-500 mb-6">Please sign in with your Google account to access your entries.</p>
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full rounded bg-stone-900 text-white font-black uppercase py-4 text-sm hover:bg-stone-800 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
