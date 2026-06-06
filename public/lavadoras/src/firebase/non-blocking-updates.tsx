'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Helper to globally sanitize undefined and NaN values before sending them to Firestore,
 * preventing HTTP 400 INVALID_ARGUMENT crashes.
 */
function sanitizePayload(obj: any): any {
  if (obj === undefined) return null;
  if (typeof obj === 'number' && isNaN(obj)) return 0;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  
  if (obj !== null && typeof obj === 'object') {
    // Preserve Firestore special objects (FieldValue, Timestamp, Date)
    if (
      typeof obj.isEqual === 'function' || 
      obj._methodName || 
      obj.type === 'FieldValue' ||
      obj instanceof Date
    ) {
      return obj;
    }

    const proto = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) {
      return obj; // Keep other custom class instances untouched
    }

    const newObj: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) {
        newObj[k] = null;
      } else {
        newObj[k] = sanitizePayload(v);
      }
    }
    return newObj;
  }
  
  return obj;
}


/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  const safeData = sanitizePayload(data);
  setDoc(docRef, safeData, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: safeData,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const safeData = sanitizePayload(data);
  const promise = addDoc(colRef, safeData)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: safeData,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 * Returns the Promise so callers can optionally chain .catch() on it.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  const safeData = sanitizePayload(data);
  const promise = updateDoc(docRef, safeData)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: safeData,
        })
      );
    });
  return promise;
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}