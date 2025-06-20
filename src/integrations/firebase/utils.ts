import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp,
  DocumentReference,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';
import type { PeriodLog, SymptomLog, Task, TimeEntry, UserProfile, WeightLog, Appointment, ContractionLog, KickLog } from './types';
import { format } from 'date-fns';

// Period Logs
export const addPeriodLog = async (userId: string, data: Omit<PeriodLog, 'id' | 'userId' | 'createdAt'>) => {
  const periodLogsRef = collection(db, COLLECTIONS.PERIOD_LOGS);
  const newLog = {
    ...data,
    userId,
    createdAt: Timestamp.now()
  };
  const docRef = await addDoc(periodLogsRef, newLog);
  return { id: docRef.id, ...newLog };
};

export const getPeriodLogs = async (userId: string, startDate?: Date): Promise<PeriodLog[]> => {
  const periodLogsRef = collection(db, COLLECTIONS.PERIOD_LOGS);
  let q = query(
    periodLogsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  if (startDate) {
    q = query(
      periodLogsRef,
      where('userId', '==', userId),
      where('startDate', '>=', format(startDate, 'yyyy-MM-dd')),
      orderBy('createdAt', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PeriodLog));
};

export const updatePeriodLog = async (logId: string, logData: Partial<PeriodLog>) => {
  const logRef = doc(db, COLLECTIONS.PERIOD_LOGS, logId);
  await updateDoc(logRef, logData);
};

export const deletePeriodLog = async (logId: string) => {
  // In a real app, you'd add security rules and error handling
  // For simplicity, directly deleting here. Ensure proper authentication/authorization.
  // This would typically be a Cloud Function for security.
  console.warn("Direct client-side deletion of period log. Implement Cloud Function for security.", logId);
  const logRef = doc(db, COLLECTIONS.PERIOD_LOGS, logId);
  await deleteDoc(logRef);
};

// Symptom Logs
export const addSymptomLog = async (userId: string, data: Omit<SymptomLog, 'id' | 'userId' | 'createdAt'>) => {
  const symptomLogsRef = collection(db, COLLECTIONS.SYMPTOM_LOGS);
  const newLog = {
    ...data,
    userId,
    createdAt: Timestamp.now()
  };
  const docRef = await addDoc(symptomLogsRef, newLog);
  return { id: docRef.id, ...newLog };
};

export const getSymptomLogs = async (userId: string, startDate?: Date): Promise<SymptomLog[]> => {
  const symptomLogsRef = collection(db, COLLECTIONS.SYMPTOM_LOGS);
  let q = query(
    symptomLogsRef,
    where('user_id', '==', userId),
    orderBy('date', 'desc')
  );

  if (startDate) {
    q = query(
      symptomLogsRef,
      where('user_id', '==', userId),
      where('date', '>=', format(startDate, 'yyyy-MM-dd')),
      orderBy('date', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as SymptomLog));
};

// Tasks
export const addTask = async (userId: string, data: Omit<Task, 'id' | 'userId' | 'createdAt'>) => {
  const tasksRef = collection(db, COLLECTIONS.TASKS);
  const newTask = {
    ...data,
    userId,
    createdAt: Timestamp.now()
  };
  const docRef = await addDoc(tasksRef, newTask);
  return { id: docRef.id, ...newTask };
};

export const updateTask = async (taskId: string, data: Partial<Task>) => {
  await updateDoc(doc(db, 'tasks', taskId), data);
};

export const deleteTask = async (taskId: string) => {
  await deleteDoc(doc(db, 'tasks', taskId));
};

export const getTasks = async (userId: string): Promise<Task[]> => {
  const tasksRef = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Task));
};

// Time Entries
export const addTimeEntry = async (userId: string, data: Omit<TimeEntry, 'id' | 'userId' | 'createdAt'>) => {
  const timeEntriesRef = collection(db, COLLECTIONS.TIME_ENTRIES);
  const newEntry = {
    ...data,
    userId,
    createdAt: Timestamp.now()
  };
  const docRef = await addDoc(timeEntriesRef, newEntry);
  return { id: docRef.id, ...newEntry };
};

export const updateTimeEntry = async (entryId: string, data: Partial<TimeEntry>) => {
  await updateDoc(doc(db, 'time_entries', entryId), data);
};

export const deleteTimeEntry = async (entryId: string) => {
  await deleteDoc(doc(db, 'time_entries', entryId));
};

export const getTimeEntries = async (userId: string): Promise<TimeEntry[]> => {
  const timeEntriesRef = collection(db, COLLECTIONS.TIME_ENTRIES);
  const q = query(
    timeEntriesRef,
    where('userId', '==', userId),
    orderBy('startTime', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as TimeEntry));
};

// User Profile
export const createUserProfile = async (userId: string, data: Omit<UserProfile, 'id' | 'createdAt' | 'lastLogin'>) => {
  const userProfilesRef = collection(db, COLLECTIONS.USER_PROFILES);
  const newProfile = {
    ...data,
    id: userId,
    createdAt: Timestamp.now(),
    lastLogin: Timestamp.now()
  };
  await addDoc(userProfilesRef, newProfile);
  return newProfile;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const userProfileRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  await setDoc(userProfileRef, {
    ...data,
    lastLogin: Timestamp.now()
  }, { merge: true });
};

// Weight Logs
export const addWeightLog = async (userId: string, data: Omit<WeightLog, 'id' | 'userId' | 'createdAt'>) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const weightLogsRef = collection(db, COLLECTIONS.USER_WEIGHT_LOGS);
      const newLog = {
        ...data,
        userId,
        createdAt: Timestamp.now()
      };
      const docRef = await addDoc(weightLogsRef, newLog);
      return { id: docRef.id, ...newLog };
    } catch (error) {
      console.error(`Error adding weight log (attempt ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      if (retryCount === maxRetries) {
        throw new Error('Failed to add weight log after multiple attempts');
      }
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Failed to add weight log after multiple attempts');
};

export const getWeightLogs = async (userId: string): Promise<WeightLog[]> => {
  const weightLogsRef = collection(db, COLLECTIONS.USER_WEIGHT_LOGS);
  const q = query(weightLogsRef, where('userId', '==', userId), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as WeightLog));
};

export const getWeightLogByDate = async (userId: string, date: string): Promise<WeightLog | null> => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const weightLogsRef = collection(db, COLLECTIONS.USER_WEIGHT_LOGS);
      const q = query(
        weightLogsRef,
        where('userId', '==', userId),
        where('date', '==', date)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as WeightLog;
    } catch (error) {
      console.error(`Error fetching weight log (attempt ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      if (retryCount === maxRetries) {
        throw new Error('Failed to fetch weight log after multiple attempts');
      }
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return null;
};

export const updateWeightLog = async (logId: string, data: Partial<WeightLog>) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const weightLogRef = doc(db, COLLECTIONS.USER_WEIGHT_LOGS, logId);
      await updateDoc(weightLogRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      return;
    } catch (error) {
      console.error(`Error updating weight log (attempt ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      if (retryCount === maxRetries) {
        throw new Error('Failed to update weight log after multiple attempts');
      }
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Appointments
export const addAppointment = async (userId: string, data: Omit<Appointment, 'id' | 'userId' | 'createdAt'>) => {
  const appointmentsRef = collection(db, COLLECTIONS.USER_APPOINTMENTS);
  const newAppointment = {
    ...data,
    userId,
    createdAt: Timestamp.now()
  };
  const docRef = await addDoc(appointmentsRef, newAppointment);
  return { id: docRef.id, ...newAppointment };
};

export const getAppointments = async (userId: string): Promise<Appointment[]> => {
  const appointmentsRef = collection(db, COLLECTIONS.USER_APPOINTMENTS);
  const q = query(appointmentsRef, where('userId', '==', userId), orderBy('date', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Appointment));
};

// Contraction Logs
export const addContractionLog = async (userId: string, data: Omit<ContractionLog, 'id' | 'userId' | 'timestamp'>) => {
  const contractionLogsRef = collection(db, COLLECTIONS.USER_CONTRACTION_LOGS);
  const newLog = {
    ...data,
    userId,
    timestamp: Timestamp.now()
  };
  const docRef = await addDoc(contractionLogsRef, newLog);
  return { id: docRef.id, ...newLog };
};

export const getContractionLogs = async (userId: string): Promise<ContractionLog[]> => {
  const contractionLogsRef = collection(db, COLLECTIONS.USER_CONTRACTION_LOGS);
  const q = query(contractionLogsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ContractionLog));
};

// Kick Logs
export const addKickLog = async (userId: string, data: Omit<KickLog, 'id' | 'userId' | 'timestamp'>) => {
  const kickLogsRef = collection(db, COLLECTIONS.USER_KICK_LOGS);
  const newLog = {
    ...data,
    userId,
    timestamp: Timestamp.now()
  };
  const docRef = await addDoc(kickLogsRef, newLog);
  return { id: docRef.id, ...newLog };
};

export const getKickLogs = async (userId: string): Promise<KickLog[]> => {
  const kickLogsRef = collection(db, COLLECTIONS.USER_KICK_LOGS);
  const q = query(kickLogsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as KickLog));
}; 