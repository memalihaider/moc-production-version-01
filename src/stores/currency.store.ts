import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'AED';

interface CurrencyStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const currencySymbols: Record<Currency, string> = {
  AED: 'AED'
};

const currencyLocales: Record<Currency, string> = {
  AED: 'en-AE'
};

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'AED',

      setCurrency: (currency: Currency) => set({ currency }),

      formatCurrency: (amount: number) => {
        return `AED ${amount.toFixed(2)}`;
      },

      getCurrencySymbol: () => {
        const { currency } = get();
        return currencySymbols[currency];
      },
    }),
    {
      name: 'currency-storage',
    }
  )
);