import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "@/integrations/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";

interface PregnancyData {
  dueDate?: string;
  lastPeriod?: string;
  hasEnteredData: boolean;
}

interface UserProfileData {
  email: string;
  createdAt: string;
  maritalStatus?: 'married' | 'unmarried';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  pregnancyData: PregnancyData;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
  updatePregnancyData: (data: Partial<PregnancyData>) => void;
  login: (email: string, password: string) => Promise<{ error: unknown }>;
  signup: (email: string, password: string, maritalStatus: 'married' | 'unmarried') => Promise<{ error: unknown }>;
  logout: () => Promise<void>;
  maritalStatus: 'married' | 'unmarried' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [pregnancyData, setPregnancyData] = useState<PregnancyData>({
    hasEnteredData: false
  });
  const [maritalStatus, setMaritalStatus] = useState<'married' | 'unmarried' | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      
      if (currentUser) {
        // Try to load user profile data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.pregnancyData) {
            setPregnancyData(userData.pregnancyData);
          }
          if (userData.maritalStatus) {
            setMaritalStatus(userData.maritalStatus);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);
  
  const updatePregnancyData = async (data: Partial<PregnancyData>) => {
    if (!user) return;

    setPregnancyData(prev => {
      const newData = { ...prev, ...data };
      
      // Store in Firestore
      setDoc(doc(db, 'users', user.uid), {
        pregnancyData: newData
      }, { merge: true });
      
      return newData;
    });
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  const signup = async (email: string, password: string, maritalStatus: 'married' | 'unmarried') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setIsNewUser(true);
      
      // Create user document in Firestore with marital status
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        maritalStatus: maritalStatus
      });
      
      setMaritalStatus(maritalStatus);

      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setUser(null);
    setMaritalStatus(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      pregnancyData, 
      isNewUser,
      setIsNewUser,
      updatePregnancyData, 
      login, 
      signup, 
      logout,
      maritalStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
