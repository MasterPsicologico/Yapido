'use client';

import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'GICICourseDB';
const PROGRESS_STORE_NAME = 'progress';
const DB_VERSION = 2; // Match the version in useCourseHistory

export const useCourseProgress = (courseId: string | undefined) => {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB connection
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains('courses')) {
        dbInstance.createObjectStore('courses', { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(PROGRESS_STORE_NAME)) {
        dbInstance.createObjectStore(PROGRESS_STORE_NAME, { keyPath: 'courseId' });
      }
    };

    request.onsuccess = () => setDb(request.result);
    
    request.onerror = () => {
        console.error('Error opening progress DB');
        setIsLoading(false);
    };
  }, []);

  // Fetch progress for the specific course when DB or courseId changes
  useEffect(() => {
    if (!db || !courseId) {
        setIsLoading(false);
        setProgress({}); // Reset if no courseId
        return;
    }

    setIsLoading(true);
    const transaction = db.transaction(PROGRESS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PROGRESS_STORE_NAME);
    const getReq = store.get(courseId);

    getReq.onsuccess = () => {
      setProgress(getReq.result?.progressMap || {});
      setIsLoading(false);
    };
    
    getReq.onerror = () => {
      console.error('Error fetching progress:', getReq.error);
      setIsLoading(false);
    };
  }, [db, courseId]);

  // Function to update progress for a chapter, only if it has increased
  const updateChapterProgress = useCallback(async (chapterKey: string, newProgress: number) => {
    if (!db || !courseId) return;

    const currentProgress = progress[chapterKey] || 0;
    if (newProgress <= currentProgress && currentProgress < 100) return; // Only update if progress increases (allow re-setting 100)

    // Optimistic UI update
    setProgress(prev => ({ ...prev, [chapterKey]: newProgress }));

    // Persist to DB
    const transaction = db.transaction(PROGRESS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PROGRESS_STORE_NAME);
    const getRequest = store.get(courseId);

    getRequest.onsuccess = () => {
      const data = getRequest.result || { courseId, progressMap: {} };
      const currentDBProgress = data.progressMap[chapterKey] || 0;
      
      // Double check in transaction to prevent race conditions
      if (newProgress > currentDBProgress) {
        data.progressMap[chapterKey] = newProgress;
        store.put(data);
      }
    };
    getRequest.onerror = () => console.error("Failed to get progress for update:", getRequest.error);

  }, [db, courseId, progress]);
  
  return { progress, isLoading, updateChapterProgress };
};
