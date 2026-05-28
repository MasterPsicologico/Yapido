'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CourseStructure } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const DB_NAME = 'GICICourseDB';
const STORE_NAME = 'courses';
const DB_VERSION = 2; // Bump version to add new stores if needed

export const useCourseHistory = () => {
  const [courses, setCourses] = useState<CourseStructure[]>([]);
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = useCallback(() => {
    if (db) {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const sortedCourses = getAllRequest.result.sort(
          (a: CourseStructure, b: CourseStructure) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );
        setCourses(sortedCourses);
        setIsLoading(false);
      };
      getAllRequest.onerror = () => {
        console.error("Error fetching courses from IndexedDB", getAllRequest.error);
        setIsLoading(false);
      };
    }
  }, [db]);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = request.result;
      // Handle course store
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      // Handle progress store
      if (!dbInstance.objectStoreNames.contains('progress')) {
        dbInstance.createObjectStore('progress', { keyPath: 'courseId' });
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

  useEffect(() => {
    if (db) {
      fetchCourses();
    }
  }, [db, fetchCourses]);

  const addCourseToHistory = useCallback(async (course: CourseStructure) => {
    if (!db || !course.id) return;

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(course);

    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
            fetchCourses();
            resolve();
        };
        request.onerror = () => {
            console.error("Failed to add course:", request.error);
            reject(request.error);
        };
    });
  }, [db, fetchCourses]);
  
  const updateCourseHistory = addCourseToHistory; // It's a `put` operation, so it works for both add and update.

  const deleteCourse = useCallback(async (id: string) => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
        toast({ title: "Curso eliminado del historial." });
        fetchCourses();
    };
     request.onerror = () => {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el curso del historial." });
    };
  }, [db, fetchCourses, toast]);

  const clearHistory = useCallback(async () => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
     request.onsuccess = () => {
        toast({ title: "Historial limpiado." });
        fetchCourses();
    };
     request.onerror = () => {
        toast({ variant: "destructive", title: "Error", description: "No se pudo limpiar el historial." });
    };
  }, [db, fetchCourses, toast]);

  return { courses, isLoading, addCourseToHistory, updateCourseHistory, deleteCourse, clearHistory };
};
