import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from './config.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../../firebase-service-account.json'), 'utf-8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Define the indexes we want to create
const indexes = [
  {
    collection: COLLECTIONS.PERIOD_LOGS,
    fields: [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: COLLECTIONS.SYMPTOM_LOGS,
    fields: [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'DESCENDING' }
    ]
  },
  {
    collection: COLLECTIONS.TASKS,
    fields: [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: COLLECTIONS.TIME_ENTRIES,
    fields: [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'startTime', order: 'DESCENDING' }
    ]
  },
  {
    collection: COLLECTIONS.USER_WEIGHT_LOGS,
    fields: [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'DESCENDING' }
    ]
  }
];

function generateIndexDefinitions() {
  console.log('Firestore Index Definitions:');
  console.log('===========================\n');

  indexes.forEach(index => {
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
}

// Generate the index definitions
generateIndexDefinitions(); 