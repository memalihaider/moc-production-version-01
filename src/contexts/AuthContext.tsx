'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// UPDATED: User interface with allowedPages
interface User {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'customer';
  branchId?: string;
  branchName?: string;
  name?: string;
  phone?: string;
  allowedPages?: string[]; // 👈 NEW: Added allowedPages
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, isCustomer?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const normalizeBranchText = (value?: string) => (value || '').trim().toLowerCase();

  const enrichAdminUser = async (
    firebaseUser: FirebaseUser,
    rawUserData: Record<string, any>
  ): Promise<User> => {
    let branchId = rawUserData.branchId;
    let branchName = rawUserData.branchName;

    // If branchId is missing, attempt to resolve it from branchName.
    if (!branchId && branchName) {
      try {
        const branchesSnap = await getDocs(collection(db, 'branches'));
        const matched = branchesSnap.docs.find((branchDoc) => {
          const data = branchDoc.data();
          return normalizeBranchText(data.name) === normalizeBranchText(branchName);
        });

        if (matched) {
          branchId = matched.id;
          branchName = matched.data().name || branchName;
        }
      } catch (error) {
        console.warn('Could not resolve branchId from branchName:', error);
      }
    }

    // If branchName is missing but branchId exists, resolve canonical branchName.
    if (branchId && !branchName) {
      try {
        const branchSnap = await getDoc(doc(db, 'branches', branchId));
        if (branchSnap.exists()) {
          const branchData = branchSnap.data();
          branchName = branchData.name || branchName;
        }
      } catch (error) {
        console.warn('Could not resolve branchName from branchId:', error);
      }
    }

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      role: rawUserData.role || 'admin',
      branchId,
      branchName,
      name: rawUserData.name,
      allowedPages: rawUserData.allowedPages || []
    };
  };

  useEffect(() => {
    let userDocUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up previous Firestore listener when auth state changes
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (firebaseUser) {
        try {
          // FIRST: Check in "users" collection (for admins)
          const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDocSnap.exists()) {
            // User is ADMIN — set up real-time listener for permission changes
            const userData = userDocSnap.data();
            const userObj = await enrichAdminUser(firebaseUser, userData);
            
            setUser(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
            console.log('✅ Admin auth state updated with allowedPages:', userObj.allowedPages || []);

            // Real-time listener for user document changes (permissions, role, etc.)
            userDocUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
              if (snapshot.exists()) {
                const updatedData = snapshot.data();
                enrichAdminUser(firebaseUser, updatedData)
                  .then((updatedUser) => {
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    console.log('🔄 Real-time user update — allowedPages:', updatedUser.allowedPages || []);
                  })
                  .catch((error) => {
                    console.error('❌ Failed to enrich updated user data:', error);
                  });
              }
            });
            
          } else {
            // SECOND: Check in "customers" collection
            const customerDoc = await getDoc(doc(db, 'customers', firebaseUser.uid));
            
            if (customerDoc.exists()) {
              // User is CUSTOMER
              const customerData = customerDoc.data();
              const userObj: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                role: 'customer',
                name: customerData.name,
                phone: customerData.phone,
              };
              
              setUser(userObj);
              localStorage.setItem('user', JSON.stringify(userObj));
              console.log('✅ Customer auth state updated:', userObj.email);
              
            } else {
              // THIRD: If not found in either collection
              console.log('⚠️ User not found in Firestore, checking if new customer...');
              
              const customerAuth = localStorage.getItem('customerAuth');
              if (customerAuth) {
                const parsed = JSON.parse(customerAuth);
                if (parsed.customer && parsed.customer.uid === firebaseUser.uid) {
                  await setDoc(doc(db, 'customers', firebaseUser.uid), {
                    email: firebaseUser.email,
                    name: parsed.customer.name || '',
                    phone: parsed.customer.phone || '',
                    role: 'customer',
                    createdAt: new Date(),
                    status: 'active'
                  });
                  
                  const userObj: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email!,
                    role: 'customer',
                    name: parsed.customer.name,
                    phone: parsed.customer.phone
                  };
                  
                  setUser(userObj);
                  localStorage.setItem('user', JSON.stringify(userObj));
                  console.log('✅ New customer document created');
                  return;
                }
              }
              
              console.error('❌ User document not found in Firestore');
              await signOut(auth);
              setUser(null);
              localStorage.removeItem('user');
              localStorage.removeItem('customerAuth');
            }
          }
          
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          await signOut(auth);
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('customerAuth');
        }
      } else {
        // User signed out
        setUser(null);
        localStorage.removeItem('user');
        console.log('❌ User signed out');
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string, isCustomer: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔑 Login attempt for:', email, 'Customer:', isCustomer);
      
      // 1. Firebase Authentication se login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase auth successful');
      
      if (isCustomer) {
        // CUSTOMER LOGIN
        const customerDoc = await getDoc(doc(db, 'customers', userCredential.user.uid));
        
        if (!customerDoc.exists()) {
          throw new Error('Customer not found in database');
        }
        
        const customerData = customerDoc.data();
        console.log('📋 Customer data from Firestore:', customerData);
        
        const userObj: User = {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          role: 'customer',
          name: customerData.name,
          phone: customerData.phone
        };
        
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('customerAuth', JSON.stringify({
          isAuthenticated: true,
          customer: userObj
        }));
        
        console.log('✅ Customer login successful');
        router.push('/customer/portal');
        
      } else {
        // ADMIN LOGIN with allowedPages
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (!userDoc.exists()) {
          throw new Error('User not found in database');
        }
        
        const userData = userDoc.data();
        console.log('📋 User role from Firestore:', userData.role);
        const userObj = await enrichAdminUser(userCredential.user, userData);
        console.log('📋 Allowed pages for admin:', userObj.allowedPages || []);
        
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        console.log('✅ User state updated with allowedPages:', userObj.allowedPages || []);
        
        if (userData.role === 'super_admin') {
          console.log('🚀 SUPER ADMIN → Redirecting to /super-admin');
          router.push('/super-admin');
        } else {
          console.log('🚀 ADMIN → Redirecting to /admin');
          router.push('/admin');
        }
      }
      
      setIsLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('❌ Login error:', error.code, error.message);
      setIsLoading(false);
      
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
      
      // Check if it was a customer logout
      if (user?.role === 'customer') {
        localStorage.removeItem('customerAuth');
        router.push('/customer/login');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};