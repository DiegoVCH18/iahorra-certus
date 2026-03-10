import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, collection, addDoc, increment, query, where, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  status: 'active' | 'completed';
  createdAt: any;
  updatedAt: any;
}

interface UserData {
  uid: string;
  name: string;
  ageProfile: 'niño' | 'joven' | 'adulto_joven' | 'adulto' | 'emprendedor' | null;
  savedAmount: number;
  completedCourses?: string[];
  watchedVideos?: string[];
}

export interface BudgetItem {
  id: string;
  concept: string;
  amount: number;
}

export interface Budget {
  id?: string;
  userId: string;
  fixedIncome: number;
  variableIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  fixedIncomeItems?: BudgetItem[];
  variableIncomeItems?: BudgetItem[];
  fixedExpensesItems?: BudgetItem[];
  variableExpensesItems?: BudgetItem[];
  updatedAt: any;
}

interface AppContextType {
  user: UserData | null;
  firebaseUser: User | null;
  isAuthReady: boolean;
  goals: Goal[];
  budget: Budget | null;
  updateUser: (data: Partial<UserData>) => Promise<void>;
  addSavingRecord: (amount: number, comment?: string, goalId?: string) => Promise<void>;
  addGoal: (name: string, targetAmount: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  deleteSavingRecord: (recordId: string, amount: number, goalId?: string) => Promise<void>;
  saveBudget: (budgetData: Omit<Budget, 'userId' | 'updatedAt' | 'id'>) => Promise<void>;
  markVideoWatched: (videoId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (!currentUser) {
        setUser(null);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setGoals([]);
      return;
    }

    const unsubscribeDoc = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUser(docSnap.data() as UserData);
        } else {
          // User document doesn't exist yet, we'll create it in Onboarding
          setUser(null);
        }
        setIsAuthReady(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      }
    );

    const q = query(
      collection(db, 'goals'),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribeGoals = onSnapshot(q, (snapshot) => {
      const fetchedGoals: Goal[] = [];
      snapshot.forEach(doc => {
        fetchedGoals.push({ id: doc.id, ...doc.data() } as Goal);
      });
      // Sort by creation date descending (newest first)
      fetchedGoals.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });
      setGoals(fetchedGoals);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
    });

    const budgetQ = query(
      collection(db, 'budgets'),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribeBudget = onSnapshot(budgetQ, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setBudget({ id: doc.id, ...doc.data() } as Budget);
      } else {
        setBudget(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'budgets');
    });

    return () => {
      unsubscribeDoc();
      unsubscribeGoals();
      unsubscribeBudget();
    };
  }, [firebaseUser]);

  const saveBudget = async (budgetData: Omit<Budget, 'userId' | 'updatedAt' | 'id'>) => {
    if (!firebaseUser) return;
    try {
      if (budget && budget.id) {
        await updateDoc(doc(db, 'budgets', budget.id), {
          ...budgetData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'budgets'), {
          ...budgetData,
          userId: firebaseUser.uid,
          updatedAt: serverTimestamp()
        });
        try {
          await setDoc(doc(db, 'public_stats', 'global'), { totalBudgets: increment(1) }, { merge: true });
        } catch (e) {
          console.error("Failed to update global stats", e);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'budgets');
    }
  };

  const updateUser = async (data: Partial<UserData>) => {
    if (!firebaseUser) return;
    
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      if (!user) {
        // Create new user
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || 'Usuario',
          ageProfile: data.ageProfile || null,
          savedAmount: data.savedAmount || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        // Increment global stats
        try {
          await setDoc(doc(db, 'public_stats', 'global'), { totalUsers: increment(1) }, { merge: true });
        } catch (e) {
          console.error("Failed to update global stats", e);
        }
      } else {
        // Update existing user
        await updateDoc(userRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const addSavingRecord = async (amount: number, comment?: string, goalId?: string) => {
    if (!firebaseUser || !user) return;
    
    try {
      // 1. Add record to savings collection
      const savingData: any = {
        userId: firebaseUser.uid,
        amount,
        date: new Date().toISOString(),
        comment: comment || '',
      };
      if (goalId) {
        savingData.goalId = goalId;
      }
      try {
        await addDoc(collection(db, 'savings'), savingData);
        // Increment global stats
        try {
          await setDoc(doc(db, 'public_stats', 'global'), { totalSavings: increment(1) }, { merge: true });
        } catch (e) {
          console.error("Failed to update global stats", e);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `savings`);
      }

      // 2. Update user's total savedAmount
      const userRef = doc(db, 'users', firebaseUser.uid);
      try {
        // Use Math.max to ensure savedAmount never goes below 0, which would violate Firestore rules
        const newSavedAmount = Math.max(0, user.savedAmount + amount);
        await updateDoc(userRef, {
          savedAmount: newSavedAmount,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }

      // 3. Update specific goal if provided
      if (goalId) {
        const goalRef = doc(db, 'goals', goalId);
        const targetGoal = goals.find(g => g.id === goalId);
        
        if (targetGoal) {
          const newAmount = Math.max(0, targetGoal.currentAmount + amount);
          const status = newAmount >= targetGoal.targetAmount ? 'completed' : 'active';
          
          try {
            await updateDoc(goalRef, {
              currentAmount: newAmount,
              status: status,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `goals/${goalId}`);
          }
        }
      }
    } catch (error) {
      console.error("Unexpected error in addSavingRecord", error);
      throw error;
    }
  };

  const addGoal = async (name: string, targetAmount: number) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'goals'), {
        userId: firebaseUser.uid,
        name,
        targetAmount,
        currentAmount: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Increment global stats
      try {
        await setDoc(doc(db, 'public_stats', 'global'), { totalGoals: increment(1) }, { merge: true });
      } catch (e) {
        console.error("Failed to update global stats", e);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'goals');
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!firebaseUser) return;
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      try {
        await setDoc(doc(db, 'public_stats', 'global'), { totalGoals: increment(-1) }, { merge: true });
      } catch (e) {
        console.error("Failed to update global stats", e);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `goals/${goalId}`);
    }
  };

  const deleteSavingRecord = async (recordId: string, amount: number, goalId?: string) => {
    if (!firebaseUser || !user) return;
    try {
      await deleteDoc(doc(db, 'savings', recordId));
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const newSavedAmount = Math.max(0, user.savedAmount - amount);
      await updateDoc(userRef, {
        savedAmount: newSavedAmount,
        updatedAt: serverTimestamp(),
      });

      if (goalId) {
        const goalRef = doc(db, 'goals', goalId);
        const targetGoal = goals.find(g => g.id === goalId);
        if (targetGoal) {
          const newAmount = Math.max(0, targetGoal.currentAmount - amount);
          const status = newAmount >= targetGoal.targetAmount ? 'completed' : 'active';
          await updateDoc(goalRef, {
            currentAmount: newAmount,
            status: status,
            updatedAt: serverTimestamp(),
          });
        }
      }
      
      try {
        await setDoc(doc(db, 'public_stats', 'global'), { totalSavings: increment(-1) }, { merge: true });
      } catch (e) {
        console.error("Failed to update global stats", e);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `savings/${recordId}`);
    }
  };

  const markVideoWatched = async (videoId: string) => {
    if (!firebaseUser || !user) return;
    
    try {
      const currentWatched = user.watchedVideos || [];
      if (!currentWatched.includes(videoId)) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, {
          watchedVideos: [...currentWatched, videoId],
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  return (
    <AppContext.Provider value={{ user, firebaseUser, isAuthReady, goals, budget, updateUser, addSavingRecord, addGoal, deleteGoal, deleteSavingRecord, saveBudget, markVideoWatched }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
