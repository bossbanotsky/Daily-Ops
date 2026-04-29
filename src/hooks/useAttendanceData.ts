import { useState, useEffect } from 'react';
import { AttendanceEntry } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, setDoc, doc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';

const STORAGE_KEY = 'attendance_pad_entries';

export function useAttendanceData() {
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const entriesRef = collection(db, 'users', userId, 'entries');

    // MIGRATION: Migrate localStorage to Firebase once
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const localEntries: AttendanceEntry[] = JSON.parse(saved);
        if (localEntries && localEntries.length > 0) {
          console.log(`Migrating ${localEntries.length} entries to Firebase`);
          const batch = writeBatch(db);
          localEntries.forEach((entry) => {
            const docRef = doc(db, 'users', userId, 'entries', entry.id);
            // Must abide by security rules
            const toSave = {
              ...entry,
              userId,
              jobType: entry.jobType || 'daily',
              billed: entry.billed || false,
            };
            // Clean up any undefined values
            Object.keys(toSave).forEach(key => {
              if ((toSave as any)[key] === undefined) {
                (toSave as any)[key] = null; // or could delete the key, but firestore rules enforce strings etc.
                delete (toSave as any)[key];
              }
            });
            batch.set(docRef, toSave);
          });
          batch.commit()
            .then(() => {
              console.log('Migration complete');
              localStorage.removeItem(STORAGE_KEY);
            })
            .catch((e) => {
              console.error('Migration failed:', e);
            });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to migrate local entries', e);
    }

    const q = query(entriesRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: AttendanceEntry[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as AttendanceEntry);
        });
        // Sort explicitly if needed, but our app already sorts on render
        setEntries(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}/entries`);
      }
    );

    return () => unsubscribe();
  }, []);

  const addEntries = async (newEntries: Omit<AttendanceEntry, 'id' | 'createdAt'>[]) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      newEntries.forEach((entry, index) => {
        const id = crypto.randomUUID();
        const docRef = doc(db, 'users', userId, 'entries', id);
        
        const toSave = {
          ...entry,
          id,
          createdAt: Date.now() + index, // Ensure stable sort for identical timestamps
          userId,
          jobType: entry.jobType || 'daily',
          billed: entry.billed || false,
        };
        // Remove undefined keys
        Object.keys(toSave).forEach(key => {
          if ((toSave as any)[key] === undefined) delete (toSave as any)[key];
        });

        batch.set(docRef, toSave);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/entries (batch)`);
    }
  };

  const addEntry = async (entry: Omit<AttendanceEntry, 'id' | 'createdAt'>) => {
    await addEntries([entry]);
  };

  const updateEntry = async (id: string, updatedFields: Partial<Omit<AttendanceEntry, 'id' | 'createdAt'>>) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const docRef = doc(db, 'users', userId, 'entries', id);

    // Clean up undefined values from updatedFields before sending to Firestore
    const cleanedFields = { ...updatedFields };
    Object.keys(cleanedFields).forEach(key => {
      if ((cleanedFields as any)[key] === undefined) delete (cleanedFields as any)[key];
    });

    try {
      await setDoc(docRef, cleanedFields, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docRef.path);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const docRef = doc(db, 'users', userId, 'entries', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docRef.path);
    }
  };

  return {
    entries,
    addEntry,
    addEntries,
    updateEntry,
    deleteEntry,
  };
}
