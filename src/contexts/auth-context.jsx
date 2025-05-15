
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config.js';
import { Skeleton } from '@/components/ui/skeleton.jsx'; 


const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data());
        } else {
          // If user exists in Auth but not Firestore (e.g. first sign-up), create doc
          const newUser = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'New User',
            email: user.email || '',
            avatarUrl: user.photoURL || null,
            tokenBalance: 0,
            createdAt: serverTimestamp(), 
          };
          await setDoc(userDocRef, newUser);
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
        setFirebaseUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-4">
            <Skeleton className="mx-auto h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-full max-w-[250px] mx-auto" />
            <Skeleton className="h-4 w-full max-w-[200px] mx-auto" />
        </div>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, isLoading, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
