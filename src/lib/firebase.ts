
// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCC33XM2VvWF5MNgopb2Eqp3FGqhVDZ5AY",
  authDomain: "art-code-sgs0w.firebaseapp.com",
  projectId: "art-code-sgs0w",
  storageBucket: "art-code-sgs0w.firebasestorage.app",
  messagingSenderId: "944227455442",
  appId: "1:944227455442:web:647a96a52bdcadce77b80b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// User Data Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  qrCodeId: string;
  createdAt: Date;
  lastLoginAt: Date;
  subscription: 'free' | 'premium';
  modelRequests: number;
  maxModelRequests: number;
  blocked: boolean;
}

export interface ModelRequest {
  id: string;
  userId: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  modelUrl?: string;
  thumbnailUrl?: string;
  aiRefinedDescription?: string;
}

export interface QRCodeAssignment {
  id: string;
  qrCodeId: string;
  userId: string;
  modelId?: string;
  modelName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Firestore Helper Functions
export const createUserProfile = async (user: User): Promise<UserProfile> => {
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName,
    photoURL: user.photoURL,
    qrCodeId: `QR-${user.uid.slice(0, 6).toUpperCase()}`,
    createdAt: new Date(),
    lastLoginAt: new Date(),
    subscription: 'free',
    modelRequests: 0,
    maxModelRequests: 3,
    blocked: false,
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...userProfile,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  return userProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const profile = {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        blocked: data.blocked ?? false, // Default to false if blocked field doesn't exist
      } as UserProfile;

      // If the user doesn't have the blocked field, add it to the database
      if (data.blocked === undefined) {
        console.log('Migrating user profile to add blocked field:', uid);
        await updateDoc(doc(db, 'users', uid), {
          blocked: false,
        });
      }

      return profile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    lastLoginAt: serverTimestamp(),
  });
};

export const createModelRequest = async (userId: string, description: string): Promise<string> => {
  const modelRequest = {
    userId,
    description,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'modelRequests'), modelRequest);
  return docRef.id;
};

export const getUserModelRequests = async (userId: string): Promise<ModelRequest[]> => {
  // Temporary: Index is still building, using JavaScript sort
  const q = query(
    collection(db, 'modelRequests'),
    where('userId', '==', userId),
    limit(20)
  );

  const querySnapshot = await getDocs(q);
  const requests = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    completedAt: doc.data().completedAt?.toDate(),
  })) as ModelRequest[];

  // Sort in JavaScript while index is building
  return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const updateModelRequest = async (requestId: string, updates: Partial<ModelRequest>) => {
  await updateDoc(doc(db, 'modelRequests', requestId), updates);
};

export const createQRCodeAssignment = async (qrCodeId: string, userId: string): Promise<void> => {
  await setDoc(doc(db, 'qrCodes', qrCodeId), {
    qrCodeId,
    userId,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getQRCodeAssignment = async (qrCodeId: string): Promise<QRCodeAssignment | null> => {
  const qrDoc = await getDoc(doc(db, 'qrCodes', qrCodeId));
  if (qrDoc.exists()) {
    const data = qrDoc.data();
    return {
      id: qrDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as QRCodeAssignment;
  }
  return null;
};

export const saveQRModelAssignment = async (qrCodeId: string, userId: string, modelName: string): Promise<void> => {
  await setDoc(doc(db, 'qrCodes', qrCodeId), {
    qrCodeId,
    userId,
    modelName,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getUserQRAssignments = async (userId: string): Promise<Record<string, string>> => {
  try {
    const q = query(
      collection(db, 'qrCodes'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const assignments: Record<string, string> = {};
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.modelName) {
        assignments[data.qrCodeId] = data.modelName;
      }
    });
    
    return assignments;
  } catch (error) {
    console.error('Error fetching user QR assignments:', error);
    return {};
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    console.log('Fetching all users from Firestore...');
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} users in database`);
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        blocked: data.blocked ?? false, // Default to false if blocked field doesn't exist
      };
    }) as UserProfile[];

    console.log('Users fetched successfully:', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching users from Firestore:', error);
    throw error;
  }
};

export const blockUser = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    blocked: true,
    updatedAt: serverTimestamp(),
  });
};

export const unblockUser = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    blocked: false,
    updatedAt: serverTimestamp(),
  });
};

export const migrateAllUsersToAddBlockedField = async (): Promise<void> => {
  try {
    console.log('Starting user migration to add blocked field...');
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    
    let migratedCount = 0;
    const batch = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (data.blocked === undefined) {
        batch.push(
          updateDoc(doc(db, 'users', docSnapshot.id), {
            blocked: false,
          })
        );
        migratedCount++;
      }
    }
    
    if (batch.length > 0) {
      await Promise.all(batch);
      console.log(`Successfully migrated ${migratedCount} users to add blocked field`);
    } else {
      console.log('No users need migration - all users already have blocked field');
    }
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
};

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  type User 
};
