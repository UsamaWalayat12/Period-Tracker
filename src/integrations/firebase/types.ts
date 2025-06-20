import { Timestamp } from 'firebase/firestore';

export interface PeriodLog {
  id: string;
  userId: string;
  date: string;
  startDate: string;
  endDate: string;
  type: 'period_start' | 'period_end';
  flow: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  notes?: string;
  durationDays?: number;
  createdAt: Timestamp;
}

export interface SymptomLog {
  id: string;
  userId: string;
  date: string;
  symptoms: string[];
  mood?: string;
  sleepHours?: number;
  sleepQuality?: string;
  notes?: string;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Timestamp;
}

export interface TimeEntry {
  id: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  activity: string;
  notes?: string;
  createdAt: Timestamp;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

export interface WeightLog {
  id: string;
  userId: string;
  date: string; // Stored as 'yyyy-MM-dd'
  weight: number;
  createdAt: Timestamp;
}

export interface Appointment {
  id: string;
  userId: string;
  date: Timestamp; // Stored as Timestamp
  type: string;
  notes?: string;
  createdAt: Timestamp;
}

export interface ContractionLog {
  id: string;
  userId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // in seconds
  timestamp: Timestamp; // Use Timestamp for consistency with Firebase
  // Optional: frequency can be calculated from logs array
}

export interface KickLog {
  id: string;
  userId: string;
  timestamp: Timestamp;
  kickCount: number; // Add kickCount property
} 