import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Branch interface
export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status?: string;
  openingTime?: string;
  closingTime?: string;
  weeklyTimings?: any;
  image?: string;
}

interface BranchStore {
  selectedBranch: string;
  branches: Branch[];
  loading: boolean;
  setSelectedBranch: (branch: string) => void;
  setBranches: (branches: Branch[]) => void;
  fetchBranches: () => Promise<void>;
}

export const useBranchStore = create<BranchStore>((set, get) => ({
  selectedBranch: 'all',
  branches: [],
  loading: true,
  
  setSelectedBranch: (branch: string) => {
    set({ selectedBranch: branch });
    // Local storage mein bhi save karo
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBranch', branch);
    }
  },
  
  setBranches: (branches: Branch[]) => set({ branches }),
  
  fetchBranches: async () => {
    set({ loading: true });
    try {
      const branchesRef = collection(db, 'branches');
      const querySnapshot = await getDocs(branchesRef);
      
      const branchesData: Branch[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        branchesData.push({
          id: doc.id,
          name: data.name || "Unknown Branch",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "",
          phone: data.phone || "",
          email: data.email || "",
          status: data.status || "active",
          openingTime: data.openingTime || "09:00",
          closingTime: data.closingTime || "18:00",
          weeklyTimings: data.weeklyTimings || {},
          image: data.image || "",
        });
      });
      
      branchesData.sort((a, b) => a.name.localeCompare(b.name));
      set({ branches: branchesData });
      
      // Local storage se selected branch lo agar pehle se save hai
      if (typeof window !== 'undefined') {
        const savedBranch = localStorage.getItem('selectedBranch');
        if (savedBranch) {
          set({ selectedBranch: savedBranch });
        } else if (branchesData.length > 0) {
          // Agar koi branch save nahi hai to pehli branch select karo
          set({ selectedBranch: branchesData[0].name });
        }
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      set({ loading: false });
    }
  },
}));