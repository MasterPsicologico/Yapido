
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from './non-blocking-updates';
// handleRedirectResult eliminado - no usamos redirect flow (causa 'missing initial state' en WebView)

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  // REF PARA EVITAR BUCLES DE ESCRITURA EN FIRESTORE
  const hasUpdatedSession = useRef<string | null>(null);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser && firestore) {
          // CONTROL DE FLUJO: Solo escribir en Firestore si es un login nuevo o cambio de usuario en esta sesión
          // Evitamos resetear el ref si el usuario es el mismo para prevenir bucles por refrescos de token
          if (hasUpdatedSession.current !== firebaseUser.uid) {
            const userRef = doc(firestore, 'users', firebaseUser.uid);
            try {
              // Verificamos existencia antes de escribir para no gastar cuota de escritura innecesaria
              const docSnap = await getDoc(userRef);
              if (!docSnap.exists()) {
                setDocumentNonBlocking(userRef, {
                  id: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  createdAt: serverTimestamp(),
                  lastLogin: serverTimestamp(),
                  role: 'cliente' 
                }, { merge: true });
              } else {
                // Actualizar solo una vez por carga de aplicación para marcar actividad reciente
                updateDocumentNonBlocking(userRef, { lastLogin: serverTimestamp() });
              }
              // Marcamos como actualizado para esta UID en esta sesión del navegador
              hasUpdatedSession.current = firebaseUser.uid;
            } catch (e) {
              console.warn("Fallo silencioso en persistencia de perfil");
            }
          }
          setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
        } else {
          // Al cerrar sesión, no reseteamos el ref de forma agresiva para evitar bucles si el estado fluctúa
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
        }
      },
      (error) => setUserAuthState({ user: null, isUserLoading: false, userError: error })
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {/* ELIMINADO EL KEY DINÁMICO: Esto causaba que toda la aplicación se desmontara y montara en cada 
          cambio de usuario, disparando efectos de carga pesados y saturando la base de datos. */}
      <div>
        <FirebaseErrorListener />
        {children}
      </div>
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps);
  if (typeof memoized === 'object' && memoized !== null) {
    (memoized as any).__memo = true;
  }
  return memoized as any;
}

export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
