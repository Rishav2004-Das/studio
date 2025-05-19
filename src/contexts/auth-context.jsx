
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
      console.log('[AuthContext] onAuthStateChanged triggered. User:', user ? user.uid : 'null');
      try {
        if (user) {
          setFirebaseUser(user);
          const userDocRef = doc(db, 'users', user.uid);
          console.log('[AuthContext] Attempting to get user document:', userDocRef.path);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            console.log('[AuthContext] User document exists. Data:', userDocSnap.data());
            setCurrentUser(userDocSnap.data());
          } else {
            console.log('[AuthContext] User document does not exist. Creating new user document.');
            const newUser = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'New User',
              email: user.email || '',
              avatarUrl: user.photoURL || null,
              tokenBalance: 0,
              createdAt: serverTimestamp(),
              isAdmin: false, // Explicitly set isAdmin to false for new users
            };
            console.log('[AuthContext] New user data to be set:', newUser);
            await setDoc(userDocRef, newUser);
            console.log('[AuthContext] New user document created successfully.');
            setCurrentUser(newUser);
          }
        } else {
          console.log('[AuthContext] No authenticated user.');
          setCurrentUser(null);
          setFirebaseUser(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error processing auth state change or fetching/setting user doc:", error);
        // Log the full error object for more details
        console.error("[AuthContext] Full Firebase error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        setCurrentUser(null);
        setFirebaseUser(null);
      } finally {
        // console.log('[AuthContext] Setting isLoading to false.');
        setIsLoading(false);
      }
    });

    return () => {
      // console.log('[AuthContext] Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
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
