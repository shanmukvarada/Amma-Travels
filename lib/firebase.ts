import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const currentApp = getApps().find(a => a.options.projectId === firebaseConfig.projectId);
const app = currentApp || initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = getFirestore(app, dbId); 
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
// Log current project to console for debugging
if (typeof window !== 'undefined') {
  console.log("Firebase initialized for project:", firebaseConfig.projectId);
}

// Avoid top-level await or side effects if possible
// We will trigger auth dynamically if needed, or ask user to enable it.

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Error handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log the full error to console for debugging
  console.error(`Firestore Error [${operationType}] at ${path}:`, error);

  // Throw a simple string to avoid circularity issues when serializing the error
  throw new Error(`Firestore Error [${operationType}] at ${path}: ${errorMessage}`);
}
