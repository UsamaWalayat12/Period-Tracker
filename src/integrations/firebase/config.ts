import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBsrG9lj5rfI1Md1xj3bvRuxJjFLNuoajw",
  authDomain: "doctor-appointment-c2c69.firebaseapp.com",
  projectId: "doctor-appointment-c2c69",
  storageBucket: "doctor-appointment-c2c69.appspot.com",
  messagingSenderId: "209519297296",
  appId: "1:209519297296:web:2594025ad48cfd6f5d5b95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Collection names
export const COLLECTIONS = {
  PERIOD_LOGS: 'period_logs',
  SYMPTOM_LOGS: 'symptom_logs',
  TASKS: 'tasks',
  TIME_ENTRIES: 'time_entries',
  USER_PROFILES: 'user_profiles',
  USER_WEIGHT_LOGS: 'user_weight_logs',
  USER_APPOINTMENTS: 'user_appointments',
  USER_NOTIFICATIONS: 'user_notifications',
  NOTIFICATIONS: 'notifications',
  USER_CONTRACTION_LOGS: 'user_contraction_logs',
  USER_KICK_LOGS: 'user_kick_logs',
} as const;

// Security rules for Firestore
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Period logs
    match /period_logs/{document=**} {
      allow read: if isAuthenticated() && isOwner(resource.data.user_id);
      allow create: if isAuthenticated() && isOwner(request.resource.data.user_id);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.user_id);
    }
    
    // Symptom logs
    match /symptom_logs/{document=**} {
      allow read: if isAuthenticated() && isOwner(resource.data.user_id);
      allow create: if isAuthenticated() && isOwner(request.resource.data.user_id);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.user_id);
    }
    
    // Tasks
    match /tasks/{document=**} {
      allow read: if isAuthenticated() && isOwner(resource.data.user_id);
      allow create: if isAuthenticated() && isOwner(request.resource.data.user_id);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.user_id);
    }
    
    // Time entries
    match /time_entries/{document=**} {
      allow read: if isAuthenticated() && isOwner(resource.data.user_id);
      allow create: if isAuthenticated() && isOwner(request.resource.data.user_id);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.user_id);
    }
    
    // User profiles
    match /user_profiles/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false; // Prevent profile deletion
    }
  }
}
*/

// Required indexes for Firestore
/*
Collection: period_logs
- Fields: user_id (Ascending), created_at (Descending)

Collection: symptom_logs
- Fields: user_id (Ascending), date (Descending)

Collection: tasks
- Fields: user_id (Ascending), created_at (Descending)
- Fields: user_id (Ascending), completed (Ascending), due_date (Ascending)

Collection: time_entries
- Fields: user_id (Ascending), start_time (Descending)
*/

export default app; 