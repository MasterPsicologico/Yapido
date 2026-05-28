
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ComicCreation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const DB_NAME = 'GICICreatorDB';
const STORE_NAME = 'comics';
const DB_VERSION = 2;

export const useComicHistory = () => {
  const [comics, setComics] = useState<ComicCreation[]>([]);
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchComics = useCallback(() => {
    if (db) {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const sortedComics = getAllRequest.result.sort(
          (a: ComicCreation, b: ComicCreation) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setComics(sortedComics);
        setIsLoading(false);
      };
      getAllRequest.onerror = () => {
        console.error("Error fetching comics from IndexedDB", getAllRequest.error);
        setIsLoading(false);
      };
    }
  }, [db]);

  useEffect(() => {
    // This check ensures IndexedDB is only accessed on the client-side
    if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => setDb(request.result);
    
    request.onerror = () => {
      console.error('Error opening IndexedDB for comics', request.error);
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    if (db) {
      fetchComics();
    }
  }, [db, fetchComics]);

  const addComicToHistory = useCallback(async (comic: ComicCreation) => {
    if (!db || !comic.id) return;

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(comic);

    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
            fetchComics();
            resolve();
        };
        request.onerror = () => {
            console.error("Failed to add comic:", request.error);
            reject(request.error);
        };
    });
  }, [db, fetchComics]);

  const deleteComic = useCallback(async (id: string) => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
        toast({ title: "Historieta eliminada." });
        fetchComics();
    };
     request.onerror = () => {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la historieta." });
    };
  }, [db, fetchComics, toast]);

  const clearHistory = useCallback(async () => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
     request.onsuccess = () => {
        toast({ title: "Historial de historietas limpiado." });
        fetchComics();
    };
     request.onerror = () => {
        toast({ variant: "destructive", title: "Error", description: "No se pudo limpiar el historial." });
    };
  }, [db, fetchComics, toast]);

  return { comics, isLoading, addComicToHistory, deleteComic, clearHistory };
};
