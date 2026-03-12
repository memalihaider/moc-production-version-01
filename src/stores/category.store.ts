import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Category {
  id: string;
  name: string;
  description: string;
  type: 'product' | 'service';
  branches: string[];      // Array of branch IDs (empty = global/all branches)
  branchNames?: string[];  // Parallel array of branch names
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryStore {
  categories: Category[];

  // Actions
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  setCategories: (categories: Category[]) => void;

  // Getters
  getCategoriesByBranch: (branchId?: string) => Category[];
  getCategoriesByType: (type: 'product' | 'service', branchId?: string) => Category[];
  getActiveCategories: (branchId?: string) => Category[];
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: [],

      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          categories: [...state.categories, newCategory]
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map(cat =>
            cat.id === id
              ? { ...cat, ...updates, updatedAt: new Date() }
              : cat
          )
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter(cat => cat.id !== id)
        }));
      },

      setCategories: (categories) => set({ categories }),

      getCategoriesByBranch: (branchId) => {
        if (!branchId) {
          // Super admin sees all categories
          return get().categories;
        }
        // Branch admin sees their branch categories + global categories (empty branches)
        return get().categories.filter(cat =>
          cat.branches.includes(branchId) || !cat.branches || cat.branches.length === 0
        );
      },

      getCategoriesByType: (type, branchId) => {
        return get().getCategoriesByBranch(branchId).filter(cat => cat.type === type);
      },

      getActiveCategories: (branchId) => {
        return get().getCategoriesByBranch(branchId).filter(cat => cat.isActive);
      },
    }),
    {
      name: 'category-storage',
      partialize: (state) => ({
        categories: state.categories
      })
    }
  )
);