import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from './config';

// Sample data structure for each collection
const sampleData = {
  [COLLECTIONS.PERIOD_LOGS]: {
    userId: 'sample-user-id',
    startDate: '2024-03-01',
    endDate: '2024-03-05',
    type: 'period_start',
    flow: 'medium',
    symptoms: ['cramps', 'headache'],
    notes: 'Sample period log',
    createdAt: Timestamp.now()
  },
  [COLLECTIONS.SYMPTOM_LOGS]: {
    userId: 'sample-user-id',
    date: '2024-03-01',
    symptoms: ['cramps', 'headache'],
    mood: 'okay',
    sleepHours: 7,
    sleepQuality: 'good',
    notes: 'Sample symptom log',
    createdAt: Timestamp.now()
  },
  [COLLECTIONS.TASKS]: {
    userId: 'sample-user-id',
    title: 'Sample Task',
    description: 'This is a sample task',
    dueDate: '2024-03-10',
    completed: false,
    priority: 'medium',
    category: 'health',
    createdAt: Timestamp.now()
  },
  [COLLECTIONS.TIME_ENTRIES]: {
    userId: 'sample-user-id',
    startTime: Timestamp.now(),
    endTime: Timestamp.now(),
    activity: 'Sample Activity',
    notes: 'Sample time entry',
    createdAt: Timestamp.now()
  },
  [COLLECTIONS.USER_PROFILES]: {
    id: 'sample-user-id',
    email: 'sample@example.com',
    displayName: 'Sample User',
    photoURL: 'https://example.com/photo.jpg',
    settings: {
      theme: 'light',
      notifications: true,
      language: 'en'
    },
    createdAt: Timestamp.now(),
    lastLogin: Timestamp.now()
  }
};

async function setupCollections() {
  try {
    // Create a sample document in each collection to establish the structure
    for (const [collectionName, structure] of Object.entries(sampleData)) {
      const sampleDocRef = doc(collection(db, collectionName), 'sample');
      await setDoc(sampleDocRef, structure, { merge: true });
      console.log(`Created sample document in ${collectionName}`);
    }
    
    console.log('All collections have been set up successfully!');
  } catch (error) {
    console.error('Error setting up collections:', error);
  }
}

// Run the setup
setupCollections(); 