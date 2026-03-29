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
  website?: string;
  status?: string;
  openingTime?: string;
  closingTime?: string;
  weeklyTimings?: any;
  image?: string;
}

const BRANCH_CACHE_KEY = 'branchCache';
const BRANCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
    // Skip re-fetch if already loaded
    const current = get();
    if (current.branches.length > 0) {
      set({ loading: false });
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem(BRANCH_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const cachedAt = Number(cached?.timestamp || 0);
          const cachedBranches = Array.isArray(cached?.branches) ? cached.branches : [];
          if (cachedBranches.length > 0 && Date.now() - cachedAt < BRANCH_CACHE_TTL) {
            set({ branches: cachedBranches, loading: false });
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to read branch cache:', error);
      }
    }

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
          website: data.website || "",
          status: data.status || "active",
          openingTime: data.openingTime || "09:00",
          closingTime: data.closingTime || "18:00",
          weeklyTimings: data.weeklyTimings || {},
          image: data.image || data.businessLogo || "",
        });
      });
      
      // Mall branches first, then alphabetical
      branchesData.sort((a, b) => {
        const aMall = a.name.toLowerCase().includes('mall');
        const bMall = b.name.toLowerCase().includes('mall');
        if (aMall && !bMall) return -1;
        if (!aMall && bMall) return 1;
        return a.name.localeCompare(b.name);
      });
      set({ branches: branchesData });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            BRANCH_CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), branches: branchesData })
          );
        } catch (error) {
          console.warn('Failed to write branch cache:', error);
        }
      }
      
      // Local storage se selected branch lo agar pehle se save hai
      if (typeof window !== 'undefined') {
        const savedBranch = localStorage.getItem('selectedBranch');
        const isValidSavedBranch =
          savedBranch === 'all' ||
          branchesData.some((branch) => branch.name === savedBranch);

        if (savedBranch && isValidSavedBranch) {
          set({ selectedBranch: savedBranch });
        } else {
          // Default always stays on all branches
          set({ selectedBranch: 'all' });
          localStorage.setItem('selectedBranch', 'all');
        }
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      set({ loading: false });
    }
  },
}));