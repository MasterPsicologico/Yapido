'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AudioDraft } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'AudioDraftsDB';
const STORE_NAME = 'drafts';

// --- IndexedDB Hook ---
export const useAudioDrafts = () => {
  const [drafts, setDrafts] = useState<AudioDraft[]>([]);
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, 2); 

    request.onupgradeneeded = (event) => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      setDb(request.result);
    };

    request.onerror = () => {
      console.error('Error opening IndexedDB', request.error);
      setIsLoading(false);
    };
  }, []);

  const fetchDrafts = useCallback(() => {
    if (db) {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const sortedDrafts = getAllRequest.result.sort(
                (a: AudioDraft, b: AudioDraft) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setDrafts(sortedDrafts);
            setIsLoading(false);
        };
        getAllRequest.onerror = () => {
            console.error("Error fetching drafts from IndexedDB", getAllRequest.error);
            setIsLoading(false);
        }
    }
  }, [db]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const saveDraft = useCallback(async (id: string | null, title: string, audioBlob: Blob): Promise<AudioDraft> => {
    if (!db) throw new Error("La base de datos no está inicializada.");

    const draftId = id || uuidv4();
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    return new Promise((resolve, reject) => {
        reader.onloadend = () => {
            const base64Audio = reader.result as string;

            const getRequest = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(draftId);
            getRequest.onsuccess = () => {
                const existingDraft = getRequest.result;
                const draft: AudioDraft = {
                    ...(existingDraft || {}),
                    id: draftId,
                    title,
                    audioUrl: base64Audio,
                    timestamp: existingDraft?.timestamp || new Date().toISOString(),
                    // Ensure these are not present on initial save unless provided
                    transcription: existingDraft?.transcription,
                    report: existingDraft?.report,
                    detectedParticipants: existingDraft?.detectedParticipants,
                    detectedParticipantsSummary: existingDraft?.detectedParticipantsSummary,
                };

                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(draft);

                request.onsuccess = () => {
                    fetchDrafts();
                    resolve(draft);
                };
                request.onerror = () => reject(request.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        };
        reader.onerror = () => reject(reader.error);
    });
  }, [db, fetchDrafts]);

  const updateDraft = useCallback(async (id: string, updates: Partial<Omit<AudioDraft, 'id'>>) => {
    if (!db) throw new Error("La base de datos no está inicializada.");

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    return new Promise<void>((resolve, reject) => {
        getRequest.onsuccess = () => {
            const draft = getRequest.result;
            if (draft) {
                const updatedDraft = { ...draft, ...updates };
                const putRequest = store.put(updatedDraft);
                putRequest.onsuccess = () => {
                    fetchDrafts();
                    resolve();
                };
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error("Borrador no encontrado."));
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
  }, [db, fetchDrafts]);


  const deleteDraft = useCallback(async (id: string) => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    fetchDrafts();
  }, [db, fetchDrafts]);

  return { drafts, isLoading, saveDraft, deleteDraft, updateDraft };
};
