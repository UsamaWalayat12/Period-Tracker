import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from './config.js';

// Sample data structure for each collection
const sampleData = {
  [COLLECTIONS.SYMPTOM_LOGS]: {
    user_id: 'sample-user-id',
    date: '2024-03-01',
    mood: 'happy',
    sleep_hours: 8,
    sleep_quality: 'good',
    symptoms: ['cramps', 'headache'],
    notes: 'Sample symptom log',
    created_at: Timestamp.now()
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
    created_at: Timestamp.now(),
    last_login: Timestamp.now()
  }
};

// Required indexes for Firestore
const requiredIndexes = [
  {
    collection: COLLECTIONS.SYMPTOM_LOGS,
    fields: [
      { fieldPath: 'user_id', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'DESCENDING' }
    ]
  }
];

async function setupFirebase() {
  try {
    // Create sample documents in each collection
    for (const [collectionName, structure] of Object.entries(sampleData)) {
      const sampleDocRef = doc(collection(db, collectionName), 'sample');
      await setDoc(sampleDocRef, structure, { merge: true });
      console.log(`Created sample document in ${collectionName}`);
    }

    // Log required indexes
    console.log('\nRequired Firestore Indexes:');
    console.log('===========================\n');
    requiredIndexes.forEach(index => {
      console.log(`Collection: ${index.collection}`);
      console.log('Fields:');
      index.fields.forEach(field => {
        console.log(`  - ${field.fieldPath} (${field.order})`);
      });
      console.log('\n');
    });

    console.log('Instructions:');
    console.log('1. Go to Firebase Console > Firestore Database > Indexes');
    console.log('2. Click "Add Index"');
    console.log('3. For each index above:');
    console.log('   - Select the collection');
    console.log('   - Add the fields in the order shown');
    console.log('   - Set the query scope to "Collection"');
    console.log('   - Click "Create Index"');

    console.log('\nFirebase setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Firebase:', error);
  }
}

// Run the setup
setupFirebase(); 