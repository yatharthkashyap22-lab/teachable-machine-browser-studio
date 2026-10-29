import { initializeApp, getApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
let app: any = null;
let auth: any = null;
let db: any = null;

try {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('Firebase configuration key is missing or incomplete.');
  }
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error('Firebase failed to initialize. Falling back to Mock authentication & Local-only storage:', e);
  // Create safe no-op fallbacks to prevent runtime crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      cb(null);
      return () => {};
    },
    signOut: async () => {}
  } as any;
  db = {} as any;
}

export { auth, db };

// Authentication Helpers
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  // Also save their profile name or firestore user entry
  const userDoc = doc(db, 'users', result.user.uid);
  await setDoc(userDoc, {
    uid: result.user.uid,
    name,
    email,
    joinedAt: new Date().toISOString()
  });
  return result.user;
};

export const signInWithEmail = async (email: string, pass: string) => {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const logOutUser = async () => {
  await signOut(auth);
};

// Firestore Sync Utilities for Offline-First Integration
export const syncService = {
  // Sync individual project to firestore
  async saveProject(userId: string, project: any) {
    try {
      const projectDoc = doc(db, 'users', userId, 'projects', project.id);
      await setDoc(projectDoc, {
        ...project,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error('Failed to sync project to Firestore:', e);
    }
  },

  async deleteProject(userId: string, projectId: string) {
    try {
      const projectDoc = doc(db, 'users', userId, 'projects', projectId);
      await deleteDoc(projectDoc);
    } catch (e) {
      console.error('Failed to delete project from Firestore:', e);
    }
  },

  // Sync Label
  async saveLabel(userId: string, label: any) {
    try {
      const labelDoc = doc(db, 'users', userId, 'labels', label.id);
      await setDoc(labelDoc, label, { merge: true });
    } catch (e) {
      console.error('Failed to sync label to Firestore:', e);
    }
  },

  async deleteLabel(userId: string, labelId: string) {
    try {
      const labelDoc = doc(db, 'users', userId, 'labels', labelId);
      await deleteDoc(labelDoc);
    } catch (e) {
      console.error('Failed to delete label from Firestore:', e);
    }
  },

  // Sync Sample
  async saveSample(userId: string, sample: any) {
    try {
      const sampleDoc = doc(db, 'users', userId, 'samples', sample.id);
      await setDoc(sampleDoc, sample, { merge: true });
    } catch (e) {
      console.error('Failed to sync sample to Firestore:', e);
    }
  },

  async deleteSample(userId: string, sampleId: string) {
    try {
      const sampleDoc = doc(db, 'users', userId, 'samples', sampleId);
      await deleteDoc(sampleDoc);
    } catch (e) {
      console.error('Failed to delete sample from Firestore:', e);
    }
  },

  // Sync Model
  async saveModel(userId: string, model: any) {
    try {
      const modelDoc = doc(db, 'users', userId, 'models', model.id);
      await setDoc(modelDoc, model, { merge: true });
    } catch (e) {
      console.error('Failed to sync model to Firestore:', e);
    }
  },

  async deleteModel(userId: string, modelId: string) {
    try {
      const modelDoc = doc(db, 'users', userId, 'models', modelId);
      await deleteDoc(modelDoc);
    } catch (e) {
      console.error('Failed to delete model from Firestore:', e);
    }
  },

  // Pull all data from Firestore for a newly logged in user to hydrate local IndexedDB
  async fetchUserData(userId: string) {
    try {
      const projectsCol = collection(db, 'users', userId, 'projects');
      const labelsCol = collection(db, 'users', userId, 'labels');
      const samplesCol = collection(db, 'users', userId, 'samples');
      const modelsCol = collection(db, 'users', userId, 'models');

      const [projSnap, labelSnap, sampleSnap, modelSnap] = await Promise.all([
        getDocs(projectsCol),
        getDocs(labelsCol),
        getDocs(samplesCol),
        getDocs(modelsCol)
      ]);

      const projects = projSnap.docs.map(doc => doc.data());
      const labels = labelSnap.docs.map(doc => doc.data());
      const samples = sampleSnap.docs.map(doc => doc.data());
      const models = modelSnap.docs.map(doc => doc.data());

      return { projects, labels, samples, models };
    } catch (e) {
      console.error('Error fetching data from Firestore:', e);
      return null;
    }
  }
};
